/**
 * Edge Function: scrape-jobs
 * Uses Apify to scrape ReliefWeb, UN Jobs, and DevNetJobs for Pakistan development jobs.
 * Trigger: twice daily cron
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APIFY_BASE = 'https://api.apify.com/v2'

interface ApifyJob {
  title: string
  organisation: string
  orgType?: string
  location?: string
  employmentType?: string
  seniority?: string
  sector?: string
  salaryLabel?: string
  applyUrl: string
  description?: string
  deadline?: string
  source: string
}

async function runApifyActor(actorId: string, input: Record<string, unknown>): Promise<ApifyJob[]> {
  const token = Deno.env.get('APIFY_API_TOKEN')!

  // Start actor run
  const runRes = await fetch(`${APIFY_BASE}/acts/${actorId}/runs?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, maxItems: 50 }),
  })
  const run = await runRes.json()
  const runId = run.data?.id
  if (!runId) throw new Error(`Failed to start actor ${actorId}`)

  // Poll for completion (max 60s)
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`)
    const status = await statusRes.json()
    if (status.data?.status === 'SUCCEEDED') break
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status.data?.status)) {
      throw new Error(`Actor ${actorId} ${status.data.status}`)
    }
  }

  // Get dataset
  const datasetId = run.data?.defaultDatasetId
  const dataRes = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&clean=true`)
  return await dataRes.json()
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ReliefWeb Jobs via Apify web scraper
  try {
    const jobs = await runApifyActor('apify/reliefweb-jobs', {
      startUrls: [{ url: 'https://reliefweb.int/jobs?country=168&source=0' }],
      maxPagesPerCrawl: 3,
    })

    let upserted = 0
    for (const job of jobs) {
      const { error } = await supabase.from('jobs').upsert({
        title: job.title,
        organisation: job.organisation,
        org_type: job.orgType,
        location: job.location ?? 'Pakistan',
        employment_type: job.employmentType,
        seniority: job.seniority,
        sector: job.sector,
        salary_label: job.salaryLabel,
        apply_url: job.applyUrl,
        description: job.description,
        deadline: job.deadline,
        source: job.source ?? 'ReliefWeb',
      }, { onConflict: 'apply_url' })
      if (!error) upserted++
    }

    await supabase.from('scraper_logs')
      .update({ status: 'healthy', last_run: new Date().toISOString(), records_last_run: upserted })
      .eq('apify_actor_id', 'apify/reliefweb-jobs')

    return new Response(JSON.stringify({ ok: true, upserted }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    await supabase.from('scraper_logs')
      .update({ status: 'failing', error_message: String(err) })
      .eq('apify_actor_id', 'apify/reliefweb-jobs')

    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
