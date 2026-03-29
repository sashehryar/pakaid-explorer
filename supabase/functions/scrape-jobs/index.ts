/**
 * Edge Function: scrape-jobs
 * Uses Apify web-scraper to pull Pakistan development jobs from ReliefWeb and UN Jobs.
 * Trigger: daily cron
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APIFY_BASE = 'https://api.apify.com/v2'
const ACTOR_ID   = 'moJRLRc85AitArpNN' // apify/web-scraper

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })

  const token = Deno.env.get('APIFY_API_TOKEN')!
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY')!,
  )

  try {
    const runRes = await fetch(`${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [
          { url: 'https://reliefweb.int/jobs?country=168' },
          { url: 'https://unjobs.org/duty_stations/pakistan' },
        ],
        maxPagesPerCrawl: 3,
        maxConcurrency: 2,
        pageFunction: `async function pageFunction({ request, $ }) {
          const jobs = [];
          // ReliefWeb
          $('article.node--job, .node--type-job').each((i, el) => {
            const title = $(el).find('h3,h2,.field--name-title').first().text().trim();
            const org   = $(el).find('.field--name-field-source a, .source').first().text().trim();
            const href  = $(el).find('a').first().attr('href') || '';
            const dead  = $(el).find('time,.field--name-field-job-closing-date').first().text().trim();
            if (title && href) jobs.push({ title, organisation: org || 'Unknown', applyUrl: href.startsWith('http') ? href : 'https://reliefweb.int' + href, deadline: dead, source: 'ReliefWeb', location: 'Pakistan' });
          });
          // UN Jobs
          $('table tr td a').each((i, el) => {
            const title = $(el).text().trim();
            const href  = $(el).attr('href') || '';
            if (title && title.length > 10 && href) jobs.push({ title, organisation: 'UN Agency', applyUrl: href.startsWith('http') ? href : 'https://unjobs.org' + href, source: 'UN Jobs', location: 'Pakistan' });
          });
          return jobs.slice(0, 30);
        }`,
      }),
    })

    const run = await runRes.json()
    const runId = run.data?.id
    if (!runId) throw new Error('Failed to start actor run')

    // Poll max 90s
    let succeeded = false
    for (let i = 0; i < 18; i++) {
      await new Promise(r => setTimeout(r, 5000))
      const s = await (await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`)).json()
      if (s.data?.status === 'SUCCEEDED') { succeeded = true; break }
      if (['FAILED','ABORTED','TIMED-OUT'].includes(s.data?.status)) throw new Error(`Actor ${s.data.status}`)
    }
    if (!succeeded) throw new Error('Actor timed out')

    const items = await (await fetch(`${APIFY_BASE}/datasets/${run.data?.defaultDatasetId}/items?token=${token}&clean=true`)).json()

    let upserted = 0
    for (const job of (Array.isArray(items) ? items.flat() : [])) {
      if (!job?.title || !job?.applyUrl) continue
      const { error } = await supabase.from('jobs').upsert({
        title:           job.title,
        organisation:    job.organisation || 'Unknown',
        org_type:        job.orgType ?? null,
        location:        job.location ?? 'Pakistan',
        employment_type: job.employmentType ?? null,
        seniority:       job.seniority ?? null,
        sector:          job.sector ?? null,
        salary_label:    job.salaryLabel ?? null,
        apply_url:       job.applyUrl,
        description:     job.description ?? null,
        deadline:        job.deadline ?? null,
        source:          job.source ?? 'ReliefWeb',
      }, { onConflict: 'apply_url' })
      if (!error) upserted++
    }

    await supabase.from('scraper_logs')
      .update({ status: 'healthy', last_run: new Date().toISOString(), records_last_run: upserted })
      .eq('name', 'ReliefWeb Jobs')

    return new Response(JSON.stringify({ ok: true, upserted }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    await supabase.from('scraper_logs')
      .update({ status: 'failing', error_message: String(err) })
      .eq('name', 'ReliefWeb Jobs')

    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
