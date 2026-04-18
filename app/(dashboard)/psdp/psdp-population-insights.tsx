'use client'

import { useState, useCallback } from 'react'
import type { PsdpScheme } from '@/lib/types/database'
import {
  usePopulationInsights,
  type PopulationInsightsFilters,
} from '@/lib/psdp/use-population-insights'
import type {
  ProvinceRow,
  SectorRow,
  ActionSignal,
  InterventionType,
} from '@/lib/psdp/population-utils'

// ── Re-export types so page.tsx can use them without reaching into utils ──────
export type { ProvinceRow as PopInsightProvinceRow, SectorRow as PopInsightSectorRow }

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  schemes:   PsdpScheme[]
  provinces: ProvinceRow[]
  sectors:   SectorRow[]
  /** Called when user clicks an action signal row */
  onActionSelect?: (province: string, sector: string, gapType: InterventionType) => void
  filters?: PopulationInsightsFilters
}

// ── Colour helpers (no hardcoded display strings) ─────────────────────────────

const INTERVENTION_STYLE: Record<InterventionType, { bg: string; color: string; label: string }> = {
  new_scheme:            { bg: '#fef2f2', color: '#dc2626', label: 'New Scheme Needed' },
  redirect:              { bg: '#fff7ed', color: '#ea580c', label: 'Redirect Allocation' },
  release_acceleration:  { bg: '#eff6ff', color: '#2563eb', label: 'Accelerate Releases' },
  throwforward_clearance:{ bg: '#fefce8', color: '#ca8a04', label: 'Clear Throwforward' },
}

function gapColor(gap: number): string {
  if (gap > 25)  return '#dc2626'
  if (gap > 15)  return '#ea580c'
  if (gap > 5)   return '#ca8a04'
  if (gap < -15) return '#2563eb'
  return '#16a34a'
}

function pressureColor(score: number): string {
  if (score >= 80) return '#dc2626'
  if (score >= 55) return '#ea580c'
  if (score >= 30) return '#ca8a04'
  return '#16a34a'
}

function flexibilityColor(score: number): string {
  if (score >= 65) return '#16a34a'
  if (score >= 40) return '#ca8a04'
  return '#dc2626'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</span>
      <span className="text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>{sub}</span>
    </div>
  )
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
    </div>
  )
}

function DualBar({ a, b, labelA, labelB }: { a: number; b: number; labelA: string; labelB: string }) {
  // Side-by-side bars for allocation% vs burden%
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 8 }}>
      <div style={{ flex: a, background: '#7c3aed', borderRadius: '2px 0 0 2px', height: '100%', minWidth: 2 }} title={`${labelA}: ${a.toFixed(1)}%`} />
      <div style={{ flex: Math.max(0, b - a), background: '#dc2626', borderRadius: '0 2px 2px 0', height: '100%', minWidth: b > a ? 2 : 0 }} title={`Gap: +${(b - a).toFixed(1)}%`} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PsdpPopulationInsights({ schemes, provinces, sectors, onActionSelect, filters }: Props) {
  const [activeSection, setActiveSection] = useState<number | null>(null)

  const { kpis, pressureRankings, spendMismatches, portfolio, perCapitaLoad, actionSignals } =
    usePopulationInsights(schemes, provinces, sectors, '2024-25', filters)

  const handleSignalClick = useCallback((signal: ActionSignal) => {
    onActionSelect?.(signal.province, signal.sector, signal.interventionType)
  }, [onActionSelect])

  if (schemes.length === 0 && provinces.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
        No PSDP data available. Run migration 0012 in Supabase to seed schemes.
      </div>
    )
  }

  const maxPressure = Math.max(...pressureRankings.map(r => r.pressureScore), 1)
  const maxPerCapita = Math.max(...perCapitaLoad.map(r => r.growthAdjustedPerCapita), 1)

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)', margin: 0 }}>
            Population Pressure
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Census 2023 × PSDP {filters?.provinces?.length ? `· ${filters.provinces.join(', ')}` : 'All Provinces'}
          </p>
        </div>
        {/* KPI strip */}
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Population covered',  value: `${kpis.totalPopulationCoveredM.toFixed(0)}M` },
            { label: 'Spend gaps flagged',  value: kpis.flaggedGapCount,   alert: kpis.flaggedGapCount > 0 },
            { label: 'Action signals',       value: kpis.signalCount,       alert: kpis.signalCount > 0  },
            { label: 'Portfolio flex score', value: `${kpis.portfolioFlexibilityScore.toFixed(0)}/100` },
          ].map(k => (
            <div key={k.label} style={{ textAlign: 'right' }}>
              <div className="text-base font-bold" style={{ color: k.alert ? '#dc2626' : 'var(--color-text-primary)', lineHeight: 1 }}>
                {k.value}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Five-panel grid ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>

        {/* Panel 1 — Pressure Mapping */}
        <div
          style={{ padding: '14px 18px', borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', cursor: 'default' }}
          onClick={() => setActiveSection(s => s === 1 ? null : 1)}
        >
          <SectionHeader title="1 · Pressure Mapping" sub="Population × growth rate" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pressureRankings.map(r => (
              <div key={r.province} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 44px', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {r.isHotspot && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', flexShrink: 0, display: 'inline-block' }} />
                  )}
                  <span className="text-xs" style={{ color: 'var(--color-text-primary)', fontWeight: r.isHotspot ? 600 : 400 }}>
                    {r.province}
                  </span>
                </div>
                <MiniBar value={r.pressureScore} max={100} color={pressureColor(r.pressureScore)} />
                <span className="text-[10px] text-right" style={{ color: pressureColor(r.pressureScore), fontWeight: 600 }}>
                  {r.pressureScore.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          {kpis.hotspotProvinces.length > 0 && (
            <div className="text-[10px] mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              ● Hotspots: {kpis.hotspotProvinces.join(', ')}
            </div>
          )}
        </div>

        {/* Panel 2 — Spend Mismatch */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <SectionHeader title="2 · Spend Mismatch" sub="Allocation % vs population burden %" />
          {spendMismatches.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              No focus-sector scheme data yet — seed PSDP schemes to compute mismatches.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {['Sector', 'Province', 'Spend%', 'Need%', 'Gap'].map(h => (
                      <th key={h} style={{ textAlign: h === 'Gap' || h === 'Spend%' || h === 'Need%' ? 'right' : 'left', padding: '2px 6px', color: 'var(--color-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {spendMismatches.flatMap(g =>
                    g.mismatches
                      .filter(m => m.flagged)
                      .map(m => (
                        <tr key={`${g.sector}-${m.province}`}>
                          <td style={{ padding: '2px 6px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{g.sector}</td>
                          <td style={{ padding: '2px 6px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{m.province}</td>
                          <td style={{ padding: '2px 6px', textAlign: 'right', color: '#7c3aed' }}>{m.allocationPct.toFixed(1)}%</td>
                          <td style={{ padding: '2px 6px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>{m.populationBurdenPct.toFixed(1)}%</td>
                          <td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 700, color: gapColor(m.gap) }}>
                            {m.gap > 0 ? '+' : ''}{m.gap.toFixed(1)}%
                          </td>
                        </tr>
                      ))
                  )}
                  {spendMismatches.flatMap(g => g.mismatches.filter(m => m.flagged)).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '6px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                        No gaps above {filters?.gapThreshold ?? 15}% threshold
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel 3 — Portfolio Flexibility */}
        <div style={{ padding: '14px 18px', borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
          <SectionHeader title="3 · Portfolio Flexibility" sub="Capacity to absorb new allocations" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Ongoing schemes',     value: `${portfolio.ongoingPct}%`,         raw: portfolio.ongoingPct,          color: '#7c3aed', max: 100 },
              { label: 'New schemes',         value: `${portfolio.newPct}%`,              raw: portfolio.newPct,              color: '#055C45', max: 100 },
              { label: 'Utilisation rate',    value: `${portfolio.utilizationRate}%`,     raw: portfolio.utilizationRate,     color: '#2563eb', max: 100 },
              { label: 'Throwforward risk',   value: `${portfolio.throwforwardRiskPct}%`, raw: portfolio.throwforwardRiskPct, color: '#dc2626', max: 100 },
              { label: 'Slow-moving',         value: `${portfolio.slowMovingPct}%`,       raw: portfolio.slowMovingPct,       color: '#ea580c', max: 100 },
              { label: 'Stalled/suspended',   value: portfolio.stalledCount,              raw: portfolio.stalledCount > 0 ? 100 : 0, color: '#9ca3af', max: 100 },
            ].map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{m.label}</span>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{m.value}</span>
                </div>
                <MiniBar value={m.raw} max={m.max} color={m.color} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Flexibility score</span>
            <span className="text-sm font-bold" style={{ color: flexibilityColor(portfolio.flexibilityScore) }}>
              {portfolio.flexibilityScore.toFixed(0)}/100
            </span>
            <div style={{ flex: 1 }}>
              <MiniBar value={portfolio.flexibilityScore} max={100} color={flexibilityColor(portfolio.flexibilityScore)} />
            </div>
          </div>
        </div>

        {/* Panel 4 — Per Capita Load */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <SectionHeader title="4 · Per Capita Load" sub="PKR/person, growth-adjusted · low → high" />
          {perCapitaLoad.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              No province data — run migration 0012.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {perCapitaLoad.map(r => (
                <div key={r.province} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 64px 52px', alignItems: 'center', gap: 8 }}>
                  <span className="text-xs" style={{ color: 'var(--color-text-primary)', fontWeight: r.rank === 1 ? 700 : 400 }}>
                    {r.province}
                  </span>
                  <MiniBar value={r.growthAdjustedPerCapita} max={maxPerCapita} color={r.rank <= 2 ? '#dc2626' : '#7c3aed'} />
                  <span className="text-[10px] text-right" style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    PKR {r.allocationPerCapita >= 1000
                      ? `${(r.allocationPerCapita / 1000).toFixed(1)}k`
                      : r.allocationPerCapita.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-right" style={{ color: r.vsMedianPct < -15 ? '#dc2626' : r.vsMedianPct > 15 ? '#16a34a' : 'var(--color-text-secondary)' }}>
                    {r.vsMedianPct >= 0 ? '+' : ''}{r.vsMedianPct.toFixed(0)}%
                  </span>
                </div>
              ))}
              <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                vs median · avg PKR {kpis.avgPerCapitaPkr >= 1000 ? `${(kpis.avgPerCapitaPkr / 1000).toFixed(1)}k` : kpis.avgPerCapitaPkr.toFixed(0)}/person
              </div>
            </div>
          )}
        </div>

        {/* Panel 5 — Action Signals (full width) */}
        <div style={{ gridColumn: '1 / -1', padding: '14px 18px' }}>
          <SectionHeader title="5 · Action Signals" sub="Province × sector gaps ranked by priority" />
          {actionSignals.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              No actionable gaps found with current data and threshold settings.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
              {actionSignals.map(signal => {
                const style = INTERVENTION_STYLE[signal.interventionType]
                return (
                  <button
                    key={`${signal.province}-${signal.sector}-${signal.priority}`}
                    onClick={() => handleSignalClick(signal)}
                    style={{
                      background: style.bg,
                      border: `1px solid ${style.color}33`,
                      borderRadius: 8,
                      padding: '10px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'opacity .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <span className="text-xs font-bold" style={{ color: style.color }}>#{signal.priority} {signal.province}</span>
                        <span className="text-xs ml-1" style={{ color: 'var(--color-text-secondary)' }}>· {signal.sector}</span>
                      </div>
                      <span style={{ background: style.color, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', marginLeft: 8 }}>
                        {style.label}
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {signal.rationale}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
