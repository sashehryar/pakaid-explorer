'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Tender } from '@/lib/types/database'
import { formatUSD, formatDate } from '@/lib/utils'
import { X, ExternalLink, Search, Filter, MapPin, Calendar, DollarSign, Building2, TrendingUp } from 'lucide-react'

const STATUS_STYLES: Record<string, { dot: string; label: string; chip: string }> = {
  open:       { dot: 'bg-fern',       label: 'OPEN',      chip: 'bg-green-50 text-green-700' },
  evaluation: { dot: 'bg-amber-400',  label: 'EVAL',      chip: 'bg-amber-50 text-amber-700' },
  awarded:    { dot: 'bg-ash',        label: 'AWARDED',   chip: 'bg-fog text-ash' },
  cancelled:  { dot: 'bg-red-400',    label: 'CANCELLED', chip: 'bg-red-50 text-red-700' },
}

function TenderModal({ tender, onClose }: { tender: Tender; onClose: () => void }) {
  const s = STATUS_STYLES[tender.status] ?? STATUS_STYLES.open
  const daysLeft = tender.days_left

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-silver overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="p-5 border-b border-silver">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-xs font-bold text-white bg-pine px-2 py-0.5 rounded">{tender.donor}</span>
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', s.chip)}>{s.label}</span>
                {daysLeft !== null && daysLeft !== undefined && daysLeft <= 14 && daysLeft >= 0 && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    {daysLeft}d left
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-ink leading-snug">{tender.title}</h2>
            </div>
            <button onClick={onClose} className="text-ash hover:text-ink shrink-0 mt-0.5">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: DollarSign, label: 'Contract Value', value: tender.value_usd ? formatUSD(tender.value_usd) : 'Undisclosed' },
              { icon: Calendar, label: 'Deadline', value: tender.deadline ? formatDate(tender.deadline) : '—' },
              { icon: MapPin, label: 'Geography', value: tender.province ?? 'National' },
              { icon: Building2, label: 'Implementer', value: tender.implementer ?? 'TBD' },
            ].map(m => (
              <div key={m.label} className="rounded-lg border border-silver bg-fog p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon size={11} className="text-ash" />
                  <span className="text-[10px] text-ash font-medium uppercase tracking-wide">{m.label}</span>
                </div>
                <div className="text-sm font-semibold text-ink">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Deadline urgency bar */}
          {daysLeft !== null && daysLeft !== undefined && daysLeft >= 0 && tender.status === 'open' && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ash">Time remaining</span>
                <span className={cn('font-semibold', daysLeft <= 7 ? 'text-danger' : daysLeft <= 14 ? 'text-amber-600' : 'text-pine')}>
                  {daysLeft} days
                </span>
              </div>
              <div className="h-2 rounded-full bg-silver overflow-hidden">
                <div
                  className={cn('h-full rounded-full', daysLeft <= 7 ? 'bg-danger' : daysLeft <= 14 ? 'bg-amber-400' : 'bg-pine')}
                  style={{ width: `${Math.min(100, (daysLeft / 90) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Sector + Instrument */}
          <div className="grid grid-cols-2 gap-4">
            {tender.sector && (
              <div>
                <h3 className="text-xs font-bold text-slate uppercase tracking-wide mb-1.5">Sector</h3>
                <span className="text-xs bg-pine/10 text-pine px-2 py-0.5 rounded-full font-medium">{tender.sector}</span>
              </div>
            )}
            {tender.instrument && (
              <div>
                <h3 className="text-xs font-bold text-slate uppercase tracking-wide mb-1.5">Type</h3>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{tender.instrument}</span>
              </div>
            )}
          </div>

          {/* Positioning note */}
          {tender.positioning_note && (
            <div className="rounded-xl bg-pine/5 border border-pine/20 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp size={13} className="text-pine" />
                <h3 className="text-xs font-bold text-pine uppercase tracking-wide">Positioning Intel</h3>
              </div>
              <p className="text-sm text-ink leading-relaxed">{tender.positioning_note}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1 border-t border-silver">
            {tender.source_url ? (
              <a
                href={tender.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-pine hover:bg-forest px-4 py-2 rounded-lg transition-colors"
              >
                <ExternalLink size={13} /> Apply / View Tender
              </a>
            ) : (
              <span className="text-xs text-ash">No direct link available — search on donor procurement portal</span>
            )}
            {daysLeft !== null && daysLeft !== undefined && daysLeft <= 14 && daysLeft >= 0 && (
              <span className="ml-auto text-xs font-bold text-danger">⚠ Closing in {daysLeft}d</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  tenders: Tender[]
}

export function TenderBoard({ tenders }: Props) {
  const [query, setQuery] = useState('')
  const [donorFilter, setDonorFilter] = useState<string | null>(null)
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    return tenders.filter(t => {
      if (query && !t.title.toLowerCase().includes(query.toLowerCase()) &&
          !t.donor.toLowerCase().includes(query.toLowerCase()) &&
          !(t.sector ?? '').toLowerCase().includes(query.toLowerCase())) return false
      if (donorFilter && t.donor !== donorFilter) return false
      if (sectorFilter && t.sector !== sectorFilter) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      return true
    })
  }, [tenders, query, donorFilter, sectorFilter, statusFilter])

  const open       = filtered.filter(t => t.status === 'open')
  const evaluation = filtered.filter(t => t.status === 'evaluation')
  const awarded    = filtered.filter(t => t.status === 'awarded')

  const donors  = [...new Set(tenders.map(t => t.donor))].sort()
  const sectors = [...new Set(tenders.map(t => t.sector).filter(Boolean))].sort() as string[]

  return (
    <>
      {/* Search + filter bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-silver bg-white px-3 py-2">
            <Search size={13} className="text-ash shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tenders, donors, sectors…"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-ash"
            />
            {query && <button onClick={() => setQuery('')} className="text-ash hover:text-ink"><X size={12} /></button>}
          </div>

          {/* Status quick-filter */}
          <div className="flex gap-1">
            {[['all', 'All'], ['open', 'Open'], ['evaluation', 'Eval'], ['awarded', 'Awarded']].map(([v, l]) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className={cn('text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors',
                  statusFilter === v ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}>
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn('flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors',
              showFilters || donorFilter || sectorFilter
                ? 'bg-pine text-white border-pine'
                : 'border-silver text-ash hover:bg-fog')}
          >
            <Filter size={12} />
          </button>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-silver bg-white p-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-ash uppercase tracking-wide">Donor</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {donors.slice(0, 10).map(d => (
                  <button key={d} onClick={() => setDonorFilter(donorFilter === d ? null : d)}
                    className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border',
                      donorFilter === d ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-ash uppercase tracking-wide">Sector</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {sectors.slice(0, 10).map(s => (
                  <button key={s} onClick={() => setSectorFilter(sectorFilter === s ? null : s)}
                    className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border',
                      sectorFilter === s ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-ash">
        {filtered.length} tenders
        {filtered.length !== tenders.length && <span className="text-pine"> · filtered from {tenders.length}</span>}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: 'open',       items: open,       title: 'Open for Bids' },
          { key: 'evaluation', items: evaluation,  title: 'Under Evaluation' },
          { key: 'awarded',    items: awarded,     title: 'Awarded' },
        ].map(col => {
          const s = STATUS_STYLES[col.key as keyof typeof STATUS_STYLES]
          return (
            <div key={col.key}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                <h2 className="text-xs font-bold text-slate uppercase tracking-wide">{col.title}</h2>
                <span className="ml-auto text-xs text-ash">{col.items.length}</span>
              </div>
              <div className="space-y-2">
                {col.items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-silver p-4 text-center text-xs text-ash">No items</div>
                )}
                {col.items.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTender(t)}
                    className="rounded-xl border border-silver bg-card p-3 hover:shadow-md hover:border-pine/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-ash bg-fog px-1.5 py-0.5 rounded">{t.donor}</span>
                      {t.days_left !== null && t.days_left !== undefined && t.days_left <= 14 && t.days_left >= 0 && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                          {t.days_left}d left
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-ink leading-snug line-clamp-2">{t.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-ash flex-wrap">
                      {t.sector && <span>{t.sector}</span>}
                      {t.value_usd && <span className="font-semibold text-ink">{formatUSD(t.value_usd)}</span>}
                      {t.deadline && <span>Due {formatDate(t.deadline)}</span>}
                    </div>
                    {t.positioning_note && (
                      <p className="mt-1.5 text-[11px] text-pine line-clamp-1">↗ {t.positioning_note}</p>
                    )}
                    <div className="mt-2 text-[10px] text-ash/60">Click for details & apply link →</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {selectedTender && (
        <TenderModal tender={selectedTender} onClose={() => setSelectedTender(null)} />
      )}
    </>
  )
}
