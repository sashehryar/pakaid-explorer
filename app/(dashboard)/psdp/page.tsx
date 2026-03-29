import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { PsdpItem } from '@/lib/types/database'
import { PsdpTabs } from './psdp-tabs'

export const metadata: Metadata = { title: 'PSDP Analysis' }

export default async function PsdpPage() {

  const supabase = await createClient()
  const itemsRes = await supabase
    .from('psdp_items')
    .select('*')
    .eq('fiscal_year', '2025-26')
    .order('execution_pct', { ascending: true })
  const items: PsdpItem[] = itemsRes.data ?? []

  const federal    = (items ?? []).filter(i => i.category === 'federal')
  const provincial = (items ?? []).filter(i => i.category === 'provincial')
  const ministries = (items ?? []).filter(i => i.category === 'ministry')

  const totalAlloc = federal.reduce((s, i) => s + i.allocation_bn, 0)
  const totalSpent = federal.reduce((s, i) => s + i.spent_bn, 0)
  const blendedPct = totalAlloc > 0 ? Math.round((totalSpent / totalAlloc) * 100) : 0

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">PSDP Execution Analysis</h1>
        <p className="text-sm text-ash mt-0.5">FY2025–26 Q3 · Federal PSDP · Provincial ADPs · Ministry tracking</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Federal PSDP FY26', value: `PKR ${totalAlloc}B`, color: 'text-pine' },
          { label: 'Federal Execution', value: `${blendedPct}%`, color: blendedPct < 60 ? 'text-danger' : 'text-amber-600' },
          { label: 'Provinces Tracked', value: provincial.length, color: 'text-pine' },
          { label: 'Ministries Tracked', value: ministries.length, color: 'text-pine' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink">{s.label}</div>
          </div>
        ))}
      </div>

      {(items ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-silver bg-card p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-semibold text-ink">No PSDP data yet</p>
          <p className="text-sm text-ash mt-1">Apply the seed SQL to populate PSDP execution data</p>
        </div>
      ) : (
        <PsdpTabs federal={federal} provincial={provincial} ministries={ministries} />
      )}

      {/* Donor link note */}
      <div className="rounded-xl bg-forest text-white p-5">
        <div className="text-xs font-bold text-gold mb-2 uppercase tracking-wide">Why PSDP Matters for Aid Practitioners</div>
        <p className="text-sm text-sage/80 leading-relaxed">
          WB and ADB disbursement triggers in Pakistan are directly linked to PSDP co-financing ratios and ADP execution rates.
          Low execution in the energy sector (50%) has already delayed a $300M WB disbursement.
          Tracking this data reveals which sectors have the most urgent TA demand and where donor pipeline will flow in Q4 2026.
        </p>
      </div>
    </div>
  )
}
