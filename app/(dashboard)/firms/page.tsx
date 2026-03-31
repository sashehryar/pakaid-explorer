import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { ConsultingFirm } from '@/lib/types/database'
import { FirmCards } from './firm-cards'

export const metadata: Metadata = { title: 'Implementing Partners & Consulting Firms' }

export default async function FirmsPage() {

  const supabase = await createClient()
  const firmsRes = await supabase
    .from('consulting_firms')
    .select('*')
    .order('trend')
    .order('name')
  const firms: ConsultingFirm[] = firmsRes.data ?? []

  const growing    = (firms ?? []).filter(f => f.trend === 'Growing').length
  const stable     = (firms ?? []).filter(f => f.trend === 'Stable').length
  const contracting= (firms ?? []).filter(f => f.trend === 'Contracting').length

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Implementing Partners &amp; Consulting Firms</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>See who implements which projects, where they work, and how they are moving</p>
        <p className="text-sm text-ash mt-0.5">Hiring signals · contract pipeline · competitive positioning</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Growing', value: growing, color: 'text-fern' },
          { label: 'Stable', value: stable, color: 'text-amber-600' },
          { label: 'Contracting', value: contracting, color: 'text-danger' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink">{s.label}</div>
          </div>
        ))}
      </div>

      {(firms ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-silver bg-card p-12 text-center">
          <div className="text-4xl mb-3">🏢</div>
          <p className="font-semibold text-ink">No firm data yet</p>
          <p className="text-sm text-ash mt-1">Apply the seed SQL to populate consulting firm profiles</p>
        </div>
      ) : (
        <FirmCards firms={firms ?? []} />
      )}
    </div>
  )
}
