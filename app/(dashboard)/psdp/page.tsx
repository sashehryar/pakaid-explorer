import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { PsdpScheme } from '@/lib/types/database'
import { PsdpDashboard } from './psdp-dashboard'
import { PsdpOutcomeIntelligence } from './psdp-outcome-intelligence'

export const metadata: Metadata = { title: 'PSDP and ADP Spend' }

interface ProvinceRow {
  province: string
  scheme_count: number
  total_allocation_bn: number
  total_utilized_bn: number
  avg_execution_pct: number
  total_throwforward_bn: number
  slow_moving_count: number
  high_risk_count: number
  donor_linked_count: number
  avg_opportunity_score: number
  avg_stress_score: number
}

interface MinistryRow {
  ministry: string
  scheme_count: number
  total_allocation_bn: number
  total_utilized_bn: number
  avg_execution_pct: number
  total_throwforward_bn: number
  slow_moving_count: number
  avg_opportunity_score: number
  backlog_pct: number
}

interface SectorRow {
  sector: string
  scheme_count: number
  total_allocation_bn: number
  total_utilized_bn: number
  avg_execution_pct: number
  total_throwforward_bn: number
  schemes_with_opportunities: number
  avg_opportunity_score: number
  avg_stress_score: number
  donor_linked_count: number
}

export default async function PsdpPage() {
  const supabase = await createClient()

  const [
    { data: schemes },
    { data: provinceSummary },
    { data: ministrySummary },
    { data: sectorIntel },
  ] = await Promise.all([
    supabase
      .from('psdp_schemes')
      .select('*')
      .order('opportunity_score', { ascending: false, nullsFirst: false })
      .order('allocation_bn',     { ascending: false })
      .limit(200),
    supabase.from('psdp_province_summary').select('*').order('total_allocation_bn', { ascending: false }),
    supabase.from('psdp_ministry_efficiency').select('*').order('total_allocation_bn', { ascending: false }).limit(20),
    supabase.from('psdp_sector_intelligence').select('*').order('total_allocation_bn', { ascending: false }),
  ])

  const rows: PsdpScheme[]   = schemes          ?? []
  const provinces            = (provinceSummary  ?? []) as ProvinceRow[]
  const ministries           = (ministrySummary  ?? []) as MinistryRow[]
  const sectors              = (sectorIntel      ?? []) as SectorRow[]

  // Top-level KPIs
  const totalAlloc    = rows.reduce((s, r) => s + (r.allocation_bn  ?? 0), 0)
  const totalUtil     = rows.reduce((s, r) => s + (r.utilized_bn    ?? 0), 0)
  const totalThrow    = rows.reduce((s, r) => s + (r.throwforward_bn ?? (r.allocation_bn ?? 0) - (r.utilized_bn ?? 0)), 0)
  const blendedExec   = totalAlloc > 0 ? Math.round((totalUtil / totalAlloc) * 100) : 0
  const donorLinked   = rows.filter(r => r.is_donor_linked).length
  const slowMoving    = rows.filter(r => r.is_slow_moving).length
  const withOpps      = rows.filter(r => r.opportunity_type !== 'none').length
  const highOpps      = rows.filter(r => (r.opportunity_score ?? 0) >= 70).length

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>PSDP and ADP Spend Intelligence</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Where public development money is underperforming against social and economic need — and where execution support, co-financing, and TA create highest marginal value
        </p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Federal PSDP · Provincial ADPs (Punjab, Sindh, KP, Balochistan) · PSLM outcomes · LFS labour indicators · Economic Survey
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Schemes',          value: rows.length,                     color: '#055C45' },
          { label: 'Total Allocation', value: `PKR ${totalAlloc.toFixed(1)}B`, color: '#055C45' },
          { label: 'Total Utilized',   value: `PKR ${totalUtil.toFixed(1)}B`,  color: '#055C45' },
          { label: 'Throwforward',     value: `PKR ${Math.max(0, totalThrow).toFixed(1)}B`, color: '#b45309' },
          { label: 'Blended Exec.',    value: `${blendedExec}%`,               color: blendedExec < 50 ? '#dc2626' : blendedExec < 70 ? '#b45309' : '#15803d' },
          { label: 'Donor-Linked',     value: donorLinked,                     color: '#2563eb' },
          { label: 'Slow-Moving',      value: slowMoving,                      color: '#dc2626' },
          { label: 'High Opp. Score',  value: highOpps,                        color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3" style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
            <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <div className="text-4xl mb-3">📊</div>
          <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>No PSDP data yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Apply migrations 0004 and 0009, then seed PSDP schemes to populate this view.
          </p>
        </div>
      ) : (
        <>
          {/* Province Efficiency League Table */}
          {provinces.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="px-5 py-3 flex items-center justify-between"
                style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Province Execution League Table</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Ranked by total allocation. Throwforward = uncommitted future liability.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      {['Province', 'Schemes', 'Allocation (B)', 'Utilized (B)', 'Exec %', 'Throwforward (B)', 'Slow-Moving', 'High Risk', 'Opp. Score', 'Stress Score'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {provinces.map((p, i) => {
                      const execColor = p.avg_execution_pct < 40 ? '#dc2626' : p.avg_execution_pct < 65 ? '#b45309' : '#15803d'
                      return (
                        <tr key={p.province} style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}>
                          <td className="px-3 py-2.5 font-semibold text-sm" style={{ color: '#055C45' }}>{p.province}</td>
                          <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.scheme_count}</td>
                          <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.total_allocation_bn?.toFixed(1) ?? '—'}</td>
                          <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.total_utilized_bn?.toFixed(1) ?? '—'}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, p.avg_execution_pct ?? 0)}%`, background: execColor }} />
                              </div>
                              <span className="text-xs font-semibold" style={{ color: execColor }}>{p.avg_execution_pct?.toFixed(0) ?? '—'}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-sm font-semibold" style={{ color: '#b45309' }}>{p.total_throwforward_bn?.toFixed(1) ?? '—'}</td>
                          <td className="px-3 py-2.5 text-center text-sm" style={{ color: p.slow_moving_count > 0 ? '#dc2626' : 'var(--color-text-disabled)' }}>{p.slow_moving_count}</td>
                          <td className="px-3 py-2.5 text-center text-sm" style={{ color: p.high_risk_count > 0 ? '#dc2626' : 'var(--color-text-disabled)' }}>{p.high_risk_count}</td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: (p.avg_opportunity_score ?? 0) >= 60 ? '#ede9fe' : 'var(--color-surface-subtle)',
                                color:      (p.avg_opportunity_score ?? 0) >= 60 ? '#7c3aed' : 'var(--color-text-secondary)',
                              }}>
                              {p.avg_opportunity_score?.toFixed(0) ?? '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: (p.avg_stress_score ?? 0) >= 60 ? '#fee2e2' : 'var(--color-surface-subtle)',
                                color:      (p.avg_stress_score ?? 0) >= 60 ? '#dc2626' : 'var(--color-text-secondary)',
                              }}>
                              {p.avg_stress_score?.toFixed(0) ?? '—'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sector Intelligence */}
          {sectors.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="px-5 py-3" style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Sector Spend & Opportunity Intelligence</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Opportunity score = low execution + risk + slow-moving + TA fit (0–100). Higher = stronger case for intervention.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      {['Sector', 'Schemes', 'Alloc (B)', 'Util (B)', 'Exec %', 'Throwforward (B)', 'With Opps', 'Opp. Score', 'Stress', 'Donor-Linked'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sectors.map((s, i) => {
                      const execColor = s.avg_execution_pct < 40 ? '#dc2626' : s.avg_execution_pct < 65 ? '#b45309' : '#15803d'
                      const oppHigh   = (s.avg_opportunity_score ?? 0) >= 60
                      return (
                        <tr key={s.sector} style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}>
                          <td className="px-3 py-2.5 font-semibold text-sm" style={{ color: '#055C45' }}>{s.sector}</td>
                          <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>{s.scheme_count}</td>
                          <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>{s.total_allocation_bn?.toFixed(1) ?? '—'}</td>
                          <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>{s.total_utilized_bn?.toFixed(1) ?? '—'}</td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-semibold" style={{ color: execColor }}>{s.avg_execution_pct?.toFixed(0) ?? '—'}%</span>
                          </td>
                          <td className="px-3 py-2.5 text-sm font-semibold" style={{ color: '#b45309' }}>{s.total_throwforward_bn?.toFixed(1) ?? '—'}</td>
                          <td className="px-3 py-2.5 text-center text-sm" style={{ color: s.schemes_with_opportunities > 0 ? '#7c3aed' : 'var(--color-text-disabled)' }}>{s.schemes_with_opportunities}</td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: oppHigh ? '#ede9fe' : 'var(--color-surface-subtle)', color: oppHigh ? '#7c3aed' : 'var(--color-text-secondary)' }}>
                              {s.avg_opportunity_score?.toFixed(0) ?? '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: (s.avg_stress_score ?? 0) >= 60 ? '#fee2e2' : 'var(--color-surface-subtle)',
                                color:      (s.avg_stress_score ?? 0) >= 60 ? '#dc2626' : 'var(--color-text-secondary)',
                              }}>
                              {s.avg_stress_score?.toFixed(0) ?? '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center text-sm" style={{ color: s.donor_linked_count > 0 ? '#2563eb' : 'var(--color-text-disabled)' }}>{s.donor_linked_count}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ministry Efficiency League Table */}
          {ministries.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="px-5 py-3" style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Ministry / Department Efficiency</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Backlog % = throwforward as share of total allocation. High backlog + low execution = delivery bottleneck.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      {['Ministry', 'Schemes', 'Alloc (B)', 'Exec %', 'Throwforward (B)', 'Backlog %', 'Slow-Moving', 'Opp. Score'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ministries.map((m, i) => {
                      const execColor  = m.avg_execution_pct < 40 ? '#dc2626' : m.avg_execution_pct < 65 ? '#b45309' : '#15803d'
                      const backlogHigh = (m.backlog_pct ?? 0) > 50
                      return (
                        <tr key={m.ministry} style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}>
                          <td className="px-3 py-2.5 font-medium text-sm max-w-xs truncate" style={{ color: 'var(--color-text-primary)' }}>{m.ministry}</td>
                          <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>{m.scheme_count}</td>
                          <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--color-text-primary)' }}>{m.total_allocation_bn?.toFixed(1) ?? '—'}</td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-semibold" style={{ color: execColor }}>{m.avg_execution_pct?.toFixed(0) ?? '—'}%</span>
                          </td>
                          <td className="px-3 py-2.5 text-sm font-semibold" style={{ color: '#b45309' }}>{m.total_throwforward_bn?.toFixed(1) ?? '—'}</td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: backlogHigh ? '#fef3c7' : 'var(--color-surface-subtle)', color: backlogHigh ? '#b45309' : 'var(--color-text-secondary)' }}>
                              {m.backlog_pct?.toFixed(0) ?? '—'}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center text-sm" style={{ color: m.slow_moving_count > 0 ? '#dc2626' : 'var(--color-text-disabled)' }}>{m.slow_moving_count}</td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: (m.avg_opportunity_score ?? 0) >= 60 ? '#ede9fe' : 'var(--color-surface-subtle)',
                                color:      (m.avg_opportunity_score ?? 0) >= 60 ? '#7c3aed' : 'var(--color-text-secondary)',
                              }}>
                              {m.avg_opportunity_score?.toFixed(0) ?? '—'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scheme-level dashboard */}
          <PsdpDashboard schemes={rows} withOpps={withOpps} />
        </>
      )}

      {/* Outcome Intelligence layer */}
      <PsdpOutcomeIntelligence />
    </div>
  )
}
