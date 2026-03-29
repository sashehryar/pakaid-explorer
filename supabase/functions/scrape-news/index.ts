/**
 * Edge Function: scrape-news
 * Scrapes Dawn Business, The News Economy, and other Pakistan news sources.
 * Uses Apify web scraper actor with CSS selectors per site.
 * Trigger: every 3 hours cron
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APIFY_BASE = 'https://api.apify.com/v2'

const NEWS_SOURCES = [
  {
    name: 'Dawn',
    url: 'https://www.dawn.com/business',
    color: '#C8102E',
    topics: ['Macro Finance', 'IMF/Fiscal', 'Business'],
  },
  {
    name: 'The News',
    url: 'https://www.thenews.com.pk/category/economy',
    color: '#1B5E20',
    topics: ['Economy', 'Donor Intel'],
  },
  {
    name: 'Business Recorder',
    url: 'https://www.brecorder.com/',
    color: '#0D47A1',
    topics: ['Business', 'Finance'],
  },
]

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY')!,
  )

  const token = Deno.env.get('APIFY_API_TOKEN')!
  let totalUpserted = 0

  for (const src of NEWS_SOURCES) {
    try {
      // Use Apify's built-in web scraper
      const runRes = await fetch(`${APIFY_BASE}/acts/moJRLRc85AitArpNN/runs?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url: src.url }],
          maxPagesPerCrawl: 2,
          maxConcurrency: 2,
          pageFunction: `async function pageFunction({ request, page, $ }) {
            const articles = [];
            $('article, .story, .news-item, h2 a, h3 a').each((i, el) => {
              const title = $(el).find('h1,h2,h3,a').first().text().trim() || $(el).text().trim();
              const href = $(el).find('a').first().attr('href') || $(el).attr('href');
              const excerpt = $(el).find('p').first().text().trim();
              if (title && title.length > 20 && href) {
                articles.push({ title, url: href.startsWith('http') ? href : '${src.url}' + href, excerpt });
              }
            });
            return articles.slice(0, 10);
          }`,
        }),
      })
      const run = await runRes.json()
      const runId = run.data?.id
      if (!runId) continue

      // Wait for completion
      await new Promise(r => setTimeout(r, 15000))
      const dataRes = await fetch(`${APIFY_BASE}/datasets/${run.data?.defaultDatasetId}/items?token=${token}&clean=true`)
      const items = await dataRes.json()

      for (const item of (Array.isArray(items) ? items : [])) {
        const { error } = await supabase.from('news_articles').upsert({
          title: item.title,
          source: src.name,
          source_color: src.color,
          topic: src.topics[0],
          excerpt: item.excerpt || null,
          url: item.url,
          published_at: new Date().toISOString(),
          featured: false,
        }, { onConflict: 'url' })
        if (!error) totalUpserted++
      }

      await supabase.from('scraper_logs')
        .update({ status: 'healthy', last_run: new Date().toISOString(), records_last_run: totalUpserted })
        .ilike('name', `%${src.name}%`)

    } catch (err) {
      console.error(`News scrape failed for ${src.name}:`, err)
    }
  }

  return new Response(JSON.stringify({ ok: true, upserted: totalUpserted }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
