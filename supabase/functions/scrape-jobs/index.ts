/**
 * Edge Function: scrape-jobs
 * Pulls Pakistan development jobs from ReliefWeb API (official, no scraping needed).
 * Trigger: daily cron
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RELIEFWEB_API = 'https://api.reliefweb.int/v1/jobs'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY')!,
  )

  try {
    // ReliefWeb official API — filter to Pakistan, last 30 days
    const params = new URLSearchParams({
      appname: 'pakaidexplorer',
      profile: 'list',
      preset: 'latest',
      limit: '50',
    })
    // POST body for filtering
    const body = {
      fields: {
        include: ['title', 'source', 'date', 'url', 'body', 'type', 'city', 'country', 'experience'],
      },
      filter: {
        conditions: [
          { field: 'country.name', value: 'Pakistan' },
          { field: 'status', value: 'active' },
        ],
      },
      sort: [{ field: 'date.created', order: 'desc' }],
      limit: 50,
    }

    const res = await fetch(`${RELIEFWEB_API}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'PakAidExplorer/1.0 (contact@pakaidexplorer.com)',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`ReliefWeb API error ${res.status}: ${text.slice(0, 200)}`)
    }

    const json = await res.json()
    const items = json.data ?? []

    let upserted = 0
    for (const item of items) {
      const f = item.fields ?? {}
      const applyUrl = f.url ?? `https://reliefweb.int/node/${item.id}`
      const title = f.title
      if (!title) continue

      const { error } = await supabase.from('jobs').upsert({
        title,
        organisation:    f.source?.[0]?.name ?? 'Unknown',
        location:        f.city?.[0]?.name ?? f.country?.[0]?.name ?? 'Pakistan',
        sector:          f.type?.[0]?.name ?? null,
        seniority:       f.experience?.[0]?.name ?? null,
        apply_url:       applyUrl,
        description:     f.body ?? null,
        deadline:        f.date?.closing ?? null,
        source:          'ReliefWeb',
        employment_type: null,
      }, { onConflict: 'apply_url' })

      if (!error) upserted++
    }

    await supabase.from('scraper_logs')
      .update({ status: 'healthy', last_run: new Date().toISOString(), records_last_run: upserted })
      .eq('name', 'ReliefWeb Jobs')

    return new Response(JSON.stringify({ ok: true, upserted, total: items.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = String(err)
    await supabase.from('scraper_logs')
      .update({ status: 'failing', error_message: msg })
      .eq('name', 'ReliefWeb Jobs')

    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
