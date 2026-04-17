import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Tender } from '@/lib/types/database'
import { TenderBoard } from './tender-board'

export const metadata: Metadata = { title: 'Tender Opportunities' }

export default async function ProcurementPage() {
  const supabase = await createClient()
  // Awarded tenders always visible; open/evaluation only if deadline hasn't passed
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('tenders')
    .select('*')
    .or(`status.eq.awarded,deadline.is.null,deadline.gte.${today}`)
    .order('deadline', { ascending: true })
    .limit(100)

  const tenders: Tender[] = data ?? []

  const open       = tenders.filter(t => t.status === 'open').length
  const evaluation = tenders.filter(t => t.status === 'evaluation').length
  const awarded    = tenders.filter(t => t.status === 'awarded').length
  const totalValue = tenders.filter(t => t.status === 'open').reduce((s, t) => s + (t.value_usd ?? 0), 0)

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Tender Opportunities</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Find Pakistan RFPs, evaluations, and grant calls instantly</p>
        <p className="text-sm text-ash mt-0.5 flex items-center gap-2">
          <span className="live-dot" />
          Open tenders · WB · ADB · FCDO · EU · GIZ · UN · Click any card to apply
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Open Tenders',       value: open,                                                                 color: 'text-fern' },
          { label: 'Under Evaluation',   value: evaluation,                                                          color: 'text-amber-600' },
          { label: 'Awarded',            value: awarded,                                                             color: 'text-ash' },
          { label: 'Open Value',         value: totalValue ? `$${(totalValue/1e6).toFixed(0)}M` : '—',              color: 'text-pine' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink">{s.label}</div>
          </div>
        ))}
      </div>

      <TenderBoard tenders={tenders} />
    </div>
  )
}
