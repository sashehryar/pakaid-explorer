'use client'

import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronRight, TrendingUp, TrendingDown, AlertTriangle, Minus, Shield, Calendar, AlertCircle } from 'lucide-react'
import type { FunderMaster, Project } from '@/lib/types/database'

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  Bilateral:    { color: '#055C45', bg: 'var(--color-brand-100)' },
  Multilateral: { color: '#1d4ed8', bg: '#dbeafe' },
  UN:           { color: '#7c3aed', bg: '#ede9fe' },
  Philanthropy: { color: '#b45309', bg: '#fef3c7' },
  Climate:      { color: '#15803d', bg: '#dcfce7' },
  Pakistan:     { color: '#b91c1c', bg: '#fee2e2' },
}

const TREND_ICONS = {
  growing:  { Icon: TrendingUp,   color: '#15803d', label: 'Growing' },
  stable:   { Icon: Minus,        color: '#1d4ed8', label: 'Stable' },
  shrinking:{ Icon: TrendingDown, color: '#b91c1c', label: 'Shrinking' },
}

const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  active:         { label: 'Active',         color: '#15803d', bg: '#dcfce7' },
  partial_freeze: { label: 'Partial Freeze', color: '#b91c1c', bg: '#fee2e2' },
  limited:        { label: 'Limited',        color: '#b45309', bg: '#fef3c7' },
  exited:         { label: 'Exited',         color: '#6b7280', bg: '#f3f4f6' },
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

interface Props {
  funders: FunderMaster[]
  projects: Project[]
}

type Tab = 'registry' | 'expiry' | 'whitespace'

export function FunderCoverage({ funders, projects }: Props) {
  const [tab, setTab]           = useState<Tab>('registry')
  const [search, setSearch]     = useState('')
  const [filterType, setFilterType]   = useState('')
  const [filterTrend, setFilterTrend] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAll, setShowAll]   = useState(false)
  const [expiryWindow, setExpiryWindow] = useState<30 | 90 | 180>(90)

  // ── Registry filter ──────────────────────────────────────────────────────────
  const filtered = funders.filter(f => {
    if (filterType  && f.type  !== filterType)  return false
    if (filterTrend && f.trend !== filterTrend) return false
    if (search) {
      const q = search.toLowerCase()
      return f.name.toLowerCase().includes(q) || f.sectors.some(s => s.toLowerCase().includes(q))
    }
    return true
  })

  const types      = [...new Set(funders.map(f => f.type))]
  const displayed  = showAll ? filtered : filtered.slice(0, 15)

  const growing   = funders.filter(f => f.trend === 'growing').length
  const shrinking = funders.filter(f => f.trend === 'shrinking').length
  const freezes   = funders.filter(f => f.status === 'partial_freeze').length

  // ── Expiry watch ─────────────────────────────────────────────────────────────
  const activeProjects = projects.filter(p => p.status === 'active')

  // Group expiring projects by funder / donor name
  const expiringByFunder = new Map<string, Project[]>()
  for (const p of activeProjects) {
    const days = daysUntil(p.end_date)
    if (days !== null && days >= 0 && days <= expiryWindow) {
      if (!expiringByFunder.has(p.donor)) expiringByFunder.set(p.donor, [])
      expiringByFunder.get(p.donor)!.push(p)
    }
  }
  const expiryFunders = [...expiringByFunder.entries()].sort((a, b) => b[1].length - a[1].length)

  // ── White space detection ────────────────────────────────────────────────────
  // Funders whose most recent project ends in the past OR who have no active project
  const donorActivity = new Map<string, { active: number; lastEnd: string | null }>()
  for (const p of projects) {
    const prev = donorActivity.get(p.donor) ?? { active: 0, lastEnd: null }
    if (p.status === 'active') prev.active++
    if (p.end_date && (!prev.lastEnd || p.end_date > prev.lastEnd)) prev.lastEnd = p.end_date
    donorActivity.set(p.donor, prev)
  }

  // Sectors covered by active projects — sector → donor count
  const sectorDonorMap = new Map<string, Set<string>>()
  for (const p of activeProjects) {
    if (!p.sector) continue
    if (!sectorDonorMap.has(p.sector)) sectorDonorMap.set(p.sector, new Set())
    sectorDonorMap.get(p.sector)!.add(p.donor)
  }

  // Funders in registry with no active projects → potential exits
  const exitRisk = funders.filter(f => {
    const act = donorActivity.get(f.name)
    return !act || act.active === 0
  })

  // Sectors covered by exiting funders but no other donor present
  const whitespaceGaps: Array<{ sector: string; exitingFunders: string[] }> = []
  const allSectors = [...new Set(funders.flatMap(f => f.sectors))]
  for (const sector of allSectors) {
    const sectorDonors = sectorDonorMap.get(sector)
    const exitingInSector = exitRisk.filter(f => f.sectors.includes(sector)).map(f => f.name)
    if (exitingInSector.length > 0 && (!sectorDonors || sectorDonors.size === 0)) {
      whitespaceGaps.push({ sector, exitingFunders: exitingInSector })
    }
  }

  return (
    <div className="space-y-5 mt-4">

      {/* Coverage KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Funders',       value: funders.length,          color: '#055C45' },
          { label: 'Growing',             value: growing,                 color: '#15803d' },
          { label: 'Shrinking / Frozen',  value: shrinking + freezes,     color: '#b91c1c' },
          { label: 'Types Covered',       value: types.length,            color: '#1d4ed8' },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3 border" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)', width: 'fit-content' }}>
        {([
          { id: 'registry',   label: 'Funder Registry' },
          { id: 'expiry',     label: 'Expiry Watch' },
          { id: 'whitespace', label: 'White Space' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: tab === t.id ? '#055C45' : '#fff',
              color:      tab === t.id ? '#fff'    : 'var(--color-text-secondary)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Registry tab ──────────────────────────────────────────────────── */}
      {tab === 'registry' && (
        <div className="rounded-xl border p-4 space-y-4"
          style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Funder Intelligence — Full Registry ({funders.length} funders)
            </h2>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              DB-live · confidence scored
            </span>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <input placeholder="Search funders or sectors…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm flex-1 min-w-[200px]"
              style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }} />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
              <option value="">All types</option>
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={filterTrend} onChange={e => setFilterTrend(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
              <option value="">All trends</option>
              <option value="growing">Growing</option>
              <option value="stable">Stable</option>
              <option value="shrinking">Shrinking</option>
            </select>
          </div>

          {/* Funder list */}
          <div className="space-y-2">
            {displayed.map(funder => {
              const tc     = TYPE_CONFIG[funder.type]    ?? TYPE_CONFIG.Bilateral
              const trend  = TREND_ICONS[funder.trend as keyof typeof TREND_ICONS] ?? TREND_ICONS.stable
              const status = STATUS_COLORS[funder.status] ?? STATUS_COLORS.active
              const isOpen = expanded === funder.name

              return (
                <div key={funder.name} className="rounded-xl border overflow-hidden"
                  style={{ borderColor: 'var(--color-border-subtle)', background: '#fff' }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : funder.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{ background: isOpen ? 'var(--color-brand-100)' : '#fff' }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{funder.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: tc.bg, color: tc.color }}>{funder.type}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: status.bg, color: status.color }}>{status.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {funder.sectors.slice(0, 4).map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' }}>{s}</span>
                        ))}
                        {funder.sectors.length > 4 && (
                          <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>+{funder.sectors.length - 4}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-xs">
                        <trend.Icon size={12} style={{ color: trend.color }} />
                        <span style={{ color: trend.color }}>{trend.label}</span>
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{funder.budget_label ?? ''}</span>
                      {isOpen ? <ChevronDown size={14} style={{ color: '#055C45' }} /> : <ChevronRight size={14} style={{ color: 'var(--color-text-disabled)' }} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                      {funder.signal && (
                        <div className="rounded-lg p-3 mt-3" style={{ background: 'var(--color-brand-100)' }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#055C45' }}>Intelligence Signal</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{funder.signal}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        {funder.confidence_score && (
                          <span className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <Shield size={11} style={{ color: funder.confidence_score >= 80 ? '#15803d' : '#b45309' }} />
                            Confidence: {funder.confidence_score}%
                          </span>
                        )}
                        {funder.last_verified && (
                          <span className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <Calendar size={11} />
                            Verified: {new Date(funder.last_verified).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {funder.country_url && (
                          <a href={funder.country_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: '#055C45' }}>
                            <ExternalLink size={11} /> Country Page
                          </a>
                        )}
                        {funder.procurement_url && funder.procurement_url !== 'N/A' && (
                          <a href={funder.procurement_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: '#055C45' }}>
                            <ExternalLink size={11} /> Procurement Portal
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {funder.sectors.map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: tc.bg, color: tc.color }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filtered.length > 15 && (
            <button onClick={() => setShowAll(!showAll)}
              className="w-full rounded-xl border py-3 text-sm font-medium transition-colors"
              style={{ borderColor: '#055C45', color: '#055C45', background: '#fff' }}>
              {showAll ? 'Show less' : `Show all ${filtered.length} funders`}
            </button>
          )}
        </div>
      )}

      {/* ── Expiry Watch tab ───────────────────────────────────────────────── */}
      {tab === 'expiry' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Expiry window:</span>
            {([30, 90, 180] as const).map(w => (
              <button key={w} onClick={() => setExpiryWindow(w)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: expiryWindow === w ? '#055C45' : '#fff',
                  color:      expiryWindow === w ? '#fff'    : '#055C45',
                  border:     '1px solid #055C45',
                }}>
                {w} days
              </button>
            ))}
          </div>

          {expiryFunders.length === 0 ? (
            <div className="rounded-xl border p-8 text-center"
              style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No active projects closing within {expiryWindow} days.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiryFunders.map(([donor, dProjects]) => {
                const funder    = funders.find(f => f.name === donor)
                const tc        = TYPE_CONFIG[funder?.type ?? 'Bilateral'] ?? TYPE_CONFIG.Bilateral
                const urgent    = dProjects.filter(p => (daysUntil(p.end_date) ?? 999) <= 30)
                return (
                  <div key={donor} className="rounded-xl border p-4"
                    style={{ background: '#fff', borderColor: urgent.length ? '#fecaca' : 'var(--color-border-subtle)' }}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {urgent.length > 0 && <AlertCircle size={14} className="text-red-500 shrink-0" />}
                        <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{donor}</span>
                        {funder && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: tc.bg, color: tc.color }}>{funder.type}</span>
                        )}
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded"
                        style={{ background: urgent.length ? '#fee2e2' : '#fef3c7', color: urgent.length ? '#b91c1c' : '#b45309' }}>
                        {dProjects.length} project{dProjects.length > 1 ? 's' : ''} closing
                      </span>
                    </div>
                    <div className="space-y-2">
                      {dProjects.map(p => {
                        const days = daysUntil(p.end_date) ?? 0
                        return (
                          <div key={p.id} className="flex items-start gap-3 text-xs">
                            <span className="shrink-0 mt-0.5 font-bold" style={{ color: days <= 30 ? '#b91c1c' : '#b45309' }}>
                              {days}d
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{p.title}</p>
                              <p style={{ color: 'var(--color-text-secondary)' }}>
                                {p.sector} · {p.province ?? 'National'} ·{' '}
                                {p.end_date ? new Date(p.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── White Space tab ────────────────────────────────────────────────── */}
      {tab === 'whitespace' && (
        <div className="space-y-4">
          {/* Exit risk funders */}
          <div className="rounded-xl border p-4"
            style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} style={{ color: '#b45309' }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Funders with No Active Projects ({exitRisk.length})
              </h3>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              These funders are in the registry but have no matching active project in the aid pipeline. Potential exits or data gaps.
            </p>
            {exitRisk.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>All registry funders have active projects.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {exitRisk.map(f => {
                  const tc = TYPE_CONFIG[f.type] ?? TYPE_CONFIG.Bilateral
                  return (
                    <div key={f.name} className="flex flex-col gap-1 rounded-lg px-3 py-2 border text-xs"
                      style={{ borderColor: 'var(--color-border-subtle)', background: '#fafafa' }}>
                      <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{f.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full w-fit"
                        style={{ background: tc.bg, color: tc.color }}>{f.type}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {f.sectors.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] px-1 py-0.5 rounded"
                            style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sector white space gaps */}
          <div className="rounded-xl border p-4"
            style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} style={{ color: '#b91c1c' }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Sector White Space After Portfolio Closure
              </h3>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Sectors where departing funders leave no replacement coverage — highest substitution opportunity.
            </p>
            {whitespaceGaps.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                No uncovered sector gaps detected based on current pipeline data.
              </p>
            ) : (
              <div className="space-y-2">
                {whitespaceGaps.map(g => (
                  <div key={g.sector} className="flex items-start gap-3 rounded-lg p-3"
                    style={{ background: '#fff3cd', border: '1px solid #fde68a' }}>
                    <AlertCircle size={13} style={{ color: '#b45309', marginTop: 1 }} />
                    <div>
                      <span className="text-sm font-semibold" style={{ color: '#b45309' }}>{g.sector}</span>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        No active coverage · Exiting: {g.exitingFunders.slice(0, 3).join(', ')}
                        {g.exitingFunders.length > 3 ? ` +${g.exitingFunders.length - 3} more` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sector coverage summary */}
          <div className="rounded-xl border p-4"
            style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Sector Coverage Map</h3>
            <div className="space-y-2">
              {[...sectorDonorMap.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, 15).map(([sector, donors]) => {
                const pct = Math.round((donors.size / Math.max(1, funders.length)) * 100)
                return (
                  <div key={sector} className="flex items-center gap-3">
                    <div className="w-36 text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>{sector}</div>
                    <div className="flex-1 rounded-full h-2" style={{ background: 'var(--color-surface-subtle)' }}>
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: '#055C45' }} />
                    </div>
                    <span className="text-xs w-16 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                      {donors.size} donor{donors.size !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
