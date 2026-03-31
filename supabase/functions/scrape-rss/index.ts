import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse } from 'https://deno.land/x/xml@2.1.3/mod.ts'

// ── Config ─────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_KEY    = Deno.env.get('OPENAI_API_KEY')

const SUMMARIZE_THRESHOLD = 0.5   // min composite_score to request AI summary
const SUMMARIZE_MAX       = 20    // max AI calls per run (cost control)
const FEED_DELAY_MS       = 500   // rate-limit: ms between feed fetches

// ── Pakistan relevance keywords ────────────────────────────────────────────────
const PAKISTAN_KEYWORDS = ['pakistan', 'pakistan\'s', 'pakistani']
const PROVINCE_KEYWORDS = ['punjab', 'sindh', 'balochistan', 'khyber', 'islamabad', 'azad kashmir', 'gilgit']
const DONOR_KEYWORDS    = ['world bank', 'adb', 'fcdo', 'dfid', 'usaid', 'giz', 'jica', 'undp', 'unicef',
  'unfpa', 'wfp', 'who', 'imf', 'european union', 'eu ', 'aga khan', 'gates foundation',
  'islamic development bank', 'isdb', 'aiib', 'opec fund', 'kfw', 'afd', 'koica', 'tika',
  'sdc', 'green climate fund', 'gcf', 'karandaaz', 'ppaf']
const SECTOR_KEYWORDS   = ['health', 'education', 'governance', 'climate', 'wash', 'water sanitation',
  'energy', 'agriculture', 'food security', 'humanitarian', 'gender', 'social protection',
  'infrastructure', 'transport', 'digital', 'rural development', 'poverty', 'nutrition']
const FINANCE_KEYWORDS  = ['budget', 'imf', 'tranche', 'disbursement', 'funding', 'grant', 'loan',
  'freeze', 'withdrawal', 'pledge', 'allocation', 'billion', 'million', 'fiscal']

// ── Scoring ────────────────────────────────────────────────────────────────────
function scoreRelevance(text: string): number {
  const t = text.toLowerCase()
  let score = 0
  for (const kw of PAKISTAN_KEYWORDS)  if (t.includes(kw)) { score += 0.5; break }
  for (const kw of PROVINCE_KEYWORDS)  if (t.includes(kw)) score += 0.3
  for (const kw of DONOR_KEYWORDS)     if (t.includes(kw)) score += 0.2
  for (const kw of SECTOR_KEYWORDS)    if (t.includes(kw)) score += 0.1
  for (const kw of FINANCE_KEYWORDS)   if (t.includes(kw)) score += 0.15
  return Math.min(1.0, score)
}

function scoreRecency(pubDate: string | null): number {
  if (!pubDate) return 0.5
  const days = (Date.now() - new Date(pubDate).getTime()) / 86400000
  return Math.max(0, 1 - days / 30)
}

function compositeScore(recency: number, relevance: number): number {
  return 0.4 * recency + 0.6 * relevance
}

// ── XML helpers ────────────────────────────────────────────────────────────────
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
  }
  return ''
}

function parseRSSItems(doc: unknown): FeedItem[] {
  const items: FeedItem[] = []
  try {
    const root = doc as Record<string, unknown>

    // RSS 2.0
    const channel = (root?.rss as Record<string, unknown>)?.channel as Record<string, unknown>
    if (channel?.item) {
      const rawItems = Array.isArray(channel.item) ? channel.item : [channel.item]
      for (const item of rawItems) {
        const i = item as Record<string, unknown>
        items.push({
          title:       extractText(i.title)       || 'Untitled',
          link:        extractText(i.link)        || extractText(i.guid) || '',
          description: extractText(i.description) || extractText(i.summary) || '',
          pubDate:     extractText(i.pubDate)     || extractText(i.updated) || null,
        })
      }
      return items
    }

    // Atom
    const feed = root?.feed as Record<string, unknown>
    if (feed?.entry) {
      const rawEntries = Array.isArray(feed.entry) ? feed.entry : [feed.entry]
      for (const entry of rawEntries) {
        const e = entry as Record<string, unknown>
        let link = ''
        if (Array.isArray(e.link)) {
          const altLink = (e.link as Record<string, unknown>[]).find(l => l['@rel'] === 'alternate')
          link = String(altLink?.['@href'] ?? (e.link as Record<string, unknown>[])[0]?.['@href'] ?? '')
        } else if (e.link) {
          link = String((e.link as Record<string, unknown>)['@href'] ?? extractText(e.link))
        }
        items.push({
          title:       extractText(e.title)   || 'Untitled',
          link,
          description: extractText(e.summary) || extractText(e.content) || '',
          pubDate:     extractText(e.updated) || extractText(e.published) || null,
        })
      }
    }
  } catch (_err) {
    // parsing errors — return whatever we got
  }
  return items
}

// ── AI summarization ───────────────────────────────────────────────────────────
interface AISummary {
  what_happened:    string
  why_it_matters:   string
  potential_action: string
}

async function summarize(title: string, description: string): Promise<AISummary | null> {
  if (!OPENAI_KEY) return null
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 300,
        messages: [{
          role: 'system',
          content: 'You summarize development news for Pakistan aid professionals. Be factual and concise.',
        }, {
          role: 'user',
          content: `Summarize this article in JSON with exactly these keys:
"what_happened" (1 factual sentence, max 25 words),
"why_it_matters" (1-2 sentences focused on donors, firms, or implementing partners in Pakistan, max 40 words),
"potential_action" (1 sentence on what a development sector user might do in response, max 20 words).

Title: ${title}
Content: ${description.slice(0, 800)}

Respond with only valid JSON.`,
        }],
      }),
    })
    const json = await resp.json()
    const content: string = json.choices?.[0]?.message?.content ?? ''
    // Strip markdown code fences if present
    const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned) as AISummary
  } catch {
    return null
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────
serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  // Fetch feeds ordered by priority and least recently fetched
  const { data: feeds, error: feedsError } = await supabase
    .from('news_feeds')
    .select('*')
    .eq('is_active', true)
    .order('is_pakistan_priority', { ascending: false })
    .order('last_fetched_at', { ascending: true, nullsFirst: true })

  if (feedsError || !feeds) {
    return new Response(JSON.stringify({ error: 'Failed to fetch feeds', detail: feedsError }), { status: 500 })
  }

  let totalInserted = 0
  let totalSummarized = 0
  const errors: string[] = []

  for (const feed of feeds) {
    try {
      // Rate-limit between feeds
      await new Promise(r => setTimeout(r, FEED_DELAY_MS))

      const response = await fetch(feed.feed_url, {
        headers: {
          'User-Agent': 'PakAidExplorer/1.0 (+https://pakaid-explorer.com)',
          'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        errors.push(`${feed.feed_name}: HTTP ${response.status}`)
        continue
      }

      const xml = await response.text()
      let doc: unknown
      try {
        doc = parse(xml)
      } catch {
        errors.push(`${feed.feed_name}: XML parse error`)
        continue
      }

      const items = parseRSSItems(doc)
      let feedInserted = 0

      for (const item of items.slice(0, 50)) {
        if (!item.link) continue

        const bodyText = `${item.title} ${item.description}`
        const recency   = scoreRecency(item.pubDate)
        const relevance = scoreRelevance(bodyText)
        const composite = compositeScore(recency, relevance)

        // AI summarize high-scoring articles (budget cap)
        let summary: AISummary | null = null
        if (composite >= SUMMARIZE_THRESHOLD && totalSummarized < SUMMARIZE_MAX) {
          summary = await summarize(item.title, item.description)
          if (summary) totalSummarized++
        }

        const { error: upsertErr } = await supabase
          .from('news_articles')
          .upsert({
            title:            item.title.slice(0, 500),
            source:           feed.feed_name,
            source_color:     '#076349',
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
          }, {
            onConflict: 'url',
            ignoreDuplicates: false,
          })

        if (!upsertErr) feedInserted++
      }

      // Update feed metadata
      await supabase
        .from('news_feeds')
        .update({ last_fetched_at: new Date().toISOString(), last_item_count: feedInserted })
        .eq('id', feed.id)

      totalInserted += feedInserted

      // Log to scraper_logs
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
        name:          `rss:${feed.feed_name}`,
        target_url:    feed.feed_url,
        status:        'failing',
        last_run:      new Date().toISOString(),
        records_last_run: 0,
        error_message: msg.slice(0, 500),
      }, { onConflict: 'name' })
    }
  }

  const result = {
    feeds_processed: feeds.length,
    articles_inserted: totalInserted,
    articles_summarized: totalSummarized,
    errors,
  }

  console.log('scrape-rss complete:', result)
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
