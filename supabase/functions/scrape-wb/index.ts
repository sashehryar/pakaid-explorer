/**
 * Edge Function: scrape-wb
 * Fetches World Bank Pakistan projects via WB API and upserts to projects table.
 * Trigger: daily cron or manual POST
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WB_API = 'https://search.worldbank.org/api/v2/projects'
  + '?countrycode_exact=PK&status=Active&fl=id,project_name,boardapprovaldate,closingdate,'
  + 'totalamt,sector1,theme1,regionname,impagency,supplementprojectflg&rows=100&os=0&format=json'

interface WBProject {
  id: string
  project_name: string
  boardapprovaldate: string
  closingdate: string
  totalamt: number
  sector1?: { Name: string }
  impagency: string
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const res = await fetch(WB_API)
    const json = await res.json()
    const projects: WBProject[] = Object.values(json.projects ?? {})

    let upserted = 0
    for (const p of projects) {
      const { error } = await supabase.from('projects').upsert({
        title: p.project_name,
        donor: 'World Bank',
        sector: p.sector1?.Name ?? 'General',
        amount_usd: p.totalamt,
        status: 'active',
        instrument: 'Loan',
        start_date: p.boardapprovaldate?.split('T')[0] ?? null,
        end_date: p.closingdate?.split('T')[0] ?? null,
        implementer: p.impagency || null,
        iati_id: p.id,
        source: 'WB',
        source_url: `https://projects.worldbank.org/en/projects-operations/project-detail/${p.id}`,
      }, { onConflict: 'iati_id' })

      if (!error) upserted++
    }

    // Update scraper log
    await supabase.from('scraper_logs')
      .update({ status: 'healthy', last_run: new Date().toISOString(), records_last_run: upserted })
      .eq('apify_actor_id', 'apify/wb-projects')

    return new Response(JSON.stringify({ ok: true, upserted }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    await supabase.from('scraper_logs')
      .update({ status: 'failing', error_message: String(err) })
      .eq('apify_actor_id', 'apify/wb-projects')

    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
