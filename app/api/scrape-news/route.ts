import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5-minute timeout for full feed scrape

const GROQ_KEY = process.env.GROQ_API_KEY
const SUMMARIZE_THRESHOLD = 0.5
const SUMMARIZE_MAX = 30
const FEED_DELAY_MS = 300

const PAKISTAN_KEYWORDS = ['pakistan', "pakistan's", 'pakistani', 'lahore', 'karachi', 'islamabad', 'peshawar', 'quetta']
const PROVINCE_KEYWORDS = ['punjab', 'sindh', 'balochistan', 'khyber', 'pakhtunkhwa', 'azad kashmir', 'gilgit']
const DONOR_KEYWORDS = [
  'world bank', 'adb', 'fcdo', 'dfid', 'usaid', 'giz', 'jica', 'undp', 'unicef',
  'unfpa', 'wfp', 'who', 'imf', 'european union', ' eu ', 'aga khan', 'gates foundation',
  'islamic development bank', 'isdb', 'aiib', 'opec fund', 'kfw', 'afd', 'koica',
  'sdc', 'green climate fund', 'gcf', 'karandaaz', 'ppaf', 'oecd', 'unops',
]
const SECTOR_KEYWORDS = [
  'health', 'education', 'governance', 'climate', 'wash', 'water sanitation',
  'energy', 'agriculture', 'food security', 'humanitarian', 'gender', 'social protection',
  'infrastructure', 'transport', 'digital', 'rural development', 'poverty', 'nutrition',
  'tvet', 'skills', 'employment', 'psdp', 'adp', 'development programme',
]
const FINANCE_KEYWORDS = [
  'budget', 'imf', 'tranche', 'disbursement', 'funding', 'grant', 'loan',
  'freeze', 'withdrawal', 'pledge', 'allocation', 'billion', 'million', 'fiscal',
  'procurement', 'tender', 'contract',
]

function scoreRelevance(text: string): number {
  const t = text.toLowerCase()
  let score = 0
  for (const kw of PAKISTAN_KEYWORDS) if (t.includes(kw)) { score += 0.5; break }
  for (const kw of PROVINCE_KEYWORDS) if (t.includes(kw)) score += 0.3
  for (const kw of DONOR_KEYWORDS) if (t.includes(kw)) score += 0.2
  for (const kw of SECTOR_KEYWORDS) if (t.includes(kw)) score += 0.1
  for (const kw of FINANCE_KEYWORDS) if (t.includes(kw)) score += 0.15
  return Math.min(1.0, score)
}

function scoreRecency(pubDate: string | null): number {
  if (!pubDate) return 0.5
  const days = (Date.now() - new Date(pubDate).getTime()) / 86400000
  return Math.max(0, 1 - days / 30)
}

interface FeedItem {
  title: string
  link: string
  description: string
  pubDate: string | null
}

function extractText(node: unknown): string {
  if (typeof node === 'string') return node
  if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>
    if ('#text' in n) return String(n['#text'])
    if ('cdata' in n) return String(n['cdata'])
    if ('_' in n) return String(n['_'])
  }
  return ''
}

// Simple but robust XML text extractor
function getTagText(xml: string, tag: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i'))
  if (cdataMatch) return cdataMatch[1].trim()
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  if (match) return match[1].replace(/<[^>]+>/g, '').trim()
  return ''
}

function parseRSSXML(xml: string): FeedItem[] {
  const items: FeedItem[] = []

  // Try RSS 2.0 items
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []

  // Try Atom entries
  const entryMatches = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || []

  const rawItems = itemMatches.length > 0 ? itemMatches : entryMatches

  for (const raw of rawItems.slice(0, 50)) {
    const title = getTagText(raw, 'title') || 'Untitled'

    // Link: <link href="..."/> for Atom or <link>...</link> for RSS
    let link = getTagText(raw, 'link')
    if (!link) {
      const hrefMatch = raw.match(/<link[^>]+href=["']([^"']+)["']/i)
      if (hrefMatch) link = hrefMatch[1]
    }
    if (!link) {
      const guidMatch = raw.match(/<guid[^>]*>([^<]+)<\/guid>/i)
      if (guidMatch) link = guidMatch[1].trim()
    }

    const description = getTagText(raw, 'description') ||
      getTagText(raw, 'summary') ||
      getTagText(raw, 'content')

    const pubDate = getTagText(raw, 'pubDate') ||
      getTagText(raw, 'published') ||
      getTagText(raw, 'updated') ||
      null

    if (link) {
      items.push({ title, link, description: description.slice(0, 800), pubDate })
    }
  }

  return items
}

interface AISummary {
  what_happened: string
  why_it_matters: string
  potential_action: string
}

async function summarizeWithGroq(title: string, description: string): Promise<AISummary | null> {
  if (!GROQ_KEY) return null
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: 'You summarize development news for Pakistan aid professionals. Be factual and concise. Respond ONLY with valid JSON, no markdown.',
          },
          {
            role: 'user',
            content: `Summarize this article with exactly these JSON keys:
"what_happened" (1 factual sentence, max 25 words),
"why_it_matters" (1-2 sentences for donors, firms, and implementing partners in Pakistan, max 40 words),
"potential_action" (1 sentence on what a development sector professional might do, max 20 words).

Title: ${title}
Content: ${description.slice(0, 600)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!resp.ok) return null
    const json = await resp.json()
    const content: string = json.choices?.[0]?.message?.content ?? ''
    const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned) as AISummary
  } catch {
    return null
  }
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function POST(request: Request) {
  // Verify admin token
  const auth = request.headers.get('Authorization')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (auth !== `Bearer ${serviceKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: feeds, error: feedsError } = await supabase
    .from('news_feeds')
    .select('*')
    .eq('is_active', true)
    .order('is_pakistan_priority', { ascending: false })
    .order('last_fetched_at', { ascending: true, nullsFirst: true })

  if (feedsError || !feeds) {
    return NextResponse.json({ error: 'Failed to fetch feeds', detail: feedsError }, { status: 500 })
  }

  let totalInserted = 0
  let totalSummarized = 0
  const errors: string[] = []

  for (const feed of feeds) {
    try {
      await delay(FEED_DELAY_MS)

      const response = await fetch(feed.feed_url, {
        headers: {
          'User-Agent': 'PakAidExplorer/1.0 (development intelligence platform)',
          'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(20000),
      })

      if (!response.ok) {
        errors.push(`${feed.feed_name}: HTTP ${response.status}`)
        continue
      }

      const xml = await response.text()
      const items = parseRSSXML(xml)

      let feedInserted = 0

      for (const item of items) {
        if (!item.link) continue

        const bodyText = `${item.title} ${item.description}`
        const recency = scoreRecency(item.pubDate)
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
            title: item.title.slice(0, 500),
            source: feed.feed_name,
            source_color: '#055C45',
            excerpt: item.description.slice(0, 500),
            url: item.link,
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
            feed_id: feed.id,
            recency_score: recency,
            relevance_score: relevance,
            composite_score: composite,
            what_happened: summary?.what_happened ?? null,
            why_it_matters: summary?.why_it_matters ?? null,
            potential_action: summary?.potential_action ?? null,
          }, { onConflict: 'url', ignoreDuplicates: false })

        if (!upsertErr) feedInserted++
      }

      await supabase
        .from('news_feeds')
        .update({ last_fetched_at: new Date().toISOString(), last_item_count: feedInserted })
        .eq('id', feed.id)

      totalInserted += feedInserted

      await supabase.from('scraper_logs').upsert({
        name: `rss:${feed.feed_name}`,
        target_url: feed.feed_url,
        status: 'healthy',
        last_run: new Date().toISOString(),
        records_last_run: feedInserted,
        error_message: null,
      }, { onConflict: 'name' })

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${feed.feed_name}: ${msg}`)
      await supabase.from('scraper_logs').upsert({
        name: `rss:${feed.feed_name}`,
        target_url: feed.feed_url,
        status: 'failing',
        last_run: new Date().toISOString(),
        records_last_run: 0,
        error_message: msg.slice(0, 500),
      }, { onConflict: 'name' })
    }
  }

  return NextResponse.json({
    feeds_processed: feeds.length,
    articles_inserted: totalInserted,
    articles_summarized: totalSummarized,
    errors,
  })
}
