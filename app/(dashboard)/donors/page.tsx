import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatUSD } from '@/lib/utils'
import type { Donor } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Donor Database' }

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
        <h1 className="text-xl font-bold text-ink">Donor Database</h1>
        <p className="text-sm text-ash mt-0.5">Entry paths · Procurement models · Intelligence profiles</p>
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

      {/* Donor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(donors ?? []).map(donor => (
          <div key={donor.id} className="rounded-xl border border-silver bg-card p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="h-10 w-10 rounded-lg bg-pine flex items-center justify-center text-white font-black text-lg shrink-0">
                {donor.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-ink">{donor.name}</h3>
                  {donor.type && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLORS[donor.type] ?? 'bg-fog text-ash'}`}>
                      {donor.type}
                    </span>
                  )}
                  {donor.country && <span className="text-xs text-ash">{donor.country}</span>}
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  {donor.active_projects > 0 && (
                    <span><span className="font-bold text-ink">{donor.active_projects}</span> <span className="text-ash">active</span></span>
                  )}
                  {donor.volume_label && (
                    <span className="font-semibold text-pine">{donor.volume_label}</span>
                  )}
                  {donor.instrument && (
                    <span className="text-ash">{donor.instrument}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sectors */}
            {donor.sectors && donor.sectors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {donor.sectors.slice(0, 5).map(s => (
                  <span key={s} className="text-[11px] bg-mist text-pine px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            )}

            {/* Opportunity note */}
            {donor.opportunity_note && (
              <div className="mt-3 rounded-lg bg-mist border-l-2 border-fern pl-3 py-2 pr-2">
                <p className="text-xs text-pine leading-relaxed">{donor.opportunity_note}</p>
              </div>
            )}

            {/* Entry path */}
            {donor.entry_path && (
              <div className="mt-2 text-xs text-ash">
                <span className="font-semibold">Entry: </span>{donor.entry_path}
              </div>
            )}

            {donor.website && (
              <a
                href={donor.website} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-pine hover:underline"
              >
                {donor.website.replace('https://', '')} ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
