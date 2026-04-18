import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { PsdpScheme } from '@/lib/types/database'
import { PsdpDashboard } from './psdp-dashboard'

export const metadata: Metadata = { title: 'Development Spending Analysis' }

export interface ProvinceRow {
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

export interface MinistryRow {
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

export interface SectorRow {
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

  const rows: PsdpScheme[] = schemes         ?? []
  const provinces          = (provinceSummary ?? []) as ProvinceRow[]
  const ministries         = (ministrySummary ?? []) as MinistryRow[]
  const sectors            = (sectorIntel     ?? []) as SectorRow[]

  const totalAlloc  = rows.reduce((s, r) => s + (r.allocation_bn   ?? 0), 0)
  const totalUtil   = rows.reduce((s, r) => s + (r.utilized_bn     ?? 0), 0)
  const totalThrow  = rows.reduce((s, r) => s + (r.throwforward_bn ?? (r.allocation_bn ?? 0) - (r.utilized_bn ?? 0)), 0)
  const blendedExec = totalAlloc > 0 ? Math.round((totalUtil / totalAlloc) * 100) : 0
  const donorLinked = rows.filter(r => r.is_donor_linked).length
  const slowMoving  = rows.filter(r => r.is_slow_moving).length
  const highOpps    = rows.filter(r => (r.opportunity_score ?? 0) >= 70).length
  const withOpps    = rows.filter(r => r.opportunity_type !== 'none').length

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Title */}
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        Development Spending Analysis
      </h1>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Schemes',          value: rows.length,                                                              color: '#055C45' },
          { label: 'Total Allocation', value: `PKR ${totalAlloc.toFixed(1)}B`,                                         color: '#055C45' },
          { label: 'Total Utilized',   value: `PKR ${totalUtil.toFixed(1)}B`,                                          color: '#055C45' },
          { label: 'Throwforward',     value: `PKR ${Math.max(0, totalThrow).toFixed(1)}B`,                            color: '#b45309' },
          { label: 'Blended Exec.',    value: `${blendedExec}%`, color: blendedExec < 50 ? '#dc2626' : blendedExec < 70 ? '#b45309' : '#15803d' },
          { label: 'Donor-Linked',     value: donorLinked,                                                              color: '#2563eb' },
          { label: 'Slow-Moving',      value: slowMoving,                                                               color: '#dc2626' },
          { label: 'High Opp. Score',  value: highOpps,                                                                 color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3" style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
            <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* All tabbed content */}
      <PsdpDashboard
        schemes={rows}
        provinces={provinces}
        ministries={ministries}
        sectors={sectors}
        withOpps={withOpps}
      />
    </div>
  )
}
