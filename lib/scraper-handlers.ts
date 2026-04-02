/**
 * Scraper handler functions — called directly from the triggerScraper server action.
 * Each handler fetches live data, upserts into DB, and returns a result summary.
 */

import { createAdminClient } from '@/lib/supabase/server'

const APIFY_TOKEN  = process.env.APIFY_API_TOKEN ?? ''
const APIFY_BASE   = 'https://api.apify.com/v2'

// ── Helpers ────────────────────────────────────────────────────────────────────

async function updateScraperLog(
  name: string,
  status: 'healthy' | 'failing',
  recordCount: number,
  errorMessage?: string,
) {
  const admin = createAdminClient()
  await admin
    .from('scraper_logs')
    .update({
      status,
      last_run:         new Date().toISOString(),
      records_last_run: recordCount,
      error_message:    errorMessage ?? null,
      updated_at:       new Date().toISOString(),
    })
    .eq('name', name)
}

// ── ReliefWeb Jobs ─────────────────────────────────────────────────────────────

export async function scrapeReliefWebJobs(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'ReliefWeb Jobs'
  try {
    const res = await fetch(
      'https://api.reliefweb.int/v1/jobs' +
      '?appname=pakaid-explorer&profile=full&preset=latest' +
      '&filter[field]=country.name&filter[value]=Pakistan&limit=30',
      { next: { revalidate: 0 } }
    )
    if (!res.ok) throw new Error(`ReliefWeb returned ${res.status}`)

    const json  = await res.json()
    const items = (json.data ?? []) as Array<{
      id: string
      fields: {
        title: string
        source?: Array<{ name: string }>
        city?: Array<{ name: string }>
        type?: Array<{ name: string }>
        career_categories?: Array<{ name: string }>
        date?: { closing?: string }
        url?: string
        body?: string
      }
    }>

    const admin = createAdminClient()
    let inserted = 0

    for (const item of items) {
      const f = item.fields
      const { error } = await admin
        .from('jobs')
        .upsert(
          {
            title:           f.title,
            organisation:    f.source?.[0]?.name ?? 'Unknown',
            org_type:        'INGO',
            location:        f.city?.[0]?.name ?? 'Pakistan',
            employment_type: f.type?.[0]?.name ?? 'Full-time',
            seniority:       'Mid',
            sector:          f.career_categories?.[0]?.name ?? null,
            apply_url:       f.url ?? null,
            description:     (f.body ?? '').slice(0, 1000),
            deadline:        f.date?.closing ?? null,
            source:          'ReliefWeb',
          },
          { onConflict: 'title,organisation', ignoreDuplicates: true }
        )
      if (!error) inserted++
    }

    await updateScraperLog(SCRAPER_NAME, 'healthy', inserted)
    return { ok: true, message: `Fetched ${items.length} jobs, inserted ${inserted} new records` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await updateScraperLog(SCRAPER_NAME, 'failing', 0, msg)
    return { ok: false, message: msg }
  }
}

// ── PPRA Federal Tenders ───────────────────────────────────────────────────────

export async function scrapePPRATenders(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'PPRA Federal Tenders'
  try {
    // Use Apify RSS parser on PPRA's tenders RSS feed
    const rssUrl = 'https://www.ppra.org.pk/feeds/tenders_rss.xml'

    const resp = await fetch(
      `${APIFY_BASE}/acts/lukaskrivka~rss-parser/run-sync-get-dataset-items` +
      `?token=${APIFY_TOKEN}&timeout=60&memory=256`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: [{ url: rssUrl }], maxItemsPerFeed: 50 }),
        signal: AbortSignal.timeout(70_000),
      }
    )

    let items: Array<{ title?: string; link?: string; description?: string; pubDate?: string }> = []

    if (resp.ok) {
      items = await resp.json()
    } else {
      // Fallback: direct RSS fetch
      const direct = await fetch(rssUrl, { signal: AbortSignal.timeout(15_000) })
      if (direct.ok) {
        const xml = await direct.text()
        const titles = [...xml.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g)].map(m => m[1])
        const links  = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map(m => m[1])
        items = titles.slice(0, 30).map((t, i) => ({ title: t, link: links[i] }))
      }
    }

    const admin = createAdminClient()
    let inserted = 0

    for (const item of items.slice(0, 30)) {
      if (!item.title) continue
      const { error } = await admin
        .from('tenders')
        .upsert(
          {
            title:       item.title.slice(0, 500),
            donor:       'PPRA',
            sector:      null,
            status:      'open' as const,
            source_url:  item.link ?? null,
            source:      'PPRA',
            instrument:  'Tender',
          },
          { onConflict: 'title,source', ignoreDuplicates: true }
        )
      if (!error) inserted++
    }

    await updateScraperLog(SCRAPER_NAME, 'healthy', inserted)
    return { ok: true, message: `Fetched ${items.length} tenders, inserted ${inserted} new` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await updateScraperLog(SCRAPER_NAME, 'failing', 0, msg)
    return { ok: false, message: msg }
  }
}

// ── GIZ Project Finder ─────────────────────────────────────────────────────────

export async function scrapeGIZProjects(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'GIZ Project Finder'
  try {
    // IATI datastore filtered for GIZ Pakistan (reporting_org = DE-1)
    const res = await fetch(
      'https://iati.cloud/search/activity?' +
      'q=reporting_org_ref:(DE-1)%20AND%20recipient_country_code:(PK)' +
      '&fl=iati_identifier,title_narrative,description_narrative,activity_status_code,' +
        'activity_date_start_actual,activity_date_end_planned,budget_value' +
      '&rows=30&wt=json',
      { next: { revalidate: 0 } }
    )

    let inserted = 0
    if (res.ok) {
      const json = await res.json()
      const docs = (json.response?.docs ?? []) as Array<{
        iati_identifier?: string
        title_narrative?: string[]
        description_narrative?: string[]
        activity_status_code?: string
        activity_date_start_actual?: string
        activity_date_end_planned?: string
        budget_value?: number[]
      }>

      const admin = createAdminClient()
      for (const doc of docs) {
        const title = doc.title_narrative?.[0]
        if (!title) continue
        const { error } = await admin
          .from('projects')
          .upsert(
            {
              title:      title.slice(0, 500),
              donor:      'GIZ',
              sector:     'Rural Development',
              status:     'active' as const,
              iati_id:    doc.iati_identifier ?? null,
              start_date: doc.activity_date_start_actual ?? null,
              end_date:   doc.activity_date_end_planned  ?? null,
              amount_usd: doc.budget_value?.[0]          ?? null,
              source:     'IATI/GIZ',
              source_url: doc.iati_identifier
                ? `https://d-portal.org/ctrack.html#view=act&aid=${doc.iati_identifier}`
                : null,
            },
            { onConflict: 'iati_id', ignoreDuplicates: true }
          )
        if (!error) inserted++
      }
    }

    await updateScraperLog(SCRAPER_NAME, 'healthy', inserted)
    return { ok: true, message: `Fetched GIZ projects via IATI, inserted ${inserted} records` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await updateScraperLog(SCRAPER_NAME, 'failing', 0, msg)
    return { ok: false, message: msg }
  }
}

// ── IATI Datastore ─────────────────────────────────────────────────────────────

export async function scrapeIATIDatastore(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'IATI Datastore'
  try {
    const res = await fetch(
      'https://iati.cloud/search/activity?' +
      'q=recipient_country_code:(PK)%20AND%20activity_status_code:(2)' +
      '&fl=iati_identifier,title_narrative,reporting_org_narrative,' +
        'description_narrative,sector_code,activity_date_start_actual,' +
        'activity_date_end_planned,budget_value' +
      '&rows=50&sort=budget_value+desc&wt=json',
      { next: { revalidate: 0 } }
    )

    if (!res.ok) throw new Error(`IATI returned ${res.status}`)

    const json = await res.json()
    const docs = (json.response?.docs ?? []) as Array<{
      iati_identifier?: string
      title_narrative?: string[]
      reporting_org_narrative?: string[]
      description_narrative?: string[]
      sector_code?: string[]
      activity_date_start_actual?: string
      activity_date_end_planned?: string
      budget_value?: number[]
    }>

    const admin = createAdminClient()
    let inserted = 0

    for (const doc of docs) {
      const title = doc.title_narrative?.[0]
      const donor = doc.reporting_org_narrative?.[0]
      if (!title || !donor) continue

      const { error } = await admin
        .from('overlap_records')
        .upsert(
          {
            iati_id:    doc.iati_identifier ?? null,
            title:      title.slice(0, 500),
            donor:      donor.slice(0, 200),
            sector:     'Governance',
            province:   'Multi-province',
            start_date: doc.activity_date_start_actual ?? null,
            end_date:   doc.activity_date_end_planned  ?? null,
            amount_usd: doc.budget_value?.[0]          ?? null,
            keywords:   [],
            source:     'IATI',
          },
          { onConflict: 'iati_id', ignoreDuplicates: true }
        )
      if (!error) inserted++
    }

    await updateScraperLog(SCRAPER_NAME, 'healthy', inserted)
    return { ok: true, message: `Fetched ${docs.length} IATI activities, inserted ${inserted} records` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await updateScraperLog(SCRAPER_NAME, 'failing', 0, msg)
    return { ok: false, message: msg }
  }
}

// ── News Feeds (Dawn / The News Economy etc.) ──────────────────────────────────

export async function scrapeNewsFeeds(scraperName: string): Promise<{ ok: boolean; message: string }> {
  try {
    // Internally call our own scrape-news route
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/scrape-news`, {
      method: 'POST',
      signal: AbortSignal.timeout(120_000),
    })
    if (!res.ok) {
      const txt = await res.text()
      await updateScraperLog(scraperName, 'failing', 0, txt.slice(0, 200))
      return { ok: false, message: `News scraper returned ${res.status}` }
    }
    const d = await res.json() as { articles_inserted?: number; articles_summarized?: number }
    await updateScraperLog(scraperName, 'healthy', d.articles_inserted ?? 0)
    return { ok: true, message: `${d.articles_inserted ?? 0} articles saved, ${d.articles_summarized ?? 0} AI summaries` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await updateScraperLog(scraperName, 'failing', 0, msg)
    return { ok: false, message: msg }
  }
}

// ── World Bank Projects ────────────────────────────────────────────────────────

export async function scrapeWorldBankProjects(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'World Bank Projects API'
  try {
    const res = await fetch(
      'https://search.worldbank.org/api/v2/projects?' +
      'format=json&countrycode=PK&status=Active&fl=id,projectid,project_name,' +
        'boardapprovaldate,closingdate,totalcommamt,sector1,impagency&rows=30',
      { next: { revalidate: 0 } }
    )
    if (!res.ok) throw new Error(`WB API returned ${res.status}`)

    const json = await res.json()
    const items = (json.projects?.project ?? []) as Array<{
      id?: string; projectid?: string; project_name?: string
      boardapprovaldate?: string; closingdate?: string
      totalcommamt?: number; sector1?: { Name?: string }
    }>

    const admin = createAdminClient()
    let inserted = 0

    for (const item of items) {
      const title = item.project_name
      if (!title) continue
      const { error } = await admin
        .from('projects')
        .upsert(
          {
            title:      title.slice(0, 500),
            donor:      'World Bank',
            sector:     item.sector1?.Name ?? 'Governance',
            status:     'active' as const,
            iati_id:    item.projectid ?? null,
            start_date: item.boardapprovaldate ?? null,
            end_date:   item.closingdate       ?? null,
            amount_usd: item.totalcommamt      ?? null,
            source:     'WB',
            source_url: item.id
              ? `https://projects.worldbank.org/en/projects-operations/project-detail/${item.id}`
              : null,
          },
          { onConflict: 'iati_id', ignoreDuplicates: true }
        )
      if (!error) inserted++
    }

    await updateScraperLog(SCRAPER_NAME, 'healthy', inserted)
    return { ok: true, message: `Fetched ${items.length} WB projects, inserted ${inserted} records` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await updateScraperLog(SCRAPER_NAME, 'failing', 0, msg)
    return { ok: false, message: msg }
  }
}

// ── WB / ADB Procurement ───────────────────────────────────────────────────────

export async function scrapeProcurementNotices(
  source: 'WB' | 'ADB',
  scraperName: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const admin = createAdminClient()
    let inserted = 0

    if (source === 'WB') {
      const res = await fetch(
        'https://search.worldbank.org/api/v2/procurement?' +
        'format=json&countrycode=PK&procstatus=Open&rows=20',
        { next: { revalidate: 0 } }
      )
      if (!res.ok) throw new Error(`WB procurement API returned ${res.status}`)
      const json = await res.json()
      const notices = (json.notices?.notice ?? []) as Array<{
        noticeId?: string; title?: string; deadline?: string; projectid?: string
      }>
      for (const n of notices) {
        if (!n.title) continue
        const { error } = await admin
          .from('tenders')
          .upsert(
            {
              title:      n.title.slice(0, 500),
              donor:      'World Bank',
              status:     'open' as const,
              deadline:   n.deadline ?? null,
              source:     'WB',
              source_url: n.noticeId
                ? `https://projects.worldbank.org/en/projects-operations/procurement/procurement-notice/${n.noticeId}`
                : null,
              instrument: 'Procurement',
            },
            { onConflict: 'title,source', ignoreDuplicates: true }
          )
        if (!error) inserted++
      }
    }

    await updateScraperLog(scraperName, 'healthy', inserted)
    return { ok: true, message: `Inserted ${inserted} ${source} procurement notices` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await updateScraperLog(scraperName, 'failing', 0, msg)
    return { ok: false, message: msg }
  }
}
