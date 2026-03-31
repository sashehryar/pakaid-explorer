import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { PsdpScheme } from '@/lib/types/database'
import { PsdpDashboard } from './psdp-dashboard'

export const metadata: Metadata = { title: 'PSDP and ADP Spend' }

export default async function PsdpPage() {
  const supabase = await createClient()

  const { data: schemes } = await supabase
    .from('psdp_schemes')
    .select('*')
    .order('allocation_bn', { ascending: false })

  const rows: PsdpScheme[] = schemes ?? []

  // Aggregate stats
  const totalAlloc  = rows.reduce((s, r) => s + (r.allocation_bn ?? 0), 0)
  const totalUtil   = rows.reduce((s, r) => s + (r.utilized_bn ?? 0), 0)
  const blendedExec = totalAlloc > 0 ? Math.round((totalUtil / totalAlloc) * 100) : 0
  const donorLinked = rows.filter(r => r.is_donor_linked).length
  const slowMoving  = rows.filter(r => r.is_slow_moving).length
  const withOpps    = rows.filter(r => r.opportunity_type !== 'none').length

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">PSDP and ADP Spend</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Compare Pakistan&#39;s Public Sector Development Programme and Annual Development Program budgets with actual execution</p>
        <p className="text-sm text-ash mt-0.5">
          Execution intelligence · Opportunity signals · Stakeholder views · FY2024–25
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Schemes Tracked',  value: rows.length,                   color: 'text-pine' },
          { label: 'Total Allocation', value: `PKR ${totalAlloc.toFixed(1)}B`, color: 'text-pine' },
          { label: 'Total Utilized',   value: `PKR ${totalUtil.toFixed(1)}B`,  color: 'text-pine' },
          { label: 'Blended Execution',value: `${blendedExec}%`,              color: blendedExec < 50 ? 'text-danger' : blendedExec < 70 ? 'text-amber-600' : 'text-fern' },
          { label: 'Donor-Linked',     value: donorLinked,                    color: 'text-blue-600' },
          { label: 'Slow-Moving',      value: slowMoving,                     color: 'text-danger' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-silver bg-card p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-semibold text-ink">No PSDP data yet</p>
          <p className="text-sm text-ash mt-1">Apply migration 0004 and seed data to populate schemes</p>
        </div>
      ) : (
        <PsdpDashboard schemes={rows} withOpps={withOpps} />
      )}
    </div>
  )
}
