import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Donor } from '@/lib/types/database'
import { DonorGrid } from './donor-grid'

export const metadata: Metadata = { title: 'Donor Profiles' }

const TYPE_COLORS: Record<string, string> = {
  'MDB':       'bg-blue-100 text-blue-700',
  'Bilateral': 'bg-purple-100 text-purple-700',
  'UN':        'bg-sky-100 text-sky-700',
  'Climate':   'bg-green-100 text-green-700',
  'Private':   'bg-orange-100 text-orange-700',
}

export default async function DonorsPage() {

  const supabase = await createClient()
  const donorsRes = await supabase
    .from('donors')
    .select('*')
    .order('active_projects', { ascending: false })
  const donors: Donor[] = donorsRes.data ?? []

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Donor Profiles</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>See each donor&#39;s sectors, instruments, and typical partners in Pakistan</p>
        <p className="text-sm text-ash mt-0.5">Entry paths · procurement models · donor strategy profiles</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Donors Tracked', value: (donors ?? []).length, color: 'text-pine' },
          { label: 'MDBs', value: (donors ?? []).filter(d => d.type === 'MDB').length, color: 'text-blue-600' },
          { label: 'Bilateral', value: (donors ?? []).filter(d => d.type === 'Bilateral').length, color: 'text-purple-600' },
          { label: 'UN Agencies', value: (donors ?? []).filter(d => d.type === 'UN').length, color: 'text-sky-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink">{s.label}</div>
          </div>
        ))}
      </div>

      <DonorGrid donors={donors} />
    </div>
  )
}
