import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatUSD } from '@/lib/utils'
import type { NewsArticle, Project } from '@/lib/types/database'
import { NewsTile } from '@/components/dashboard/news-tile'
import { PakistanMap, type ProvinceData } from '@/components/dashboard/pakistan-map'
import { HomeChart } from '@/components/dashboard/home-chart'

export const metadata: Metadata = { title: 'Home — PakAid Explorer' }

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, newsRes, projectsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user?.id ?? '')
      .single(),
    supabase
      .from('news_articles')
      .select('id,title,source,published_at,what_happened,why_it_matters,potential_action,url,composite_score,excerpt')
      .order('composite_score', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('projects')
      .select('province,amount_usd,status,donor')
      .eq('status', 'active'),
  ])

  const fullName: string = profileRes.data?.full_name ?? 'there'
  const articles: NewsArticle[] = (newsRes.data ?? []) as NewsArticle[]
  const projects: Project[] = (projectsRes.data ?? []) as Project[]

  // ── Greeting ────────────────────────────────────────────────────
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // ── Province map data ────────────────────────────────────────────
  const provinceMap: Record<string, ProvinceData> = {}
  for (const p of projects) {
    const prov = p.province ?? 'Unknown'
    if (!provinceMap[prov]) provinceMap[prov] = { totalFunding: 0, projectCount: 0, donorCount: 0 }
    provinceMap[prov].totalFunding += p.amount_usd ?? 0
    provinceMap[prov].projectCount += 1
  }
  // Count unique donors per province
  const donorsByProvince: Record<string, Set<string>> = {}
  for (const p of projects) {
    const prov = p.province ?? 'Unknown'
    if (!donorsByProvince[prov]) donorsByProvince[prov] = new Set()
    if (p.donor) donorsByProvince[prov].add(p.donor)
  }
  for (const [prov, donors] of Object.entries(donorsByProvince)) {
    if (provinceMap[prov]) provinceMap[prov].donorCount = donors.size
  }

  // ── Chart data: funding by donor (top 8) ─────────────────────────
  const donorTotals: Record<string, number> = {}
  for (const p of projects) {
    if (!p.donor) continue
    donorTotals[p.donor] = (donorTotals[p.donor] ?? 0) + (p.amount_usd ?? 0)
  }
  const chartData = Object.entries(donorTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.replace('World Bank', 'WB').replace('Asian Development Bank', 'ADB'), value }))

  // ── Total stats ───────────────────────────────────────────────────
  const totalActive = projects.length
  const totalValue  = projects.reduce((sum, p) => sum + (p.amount_usd ?? 0), 0)

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Greeting ─────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--color-brand-500)', color: '#ffffff' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>
          {greeting}, {fullName} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.82)' }}>
          Here is what you missed — {totalActive} active programmes worth {formatUSD(totalValue)} across Pakistan
        </p>
      </div>

      {/* ── Main two-column layout ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Left: News tiles */}
        <section aria-label="Latest news">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            LATEST UPDATES
          </h2>
          {articles.length === 0 ? (
            <div
              className="card-default rounded-xl p-8 text-center"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <p className="text-sm">No news yet — RSS ingestion will populate this once scrape-rss runs.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map(article => (
                <NewsTile key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>

        {/* Right: Map + Chart */}
        <section aria-label="Pakistan funding overview" className="space-y-4">
          <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            PAKISTAN OVERVIEW
          </h2>
          <PakistanMap data={provinceMap} metric="totalFunding" />
          <HomeChart data={chartData} title="Active Funding by Donor" />
        </section>
      </div>
    </div>
  )
}
