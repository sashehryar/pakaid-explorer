import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatUSD } from '@/lib/utils'
import type { UsaidGapProgram } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Aid Risk Monitor' }

const FILL_STYLES = {
  None:    { chip: 'bg-red-50 text-red-700 border border-red-200', bar: 'bg-red-400', label: 'UNFILLED' },
  Partial: { chip: 'bg-amber-50 text-amber-700 border border-amber-200', bar: 'bg-amber-400', label: 'PARTIAL' },
  Full:    { chip: 'bg-green-50 text-green-700 border border-green-200', bar: 'bg-fern', label: 'FILLED' },
}

export default async function UsaidGapPage() {

  const supabase = await createClient()
  const programsRes = await supabase
    .from('usaid_gap_programs')
    .select('*')
    .order('gap_usd', { ascending: false })
  const programs: UsaidGapProgram[] = programsRes.data ?? []

  const total = (programs ?? []).reduce((s, p) => s + (p.value_usd ?? 0), 0)
  const totalGap = (programs ?? []).reduce((s, p) => s + (p.gap_usd ?? 0), 0)
  const filled = (programs ?? []).filter(p => p.fill_level === 'Full').length
  const partial = (programs ?? []).filter(p => p.fill_level === 'Partial').length
  const none = (programs ?? []).filter(p => p.fill_level === 'None').length

  // Sector summary
  const sectors = [...new Set((programs ?? []).map(p => p.sector))]
  const sectorSummary = sectors.map(s => {
    const sPrograms = (programs ?? []).filter(p => p.sector === s)
    const sTotal = sPrograms.reduce((acc, p) => acc + (p.value_usd ?? 0), 0)
    const sGap = sPrograms.reduce((acc, p) => acc + (p.gap_usd ?? 0), 0)
    return { sector: s, total: sTotal, gap: sGap, pct: sTotal > 0 ? Math.round((sGap / sTotal) * 100) : 0 }
  }).sort((a, b) => b.gap - a.gap)

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Aid Risk Monitor</h1>
        <p className="text-sm text-ash mt-0.5">Geopolitical disruptions to Pakistan&apos;s aid landscape · Funding gaps, replacements &amp; exposure</p>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Frozen', value: formatUSD(total), color: 'text-red-600' },
          { label: 'Unfilled Gap', value: formatUSD(totalGap), color: 'text-danger' },
          { label: 'Partially Filled', value: partial, color: 'text-amber-600' },
          { label: 'Fully Replaced', value: filled, color: 'text-fern' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sector summary */}
      {sectorSummary.length > 0 && (
        <div className="rounded-xl border border-silver bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-silver bg-fog">
            <h2 className="text-xs font-bold text-slate uppercase tracking-wide">Gap by Sector</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-silver">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Sector</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Total Value</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Gap</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash w-40">Gap %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver">
              {sectorSummary.map(s => (
                <tr key={s.sector} className="hover:bg-fog/50">
                  <td className="px-4 py-2.5 font-medium text-ink">{s.sector}</td>
                  <td className="px-4 py-2.5 text-ash">{formatUSD(s.total)}</td>
                  <td className={`px-4 py-2.5 font-bold ${s.gap > 0 ? 'text-danger' : 'text-fern'}`}>{formatUSD(s.gap)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-silver rounded-full overflow-hidden">
                        <div className="h-full bg-danger rounded-full" style={{ width: `${s.pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-danger w-8">{s.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Program cards */}
      {(programs ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(programs ?? []).map(p => {
            const fill = FILL_STYLES[p.fill_level as keyof typeof FILL_STYLES]
            return (
              <div key={p.id} className="rounded-xl border border-silver bg-card p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-ash bg-fog px-1.5 py-0.5 rounded">{p.program_id}</span>
                      <span className="text-xs text-ash">{p.sector}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-ink leading-snug">{p.title}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap ${fill.chip}`}>
                    {fill.label}
                  </span>
                </div>

                <div className="flex gap-4 text-xs mb-3">
                  <div>
                    <span className="text-ash">Value: </span>
                    <span className="font-bold text-ink">{formatUSD(p.value_usd)}</span>
                  </div>
                  {p.gap_usd > 0 && (
                    <div>
                      <span className="text-ash">Gap: </span>
                      <span className="font-bold text-danger">{formatUSD(p.gap_usd)}</span>
                    </div>
                  )}
                  {p.implementer && (
                    <div className="text-ash">{p.implementer}</div>
                  )}
                </div>

                {/* Gap bar */}
                {p.value_usd > 0 && (
                  <div className="h-1.5 bg-silver rounded-full overflow-hidden mb-3">
                    <div
                      className={fill.bar + ' h-full rounded-full'}
                      style={{ width: `${Math.round((p.gap_usd / p.value_usd) * 100)}%` }}
                    />
                  </div>
                )}

                {p.fill_source && (
                  <p className="text-xs text-fern mb-1.5">✓ Partially filled by: {p.fill_source}</p>
                )}
                {p.gap_note && (
                  <p className="text-xs text-ash leading-relaxed">{p.gap_note}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Editorial note */}
      <div className="rounded-xl bg-forest text-white p-5">
        <div className="text-xs font-bold text-gold mb-2 uppercase tracking-wide">Editorial Intelligence</div>
        <p className="text-sm text-sage/80 leading-relaxed">
          The $845M US aid freeze represents the single largest disruption to Pakistan&apos;s development landscape in a decade.
          Education (PRP, SBEP) and governance (SIMA, SERROL) have the largest unaddressed gaps.
          WB, FCDO, and GIZ are partially absorbing some programmes but at significantly reduced scale.
          The media and civil society gaps are effectively total — no donor has stepped in.
        </p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-silver bg-card p-12 text-center">
      <div className="text-4xl mb-3">🗺️</div>
      <p className="font-semibold text-ink">No gap data yet</p>
      <p className="text-sm text-ash mt-1">Apply the seed SQL to populate USAID gap programmes</p>
    </div>
  )
}
