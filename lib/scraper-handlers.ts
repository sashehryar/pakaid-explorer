/**
 * Scraper handler functions — called directly from the triggerScraper server action.
 * Each handler fetches live data from real public APIs, upserts into DB, and returns
 * a result summary. No hardcoded records — if the source returns nothing, we return 0.
 */

import { createAdminClient } from '@/lib/supabase/server'
import { runNewsScraperCore } from '@/lib/news-scraper'

const APIFY_TOKEN = process.env.APIFY_API_TOKEN ?? ''
const APIFY_BASE  = 'https://api.apify.com/v2'

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

// ── DevNetJobs Pakistan ────────────────────────────────────────────────────────

export async function scrapeDevNetJobs(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'DevNetJobs Pakistan'
  try {
    // DevNetJobs publishes an RSS feed — filter for Pakistan-relevant items
    const rssUrl = 'https://www.devnetjobs.org/rss/latest.xml'
    const resp   = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PakAidExplorer/1.0)', 'Accept': 'application/rss+xml, */*' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!resp.ok) throw new Error(`DevNetJobs RSS returned ${resp.status}`)

    const xml   = await resp.text()
    const items = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)]

    const admin = createAdminClient()
    let inserted = 0
    const PAKISTAN_TERMS = ['pakistan', 'islamabad', 'karachi', 'lahore', 'peshawar', 'quetta']

    for (const [rawItem] of items.slice(0, 60)) {
      const getTag = (tag: string) => {
        const m = rawItem.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
        return m ? m[1].replace(/<[^>]+>/g, '').trim() : ''
      }
      const title = getTag('title')
      const link  = getTag('link') || (rawItem.match(/<link>([^<]+)<\/link>/i)?.[1] ?? '')
      const org   = getTag('author') || getTag('dc:creator') || ''
      const desc  = getTag('description')
      const pub   = getTag('pubDate')

      if (!title || !link) continue

      // Only include Pakistan-relevant jobs
      const combined = `${title} ${desc} ${org}`.toLowerCase()
      if (!PAKISTAN_TERMS.some(t => combined.includes(t))) continue

      const { error } = await admin
        .from('jobs')
        .upsert(
          {
            title:        title.slice(0, 500),
            organisation: org.slice(0, 200) || 'Unknown',
            org_type:     'INGO',
            location:     'Pakistan',
            apply_url:    link.trim(),
            description:  desc.slice(0, 1000),
            deadline:     null,
            source:       'DevNetJobs',
            created_at:   pub ? new Date(pub).toISOString() : new Date().toISOString(),
          },
          { onConflict: 'title,organisation', ignoreDuplicates: true }
        )
      if (!error) inserted++
    }

    await updateScraperLog(SCRAPER_NAME, 'healthy', inserted)
    return { ok: true, message: `Parsed RSS, inserted ${inserted} Pakistan jobs` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await updateScraperLog(SCRAPER_NAME, 'failing', 0, msg)
    return { ok: false, message: msg }
  }
}

// ── ADB Pakistan Projects (via IATI) ──────────────────────────────────────────

export async function scrapeADBProjects(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'ADB Pakistan Projects'
  try {
    // ADB's IATI organisation reference is XM-DAC-4
    const res = await fetch(
      'https://iati.cloud/search/activity?' +
      'q=reporting_org_ref:(XM-DAC-4)%20AND%20recipient_country_code:(PK)%20AND%20activity_status_code:(2)' +
      '&fl=iati_identifier,title_narrative,description_narrative,activity_date_start_actual,' +
        'activity_date_end_planned,budget_value,sector_narrative' +
      '&rows=40&sort=budget_value+desc&wt=json',
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(20_000) }
    )
    if (!res.ok) throw new Error(`IATI returned ${res.status}`)

    const json = await res.json()
    const docs = (json.response?.docs ?? []) as Array<{
      iati_identifier?: string
      title_narrative?: string[]
      description_narrative?: string[]
      activity_date_start_actual?: string
      activity_date_end_planned?:  string
      budget_value?: number[]
      sector_narrative?: string[]
    }>

    const admin = createAdminClient()
    let inserted = 0

    for (const doc of docs) {
      const title = doc.title_narrative?.[0]
      if (!title) continue
      const { error } = await admin
        .from('projects')
        .upsert(
          {
            title:      title.slice(0, 500),
            donor:      'ADB',
            sector:     doc.sector_narrative?.[0] ?? 'Infrastructure',
            status:     'active' as const,
            iati_id:    doc.iati_identifier ?? null,
            start_date: doc.activity_date_start_actual ?? null,
            end_date:   doc.activity_date_end_planned  ?? null,
            amount_usd: doc.budget_value?.[0]          ?? null,
            source:     'IATI/ADB',
            source_url: doc.iati_identifier
              ? `https://d-portal.org/ctrack.html#view=act&aid=${doc.iati_identifier}`
              : null,
          },
          { onConflict: 'iati_id', ignoreDuplicates: true }
        )
      if (!error) inserted++
    }

    await updateScraperLog(SCRAPER_NAME, 'healthy', inserted)
    return { ok: true, message: `Fetched ${docs.length} ADB projects via IATI, inserted ${inserted} records` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await updateScraperLog(SCRAPER_NAME, 'failing', 0, msg)
    return { ok: false, message: msg }
  }
}

// ── EAD Project Pipeline (via IATI Pakistan Government) ───────────────────────

export async function scrapeEADPipeline(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'EAD Project Pipeline'
  try {
    // EAD (Economic Affairs Division) coordinates all foreign-assisted projects.
    // Use IATI datastore: active projects with Pakistan as recipient, multiple donors,
    // that typically go through EAD coordination.
    const res = await fetch(
      'https://iati.cloud/search/activity?' +
      'q=recipient_country_code:(PK)%20AND%20activity_status_code:(2)' +
      '%20AND%20reporting_org_ref:(GB-GOV-1%20OR%20US-GOV-1%20OR%20XM-DAC-4%20OR%20XM-DAC-5%20OR%20DE-1)' +
      '&fl=iati_identifier,title_narrative,reporting_org_narrative,' +
        'activity_date_start_actual,activity_date_end_planned,budget_value,sector_narrative' +
      '&rows=50&sort=budget_value+desc&wt=json',
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(25_000) }
    )
    if (!res.ok) throw new Error(`IATI returned ${res.status}`)

    const json = await res.json()
    const docs = (json.response?.docs ?? []) as Array<{
      iati_identifier?: string
      title_narrative?: string[]
      reporting_org_narrative?: string[]
      activity_date_start_actual?: string
      activity_date_end_planned?:  string
      budget_value?: number[]
      sector_narrative?: string[]
    }>

    const admin = createAdminClient()
    let inserted = 0

    for (const doc of docs) {
      const title = doc.title_narrative?.[0]
      const donor = doc.reporting_org_narrative?.[0]
      if (!title || !donor) continue
      const { error } = await admin
        .from('projects')
        .upsert(
          {
            title:      title.slice(0, 500),
            donor:      donor.slice(0, 200),
            sector:     doc.sector_narrative?.[0] ?? 'Governance',
            status:     'active' as const,
            iati_id:    doc.iati_identifier ?? null,
            start_date: doc.activity_date_start_actual ?? null,
            end_date:   doc.activity_date_end_planned  ?? null,
            amount_usd: doc.budget_value?.[0]          ?? null,
            source:     'IATI/EAD',
            source_url: doc.iati_identifier
              ? `https://d-portal.org/ctrack.html#view=act&aid=${doc.iati_identifier}`
              : null,
          },
          { onConflict: 'iati_id', ignoreDuplicates: true }
        )
      if (!error) inserted++
    }

    await updateScraperLog(SCRAPER_NAME, 'healthy', inserted)
    return { ok: true, message: `Fetched ${docs.length} EAD-coordinated projects, inserted ${inserted}` }
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
    const rssUrl = 'https://www.ppra.org.pk/feeds/tenders_rss.xml'
    const items: Array<{ title?: string; link?: string }> = []

    // Try Apify RSS parser first (more robust), fallback to direct fetch
    if (APIFY_TOKEN) {
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
      if (resp.ok) {
        const data = await resp.json()
        items.push(...(data as Array<{ title?: string; link?: string }>))
      }
    }

    if (items.length === 0) {
      // Fallback: direct RSS fetch
      const direct = await fetch(rssUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PakAidExplorer/1.0)' },
        signal: AbortSignal.timeout(15_000),
      })
      if (direct.ok) {
        const xml    = await direct.text()
        const titles = [...xml.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g)].map(m => m[1])
        const links  = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map(m => m[1])
        titles.slice(0, 30).forEach((t, i) => items.push({ title: t, link: links[i] }))
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
            title:      item.title.slice(0, 500),
            donor:      'PPRA',
            sector:     null,
            status:     'open' as const,
            source_url: item.link ?? null,
            source:     'PPRA',
            instrument: 'Tender',
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

// ── GIZ Project Finder (IATI) ──────────────────────────────────────────────────

export async function scrapeGIZProjects(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'GIZ Project Finder'
  try {
    const res = await fetch(
      'https://iati.cloud/search/activity?' +
      'q=reporting_org_ref:(DE-1)%20AND%20recipient_country_code:(PK)%20AND%20activity_status_code:(2)' +
      '&fl=iati_identifier,title_narrative,description_narrative,activity_status_code,' +
        'activity_date_start_actual,activity_date_end_planned,budget_value' +
      '&rows=30&wt=json',
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(20_000) }
    )

    let inserted = 0
    if (res.ok) {
      const json = await res.json()
      const docs = (json.response?.docs ?? []) as Array<{
        iati_identifier?: string
        title_narrative?: string[]
        activity_date_start_actual?: string
        activity_date_end_planned?:  string
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

// ── IATI Datastore (overlap records) ──────────────────────────────────────────

export async function scrapeIATIDatastore(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'IATI Datastore Pakistan'  // matches DB name
  try {
    const res = await fetch(
      'https://iati.cloud/search/activity?' +
      'q=recipient_country_code:(PK)%20AND%20activity_status_code:(2)' +
      '&fl=iati_identifier,title_narrative,reporting_org_narrative,' +
        'description_narrative,sector_code,activity_date_start_actual,' +
        'activity_date_end_planned,budget_value' +
      '&rows=50&sort=budget_value+desc&wt=json',
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(25_000) }
    )
    if (!res.ok) throw new Error(`IATI returned ${res.status}`)

    const json = await res.json()
    const docs = (json.response?.docs ?? []) as Array<{
      iati_identifier?: string
      title_narrative?: string[]
      reporting_org_narrative?: string[]
      activity_date_start_actual?: string
      activity_date_end_planned?:  string
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

// ── News Feeds (RSS — calls shared core directly, no HTTP self-call) ───────────

export async function scrapeNewsFeeds(scraperName: string): Promise<{ ok: boolean; message: string }> {
  try {
    const result = await runNewsScraperCore()
    if ('error' in result) {
      await updateScraperLog(scraperName, 'failing', 0, result.error)
      return { ok: false, message: result.error }
    }
    await updateScraperLog(scraperName, 'healthy', result.articles_inserted)
    return {
      ok: true,
      message: `${result.articles_inserted} articles saved, ${result.articles_summarized} AI summaries`,
    }
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
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(20_000) }
    )
    if (!res.ok) throw new Error(`WB API returned ${res.status}`)

    const json  = await res.json()
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

// ── WB / ADB Procurement Notices ──────────────────────────────────────────────

export async function scrapeProcurementNotices(
  source: 'WB' | 'ADB',
  scraperName: string
): Promise<{ ok: boolean; message: string }> {
  const admin = createAdminClient()
  let inserted = 0

  try {
    if (source === 'WB') {
      const res = await fetch(
        'https://search.worldbank.org/api/v2/procurement?' +
        'format=json&countrycode=PK&procstatus=Open&rows=20',
        { next: { revalidate: 0 }, signal: AbortSignal.timeout(20_000) }
      )
      if (!res.ok) throw new Error(`WB procurement API returned ${res.status}`)
      const json    = await res.json()
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

    if (source === 'ADB') {
      // ADB procurement via their public API (business opportunities)
      const res = await fetch(
        'https://www.adb.org/api/projects?country=PAK&type=procurement&status=active&limit=30',
        { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; PakAidExplorer/1.0)' },
          signal: AbortSignal.timeout(15_000) }
      )
      if (res.ok) {
        const json = await res.json()
        const notices = (json.data ?? json.projects ?? json.items ?? []) as Array<{
          title?: string; id?: string; closingDate?: string; country?: string
        }>
        for (const n of notices) {
          if (!n.title) continue
          const { error } = await admin
            .from('tenders')
            .upsert(
              {
                title:      n.title.slice(0, 500),
                donor:      'ADB',
                status:     'open' as const,
                deadline:   n.closingDate ?? null,
                source:     'ADB',
                source_url: n.id ? `https://www.adb.org/projects/${n.id}` : null,
                instrument: 'Procurement',
              },
              { onConflict: 'title,source', ignoreDuplicates: true }
            )
          if (!error) inserted++
        }
      } else {
        // ADB public API not available — try IATI procurement notices
        const iatiRes = await fetch(
          'https://iati.cloud/search/activity?' +
          'q=reporting_org_ref:(XM-DAC-4)%20AND%20recipient_country_code:(PK)%20AND%20activity_status_code:(1)' +
          '&fl=iati_identifier,title_narrative,activity_date_end_planned,budget_value' +
          '&rows=20&wt=json',
          { signal: AbortSignal.timeout(15_000) }
        )
        if (iatiRes.ok) {
          const json = await iatiRes.json()
          const docs = (json.response?.docs ?? []) as Array<{
            iati_identifier?: string; title_narrative?: string[]
            activity_date_end_planned?: string; budget_value?: number[]
          }>
          for (const doc of docs) {
            const title = doc.title_narrative?.[0]
            if (!title) continue
            const { error } = await admin
              .from('tenders')
              .upsert(
                {
                  title:      title.slice(0, 500),
                  donor:      'ADB',
                  status:     'open' as const,
                  deadline:   doc.activity_date_end_planned ?? null,
                  source:     'ADB',
                  source_url: doc.iati_identifier
                    ? `https://d-portal.org/ctrack.html#view=act&aid=${doc.iati_identifier}`
                    : null,
                  instrument: 'Procurement',
                },
                { onConflict: 'title,source', ignoreDuplicates: true }
              )
            if (!error) inserted++
          }
        }
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

// ── FCDO DevTracker (IATI GB-GOV-1) ───────────────────────────────────────────

export async function scrapeFCDODevTracker(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'FCDO DevTracker'
  try {
    // FCDO (formerly DFID) IATI organisation ref: GB-GOV-1
    const res = await fetch(
      'https://iati.cloud/search/activity?' +
      'q=reporting_org_ref:(GB-GOV-1)%20AND%20recipient_country_code:(PK)%20AND%20activity_status_code:(2)' +
      '&fl=iati_identifier,title_narrative,description_narrative,' +
        'activity_date_start_actual,activity_date_end_planned,budget_value,sector_narrative' +
      '&rows=40&sort=budget_value+desc&wt=json',
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(20_000) }
    )
    if (!res.ok) throw new Error(`IATI returned ${res.status}`)

    const json = await res.json()
    const docs = (json.response?.docs ?? []) as Array<{
      iati_identifier?: string
      title_narrative?: string[]
      activity_date_start_actual?: string
      activity_date_end_planned?:  string
      budget_value?: number[]
      sector_narrative?: string[]
    }>

    const admin = createAdminClient()
    let inserted = 0

    for (const doc of docs) {
      const title = doc.title_narrative?.[0]
      if (!title) continue
      const { error } = await admin
        .from('projects')
        .upsert(
          {
            title:      title.slice(0, 500),
            donor:      'FCDO',
            sector:     doc.sector_narrative?.[0] ?? 'Governance',
            status:     'active' as const,
            iati_id:    doc.iati_identifier ?? null,
            start_date: doc.activity_date_start_actual ?? null,
            end_date:   doc.activity_date_end_planned  ?? null,
            amount_usd: doc.budget_value?.[0]          ?? null,
            source:     'IATI/FCDO',
            source_url: doc.iati_identifier
              ? `https://devtracker.fcdo.gov.uk/projects/${doc.iati_identifier}`
              : null,
          },
          { onConflict: 'iati_id', ignoreDuplicates: true }
        )
      if (!error) inserted++
    }

    await updateScraperLog(SCRAPER_NAME, 'healthy', inserted)
    return { ok: true, message: `Fetched ${docs.length} FCDO projects via IATI, inserted ${inserted}` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await updateScraperLog(SCRAPER_NAME, 'failing', 0, msg)
    return { ok: false, message: msg }
  }
}

// ── EU OPSYS Pakistan (IATI XM-DAC-6-4 = European Commission) ─────────────────

export async function scrapeEUOpsys(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'EU OPSYS Pakistan'
  try {
    // European Commission (EuropeAid/DG DEVCO) IATI org ref: XM-DAC-6-4
    const res = await fetch(
      'https://iati.cloud/search/activity?' +
      'q=reporting_org_ref:(XM-DAC-6-4)%20AND%20recipient_country_code:(PK)%20AND%20activity_status_code:(2)' +
      '&fl=iati_identifier,title_narrative,description_narrative,' +
        'activity_date_start_actual,activity_date_end_planned,budget_value,sector_narrative' +
      '&rows=30&sort=budget_value+desc&wt=json',
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(20_000) }
    )
    if (!res.ok) throw new Error(`IATI returned ${res.status}`)

    const json = await res.json()
    const docs = (json.response?.docs ?? []) as Array<{
      iati_identifier?: string
      title_narrative?: string[]
      activity_date_start_actual?: string
      activity_date_end_planned?:  string
      budget_value?: number[]
      sector_narrative?: string[]
    }>

    const admin = createAdminClient()
    let inserted = 0

    for (const doc of docs) {
      const title = doc.title_narrative?.[0]
      if (!title) continue
      const { error } = await admin
        .from('projects')
        .upsert(
          {
            title:      title.slice(0, 500),
            donor:      'EU',
            sector:     doc.sector_narrative?.[0] ?? 'Governance',
            status:     'active' as const,
            iati_id:    doc.iati_identifier ?? null,
            start_date: doc.activity_date_start_actual ?? null,
            end_date:   doc.activity_date_end_planned  ?? null,
            amount_usd: doc.budget_value?.[0]          ?? null,
            source:     'IATI/EU',
            source_url: doc.iati_identifier
              ? `https://d-portal.org/ctrack.html#view=act&aid=${doc.iati_identifier}`
              : null,
          },
          { onConflict: 'iati_id', ignoreDuplicates: true }
        )
      if (!error) inserted++
    }

    await updateScraperLog(SCRAPER_NAME, 'healthy', inserted)
    return { ok: true, message: `Fetched ${docs.length} EU projects via IATI, inserted ${inserted}` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await updateScraperLog(SCRAPER_NAME, 'failing', 0, msg)
    return { ok: false, message: msg }
  }
}

// ── UN Jobs Pakistan (ReliefWeb Jobs API — UN source type) ─────────────────────

export async function scrapeUNJobs(): Promise<{ ok: boolean; message: string }> {
  const SCRAPER_NAME = 'UN Jobs Pakistan'
  try {
    // ReliefWeb jobs API filtered for Pakistan + UN-type organisations
    const res = await fetch(
      'https://api.reliefweb.int/v1/jobs' +
      '?appname=pakaid-explorer&profile=full&limit=30' +
      '&filter[operator]=AND' +
      '&filter[conditions][0][field]=country.name&filter[conditions][0][value]=Pakistan' +
      '&filter[conditions][1][field]=source.type.name&filter[conditions][1][value]=United%20Nations',
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(20_000) }
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
            organisation:    f.source?.[0]?.name ?? 'UN Agency',
            org_type:        'UN',
            location:        f.city?.[0]?.name ?? 'Pakistan',
            employment_type: f.type?.[0]?.name ?? 'Full-time',
            seniority:       'Mid',
            sector:          f.career_categories?.[0]?.name ?? null,
            apply_url:       f.url ?? null,
            description:     (f.body ?? '').slice(0, 1000),
            deadline:        f.date?.closing ?? null,
            source:          'UN Jobs',
          },
          { onConflict: 'title,organisation', ignoreDuplicates: true }
        )
      if (!error) inserted++
    }

    await updateScraperLog(SCRAPER_NAME, 'healthy', inserted)
    return { ok: true, message: `Fetched ${items.length} UN jobs via ReliefWeb, inserted ${inserted}` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await updateScraperLog(SCRAPER_NAME, 'failing', 0, msg)
    return { ok: false, message: msg }
  }
}
