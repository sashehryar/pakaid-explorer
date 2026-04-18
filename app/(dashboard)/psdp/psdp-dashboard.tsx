'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { PsdpScheme, ImplementationStage, SchemeRiskLevel, OpportunityType } from '@/lib/types/database'
import type { ProvinceRow, MinistryRow, SectorRow } from './page'
import {
  Search, X, ExternalLink, AlertTriangle, TrendingUp,
  MapPin, Banknote, Eye, Zap,
} from 'lucide-react'
import { PsdpProvinceMap }         from './psdp-province-map'
import { PsdpOutcomeIntelligence }  from './psdp-outcome-intelligence'
import { PsdpPopulationInsights }   from './psdp-population-insights'
import { PsdpSecurityPanel }        from './psdp-security-panel'

// ── Constants ──────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<SchemeRiskLevel, string> = {
  low:      'bg-fern/10 text-fern border-fern/20',
  medium:   'bg-amber-50 text-amber-700 border-amber-200',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-danger/10 text-danger border-danger/20',
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

const TABS = [
  'Overview',
  'Federal PSDP',
  'Provincial ADPs',
  'Opportunities',
  'Risk',
  'Sectoral Spending',
  'Ministry Efficiency',
  'All Schemes',
  'Opportunity Scoring',
  'Population',
] as const
type Tab = typeof TABS[number]

// Tabs that display filtered scheme cards (search/filter bar is relevant)
const SCHEME_TABS: Tab[] = ['Overview', 'Federal PSDP', 'Provincial ADPs', 'Opportunities', 'Risk', 'All Schemes']

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
  const alloc    = scheme.allocation_bn ?? 0
  const released = scheme.released_bn  ?? 0
  const utilized = scheme.utilized_bn  ?? 0
  const relPct   = alloc > 0 ? Math.min(100, (released / alloc) * 100) : 0
  const utilPct  = alloc > 0 ? Math.min(100, (utilized / alloc) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="relative h-3 w-full rounded-full bg-silver overflow-hidden">
        <div className="absolute h-full bg-blue-300 rounded-full" style={{ width: `${relPct}%` }} />
        <div className="absolute h-full bg-pine rounded-full"     style={{ width: `${utilPct}%` }} />
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
      map[k].util  += s.utilized_bn  ?? 0
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
                <div className="absolute h-full bg-pine rounded-full"    style={{ width: `${(d.util  / maxAlloc) * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Provincial Allocations table ───────────────────────────────────────────────

function ProvincialAllocationsTable({ provinces }: { provinces: ProvinceRow[] }) {
  return (
    <div className="rounded-xl border overflow-hidden h-full" style={{ borderColor: 'var(--color-border-subtle)', background: '#fff' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Provincial Allocations</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead style={{ background: 'var(--color-surface-subtle)' }}>
            <tr>
              <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Province</th>
              <th className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Alloc (B)</th>
              <th className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Exec %</th>
              <th className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Schemes</th>
              <th className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Slow</th>
            </tr>
          </thead>
          <tbody>
            {provinces.map((p, i) => {
              const execColor = p.avg_execution_pct < 40 ? '#dc2626' : p.avg_execution_pct < 70 ? '#b45309' : '#15803d'
              return (
                <tr key={p.province}
                  style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}
                  className="hover:bg-[#f9fafb]">
                  <td className="px-3 py-2.5 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{p.province}</td>
                  <td className="px-3 py-2.5 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                    {p.total_allocation_bn?.toFixed(1) ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold" style={{ color: execColor }}>
                    {p.avg_execution_pct?.toFixed(0) ?? '—'}%
                  </td>
                  <td className="px-3 py-2.5 text-right" style={{ color: 'var(--color-text-secondary)' }}>{p.scheme_count}</td>
                  <td className="px-3 py-2.5 text-right font-bold"
                    style={{ color: p.slow_moving_count > 0 ? '#dc2626' : 'var(--color-text-secondary)' }}>
                    {p.slow_moving_count > 0 ? p.slow_moving_count : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Sectoral Spending table ────────────────────────────────────────────────────

function SectoralSpendingTable({ sectors }: { sectors: SectorRow[] }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)', background: '#fff' }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Sectoral Spending & Opportunity Intelligence</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead style={{ background: 'var(--color-surface-subtle)' }}>
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Sector</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Schemes</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Allocation (B)</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Utilized (B)</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Exec %</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Throwforward (B)</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Opp. Score</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Stress Score</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Donor-Linked</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
            {sectors.map(s => {
              const execColor = s.avg_execution_pct < 40 ? '#dc2626' : s.avg_execution_pct < 70 ? '#b45309' : '#15803d'
              const oppColor  = s.avg_opportunity_score >= 70 ? '#7c3aed' : s.avg_opportunity_score >= 40 ? '#b45309' : 'var(--color-text-secondary)'
              const stressColor = s.avg_stress_score >= 70 ? '#dc2626' : s.avg_stress_score >= 40 ? '#b45309' : '#15803d'
              return (
                <tr key={s.sector} className="hover:bg-[#f9fafb]">
                  <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{s.sector}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: 'var(--color-text-secondary)' }}>{s.scheme_count}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: 'var(--color-text-secondary)' }}>{s.total_allocation_bn?.toFixed(1) ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: 'var(--color-text-secondary)' }}>{s.total_utilized_bn?.toFixed(1)   ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: execColor }}>{s.avg_execution_pct?.toFixed(0) ?? '—'}%</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: '#b45309' }}>{s.total_throwforward_bn?.toFixed(1) ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: oppColor }}>{s.avg_opportunity_score?.toFixed(0) ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: stressColor }}>{s.avg_stress_score?.toFixed(0) ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: 'var(--color-text-secondary)' }}>{s.donor_linked_count ?? 0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Ministry Efficiency table ──────────────────────────────────────────────────

function MinistryEfficiencyTable({ ministries }: { ministries: MinistryRow[] }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)', background: '#fff' }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Ministry Execution Efficiency</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead style={{ background: 'var(--color-surface-subtle)' }}>
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Ministry</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Schemes</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Allocation (B)</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Utilized (B)</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Exec %</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Throwforward (B)</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Slow-Moving</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Backlog %</th>
              <th className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Opp. Score</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
            {ministries.map(m => {
              const execColor    = m.avg_execution_pct < 40 ? '#dc2626' : m.avg_execution_pct < 70 ? '#b45309' : '#15803d'
              const backlogColor = m.backlog_pct > 60 ? '#dc2626' : m.backlog_pct > 40 ? '#b45309' : 'var(--color-text-secondary)'
              return (
                <tr key={m.ministry} className="hover:bg-[#f9fafb]">
                  <td className="px-4 py-2.5 font-semibold max-w-[220px] truncate" style={{ color: 'var(--color-text-primary)' }} title={m.ministry}>{m.ministry}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: 'var(--color-text-secondary)' }}>{m.scheme_count}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: 'var(--color-text-secondary)' }}>{m.total_allocation_bn?.toFixed(1) ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: 'var(--color-text-secondary)' }}>{m.total_utilized_bn?.toFixed(1)   ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: execColor }}>{m.avg_execution_pct?.toFixed(0) ?? '—'}%</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: '#b45309' }}>{m.total_throwforward_bn?.toFixed(1) ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right font-bold"
                    style={{ color: m.slow_moving_count > 0 ? '#dc2626' : 'var(--color-text-secondary)' }}>
                    {m.slow_moving_count > 0 ? m.slow_moving_count : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: backlogColor }}>{m.backlog_pct?.toFixed(0) ?? '—'}%</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: '#7c3aed' }}>{m.avg_opportunity_score?.toFixed(0) ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-silver p-8 text-center">
      <p className="text-sm text-ash">No schemes match the current filters</p>
      <button onClick={onClear} className="mt-2 text-xs text-pine hover:underline">Clear filters</button>
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

interface Props {
  schemes:    PsdpScheme[]
  provinces:  ProvinceRow[]
  ministries: MinistryRow[]
  sectors:    SectorRow[]
  withOpps?:  number
}

export function PsdpDashboard({ schemes, provinces, ministries, sectors }: Props) {
  const [activeTab, setActiveTab]           = useState<Tab>('Overview')
  const [selected, setSelected]             = useState<PsdpScheme | null>(null)
  const [query, setQuery]                   = useState('')
  const [riskFilter, setRiskFilter]         = useState<SchemeRiskLevel | null>(null)
  const [sectorFilter, setSectorFilter]     = useState<string | null>(null)
  const [provinceFilter, setProvinceFilter] = useState<string | null>(null)

  const sectorNames   = useMemo(() => [...new Set(schemes.map(s => s.sector).filter(Boolean))].sort() as string[], [schemes])
  const provinceNames = useMemo(() => [...new Set(schemes.map(s => s.province).filter(Boolean))].sort() as string[], [schemes])

  const filtered = useMemo(() => schemes.filter(s => {
    if (query) {
      const q = query.toLowerCase()
      if (!s.title.toLowerCase().includes(q) &&
          !(s.ministry         ?? '').toLowerCase().includes(q) &&
          !(s.executing_agency ?? '').toLowerCase().includes(q) &&
          !(s.implementer      ?? '').toLowerCase().includes(q)) return false
    }
    if (riskFilter     && s.risk_level !== riskFilter)    return false
    if (sectorFilter   && s.sector     !== sectorFilter)  return false
    if (provinceFilter && s.province   !== provinceFilter) return false
    return true
  }), [schemes, query, riskFilter, sectorFilter, provinceFilter])

  const clearFilters = () => {
    setQuery(''); setRiskFilter(null); setSectorFilter(null); setProvinceFilter(null)
  }
  const hasFilters = !!(query || riskFilter || sectorFilter || provinceFilter)

  const tabSchemes = useMemo(() => {
    switch (activeTab) {
      case 'Federal PSDP':    return filtered.filter(s => s.source === 'federal_psdp')
      case 'Provincial ADPs': return filtered.filter(s => s.source === 'provincial_adp')
      case 'Opportunities':   return filtered.filter(s => s.opportunity_type !== 'none')
      case 'Risk':            return filtered.filter(s => s.risk_level === 'high' || s.risk_level === 'critical' || s.is_slow_moving)
      default:                return filtered
    }
  }, [filtered, activeTab])

  const showSearchBar = SCHEME_TABS.includes(activeTab)

  return (
    <div className="space-y-4">

      {/* ── Search + filters (only for scheme tabs) ── */}
      {showSearchBar && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 min-w-[240px]"
              style={{ borderColor: 'var(--color-border-subtle)', background: '#fff' }}>
              <Search size={13} style={{ color: 'var(--color-text-secondary)' }} className="shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search schemes, ministries, implementers…"
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: 'var(--color-text-primary)' }}
              />
              {query && (
                <button onClick={() => setQuery('')}>
                  <X size={12} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              )}
            </div>

            {(['low', 'medium', 'high', 'critical'] as SchemeRiskLevel[]).map(r => (
              <button key={r} onClick={() => setRiskFilter(riskFilter === r ? null : r)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors"
                style={{
                  background:   riskFilter === r ? '#055C45' : '#fff',
                  color:        riskFilter === r ? '#fff' : 'var(--color-text-secondary)',
                  borderColor:  riskFilter === r ? '#055C45' : 'var(--color-border-subtle)',
                }}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}

            {hasFilters && (
              <button onClick={clearFilters} className="text-xs hover:underline" style={{ color: '#dc2626' }}>Clear</button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {sectorNames.slice(0, 8).map(s => (
              <button key={s} onClick={() => setSectorFilter(sectorFilter === s ? null : s)}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors"
                style={{
                  background:  sectorFilter === s ? '#055C45' : '#fff',
                  color:       sectorFilter === s ? '#fff' : 'var(--color-text-secondary)',
                  borderColor: sectorFilter === s ? '#055C45' : 'var(--color-border-subtle)',
                }}>
                {s}
              </button>
            ))}
            {provinceNames.map(p => (
              <button key={p} onClick={() => setProvinceFilter(provinceFilter === p ? null : p)}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors"
                style={{
                  background:  provinceFilter === p ? '#1d4ed8' : '#fff',
                  color:       provinceFilter === p ? '#fff' : 'var(--color-text-secondary)',
                  borderColor: provinceFilter === p ? '#1d4ed8' : 'var(--color-border-subtle)',
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab strip ── */}
      <div className="flex gap-0.5 border-b overflow-x-auto" style={{ borderColor: 'var(--color-border-subtle)' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap"
            style={{
              borderBottomColor: activeTab === tab ? '#055C45' : 'transparent',
              color:             activeTab === tab ? '#055C45' : 'var(--color-text-secondary)',
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ════════════════ TAB CONTENT ════════════════ */}

      {/* ── Overview ── */}
      {activeTab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectorChart schemes={filtered} />
            <ProvincialAllocationsTable provinces={provinces} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <TrendingUp size={14} />, label: 'With Opportunities', value: filtered.filter(s => s.opportunity_type !== 'none').length, color: '#055C45' },
              { icon: <AlertTriangle size={14} />, label: 'High/Critical Risk',   value: filtered.filter(s => s.risk_level === 'high' || s.risk_level === 'critical').length, color: '#dc2626' },
              { icon: <Banknote size={14} />, label: 'Donor-Linked',          value: filtered.filter(s => s.is_donor_linked).length, color: '#2563eb' },
              { icon: <Eye size={14} />, label: 'Under-Utilized',          value: filtered.filter(s => s.is_under_utilized).length, color: '#b45309' },
            ].map(m => (
              <div key={m.label} className="rounded-xl border p-4 flex gap-3 items-start"
                style={{ borderColor: 'var(--color-border-subtle)', background: '#fff' }}>
                <div style={{ color: m.color, marginTop: '2px' }}>{m.icon}</div>
                <div>
                  <div className="text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{m.label}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {filtered.length} scheme{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(s => <SchemeCard key={s.id} scheme={s} onClick={() => setSelected(s)} />)}
          </div>
        </div>
      )}

      {/* ── Federal PSDP ── */}
      {activeTab === 'Federal PSDP' && (
        <div className="space-y-4">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {tabSchemes.length} federal scheme{tabSchemes.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tabSchemes.map(s => <SchemeCard key={s.id} scheme={s} onClick={() => setSelected(s)} />)}
          </div>
          {tabSchemes.length === 0 && <EmptyState onClear={clearFilters} />}
        </div>
      )}

      {/* ── Provincial ADPs ── */}
      {activeTab === 'Provincial ADPs' && (
        <div className="space-y-4">
          {/* Map + table side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
            <div className="lg:col-span-3">
              <PsdpProvinceMap provinces={provinces} />
            </div>
            <div className="lg:col-span-2">
              <ProvincialAllocationsTable provinces={provinces} />
            </div>
          </div>

          {/* Provincial scheme cards */}
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {tabSchemes.length} provincial scheme{tabSchemes.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tabSchemes.map(s => <SchemeCard key={s.id} scheme={s} onClick={() => setSelected(s)} />)}
          </div>
          {tabSchemes.length === 0 && <EmptyState onClear={clearFilters} />}
        </div>
      )}

      {/* ── Opportunities ── */}
      {activeTab === 'Opportunities' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4 text-xs leading-relaxed"
            style={{ borderColor: '#a7f3d0', background: '#ecfdf5', color: '#055C45' }}>
            <Zap size={12} className="inline mr-1" />
            {tabSchemes.length} scheme{tabSchemes.length !== 1 ? 's' : ''} with active opportunity windows.
            Click any card to see the firm-perspective positioning note.
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {tabSchemes.length} scheme{tabSchemes.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tabSchemes.map(s => <SchemeCard key={s.id} scheme={s} onClick={() => setSelected(s)} />)}
          </div>
          {tabSchemes.length === 0 && <EmptyState onClear={clearFilters} />}
        </div>
      )}

      {/* ── Risk ── */}
      {activeTab === 'Risk' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4 text-xs leading-relaxed"
            style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={12} className="inline mr-1" />
            Showing high-risk and slow-moving schemes. These may signal demand for TA, M&E, or restructuring support.
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {tabSchemes.length} scheme{tabSchemes.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tabSchemes.map(s => <SchemeCard key={s.id} scheme={s} onClick={() => setSelected(s)} />)}
          </div>
          {tabSchemes.length === 0 && <EmptyState onClear={clearFilters} />}
        </div>
      )}

      {/* ── Sectoral Spending ── */}
      {activeTab === 'Sectoral Spending' && (
        <SectoralSpendingTable sectors={sectors} />
      )}

      {/* ── Ministry Efficiency ── */}
      {activeTab === 'Ministry Efficiency' && (
        <MinistryEfficiencyTable ministries={ministries} />
      )}

      {/* ── All Schemes ── */}
      {activeTab === 'All Schemes' && (
        <div className="space-y-4">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {filtered.length} scheme{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(s => <SchemeCard key={s.id} scheme={s} onClick={() => setSelected(s)} />)}
          </div>
          {filtered.length === 0 && <EmptyState onClear={clearFilters} />}
        </div>
      )}

      {/* ── Opportunity Scoring ── */}
      {activeTab === 'Opportunity Scoring' && (
        <PsdpOutcomeIntelligence sectorData={sectors} />
      )}

      {/* ── Population ── */}
      {activeTab === 'Population' && (
        <div className="space-y-6">
          <PsdpPopulationInsights
            schemes={schemes}
            provinces={provinces}
            sectors={sectors}
          />
          <PsdpSecurityPanel />
        </div>
      )}

      {/* ── Slide-in detail panel ── */}
      {selected && <SchemePanel scheme={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
