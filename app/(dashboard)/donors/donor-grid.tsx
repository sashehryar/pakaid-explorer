'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Donor } from '@/lib/types/database'
import { Search, X, ExternalLink } from 'lucide-react'

const TYPE_COLORS: Record<string, string> = {
  'MDB':       'bg-blue-100 text-blue-700',
  'Bilateral': 'bg-purple-100 text-purple-700',
  'UN':        'bg-sky-100 text-sky-700',
  'Climate':   'bg-green-100 text-green-700',
  'Private':   'bg-orange-100 text-orange-700',
}

export function DonorGrid({ donors }: { donors: Donor[] }) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)

  const types = [...new Set(donors.map(d => d.type).filter(Boolean))].sort() as string[]
  const sectors = [...new Set(donors.flatMap(d => d.sectors ?? []))].sort()

  const filtered = useMemo(() => donors.filter(d => {
    if (query && !d.name.toLowerCase().includes(query.toLowerCase()) &&
        !(d.opportunity_note ?? '').toLowerCase().includes(query.toLowerCase()) &&
        !(d.entry_path ?? '').toLowerCase().includes(query.toLowerCase())) return false
    if (typeFilter && d.type !== typeFilter) return false
    if (sectorFilter && !(d.sectors ?? []).includes(sectorFilter)) return false
    return true
  }), [donors, query, typeFilter, sectorFilter])

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-silver bg-white px-3 py-2 min-w-[220px]">
          <Search size={13} className="text-ash shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search donors, sectors, entry paths…"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-ash"
          />
          {query && <button onClick={() => setQuery('')}><X size={12} className="text-ash" /></button>}
        </div>

        {/* Type filter chips */}
        <div className="flex gap-1.5 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors',
                typeFilter === t ? 'bg-pine text-white border-pine' : `border-silver text-ash hover:bg-fog ${TYPE_COLORS[t] ?? ''}`)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Sector filter */}
      {sectors.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[10px] text-ash font-medium self-center">Sector:</span>
          {sectors.slice(0, 10).map(s => (
            <button key={s} onClick={() => setSectorFilter(sectorFilter === s ? null : s)}
              className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors',
                sectorFilter === s ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="text-xs text-ash">
        {filtered.length} donor{filtered.length !== 1 ? 's' : ''}
        {filtered.length !== donors.length && <span className="text-pine"> · filtered from {donors.length}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(donor => (
          <div key={donor.id} className="rounded-xl border border-silver bg-card p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-pine flex items-center justify-center text-white font-black text-lg shrink-0">
                {donor.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-ink">{donor.name}</h3>
                  {donor.type && (
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', TYPE_COLORS[donor.type] ?? 'bg-fog text-ash')}>
                      {donor.type}
                    </span>
                  )}
                  {donor.country && <span className="text-xs text-ash">{donor.country}</span>}
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  {donor.active_projects > 0 && (
                    <span><span className="font-bold text-ink">{donor.active_projects}</span> <span className="text-ash">active</span></span>
                  )}
                  {donor.volume_label && <span className="font-semibold text-pine">{donor.volume_label}</span>}
                  {donor.instrument && <span className="text-ash">{donor.instrument}</span>}
                </div>
              </div>
            </div>

            {donor.sectors && donor.sectors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {donor.sectors.slice(0, 5).map(s => (
                  <span key={s} className="text-[11px] bg-pine/5 text-pine px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            )}

            {donor.opportunity_note && (
              <div className="mt-3 rounded-lg bg-pine/5 border-l-2 border-fern pl-3 py-2 pr-2">
                <p className="text-xs text-pine leading-relaxed">{donor.opportunity_note}</p>
              </div>
            )}

            {donor.entry_path && (
              <div className="mt-2 text-xs text-ash">
                <span className="font-semibold text-ink">Entry: </span>{donor.entry_path}
              </div>
            )}

            {donor.pain_point && (
              <div className="mt-1 text-xs text-ash">
                <span className="font-semibold text-ink">Pain point: </span>{donor.pain_point}
              </div>
            )}

            {donor.procurement_model && (
              <div className="mt-1 text-xs text-ash">
                <span className="font-semibold text-ink">Procurement: </span>{donor.procurement_model}
              </div>
            )}

            {donor.website && (
              <a href={donor.website} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-pine hover:underline">
                <ExternalLink size={10} /> {donor.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 rounded-xl border border-dashed border-silver p-8 text-center">
            <p className="text-sm text-ash">No donors match your filters</p>
            <button onClick={() => { setQuery(''); setTypeFilter(null); setSectorFilter(null) }}
              className="mt-2 text-xs text-pine hover:underline">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  )
}
