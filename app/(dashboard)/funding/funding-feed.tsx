'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/types/database'
import { daysUntil, expiryZone, formatUSD, formatDate } from '@/lib/utils'
import {
  X, ExternalLink, MapPin, Calendar, DollarSign, Building2,
  AlertTriangle, TrendingUp, Bookmark, Search, Filter,
} from 'lucide-react'

const ZONE_STYLES: Record<string, string> = {
  critical: 'border-l-4 border-l-red-400',
  watch:    'border-l-4 border-l-amber-400',
  active:   'border-l-4 border-l-fern',
  expired:  'border-l-4 border-l-silver opacity-60',
}

const ZONE_BADGE: Record<string, React.ReactNode> = {
  critical: <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">CRITICAL</span>,
  watch:    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">EXPIRING</span>,
  active:   null,
  expired:  <span className="text-[10px] font-bold text-ash bg-fog px-1.5 py-0.5 rounded">CLOSED</span>,
}

const INSTRUMENT_COLORS: Record<string, string> = {
  Loan:          'bg-blue-50 text-blue-700',
  Grant:         'bg-green-50 text-green-700',
  TA:            'bg-purple-50 text-purple-700',
  Humanitarian:  'bg-red-50 text-red-700',
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const days = daysUntil(project.end_date)
  const zone = expiryZone(days)

  const disbursedPct = project.amount_usd && project.amount_usd > 0
    ? Math.min(100, Math.round(Math.random() * 40 + 30)) // placeholder — replace with real disbursement field
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-silver overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={cn('p-5 border-b border-silver', ZONE_STYLES[zone])}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-xs font-bold text-white bg-pine px-2 py-0.5 rounded">{project.donor}</span>
                {project.status === 'frozen' && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">FROZEN</span>
                )}
                {ZONE_BADGE[zone]}
                {project.instrument && (
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', INSTRUMENT_COLORS[project.instrument] ?? 'bg-fog text-ash')}>
                    {project.instrument}
                  </span>
                )}
                {project.featured && (
                  <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded">★ FEATURED</span>
                )}
              </div>
              <h2 className="text-base font-bold text-ink leading-snug">{project.title}</h2>
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
              { icon: DollarSign, label: 'Total Value', value: project.amount_usd ? formatUSD(project.amount_usd) : '—' },
              { icon: Calendar, label: 'End Date', value: project.end_date ? formatDate(project.end_date) : '—' },
              { icon: MapPin, label: 'Geography', value: project.province ?? 'Federal' },
              { icon: Building2, label: 'Implementer', value: project.implementer ?? 'TBD' },
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

          {/* Timeline */}
          {(project.start_date || project.end_date) && (
            <div>
              <h3 className="text-xs font-bold text-slate uppercase tracking-wide mb-2">Timeline</h3>
              <div className="flex items-center gap-3">
                <div className="text-xs text-ash">
                  {project.start_date ? formatDate(project.start_date) : '—'}
                  <span className="text-[10px] block text-ash/70">Start</span>
                </div>
                <div className="flex-1 h-2 rounded-full bg-silver overflow-hidden">
                  {project.start_date && project.end_date && (() => {
                    const start = new Date(project.start_date).getTime()
                    const end = new Date(project.end_date).getTime()
                    const now = Date.now()
                    const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
                    return (
                      <div
                        className={cn('h-full rounded-full', zone === 'critical' ? 'bg-danger' : zone === 'watch' ? 'bg-amber-400' : 'bg-pine')}
                        style={{ width: `${pct}%` }}
                      />
                    )
                  })()}
                </div>
                <div className="text-xs text-ash text-right">
                  {project.end_date ? formatDate(project.end_date) : '—'}
                  <span className="text-[10px] block text-ash/70">
                    {days !== null && days >= 0 ? `${days}d left` : 'Ended'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sector + IATI */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate uppercase tracking-wide mb-1.5">Sector</h3>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-pine/10 text-pine px-2 py-0.5 rounded-full font-medium">{project.sector}</span>
                {project.instrument && (
                  <span className="text-xs bg-fog text-ash px-2 py-0.5 rounded-full">{project.instrument}</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate uppercase tracking-wide mb-1.5">Source</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink">{project.source}</span>
                {project.iati_id && (
                  <span className="text-[10px] text-ash font-mono">{project.iati_id}</span>
                )}
              </div>
            </div>
          </div>

          {/* Context note */}
          {project.context_note && (
            <div className="rounded-xl bg-fog border border-silver p-4">
              <h3 className="text-xs font-bold text-slate uppercase tracking-wide mb-1.5">Context</h3>
              <p className="text-sm text-ink leading-relaxed">{project.context_note}</p>
            </div>
          )}

          {/* Opportunity signal */}
          {project.opportunity_note && (
            <div className="rounded-xl bg-pine/5 border border-pine/20 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp size={13} className="text-pine" />
                <h3 className="text-xs font-bold text-pine uppercase tracking-wide">Opportunity Signal</h3>
              </div>
              <p className="text-sm text-ink leading-relaxed">{project.opportunity_note}</p>
            </div>
          )}

          {/* Warning for frozen */}
          {project.status === 'frozen' && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={13} className="text-red-600" />
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-wide">Funding Frozen</h3>
              </div>
              <p className="text-xs text-red-700">This programme has an active stop-work order. Verify with donor before engaging.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1 border-t border-silver">
            {project.source_url && (
              <a
                href={project.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-pine hover:bg-forest px-4 py-2 rounded-lg transition-colors"
              >
                <ExternalLink size={13} /> View Source
              </a>
            )}
            <button className="flex items-center gap-1.5 text-sm font-medium text-pine hover:text-forest px-4 py-2 rounded-lg border border-pine/30 hover:bg-pine/5 transition-colors">
              <Bookmark size={13} /> Save to Watchlist
            </button>
            {project.end_date && days !== null && days <= 90 && (
              <span className={cn(
                'ml-auto text-xs font-bold',
                days <= 30 ? 'text-danger' : 'text-amber-600'
              )}>
                ⚠ {days <= 30 ? 'Urgent: ' : ''}{days}d remaining
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  projects: Project[]
}

const ALL_DONORS = ['World Bank', 'ADB', 'FCDO', 'GIZ', 'EU', 'USAID', 'JICA', 'UNDP', 'WHO']
const ALL_SECTORS = ['Health', 'Education', 'WASH', 'Governance', 'Agriculture', 'Infrastructure', 'Energy', 'Climate', 'Economic Growth']
const ALL_PROVINCES = ['Federal', 'Punjab', 'Sindh', 'KP', 'Balochistan']

export function FundingFeed({ projects }: Props) {
  const [query, setQuery] = useState('')
  const [donorFilter, setDonorFilter] = useState<string | null>(null)
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (query && !p.title.toLowerCase().includes(query.toLowerCase()) &&
          !p.donor.toLowerCase().includes(query.toLowerCase()) &&
          !(p.sector ?? '').toLowerCase().includes(query.toLowerCase())) return false
      if (donorFilter && p.donor !== donorFilter) return false
      if (sectorFilter && p.sector !== sectorFilter) return false
      if (statusFilter === 'critical') {
        const d = daysUntil(p.end_date); return d !== null && d <= 30 && d >= 0
      }
      if (statusFilter === 'expiring') {
        const d = daysUntil(p.end_date); return d !== null && d <= 90 && d >= 0
      }
      if (statusFilter === 'frozen') return p.status === 'frozen'
      if (statusFilter === 'active') return p.status === 'active'
      return true
    })
  }, [projects, query, donorFilter, sectorFilter, statusFilter])

  const donors = [...new Set(projects.map(p => p.donor))].sort()
  const sectors = [...new Set(projects.map(p => p.sector).filter(Boolean))].sort() as string[]

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
              placeholder="Search programmes, donors, sectors…"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-ash"
            />
            {query && <button onClick={() => setQuery('')} className="text-ash hover:text-ink"><X size={12} /></button>}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn('flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors',
              showFilters || donorFilter || sectorFilter || statusFilter
                ? 'bg-pine text-white border-pine'
                : 'border-silver text-ash hover:bg-fog')}
          >
            <Filter size={12} /> Filters
            {(donorFilter || sectorFilter || statusFilter) && (
              <span className="bg-white/30 text-white text-[9px] font-bold rounded-full px-1">
                {[donorFilter, sectorFilter, statusFilter].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-silver bg-white p-3 space-y-2">
            <div className="grid grid-cols-3 gap-3">
              {/* Status */}
              <div>
                <label className="text-[10px] font-bold text-ash uppercase tracking-wide">Status</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {[['critical', 'Critical'], ['expiring', 'Expiring 90d'], ['frozen', 'Frozen'], ['active', 'Active']].map(([v, l]) => (
                    <button key={v} onClick={() => setStatusFilter(statusFilter === v ? null : v)}
                      className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border',
                        statusFilter === v ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Donor */}
              <div>
                <label className="text-[10px] font-bold text-ash uppercase tracking-wide">Donor</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {donors.slice(0, 8).map(d => (
                    <button key={d} onClick={() => setDonorFilter(donorFilter === d ? null : d)}
                      className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border',
                        donorFilter === d ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              {/* Sector */}
              <div>
                <label className="text-[10px] font-bold text-ash uppercase tracking-wide">Sector</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sectors.slice(0, 8).map(s => (
                    <button key={s} onClick={() => setSectorFilter(sectorFilter === s ? null : s)}
                      className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border',
                        sectorFilter === s ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {(donorFilter || sectorFilter || statusFilter) && (
              <button onClick={() => { setDonorFilter(null); setSectorFilter(null); setStatusFilter(null) }}
                className="text-[10px] text-danger hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-xs text-ash">
        <span>{filtered.length} programme{filtered.length !== 1 ? 's' : ''}</span>
        {filtered.length !== projects.length && (
          <span className="text-pine">· filtered from {projects.length}</span>
        )}
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-silver bg-card p-8 text-center">
          <p className="text-sm text-ash">No programmes match your filters</p>
          <button onClick={() => { setQuery(''); setDonorFilter(null); setSectorFilter(null); setStatusFilter(null) }}
            className="mt-2 text-xs text-pine hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(project => {
            const days = daysUntil(project.end_date)
            const zone = expiryZone(days)
            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={cn(
                  'rounded-xl border border-silver bg-card p-4 hover:shadow-md transition-all cursor-pointer hover:border-pine/30',
                  ZONE_STYLES[zone]
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-ash bg-fog px-2 py-0.5 rounded">{project.donor}</span>
                      {project.sector && <span className="text-xs text-ash">{project.sector}</span>}
                      {project.province && <span className="text-xs text-ash">· {project.province}</span>}
                      {ZONE_BADGE[zone]}
                      {project.status === 'frozen' && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">FROZEN</span>
                      )}
                      {project.instrument && (
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', INSTRUMENT_COLORS[project.instrument] ?? 'bg-fog text-ash')}>
                          {project.instrument}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-ink leading-snug">{project.title}</h3>
                    {project.opportunity_note && (
                      <p className="text-xs text-fern mt-1 line-clamp-1">↗ {project.opportunity_note}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {project.amount_usd && (
                      <div className="text-sm font-bold text-ink">{formatUSD(project.amount_usd)}</div>
                    )}
                    {project.end_date && (
                      <div className="text-xs text-ash mt-0.5">
                        {days !== null && days >= 0
                          ? <span className={days <= 30 ? 'text-red-600 font-bold' : days <= 90 ? 'text-amber-600 font-semibold' : ''}>
                              {days}d left
                            </span>
                          : formatDate(project.end_date)
                        }
                      </div>
                    )}
                    <div className="text-[10px] text-ash mt-0.5 opacity-0 group-hover:opacity-100">Click for detail →</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </>
  )
}
