'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { PsdpScheme, ImplementationStage, SchemeRiskLevel, OpportunityType } from '@/lib/types/database'
import {
  Search, X, ExternalLink, AlertTriangle, TrendingUp,
  MapPin, Building2, Banknote, Calendar, ChevronDown, ChevronRight,
  Zap, Eye, Users, Briefcase,
} from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<SchemeRiskLevel, string> = {
  low:      'bg-fern/10 text-fern border-fern/20',
  medium:   'bg-amber-50 text-amber-700 border-amber-200',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-danger/10 text-danger border-danger/20',
}

const RISK_BAR: Record<SchemeRiskLevel, string> = {
  low:      'bg-fern',
  medium:   'bg-amber-500',
  high:     'bg-orange-500',
  critical: 'bg-danger',
}

const STAGE_LABELS: Record<ImplementationStage, string> = {
  pre_award:            'Pre-Award',
  mobilization:         'Mobilization',
  early_implementation: 'Early Impl.',
  mid_implementation:   'Mid Impl.',
  completion:           'Completion',
  post_completion:      'Post-Completion',
  suspended:            'Suspended',
  cancelled:            'Cancelled',
}

const OPP_COLORS: Record<OpportunityType, string> = {
  ta_opportunity:        'bg-pine/10 text-pine',
  supervision:           'bg-blue-50 text-blue-700',
  monitoring_evaluation: 'bg-purple-50 text-purple-700',
  implementation:        'bg-amber-50 text-amber-700',
  none:                  'bg-fog text-ash',
}

const OPP_LABELS: Record<OpportunityType, string> = {
  ta_opportunity:        'TA Opportunity',
  supervision:           'Supervision',
  monitoring_evaluation: 'M&E',
  implementation:        'Implementation',
  none:                  'None',
}

const TABS = ['Overview', 'Federal PSDP', 'Provincial ADPs', 'Opportunities', 'Risk Intelligence'] as const
type Tab = typeof TABS[number]

const SOURCES = ['federal_psdp', 'provincial_adp', 'special_program'] as const

// ── Helper components ──────────────────────────────────────────────────────────

function ProgressBar({ value, max = 100, colorClass }: { value: number; max?: number; colorClass: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-1.5 w-full rounded-full bg-silver overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', colorClass)} style={{ width: `${pct}%` }} />
    </div>
  )
}

function RiskBadge({ level }: { level: SchemeRiskLevel }) {
  return (
    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', RISK_COLORS[level])}>
      {level.toUpperCase()}
    </span>
  )
}

function OppBadge({ type }: { type: OpportunityType }) {
  if (type === 'none') return null
  return (
    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', OPP_COLORS[type])}>
      {OPP_LABELS[type]}
    </span>
  )
}

function WarningSignals({ signals }: { signals: string[] | null }) {
  if (!signals || signals.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {signals.map(s => (
        <span key={s} className="text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded">
          {s.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  )
}

function FinancialBar({ scheme }: { scheme: PsdpScheme }) {
  const alloc   = scheme.allocation_bn ?? 0
  const released = scheme.released_bn ?? 0
  const utilized = scheme.utilized_bn ?? 0
  const relPct  = alloc > 0 ? Math.min(100, (released / alloc) * 100) : 0
  const utilPct = alloc > 0 ? Math.min(100, (utilized / alloc) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="relative h-3 w-full rounded-full bg-silver overflow-hidden">
        <div className="absolute h-full bg-blue-300 rounded-full" style={{ width: `${relPct}%` }} />
        <div className="absolute h-full bg-pine rounded-full" style={{ width: `${utilPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-ash">
        <span>PKR {alloc.toFixed(1)}B allocated</span>
        <span className="font-medium text-pine">{scheme.execution_pct?.toFixed(0) ?? 0}% utilized</span>
      </div>
    </div>
  )
}

// ── Scheme detail slide-in panel ───────────────────────────────────────────────

function SchemePanel({ scheme, onClose }: { scheme: PsdpScheme; onClose: () => void }) {
  const [stakeholderView, setStakeholderView] = useState<'donor' | 'firm' | 'implementer'>('firm')

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-xl bg-white shadow-2xl border-l border-silver overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-silver px-6 py-4 z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ash">{scheme.scheme_id ?? 'Scheme'}</p>
              <h2 className="text-sm font-bold text-ink leading-snug mt-0.5">{scheme.title}</h2>
            </div>
            <button onClick={onClose} className="text-ash hover:text-ink shrink-0 mt-1">
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <RiskBadge level={scheme.risk_level} />
            <OppBadge type={scheme.opportunity_type} />
            {scheme.is_slow_moving && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-danger/10 text-danger">SLOW MOVING</span>
            )}
            {scheme.is_donor_linked && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                {scheme.donor_name ?? 'Donor Linked'}
              </span>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Identity */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {scheme.ministry && (
              <div>
                <span className="text-ash font-medium">Ministry</span>
                <p className="font-semibold text-ink mt-0.5">{scheme.ministry}</p>
              </div>
            )}
            {scheme.executing_agency && (
              <div>
                <span className="text-ash font-medium">Executing Agency</span>
                <p className="font-semibold text-ink mt-0.5">{scheme.executing_agency}</p>
              </div>
            )}
            {scheme.province && (
              <div>
                <span className="text-ash font-medium">Province</span>
                <p className="font-semibold text-ink mt-0.5">{scheme.province}</p>
              </div>
            )}
            {scheme.sector && (
              <div>
                <span className="text-ash font-medium">Sector</span>
                <p className="font-semibold text-ink mt-0.5">{scheme.sector}{scheme.sub_sector ? ` / ${scheme.sub_sector}` : ''}</p>
              </div>
            )}
            {scheme.fiscal_year && (
              <div>
                <span className="text-ash font-medium">Fiscal Year</span>
                <p className="font-semibold text-ink mt-0.5">FY{scheme.fiscal_year}</p>
              </div>
            )}
            <div>
              <span className="text-ash font-medium">Stage</span>
              <p className="font-semibold text-ink mt-0.5">{STAGE_LABELS[scheme.implementation_stage]}</p>
            </div>
          </div>

          {/* Financial progress */}
          <div className="rounded-xl border border-silver p-4 space-y-3">
            <p className="text-xs font-bold text-ink">Financial Progress</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-ash">Allocation</span>
                <span className="font-bold text-ink">PKR {(scheme.allocation_bn ?? 0).toFixed(2)}B</span>
              </div>
              {scheme.revised_allocation_bn && (
                <div className="flex justify-between text-xs">
                  <span className="text-ash">Revised Allocation</span>
                  <span className="font-bold text-amber-700">PKR {scheme.revised_allocation_bn.toFixed(2)}B</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-ash">Released</span>
                <span className="font-semibold text-ink">PKR {(scheme.released_bn ?? 0).toFixed(2)}B</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ash">Utilized</span>
                <span className="font-semibold text-pine">PKR {(scheme.utilized_bn ?? 0).toFixed(2)}B</span>
              </div>
              <FinancialBar scheme={scheme} />
            </div>
          </div>

          {/* Physical vs financial */}
          {(scheme.physical_progress_pct != null || scheme.execution_pct != null) && (
            <div className="rounded-xl border border-silver p-4 space-y-3">
              <p className="text-xs font-bold text-ink">Financial vs Physical Progress</p>
              {scheme.execution_pct != null && (
                <div>
                  <div className="flex justify-between text-xs text-ash mb-1">
                    <span>Financial execution</span>
                    <span className="font-semibold text-ink">{scheme.execution_pct.toFixed(1)}%</span>
                  </div>
                  <ProgressBar
                    value={scheme.execution_pct}
                    colorClass={scheme.execution_pct < 40 ? 'bg-danger' : scheme.execution_pct < 70 ? 'bg-amber-500' : 'bg-pine'}
                  />
                </div>
              )}
              {scheme.physical_progress_pct != null && (
                <div>
                  <div className="flex justify-between text-xs text-ash mb-1">
                    <span>Physical completion</span>
                    <span className="font-semibold text-ink">{scheme.physical_progress_pct.toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={scheme.physical_progress_pct} colorClass="bg-blue-400" />
                </div>
              )}
              {scheme.progress_variance != null && (
                <p className={cn('text-xs font-medium', scheme.progress_variance < -10 ? 'text-danger' : 'text-ash')}>
                  {scheme.progress_variance < 0
                    ? `⚠ Physical lags financial by ${Math.abs(scheme.progress_variance).toFixed(1)} pp`
                    : `Physical leads financial by ${scheme.progress_variance.toFixed(1)} pp`}
                </p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-xl border border-silver p-4 space-y-2 text-xs">
            <p className="font-bold text-ink">Timeline</p>
            {scheme.start_date && (
              <div className="flex justify-between">
                <span className="text-ash">Start date</span>
                <span className="font-medium text-ink">{scheme.start_date}</span>
              </div>
            )}
            {scheme.original_end_date && (
              <div className="flex justify-between">
                <span className="text-ash">Original end</span>
                <span className="font-medium text-ink">{scheme.original_end_date}</span>
              </div>
            )}
            {scheme.revised_end_date && (
              <div className="flex justify-between">
                <span className="text-ash">Revised end</span>
                <span className="font-medium text-amber-700">{scheme.revised_end_date}</span>
              </div>
            )}
            {scheme.extension_count > 0 && (
              <p className="text-amber-700 font-medium">{scheme.extension_count} extension(s) granted</p>
            )}
          </div>

          {/* Opportunity window */}
          {scheme.opportunity_type !== 'none' && (
            <div className="rounded-xl border border-pine/20 bg-pine/5 p-4">
              <p className="text-xs font-bold text-pine mb-1">
                <Zap size={12} className="inline mr-1" />
                Opportunity Window — {OPP_LABELS[scheme.opportunity_type]}
              </p>
              {scheme.opportunity_window && (
                <p className="text-xs text-ink leading-relaxed">{scheme.opportunity_window}</p>
              )}
              {scheme.ta_value_estimate_m && (
                <p className="text-xs text-pine font-semibold mt-1">
                  Est. value: ${scheme.ta_value_estimate_m}M
                </p>
              )}
            </div>
          )}

          {/* Warning signals */}
          {scheme.warning_signals && scheme.warning_signals.length > 0 && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
              <p className="text-xs font-bold text-danger mb-2">
                <AlertTriangle size={12} className="inline mr-1" />
                Warning Signals
              </p>
              <div className="flex flex-wrap gap-1.5">
                {scheme.warning_signals.map(s => (
                  <span key={s} className="text-xs bg-danger/10 text-danger px-2 py-0.5 rounded">
                    {s.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stakeholder views */}
          <div>
            <p className="text-xs font-bold text-ink mb-2">Stakeholder Views</p>
            <div className="flex gap-1 mb-3">
              {([['donor', 'Donor'], ['firm', 'Consulting Firm'], ['implementer', 'Implementer']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setStakeholderView(key)}
                  className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors',
                    stakeholderView === key ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}>
                  {label}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-silver p-4 min-h-[60px]">
              {stakeholderView === 'donor' && (
                scheme.donor_perspective
                  ? <p className="text-xs text-ink leading-relaxed">{scheme.donor_perspective}</p>
                  : <p className="text-xs text-ash italic">No donor perspective recorded</p>
              )}
              {stakeholderView === 'firm' && (
                scheme.firm_perspective
                  ? <p className="text-xs text-ink leading-relaxed">{scheme.firm_perspective}</p>
                  : <p className="text-xs text-ash italic">No consulting firm perspective recorded</p>
              )}
              {stakeholderView === 'implementer' && (
                scheme.implementer_perspective
                  ? <p className="text-xs text-ink leading-relaxed">{scheme.implementer_perspective}</p>
                  : <p className="text-xs text-ash italic">No implementer perspective recorded</p>
              )}
            </div>
          </div>

          {/* Implementer */}
          {scheme.implementer && (
            <div className="text-xs">
              <span className="font-semibold text-ink">Implementer: </span>
              <span className="text-ash">{scheme.implementer}</span>
              {scheme.implementer_type && <span className="text-ash"> ({scheme.implementer_type})</span>}
              {scheme.implementer_note && <p className="mt-1 text-ash leading-relaxed">{scheme.implementer_note}</p>}
            </div>
          )}

          {/* Donor financing */}
          {scheme.is_donor_linked && scheme.donor_name && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs space-y-1">
              <p className="font-bold text-blue-800">Donor Financing</p>
              <p className="text-blue-700">{scheme.donor_name}</p>
              {scheme.donor_loan_pct && (
                <p className="text-blue-600">{scheme.donor_loan_pct}% of cost financed</p>
              )}
            </div>
          )}

          {/* Geographic detail */}
          {(scheme.geographic_note || scheme.beneficiary_count) && (
            <div className="text-xs space-y-1">
              {scheme.beneficiary_count && (
                <p><span className="font-semibold text-ink">Beneficiaries: </span>
                  <span className="text-ash">{scheme.beneficiary_count.toLocaleString()}</span></p>
              )}
              {scheme.geographic_note && <p className="text-ash leading-relaxed">{scheme.geographic_note}</p>}
            </div>
          )}

          {/* Source */}
          {scheme.source_url && (
            <a href={scheme.source_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-pine hover:underline">
              <ExternalLink size={11} /> View source
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Scheme card ────────────────────────────────────────────────────────────────

function SchemeCard({ scheme, onClick }: { scheme: PsdpScheme; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-silver bg-card p-4 hover:shadow-sm hover:border-pine/30 cursor-pointer transition-all space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-ash font-medium">{scheme.ministry ?? scheme.executing_agency}</p>
          <h3 className="text-sm font-bold text-ink leading-snug mt-0.5 line-clamp-2">{scheme.title}</h3>
        </div>
        <RiskBadge level={scheme.risk_level} />
      </div>

      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {scheme.province && (
          <span className="flex items-center gap-0.5 text-ash">
            <MapPin size={9} /> {scheme.province}
          </span>
        )}
        {scheme.sector && (
          <span className="bg-pine/5 text-pine px-1.5 py-0.5 rounded">{scheme.sector}</span>
        )}
        <span className="text-ash">{STAGE_LABELS[scheme.implementation_stage]}</span>
      </div>

      <FinancialBar scheme={scheme} />

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <OppBadge type={scheme.opportunity_type} />
          {scheme.is_slow_moving && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-danger/10 text-danger">SLOW</span>
          )}
          {scheme.is_donor_linked && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
              {scheme.donor_name ?? 'Donor'}
            </span>
          )}
        </div>
        <span className="text-[10px] text-ash font-medium">
          PKR {(scheme.allocation_bn ?? 0).toFixed(1)}B
        </span>
      </div>

      <WarningSignals signals={scheme.warning_signals} />
    </div>
  )
}

// ── Sector concentration chart ─────────────────────────────────────────────────

function SectorChart({ schemes }: { schemes: PsdpScheme[] }) {
  const sectors = useMemo(() => {
    const map: Record<string, { alloc: number; util: number; count: number }> = {}
    for (const s of schemes) {
      const k = s.sector ?? 'Other'
      if (!map[k]) map[k] = { alloc: 0, util: 0, count: 0 }
      map[k].alloc += s.allocation_bn ?? 0
      map[k].util  += s.utilized_bn ?? 0
      map[k].count += 1
    }
    return Object.entries(map)
      .sort((a, b) => b[1].alloc - a[1].alloc)
      .slice(0, 8)
  }, [schemes])

  const maxAlloc = sectors[0]?.[1].alloc ?? 1

  return (
    <div className="rounded-xl border border-silver bg-card p-5 space-y-3">
      <p className="text-xs font-bold text-ink">Budget Allocation by Sector (PKR Billions)</p>
      <div className="space-y-2.5">
        {sectors.map(([sector, d]) => {
          const execPct = d.alloc > 0 ? (d.util / d.alloc) * 100 : 0
          return (
            <div key={sector} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ink">{sector}</span>
                <span className="text-ash">{d.alloc.toFixed(1)}B · <span className={cn('font-semibold', execPct < 40 ? 'text-danger' : execPct < 70 ? 'text-amber-600' : 'text-fern')}>{execPct.toFixed(0)}%</span></span>
              </div>
              <div className="relative h-2 rounded-full bg-silver overflow-hidden">
                <div className="absolute h-full bg-pine/20 rounded-full" style={{ width: `${(d.alloc / maxAlloc) * 100}%` }} />
                <div className="absolute h-full bg-pine rounded-full" style={{ width: `${(d.util / maxAlloc) * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Province comparison ────────────────────────────────────────────────────────

function ProvinceTable({ schemes }: { schemes: PsdpScheme[] }) {
  const provinces = useMemo(() => {
    const map: Record<string, { alloc: number; util: number; slow: number; count: number }> = {}
    for (const s of schemes) {
      const k = s.province ?? 'National'
      if (!map[k]) map[k] = { alloc: 0, util: 0, slow: 0, count: 0 }
      map[k].alloc += s.allocation_bn ?? 0
      map[k].util  += s.utilized_bn ?? 0
      map[k].slow  += s.is_slow_moving ? 1 : 0
      map[k].count += 1
    }
    return Object.entries(map).sort((a, b) => b[1].alloc - a[1].alloc)
  }, [schemes])

  return (
    <div className="rounded-xl border border-silver bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-silver">
        <p className="text-xs font-bold text-ink">Province Comparison</p>
      </div>
      <table className="w-full text-xs">
        <thead className="bg-fog text-ash font-medium">
          <tr>
            <th className="px-4 py-2 text-left">Province</th>
            <th className="px-4 py-2 text-right">Allocation</th>
            <th className="px-4 py-2 text-right">Utilized</th>
            <th className="px-4 py-2 text-right">Execution</th>
            <th className="px-4 py-2 text-right">Schemes</th>
            <th className="px-4 py-2 text-right">Slow</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-silver">
          {provinces.map(([prov, d]) => {
            const execPct = d.alloc > 0 ? (d.util / d.alloc) * 100 : 0
            return (
              <tr key={prov} className="hover:bg-fog/50">
                <td className="px-4 py-2.5 font-semibold text-ink">{prov}</td>
                <td className="px-4 py-2.5 text-right text-ash">{d.alloc.toFixed(1)}B</td>
                <td className="px-4 py-2.5 text-right text-ash">{d.util.toFixed(1)}B</td>
                <td className={cn('px-4 py-2.5 text-right font-bold',
                  execPct < 40 ? 'text-danger' : execPct < 70 ? 'text-amber-600' : 'text-fern')}>
                  {execPct.toFixed(0)}%
                </td>
                <td className="px-4 py-2.5 text-right text-ash">{d.count}</td>
                <td className={cn('px-4 py-2.5 text-right font-bold', d.slow > 0 ? 'text-danger' : 'text-ash')}>
                  {d.slow > 0 ? d.slow : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

interface Props {
  schemes: PsdpScheme[]
  withOpps: number
}

export function PsdpDashboard({ schemes, withOpps }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [selected, setSelected] = useState<PsdpScheme | null>(null)
  const [query, setQuery]           = useState('')
  const [riskFilter, setRiskFilter]   = useState<SchemeRiskLevel | null>(null)
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)
  const [provinceFilter, setProvinceFilter] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)

  const sectors   = useMemo(() => [...new Set(schemes.map(s => s.sector).filter(Boolean))].sort() as string[], [schemes])
  const provinces = useMemo(() => [...new Set(schemes.map(s => s.province).filter(Boolean))].sort() as string[], [schemes])

  const filtered = useMemo(() => schemes.filter(s => {
    if (query) {
      const q = query.toLowerCase()
      if (!s.title.toLowerCase().includes(q) &&
          !(s.ministry ?? '').toLowerCase().includes(q) &&
          !(s.executing_agency ?? '').toLowerCase().includes(q) &&
          !(s.implementer ?? '').toLowerCase().includes(q)) return false
    }
    if (riskFilter && s.risk_level !== riskFilter) return false
    if (sectorFilter && s.sector !== sectorFilter) return false
    if (provinceFilter && s.province !== provinceFilter) return false
    if (sourceFilter && s.source !== sourceFilter) return false
    return true
  }), [schemes, query, riskFilter, sectorFilter, provinceFilter, sourceFilter])

  const clearFilters = () => {
    setQuery(''); setRiskFilter(null); setSectorFilter(null)
    setProvinceFilter(null); setSourceFilter(null)
  }
  const hasFilters = query || riskFilter || sectorFilter || provinceFilter || sourceFilter

  const tabSchemes = useMemo(() => {
    if (activeTab === 'Federal PSDP')    return filtered.filter(s => s.source === 'federal_psdp')
    if (activeTab === 'Provincial ADPs') return filtered.filter(s => s.source === 'provincial_adp')
    if (activeTab === 'Opportunities')   return filtered.filter(s => s.opportunity_type !== 'none')
    if (activeTab === 'Risk Intelligence') return filtered.filter(s => s.risk_level === 'high' || s.risk_level === 'critical' || s.is_slow_moving)
    return filtered
  }, [filtered, activeTab])

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-silver bg-white px-3 py-2 min-w-[240px]">
            <Search size={13} className="text-ash shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search schemes, ministries, implementers…"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-ash"
            />
            {query && <button onClick={() => setQuery('')}><X size={12} className="text-ash" /></button>}
          </div>

          {/* Risk filter */}
          {(['low','medium','high','critical'] as SchemeRiskLevel[]).map(r => (
            <button key={r} onClick={() => setRiskFilter(riskFilter === r ? null : r)}
              className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors',
                riskFilter === r ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-danger hover:underline">Clear</button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {sectors.slice(0, 8).map(s => (
            <button key={s} onClick={() => setSectorFilter(sectorFilter === s ? null : s)}
              className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors',
                sectorFilter === s ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}>
              {s}
            </button>
          ))}
          {provinces.map(p => (
            <button key={p} onClick={() => setProvinceFilter(provinceFilter === p ? null : p)}
              className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors',
                provinceFilter === p ? 'bg-forest text-white border-forest' : 'border-silver text-ash hover:bg-fog')}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-silver">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'border-pine text-pine'
                : 'border-transparent text-ash hover:text-ink')}>
            {tab}
          </button>
        ))}
      </div>

      {/* Overview: sector chart + province table + scheme grid */}
      {activeTab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectorChart schemes={filtered} />
            <ProvinceTable schemes={filtered} />
          </div>

          {/* Key metrics strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: <TrendingUp size={14} />,
                label: 'Schemes with Opportunities',
                value: filtered.filter(s => s.opportunity_type !== 'none').length,
                color: 'text-pine',
              },
              {
                icon: <AlertTriangle size={14} />,
                label: 'High/Critical Risk',
                value: filtered.filter(s => s.risk_level === 'high' || s.risk_level === 'critical').length,
                color: 'text-danger',
              },
              {
                icon: <Banknote size={14} />,
                label: 'Donor-Linked Schemes',
                value: filtered.filter(s => s.is_donor_linked).length,
                color: 'text-blue-600',
              },
              {
                icon: <Eye size={14} />,
                label: 'Under-Utilized',
                value: filtered.filter(s => s.is_under_utilized).length,
                color: 'text-amber-600',
              },
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-silver bg-card p-4 flex gap-3 items-start">
                <div className={cn('mt-0.5', m.color)}>{m.icon}</div>
                <div>
                  <div className={cn('text-xl font-bold', m.color)}>{m.value}</div>
                  <div className="text-xs text-ash mt-0.5">{m.label}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-ash font-medium">{filtered.length} scheme{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(s => <SchemeCard key={s.id} scheme={s} onClick={() => setSelected(s)} />)}
          </div>
        </div>
      )}

      {/* List views for other tabs */}
      {activeTab !== 'Overview' && (
        <div className="space-y-4">
          {activeTab === 'Risk Intelligence' && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-xs text-danger leading-relaxed">
              <AlertTriangle size={12} className="inline mr-1" />
              Showing high-risk and slow-moving schemes. These may signal TA demand for execution support, M&E, or restructuring.
            </div>
          )}
          {activeTab === 'Opportunities' && (
            <div className="rounded-xl border border-pine/20 bg-pine/5 p-4 text-xs text-pine leading-relaxed">
              <Zap size={12} className="inline mr-1" />
              {tabSchemes.length} scheme{tabSchemes.length !== 1 ? 's' : ''} with active opportunity windows.
              Click any card to see the firm-perspective positioning note.
            </div>
          )}
          <p className="text-xs text-ash font-medium">{tabSchemes.length} scheme{tabSchemes.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tabSchemes.map(s => <SchemeCard key={s.id} scheme={s} onClick={() => setSelected(s)} />)}
          </div>
          {tabSchemes.length === 0 && (
            <div className="rounded-xl border border-dashed border-silver p-8 text-center">
              <p className="text-sm text-ash">No schemes match the current filters</p>
              <button onClick={clearFilters} className="mt-2 text-xs text-pine hover:underline">Clear filters</button>
            </div>
          )}
        </div>
      )}

      {/* Slide-in detail panel */}
      {selected && <SchemePanel scheme={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
