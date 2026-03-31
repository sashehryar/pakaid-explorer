import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { EmeItem } from '@/lib/types/database'
import { EmeList } from './eme-list'

export const metadata: Metadata = { title: 'Donor Engagement' }

const TYPE_LABELS: Record<string, string> = {
  rfi:          'RFI',
  framework:    'Framework',
  forecast:     'Pipeline Forecast',
  relationship: 'Relationship',
  meeting:      'Meeting',
}

export default async function EmePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('eme_items')
    .select('*')
    .order('expected_date', { ascending: true })

  const items: EmeItem[] = data ?? []

  const byType: Record<string, number> = {}
  items.forEach(i => { byType[i.type] = (byType[i.type] ?? 0) + 1 })

  const upcoming = items.filter(i => {
    if (!i.expected_date) return false
    const d = new Date(i.expected_date)
    return d >= new Date()
  }).length

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Donor Engagement</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Plan and track outreach, meetings, and account strategy</p>
        <p className="text-sm text-ash mt-0.5">RFIs · framework agreements · pipeline forecasts · relationship building</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Items',     value: items.length,    color: 'text-pine' },
          { label: 'Upcoming',        value: upcoming,        color: 'text-pine' },
          { label: 'RFIs',            value: byType.rfi ?? 0, color: 'text-amber-600' },
          { label: 'Frameworks',      value: byType.framework ?? 0, color: 'text-fern' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <EmeList items={items} typeLabels={TYPE_LABELS} />
    </div>
  )
}
