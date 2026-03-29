import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { RegulatoryEntry } from '@/lib/types/database'
import { RegulatoryAccordion } from './regulatory-accordion'

export const metadata: Metadata = { title: 'Regulatory Guide' }

const COMPLEXITY_STYLES = {
  Low:    'bg-green-50 text-green-700',
  Medium: 'bg-amber-50 text-amber-700',
  High:   'bg-red-50 text-red-700',
}

export default async function RegulatoryPage() {

  const supabase = await createClient()
  const entriesRes = await supabase
    .from('regulatory_entries')
    .select('*')
    .order('category')
    .order('complexity', { ascending: false })
  const entries: RegulatoryEntry[] = entriesRes.data ?? []

  const categories = [...new Set((entries ?? []).map(e => e.category))]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Regulatory & Compliance Guide</h1>
        <p className="text-sm text-ash mt-0.5">INGO registration · Tax · Procurement · Foreign exchange · AML</p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex gap-2.5">
        <span className="text-amber-600 shrink-0">⚠</span>
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Editorial guidance only.</strong> This reflects editorial research as of March 2026 and does not constitute legal advice.
          Always verify with your legal counsel, EAD, FBR, or PPRA. Pakistan&apos;s regulatory environment changes frequently.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Entries', value: (entries ?? []).length, color: 'text-pine' },
          { label: 'High Complexity', value: (entries ?? []).filter(e => e.complexity === 'High').length, color: 'text-danger' },
          { label: 'Categories', value: categories.length, color: 'text-pine' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink">{s.label}</div>
          </div>
        ))}
      </div>

      {(entries ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-silver bg-card p-12 text-center">
          <div className="text-4xl mb-3">⚖️</div>
          <p className="font-semibold text-ink">No regulatory entries yet</p>
          <p className="text-sm text-ash mt-1">Apply the seed SQL to populate the regulatory guide</p>
        </div>
      ) : (
        <RegulatoryAccordion entries={entries ?? []} categories={categories} />
      )}
    </div>
  )
}
