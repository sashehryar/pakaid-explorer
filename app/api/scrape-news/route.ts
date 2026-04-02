import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime    = 'nodejs'
export const maxDuration = 300

const GROQ_KEY            = process.env.GROQ_API_KEY
const SUMMARIZE_THRESHOLD = 0.5
const SUMMARIZE_MAX       = 30
const MAX_FEEDS_PER_RUN   = 25   // stay well inside 300 s limit
const FETCH_CONCURRENCY   = 8    // parallel feed fetches

// ── Relevance scoring keywords ────────────────────────────────────────────────
const PAKISTAN_KW = ['pakistan', "pakistan's", 'pakistani', 'lahore', 'karachi', 'islamabad', 'peshawar', 'quetta']
const PROVINCE_KW = ['punjab', 'sindh', 'balochistan', 'khyber', 'pakhtunkhwa', 'azad kashmir', 'gilgit']
const DONOR_KW    = [
  'world bank', 'adb', 'fcdo', 'dfid', 'usaid', 'giz', 'jica', 'undp', 'unicef',
  'unfpa', 'wfp', 'who', 'imf', 'european union', ' eu ', 'aga khan', 'gates foundation',
  'islamic development bank', 'isdb', 'aiib', 'opec fund', 'kfw', 'afd', 'koica',
  'sdc', 'green climate fund', 'gcf', 'karandaaz', 'ppaf',
]
const SECTOR_KW   = [
  'health', 'education', 'governance', 'climate', 'wash', 'water sanitation',
  'energy', 'agriculture', 'food security', 'humanitarian', 'gender', 'social protection',
  'infrastructure', 'transport', 'digital', 'rural development', 'poverty', 'nutrition',
  'tvet', 'skills', 'employment', 'psdp', 'adp', 'development programme',
]
const FINANCE_KW  = [
  'budget', 'imf', 'tranche', 'disbursement', 'funding', 'grant', 'loan',
  'freeze', 'withdrawal', 'pledge', 'allocation', 'billion', 'million', 'fiscal',
  'procurement', 'tender', 'contract',
]

function scoreRelevance(text: string): number {
  const t = text.toLowerCase()
  let score = 0
  for (const kw of PAKISTAN_KW) if (t.includes(kw)) { score += 0.5; break }
  for (const kw of PROVINCE_KW) if (t.includes(kw)) score += 0.3
  for (const kw of DONOR_KW)    if (t.includes(kw)) score += 0.2
  for (const kw of SECTOR_KW)   if (t.includes(kw)) score += 0.1
  for (const kw of FINANCE_KW)  if (t.includes(kw)) score += 0.15
  return Math.min(1.0, score)
}

function scoreRecency(pubDate: string | null): number {
  if (!pubDate) return 0.5
  const days = (Date.now() - new Date(pubDate).getTime()) / 86400000
  return Math.max(0, 1 - days / 30)
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FeedItem {
  title:       string
  link:        string
  description: string
  pubDate:     string | null
  feedUrl:     string
}

interface AISummary {
  what_happened:    string
  why_it_matters:   string
  potential_action: string
}

// ── RSS/Atom XML parser (no external dependency) ──────────────────────────────
function getTagText(xml: string, tag: string): string {
  const cdata = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>`, 'i'))
  if (cdata) return cdata[1].trim()
  const plain = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'))
  if (plain) return plain[1].replace(/<[^>]+>/g, '').trim()
  return ''
}

function parseRSSXML(xml: string, feedUrl: string): FeedItem[] {
  const items: FeedItem[] = []
  const rssItems  = xml.match(/<item[\s>][\s\S]*?<\/item>/gi)   ?? []
  const atomItems = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? []
  const rawItems  = rssItems.length > 0 ? rssItems : atomItems

  for (const raw of rawItems.slice(0, 40)) {
    const title = getTagText(raw, 'title') || 'Untitled'

    let link = getTagText(raw, 'link')
    if (!link) {
      const href = raw.match(/<link[^>]+href=["']([^"']+)["']/i)
      if (href) link = href[1]
    }
    if (!link) {
      const guid = raw.match(/<guid[^>]*>([^<]+)<\/guid>/i)
      if (guid) link = guid[1].trim()
    }
    if (!link) continue

    items.push({
      title,
      link,
      description: (getTagText(raw, 'description') || getTagText(raw, 'summary') || '').slice(0, 800),
      pubDate:     getTagText(raw, 'pubDate') || getTagText(raw, 'published') || null,
      feedUrl,
    })
  }
  return items
}

async function fetchFeed(feedUrl: string): Promise<FeedItem[]> {
  try {
    const resp = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PakAidExplorer/1.0; +https://pakaid-explorer.vercel.app)',
        'Accept':     'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (!resp.ok) return []
    const xml = await resp.text()
    return parseRSSXML(xml, feedUrl)
  } catch {
    return []
  }
}

// ── Parallel fetch with concurrency limit ─────────────────────────────────────
async function fetchAllFeeds(
  feeds: Array<{ id: string; feed_url: string; feed_name: string }>
): Promise<Map<string, FeedItem[]>> {
  const result = new Map<string, FeedItem[]>()
  const queue  = [...feeds]

  async function worker() {
    while (queue.length > 0) {
      const feed = queue.shift()!
      const items = await fetchFeed(feed.feed_url)
      result.set(feed.feed_url, items)
    }
  }

  const workers = Array.from({ length: Math.min(FETCH_CONCURRENCY, feeds.length) }, worker)
  await Promise.all(workers)
  return result
}

// ── Groq AI summarization ─────────────────────────────────────────────────────
async function summarizeWithGroq(title: string, description: string): Promise<AISummary | null> {
  if (!GROQ_KEY) return null
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens:  300,
        messages: [
          {
            role:    'system',
            content: 'You summarize development news for Pakistan aid professionals. Be factual and concise. Respond ONLY with valid JSON, no markdown.',
          },
          {
            role:    'user',
            content: `Return exactly these JSON keys:
"what_happened" (1 factual sentence, max 25 words),
"why_it_matters" (1-2 sentences for donors/firms/implementers in Pakistan, max 40 words),
"potential_action" (1 sentence on what a development professional might do, max 20 words).

Title: ${title}
Content: ${description.slice(0, 600)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!resp.ok) return null
    const json = await resp.json()
    const raw: string = json.choices?.[0]?.message?.content ?? ''
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned) as AISummary
  } catch {
    return null
  }
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(_request: Request) {
  const supabase = createAdminClient()

  const { data: allFeeds, error: feedsError } = await supabase
    .from('news_feeds')
    .select('*')
    .eq('is_active', true)
    .order('is_pakistan_priority', { ascending: false })
    .order('last_fetched_at',      { ascending: true, nullsFirst: true })

  if (feedsError || !allFeeds) {
    return NextResponse.json({ error: 'Failed to fetch feeds', detail: feedsError }, { status: 500 })
  }

  // Cap feeds per run to stay within maxDuration
  const feeds = allFeeds.slice(0, MAX_FEEDS_PER_RUN)

  // ── Parallel fetch ────────────────────────────────────────────────────────
  const allItems = await fetchAllFeeds(feeds)

  let totalInserted   = 0
  let totalSummarized = 0
  const errors: string[] = []

  // ── Score, summarize, upsert ──────────────────────────────────────────────
  for (const feed of feeds) {
    const items = allItems.get(feed.feed_url) ?? []
    let feedInserted = 0

    if (items.length === 0) {
      errors.push(`${feed.feed_name}: 0 items fetched`)
      await supabase.from('news_feeds').update({
        last_fetched_at: new Date().toISOString(),
        last_item_count: 0,
      }).eq('id', feed.id)
      continue
    }

    try {
      for (const item of items) {
        if (!item.link) continue

        const bodyText  = `${item.title} ${item.description}`
        const recency   = scoreRecency(item.pubDate)
        const relevance = scoreRelevance(bodyText)
        const composite = 0.4 * recency + 0.6 * relevance

        let summary: AISummary | null = null
        if (composite >= SUMMARIZE_THRESHOLD && totalSummarized < SUMMARIZE_MAX) {
          summary = await summarizeWithGroq(item.title, item.description)
          if (summary) totalSummarized++
        }

        const { error: upsertErr } = await supabase
          .from('news_articles')
          .upsert({
            title:            item.title,
            source:           feed.feed_name,
            source_color:     '#055C45',
            excerpt:          item.description.slice(0, 500),
            url:              item.link,
            published_at:     item.pubDate ? new Date(item.pubDate).toISOString() : null,
            feed_id:          feed.id,
            recency_score:    recency,
            relevance_score:  relevance,
            composite_score:  composite,
            what_happened:    summary?.what_happened    ?? null,
            why_it_matters:   summary?.why_it_matters   ?? null,
            potential_action: summary?.potential_action ?? null,
          }, { onConflict: 'url', ignoreDuplicates: false })

        if (!upsertErr) feedInserted++
      }

      await supabase.from('news_feeds').update({
        last_fetched_at: new Date().toISOString(),
        last_item_count: feedInserted,
      }).eq('id', feed.id)

      totalInserted += feedInserted

      await supabase.from('scraper_logs').upsert({
        name:             `rss:${feed.feed_name}`,
        target_url:       feed.feed_url,
        status:           'healthy' as const,
        last_run:         new Date().toISOString(),
        records_last_run: feedInserted,
        error_message:    null,
      }, { onConflict: 'name' })

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${feed.feed_name}: ${msg}`)
      await supabase.from('scraper_logs').upsert({
        name:             `rss:${feed.feed_name}`,
        target_url:       feed.feed_url,
        status:           'failing' as const,
        last_run:         new Date().toISOString(),
        records_last_run: 0,
        error_message:    msg.slice(0, 500),
      }, { onConflict: 'name' })
    }
  }

  return NextResponse.json({
    feeds_processed:     feeds.length,
    feeds_total:         allFeeds.length,
    articles_inserted:   totalInserted,
    articles_summarized: totalSummarized,
    errors,
  })
}
