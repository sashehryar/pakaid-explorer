import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatUSD } from '@/lib/utils'
import type { NewsArticle, Tender, Job } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Home — PakAid Explorer' }

// ── Signal classifier ────────────────────────────────────────────────────────
function classifySignal(title: string, excerpt: string): string {
  const t = (title + ' ' + excerpt).toLowerCase()
  if (['tender', 'procurement', 'rfp', 'bid', 'contract'].some(k => t.includes(k))) return 'procurement signal'
  if (['imf', 'budget', 'tranche', 'fiscal', 'disbursement', 'freeze', 'allocation'].some(k => t.includes(k))) return 'funding signal'
  if (['law', 'policy', 'regulation', 'reform', 'government', 'ministry', 'parliament'].some(k => t.includes(k))) return 'policy shift'
  if (['flood', 'earthquake', 'crisis', 'emergency', 'conflict', 'violence'].some(k => t.includes(k))) return 'political risk'
  if (['programme', 'project', 'launch', 'implementation', 'phase'].some(k => t.includes(k))) return 'programme update'
  return 'sector shift'
}

const SIGNAL_COLORS: Record<string, { bg: string; color: string }> = {
  'funding signal':     { bg: '#dbeafe', color: '#1d4ed8' },
  'procurement signal': { bg: '#fef3c7', color: '#b45309' },
  'policy shift':       { bg: '#ede9fe', color: '#7c3aed' },
  'political risk':     { bg: '#fee2e2', color: '#dc2626' },
  'programme update':   { bg: '#dcfce7', color: '#15803d' },
  'sector shift':       { bg: '#e0f2fe', color: '#0891b2' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
}

function urgencyColor(days: number | null): string {
  if (days === null) return '#6b7280'
  if (days <= 7)  return '#dc2626'
  if (days <= 30) return '#b45309'
  return '#15803d'
}

function stripHtml(html: string | null): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, newsRes, projectsRes, tendersRes, jobsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, preferred_sectors, preferred_provinces')
      .eq('id', user?.id ?? '')
      .single(),
    supabase
      .from('news_articles')
      .select('id,title,source,published_at,created_at,what_happened,why_it_matters,potential_action,url,composite_score,excerpt')
      .order('created_at',      { ascending: false, nullsFirst: false })
      .order('composite_score', { ascending: false, nullsFirst: false })
      .limit(8),
    supabase
      .from('projects')
      .select('province,amount_usd,status,donor')
      .eq('status', 'active'),
    supabase
      .from('tenders')
      .select('id,title,donor,deadline,days_left,sector')
      .eq('status', 'open')
      .order('deadline', { ascending: true, nullsFirst: false })
      .limit(4),
    supabase
      .from('jobs')
      .select('id,title,organisation,deadline,sector')
      .order('deadline', { ascending: true, nullsFirst: false })
      .limit(4),
  ])

  const fullName: string = profileRes.data?.full_name ?? 'there'
  const articles: NewsArticle[] = (newsRes.data ?? []) as NewsArticle[]
  const projects = projectsRes.data ?? []
  const tenders: Tender[] = (tendersRes.data ?? []) as Tender[]
  const jobs: Job[] = (jobsRes.data ?? []) as Job[]

  // ── Pakistan time greeting ───────────────────────────────────────────────
  const pkHour = new Date(Date.now() + 5 * 3600 * 1000).getUTCHours()
  const greeting = pkHour < 12 ? 'Good morning' : pkHour < 17 ? 'Good afternoon' : 'Good evening'

  // ── Totals ───────────────────────────────────────────────────────────────
  const totalActive = projects.length
  const totalValue  = projects.reduce((sum, p) => sum + (p.amount_usd ?? 0), 0)

  // ── Top 5 donors by active funding (for mini bar chart) ─────────────────
  const donorTotals: Record<string, number> = {}
  for (const p of projects) {
    if (!p.donor) continue
    donorTotals[p.donor] = (donorTotals[p.donor] ?? 0) + (p.amount_usd ?? 0)
  }
  const topDonors = Object.entries(donorTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxDonorVal = topDonors[0]?.[1] ?? 1

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Row 1: Greeting strip (56px) ────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-4 px-5"
        style={{ height: 56, background: '#055C45', color: '#fff' }}
      >
        <div className="flex-1 min-w-0">
          <span className="text-base font-semibold truncate">
            {greeting}, {fullName}
          </span>
          <span className="ml-3 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {totalActive} active programmes &middot; {formatUSD(totalValue)} total
          </span>
        </div>
      </div>

      {/* ── Row 2: Three-column grid (fills remaining height) ───────────── */}
      <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden" style={{ minHeight: 0 }}>

        {/* ── Col 1: Signals & Updates ──────────────────────────────────── */}
        <div className="flex flex-col overflow-hidden border-r" style={{ borderColor: 'var(--color-border-subtle)' }}>
          {/* Fixed header */}
          <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-subtle)', background: '#fff' }}>
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#055C45' }}>
              Signals &amp; Updates
            </span>
          </div>
          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto">
            {articles.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No articles yet — click Refresh Feeds in the News tab.
              </div>
            ) : (
              articles.map(article => {
                const signal = classifySignal(article.title ?? '', article.excerpt ?? '')
                const sc = SIGNAL_COLORS[signal] ?? SIGNAL_COLORS['sector shift']
                const clean = stripHtml(article.excerpt)
                return (
                  <a
                    key={article.id}
                    href={article.url ?? '#'}
                    target={article.url ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="block px-4 py-3 border-b transition-colors hover:bg-gray-50"
                    style={{ borderColor: 'var(--color-border-subtle)', textDecoration: 'none' }}
                  >
                    {/* Signal badge + source + time */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        {signal}
                      </span>
                      <span className="text-[10px] font-semibold" style={{ color: '#055C45' }}>
                        {article.source}
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-secondary)' }}>
                        {timeAgo(article.published_at ?? (article as any).created_at)}
                      </span>
                    </div>
                    {/* Title */}
                    <p className="text-xs font-semibold leading-snug mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      {article.title}
                    </p>
                    {/* Clean excerpt */}
                    {clean && (
                      <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {clean}
                      </p>
                    )}
                  </a>
                )
              })
            )}
          </div>
        </div>

        {/* ── Col 2: Expiring Soon ──────────────────────────────────────── */}
        <div className="flex flex-col overflow-hidden border-r" style={{ borderColor: 'var(--color-border-subtle)' }}>
          {/* Fixed header */}
          <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-subtle)', background: '#fff' }}>
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#055C45' }}>
              Expiring Soon
            </span>
          </div>
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">

            {/* Tenders section */}
            <div className="px-4 pt-3 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Tenders
              </span>
            </div>
            {tenders.length === 0 ? (
              <div className="px-4 py-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>No open tenders.</div>
            ) : (
              tenders.map(tender => {
                const dl = tender.days_left ?? daysLeft(tender.deadline)
                const uc = urgencyColor(dl)
                return (
                  <div
                    key={tender.id}
                    className="px-4 py-3 border-b"
                    style={{ borderColor: 'var(--color-border-subtle)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded"
                        style={{ background: uc + '18', color: uc }}
                      >
                        {dl === null ? 'No deadline' : dl <= 0 ? 'Closing' : `${dl}d left`}
                      </span>
                      <span className="text-[10px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {tender.donor}
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                      {tender.title}
                    </p>
                  </div>
                )
              })
            )}

            {/* Jobs section */}
            <div className="px-4 pt-4 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Jobs
              </span>
            </div>
            {jobs.length === 0 ? (
              <div className="px-4 py-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>No open jobs.</div>
            ) : (
              jobs.map(job => {
                const dl = daysLeft(job.deadline)
                const uc = urgencyColor(dl)
                return (
                  <div
                    key={job.id}
                    className="px-4 py-3 border-b"
                    style={{ borderColor: 'var(--color-border-subtle)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded"
                        style={{ background: uc + '18', color: uc }}
                      >
                        {dl === null ? 'No deadline' : dl <= 0 ? 'Closing' : `${dl}d left`}
                      </span>
                      <span className="text-[10px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {job.organisation}
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                      {job.title}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Col 3: Market Intelligence ────────────────────────────────── */}
        <div className="flex flex-col overflow-hidden">
          {/* Fixed header */}
          <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-subtle)', background: '#fff' }}>
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#055C45' }}>
              Market Intelligence
            </span>
          </div>
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

            {/* Top donors mini bar chart */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Top Donors by Active Funding
              </p>
              {topDonors.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>No active projects loaded.</p>
              ) : (
                <div className="space-y-2.5">
                  {topDonors.map(([donor, value]) => {
                    const pct = Math.round((value / maxDonorVal) * 100)
                    const label = donor
                      .replace('World Bank', 'WB')
                      .replace('Asian Development Bank', 'ADB')
                      .replace('European Union', 'EU')
                    return (
                      <div key={donor}>
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="text-[11px] font-semibold truncate mr-2" style={{ color: 'var(--color-text-primary)', maxWidth: '55%' }}>
                            {label}
                          </span>
                          <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                            {formatUSD(value)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: '#055C45' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Total active programme value */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--color-brand-100)', border: '1px solid #cbeadd' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#055C45' }}>
                Total Active Portfolio
              </p>
              <p className="text-2xl font-bold" style={{ color: '#055C45' }}>
                {formatUSD(totalValue)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#055C45', opacity: 0.75 }}>
                across {totalActive} active programmes
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
