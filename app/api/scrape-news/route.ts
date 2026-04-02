import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 300

const APIFY_TOKEN = process.env.APIFY_API_TOKEN
const GROQ_KEY    = process.env.GROQ_API_KEY

const SUMMARIZE_THRESHOLD = 0.5
const SUMMARIZE_MAX       = 30
const APIFY_BATCH_SIZE    = 20
// Apify public RSS parser actor — apify store: lukaskrivka/rss-parser
const APIFY_RSS_ACTOR     = 'lukaskrivka~rss-parser'

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
  title: string
  link: string
  description: string
  pubDate: string | null
  feedUrl?: string
}

interface ApifyRSSItem {
  title?: string
  link?: string
  url?: string
  guid?: string
  description?: string
  summary?: string
  content?: string
  pubDate?: string
  isoDate?: string
  feedUrl?: string
  feedTitle?: string
}

interface AISummary {
  what_happened: string
  why_it_matters: string
  potential_action: string
}

// ── Apify RSS fetch ───────────────────────────────────────────────────────────
// Calls Apify actor lukaskrivka~rss-parser synchronously.
// Returns a map of feedUrl → array of items.
async function fetchViaApify(
  feedBatch: Array<{ id: string; feed_url: string; feed_name: string }>
): Promise<Map<string, FeedItem[]>> {
  const result = new Map<string, FeedItem[]>()
  if (!APIFY_TOKEN || feedBatch.length === 0) return result

  try {
    const resp = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_RSS_ACTOR}/run-sync-get-dataset-items` +
      `?token=${APIFY_TOKEN}&timeout=120&memory=256`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: feedBatch.map(f => ({ url: f.feed_url })),
          maxItemsPerFeed: 30,
          proxy: { useApifyProxy: true },
        }),
        signal: AbortSignal.timeout(130_000),
      }
    )

    if (!resp.ok) {
      console.error(`Apify returned ${resp.status}: ${await resp.text()}`)
      return result
    }

    const items: ApifyRSSItem[] = await resp.json()

    for (const item of items) {
      const feedUrl = item.feedUrl ?? ''
      const link    = item.link ?? item.url ?? item.guid ?? ''
      if (!link) continue

      const normalized: FeedItem = {
        title:       (item.title ?? 'Untitled').slice(0, 500),
        link,
        description: (item.description ?? item.summary ?? item.content ?? '').slice(0, 800),
        pubDate:     item.pubDate ?? item.isoDate ?? null,
        feedUrl,
      }

      if (!result.has(feedUrl)) result.set(feedUrl, [])
      result.get(feedUrl)!.push(normalized)
    }
  } catch (err) {
    console.error('Apify fetch error:', err)
  }

  return result
}

// ── Direct HTTP fallback (when Apify token missing or batch fails) ────────────
function getTagText(xml: string, tag: string): string {
  const cdata = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i'))
  if (cdata) return cdata[1].trim()
  const plain = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  if (plain) return plain[1].replace(/<[^>]+>/g, '').trim()
  return ''
}

function parseRSSXML(xml: string, feedUrl: string): FeedItem[] {
  const items: FeedItem[] = []
  const rssItems   = xml.match(/<item[\s>][\s\S]*?<\/item>/gi)   ?? []
  const atomItems  = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? []
  const rawItems   = rssItems.length > 0 ? rssItems : atomItems

  for (const raw of rawItems.slice(0, 50)) {
    const title = getTagText(raw, 'title') || 'Untitled'
    let link    = getTagText(raw, 'link')
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

async function fetchDirectly(feedUrl: string): Promise<FeedItem[]> {
  try {
    const resp = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'PakAidExplorer/1.0',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (!resp.ok) return []
    const xml = await resp.text()
    return parseRSSXML(xml, feedUrl)
  } catch {
    return []
  }
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

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(_request: Request) {
  const supabase = createAdminClient()

  const { data: feeds, error: feedsError } = await supabase
    .from('news_feeds')
    .select('*')
    .eq('is_active', true)
    .order('is_pakistan_priority', { ascending: false })
    .order('last_fetched_at',      { ascending: true, nullsFirst: true })

  if (feedsError || !feeds) {
    return NextResponse.json({ error: 'Failed to fetch feeds', detail: feedsError }, { status: 500 })
  }

  let totalInserted   = 0
  let totalSummarized = 0
  const errors: string[] = []

  // ── Batch feeds through Apify ─────────────────────────────────────────────
  // Map feedUrl → items (populated from Apify or direct fallback)
  const allItems = new Map<string, FeedItem[]>()

  if (APIFY_TOKEN) {
    for (let i = 0; i < feeds.length; i += APIFY_BATCH_SIZE) {
      const batch = feeds.slice(i, i + APIFY_BATCH_SIZE)
      const batchResult = await fetchViaApify(batch)

      // Merge batch results
      for (const [url, items] of batchResult) {
        allItems.set(url, items)
      }

      // For any feed in batch with no Apify result, fallback to direct
      for (const feed of batch) {
        if (!allItems.has(feed.feed_url) || allItems.get(feed.feed_url)!.length === 0) {
          const direct = await fetchDirectly(feed.feed_url)
          if (direct.length > 0) {
            allItems.set(feed.feed_url, direct)
          } else {
            errors.push(`${feed.feed_name}: no items from Apify or direct fetch`)
          }
        }
      }

      if (i + APIFY_BATCH_SIZE < feeds.length) await delay(2000)
    }
  } else {
    // No Apify token — direct fetch all
    for (const feed of feeds) {
      const items = await fetchDirectly(feed.feed_url)
      allItems.set(feed.feed_url, items)
      await delay(300)
    }
  }

  // ── Score, summarize, upsert ──────────────────────────────────────────────
  for (const feed of feeds) {
    const items = allItems.get(feed.feed_url) ?? []
    let feedInserted = 0

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
        status:           'healthy',
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
        status:           'failing',
        last_run:         new Date().toISOString(),
        records_last_run: 0,
        error_message:    msg.slice(0, 500),
      }, { onConflict: 'name' })
    }
  }

  return NextResponse.json({
    feeds_processed:     feeds.length,
    articles_inserted:   totalInserted,
    articles_summarized: totalSummarized,
    apify_used:          !!APIFY_TOKEN,
    errors,
  })
}
