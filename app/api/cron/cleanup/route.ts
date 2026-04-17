import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime     = 'nodejs'
export const maxDuration = 60

/**
 * Cron cleanup — runs daily at 03:00 UTC (configured in vercel.json).
 * Also callable via POST from admin panel.
 *
 * Deletes:
 *   1. News articles older than 6 days
 *   2. Tenders whose deadline passed more than 1 day ago
 *   3. Aid pipeline projects whose end_date passed more than 90 days ago
 */
async function runCleanup() {
  const supabase = createAdminClient()
  const results: Record<string, number | string> = {}

  // ── 1. Delete news articles older than 6 days ────────────────────────────────
  const newsThreshold = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  const { count: newsDeleted, error: newsErr } = await supabase
    .from('news_articles')
    .delete({ count: 'exact' })
    .lt('published_at', newsThreshold)

  if (newsErr) {
    results.news_error = newsErr.message
  } else {
    results.news_deleted = newsDeleted ?? 0
  }

  // ── 2. Delete expired tenders (deadline > 1 day ago) ──────────────────────────
  const tenderThreshold = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  const { count: tendersDeleted, error: tenderErr } = await supabase
    .from('tenders')
    .delete({ count: 'exact' })
    .lt('deadline', tenderThreshold)

  if (tenderErr) {
    results.tenders_error = tenderErr.message
  } else {
    results.tenders_deleted = tendersDeleted ?? 0
  }

  // ── 3. Delete expired aid pipeline projects (end_date > 90 days ago) ──────────
  // 90-day grace period keeps recently-ended projects visible;
  // excludes frozen programmes (they may still be active/relevant).
  const projectThreshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { count: projectsDeleted, error: projectErr } = await supabase
    .from('projects')
    .delete({ count: 'exact' })
    .lt('end_date', projectThreshold)
    .neq('status', 'frozen')

  if (projectErr) {
    results.projects_error = projectErr.message
  } else {
    results.projects_deleted = projectsDeleted ?? 0
  }

  // ── Log to scraper_logs ──────────────────────────────────────────────────────
  const hasError = !!(results.news_error || results.tenders_error || results.projects_error)
  await supabase.from('scraper_logs').upsert({
    name:             'cron:cleanup',
    target_url:       '/api/cron/cleanup',
    status:           hasError ? 'failing' : 'healthy',
    last_run:         new Date().toISOString(),
    records_last_run: (results.news_deleted as number ?? 0) +
                      (results.tenders_deleted as number ?? 0) +
                      (results.projects_deleted as number ?? 0),
    error_message:    hasError
      ? [results.news_error, results.tenders_error, results.projects_error].filter(Boolean).join(' | ').slice(0, 500)
      : null,
  }, { onConflict: 'name' })

  return results
}

// ── GET — called by Vercel cron ───────────────────────────────────────────────
export async function GET() {
  const results = await runCleanup()
  return NextResponse.json({ ok: true, ...results })
}

// ── POST — called from admin panel ────────────────────────────────────────────
export async function POST() {
  const results = await runCleanup()
  return NextResponse.json({ ok: true, ...results })
}
