'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Job } from '@/lib/types/database'
import { formatDate } from '@/lib/utils'
import { Search, X, Filter, ExternalLink } from 'lucide-react'

const SENIORITY_COLORS: Record<string, string> = {
  'Entry':    'bg-blue-50 text-blue-700',
  'Mid':      'bg-purple-50 text-purple-700',
  'Senior':   'bg-orange-50 text-orange-700',
  'Director': 'bg-red-50 text-red-700',
  'UN NO':    'bg-sky-50 text-sky-700',
  'UN P3':    'bg-sky-100 text-sky-800',
}

const ORG_TYPE_COLORS: Record<string, string> = {
  'UN':           'bg-blue-50 text-blue-700',
  'INGO':         'bg-purple-50 text-purple-700',
  'Consulting':   'bg-amber-50 text-amber-700',
  'Local NGO':    'bg-green-50 text-green-700',
  'Government':   'bg-fog text-ash',
}

export function CareersList({ jobs }: { jobs: Job[] }) {
  const [query, setQuery] = useState('')
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)
  const [seniorityFilter, setSeniorityFilter] = useState<string | null>(null)
  const [orgTypeFilter, setOrgTypeFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const sectors    = [...new Set(jobs.map(j => j.sector).filter(Boolean))].sort() as string[]
  const seniorities = [...new Set(jobs.map(j => j.seniority).filter(Boolean))].sort() as string[]
  const orgTypes   = [...new Set(jobs.map(j => j.org_type).filter(Boolean))].sort() as string[]

  const filtered = useMemo(() => jobs.filter(j => {
    if (query && !j.title.toLowerCase().includes(query.toLowerCase()) &&
        !j.organisation.toLowerCase().includes(query.toLowerCase()) &&
        !(j.sector ?? '').toLowerCase().includes(query.toLowerCase())) return false
    if (sectorFilter && j.sector !== sectorFilter) return false
    if (seniorityFilter && j.seniority !== seniorityFilter) return false
    if (orgTypeFilter && j.org_type !== orgTypeFilter) return false
    return true
  }), [jobs, query, sectorFilter, seniorityFilter, orgTypeFilter])

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-lg border border-silver bg-white px-3 py-2">
          <Search size={13} className="text-ash shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search jobs, organisations, sectors…"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-ash"
          />
          {query && <button onClick={() => setQuery('')}><X size={12} className="text-ash" /></button>}
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn('flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border',
            showFilters || sectorFilter || seniorityFilter || orgTypeFilter
              ? 'bg-pine text-white border-pine'
              : 'border-silver text-ash hover:bg-fog')}
        >
          <Filter size={12} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-silver bg-white p-3 grid grid-cols-3 gap-3">
          {[
            { label: 'Seniority', values: seniorities, active: seniorityFilter, set: setSeniorityFilter },
            { label: 'Sector',    values: sectors,     active: sectorFilter,    set: setSectorFilter },
            { label: 'Org Type',  values: orgTypes,    active: orgTypeFilter,   set: setOrgTypeFilter },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[10px] font-bold text-ash uppercase tracking-wide">{f.label}</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {f.values.slice(0, 8).map(v => (
                  <button key={v} onClick={() => f.set(f.active === v ? null : v)}
                    className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border',
                      f.active === v ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-ash">
        {filtered.length} position{filtered.length !== 1 ? 's' : ''}
        {filtered.length !== jobs.length && <span className="text-pine"> · filtered from {jobs.length}</span>}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-silver bg-card p-8 text-center">
          <p className="text-sm text-ash">No jobs match your filters</p>
          <button onClick={() => { setQuery(''); setSectorFilter(null); setSeniorityFilter(null); setOrgTypeFilter(null) }}
            className="mt-2 text-xs text-pine hover:underline">Clear filters</button>
        </div>
      ) : (
        filtered.map(job => (
          <div key={job.id} className="rounded-xl border border-silver bg-card p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-pine flex items-center justify-center text-white font-bold text-sm shrink-0">
                {job.organisation.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-semibold text-sm text-ink">{job.title}</span>
                  {job.seniority && (
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', SENIORITY_COLORS[job.seniority] ?? 'bg-fog text-ash')}>
                      {job.seniority}
                    </span>
                  )}
                  {job.org_type && (
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', ORG_TYPE_COLORS[job.org_type] ?? 'bg-fog text-ash')}>
                      {job.org_type}
                    </span>
                  )}
                </div>
                <div className="text-xs text-ash flex flex-wrap gap-2">
                  <span className="font-medium text-slate">{job.organisation}</span>
                  {job.location && <span>· {job.location}</span>}
                  {job.sector && <span>· {job.sector}</span>}
                  {job.salary_label && <span className="font-semibold text-pine">· {job.salary_label}</span>}
                </div>
                {job.description && (
                  <p className="text-xs text-ash mt-1 line-clamp-2">{job.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {job.deadline && (
                    <span className="text-xs text-ash">Deadline: {formatDate(job.deadline)}</span>
                  )}
                  {job.apply_url && (
                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-pine hover:underline font-medium"
                    >
                      <ExternalLink size={11} /> Apply Now
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
