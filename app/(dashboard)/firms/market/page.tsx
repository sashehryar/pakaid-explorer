import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Market Intel' }

const SECTORS = ['Health', 'Education', 'WASH', 'Governance', 'Agriculture', 'Livelihoods', 'Protection', 'Climate', 'Economic Growth']
const DONORS  = ['USAID', 'FCDO', 'EU', 'World Bank', 'ADB', 'GIZ', 'UNICEF', 'WHO', 'UNDP']

export default async function MarketPage() {
  const supabase = await createClient()

  const [projectsRes, tendersRes, firmsRes] = await Promise.all([
    supabase.from('projects').select('donor, sector, amount_usd, status').eq('status', 'active'),
    supabase.from('tenders').select('donor, sector, value_usd, status'),
    supabase.from('consulting_firms').select('name, trend, donors, key_programmes'),
  ])

  const projects = projectsRes.data ?? []
  const tenders  = tendersRes.data ?? []
  const firms    = firmsRes.data ?? []

  // Sector concentration by active projects
  const sectorProjects: Record<string, { count: number; value: number }> = {}
  projects.forEach(p => {
    const s = p.sector || 'Other'
    if (!sectorProjects[s]) sectorProjects[s] = { count: 0, value: 0 }
    sectorProjects[s].count++
    sectorProjects[s].value += p.amount_usd ?? 0
  })

  // Donor activity
  const donorActivity: Record<string, { projects: number; tenders: number; value: number }> = {}
  projects.forEach(p => {
    const d = p.donor
    if (!donorActivity[d]) donorActivity[d] = { projects: 0, tenders: 0, value: 0 }
    donorActivity[d].projects++
    donorActivity[d].value += p.amount_usd ?? 0
  })
  tenders.forEach(t => {
    const d = t.donor
    if (!donorActivity[d]) donorActivity[d] = { projects: 0, tenders: 0, value: 0 }
    donorActivity[d].tenders++
    donorActivity[d].value += t.value_usd ?? 0
  })

  const topDonors = Object.entries(donorActivity)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 8)

  const topSectors = Object.entries(sectorProjects)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 8)
  const maxSectorValue = topSectors[0]?.[1].value ?? 1

  // Open tenders by sector
  const openTenders = tenders.filter(t => t.status === 'open')
  const tendersBySector: Record<string, number> = {}
  openTenders.forEach(t => {
    const s = t.sector || 'Other'
    tendersBySector[s] = (tendersBySector[s] ?? 0) + 1
  })

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Market Intel</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Analyze aid volumes and trends by donor, sector, and province</p>
        <p className="text-sm text-ash mt-0.5">Buyer behavior · sector concentration · firm positioning</p>
      </div>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Projects',  value: projects.length,    color: 'text-pine' },
          { label: 'Open Tenders',     value: openTenders.length, color: 'text-pine' },
          { label: 'Active Donors',    value: topDonors.length,   color: 'text-pine' },
          { label: 'Firms Tracked',    value: firms.length,       color: 'text-pine' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector heatmap (bar chart) */}
        <div className="rounded-xl border border-silver bg-card p-4">
          <h2 className="text-sm font-bold text-slate uppercase tracking-wide mb-4">Sector Concentration</h2>
          {topSectors.length === 0 ? (
            <p className="text-xs text-ash">No project data</p>
          ) : (
            <div className="space-y-2.5">
              {topSectors.map(([sector, data]) => {
                const pct = (data.value / maxSectorValue) * 100
                return (
                  <div key={sector}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-ink">{sector}</span>
                      <span className="text-ash">
                        {data.count} projects · ${data.value >= 1e9 ? `${(data.value/1e9).toFixed(1)}B` : `${(data.value/1e6).toFixed(0)}M`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-silver overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pine to-fern"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Donor activity table */}
        <div className="rounded-xl border border-silver bg-card p-4">
          <h2 className="text-sm font-bold text-slate uppercase tracking-wide mb-4">Donor Activity</h2>
          {topDonors.length === 0 ? (
            <p className="text-xs text-ash">No donor data</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-silver">
                  <th className="pb-2 text-left text-ash font-semibold">Donor</th>
                  <th className="pb-2 text-right text-ash font-semibold">Projects</th>
                  <th className="pb-2 text-right text-ash font-semibold">Tenders</th>
                  <th className="pb-2 text-right text-ash font-semibold">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver">
                {topDonors.map(([donor, data]) => (
                  <tr key={donor} className="hover:bg-fog/50">
                    <td className="py-2 font-medium text-ink">{donor}</td>
                    <td className="py-2 text-right text-ash">{data.projects}</td>
                    <td className="py-2 text-right text-ash">{data.tenders}</td>
                    <td className="py-2 text-right font-semibold text-pine">
                      {data.value >= 1e9
                        ? `$${(data.value/1e9).toFixed(1)}B`
                        : `$${(data.value/1e6).toFixed(0)}M`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open tenders by sector */}
        <div className="rounded-xl border border-silver bg-card p-4">
          <h2 className="text-sm font-bold text-slate uppercase tracking-wide mb-4">Open Tenders by Sector</h2>
          {Object.keys(tendersBySector).length === 0 ? (
            <p className="text-xs text-ash">No open tenders</p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(tendersBySector)
                .sort((a, b) => b[1] - a[1])
                .map(([sector, count]) => (
                  <div key={sector} className="flex items-center justify-between px-3 py-2 rounded-lg bg-fog">
                    <span className="text-xs font-medium text-ink">{sector}</span>
                    <span className="text-xs font-bold text-pine">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Firm positioning */}
        <div className="rounded-xl border border-silver bg-card p-4">
          <h2 className="text-sm font-bold text-slate uppercase tracking-wide mb-4">Firm Market Position</h2>
          {firms.length === 0 ? (
            <p className="text-xs text-ash">No firm data</p>
          ) : (
            <div className="space-y-2">
              {firms.slice(0, 8).map(f => (
                <div key={f.name} className="flex items-start gap-2.5 py-1.5 border-b border-silver last:border-0">
                  <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                    f.trend === 'Growing' ? 'bg-fern' : f.trend === 'Contracting' ? 'bg-danger' : 'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-ink">{f.name}</span>
                    {f.key_programmes && f.key_programmes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {f.key_programmes.slice(0, 2).map((p: string) => (
                          <span key={p} className="text-[9px] bg-fog text-ash px-1 py-0.5 rounded">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium shrink-0 ${
                    f.trend === 'Growing' ? 'text-fern' : f.trend === 'Contracting' ? 'text-danger' : 'text-amber-600'
                  }`}>{f.trend}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
