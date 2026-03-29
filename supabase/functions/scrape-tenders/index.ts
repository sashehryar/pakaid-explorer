/**
 * Edge Function: scrape-tenders
 * Scrapes WB and ADB procurement notices for Pakistan.
 * WB: search.worldbank.org/procurement — direct API
 * ADB: www.adb.org/work-with-us/opportunities/business/notices — Apify web scraper
 * Trigger: twice daily cron
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WB_PROC_API = 'https://search.worldbank.org/api/v2/wds'
  + '?qterm=Pakistan&docty=Procurement+Notice&fl=id,docdt,display_title,url,pdfurl&rows=50&format=json'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let upserted = 0

  // World Bank procurement notices
  try {
    const res = await fetch(WB_PROC_API)
    const json = await res.json()
    const docs = Object.values(json.documents ?? {}) as any[]

    for (const doc of docs) {
      const { error } = await supabase.from('tenders').upsert({
        title: doc.display_title ?? doc.docna,
        donor: 'World Bank',
        status: 'open',
        source_url: doc.url ?? doc.pdfurl,
        source: 'WB',
      }, { onConflict: 'source_url' })
      if (!error) upserted++
    }

    await supabase.from('scraper_logs')
      .update({ status: 'healthy', last_run: new Date().toISOString(), records_last_run: upserted })
      .eq('apify_actor_id', 'apify/wb-procurement')

  } catch (err) {
    await supabase.from('scraper_logs')
      .update({ status: 'failing', error_message: String(err) })
      .eq('apify_actor_id', 'apify/wb-procurement')
  }

  return new Response(JSON.stringify({ ok: true, upserted }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
