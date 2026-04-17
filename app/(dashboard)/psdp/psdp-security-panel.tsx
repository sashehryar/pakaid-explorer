'use client'

import { useState } from 'react'
import {
  populationSecurityData,
  SECURITY_LEVEL_STYLE,
  type ProvinceSecurityData,
  type SecurityLevel,
} from '@/lib/psdp/security-data'

// ── Helpers ───────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.max(0, Math.min(1, t)) }
function hexToRgb(hex: string) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}
function blendColor(value: number, min: number, max: number, lo: string, hi: string) {
  const t = max > min ? (value - min) / (max - min) : 0
  const [lr,lg,lb] = hexToRgb(lo), [hr,hg,hb] = hexToRgb(hi)
  return `rgb(${Math.round(lerp(lr,hr,t))},${Math.round(lerp(lg,hg,t))},${Math.round(lerp(lb,hb,t))})`
}

function MiniSparkline({
  points, colorLo, colorHi, height = 28,
}: { points: { year: number; value: number }[]; colorLo: string; colorHi: string; height?: number }) {
  if (!points.length) return null
  const vals = points.map(p => p.value)
  const min = Math.min(...vals), max = Math.max(...vals)
  const w = 120, h = height
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w
    const y = max === min ? h / 2 : h - ((p.value - min) / (max - min)) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={colorHi} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

function DilutionBar({ province }: { province: ProvinceSecurityData }) {
  const curve    = province.dilution_curve
  const baseVal  = curve[0]?.per_capita_pkr  ?? 0
  const endVal   = curve[curve.length - 1]?.per_capita_pkr ?? 0
  const dropPct  = baseVal > 0 ? Math.round(((baseVal - endVal) / baseVal) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
          PKR {baseVal >= 1000 ? `${(baseVal/1000).toFixed(1)}k` : baseVal.toFixed(0)}/person now
        </span>
        <span className="text-[10px] font-semibold" style={{ color: dropPct > 15 ? '#dc2626' : '#ea580c' }}>
          −{dropPct}% by {curve[curve.length - 1]?.year}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${Math.max(5, 100 - dropPct)}%`,
          background: dropPct > 20 ? '#dc2626' : '#ea580c',
          transition: 'width 0.4s',
        }} />
      </div>
    </div>
  )
}

// ── Population pyramid mini-chart (age structure) ─────────────────────────────
function AgeStructureBadge({ pdata }: { pdata: ProvinceSecurityData }) {
  // Under-14 (approx from census), 15-29 (youth), 30-64, 65+
  // We compute from available data
  const u14     = 100 * (pdata.pop_2023_m * 0.37)  / pdata.pop_2023_m  // national ~37%
  const youth   = pdata.youth_15_29_pct
  const old     = 4.5   // national ~4.5% over 65
  const working = 100 - u14 - old

  const bars = [
    { label: '<14',   pct: Math.round(u14),    color: '#93c5fd' },
    { label: '15-29', pct: Math.round(youth),  color: '#f97316' },
    { label: '30-64', pct: Math.round(working - youth), color: '#86efac' },
    { label: '65+',   pct: Math.round(old),    color: '#d1d5db' },
  ]
  return (
    <div style={{ display: 'flex', gap: 2, height: 12, borderRadius: 3, overflow: 'hidden', width: '100%' }}>
      {bars.map(b => (
        <div key={b.label} title={`${b.label}: ~${b.pct}%`}
          style={{ flex: b.pct, background: b.color, minWidth: 2 }} />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const { provinces, national_summary, national_trends, security_scatter, meta } = populationSecurityData

const SCENARIO_COLORS = { high: '#dc2626', medium: '#7c3aed', low: '#16a34a' }
const HIGHLIGHT_PROVINCES = ['KP', 'Balochistan']  // highest security risk

export function PsdpSecurityPanel() {
  const [activeProvince, setActiveProvince] = useState<string | null>(null)
  const [scenario, setScenario] = useState<'high' | 'medium' | 'low'>('medium')

  const activeData = activeProvince
    ? provinces.find(p => p.province === activeProvince)
    : null

  const sortedByRisk = [...provinces].sort((a, b) => b.security.score - a.security.score)

  // For the national fertility trend sparkline
  const fertilityTrend = (national_trends.fertility_rate ?? [])
    .filter(p => p.year >= 1990)
    .sort((a, b) => a.year - b.year)

  const growthTrend = (national_trends.pop_growth_pct ?? [])
    .filter(p => p.year >= 1990)
    .sort((a, b) => a.year - b.year)

  const youthUnempTrend = (national_trends.youth_unemployment_pct ?? [])
    .filter(p => p.year >= 2000)
    .sort((a, b) => a.year - b.year)

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden', marginTop: 0 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--color-border)', background: '#1a0a00' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="text-sm font-bold" style={{ color: '#fff', margin: 0 }}>
              Population Security Intelligence
            </h3>
            <p className="text-xs mt-1" style={{ color: '#9ca3af', margin: 0, maxWidth: 560, lineHeight: 1.5 }}>
              2.55% annual growth outpaces GDP, erodes per-capita PSDP spend, and amplifies youth unemployment —
              highest risk in KP &amp; Balochistan where 60%+ of security incidents concentrate.
              Pakistan reaches <strong style={{ color: '#f97316' }}>{national_summary.pakistan_2050_medium_m.toFixed(0)}M by 2050</strong> on current trajectory.
            </p>
          </div>
          {/* National KPIs */}
          <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
            {[
              { label: 'Pop 2023',      value: `${national_summary.total_pop_2023_m.toFixed(0)}M` },
              { label: 'Growth rate',   value: `${national_summary.national_growth_rate_2023}%` },
              { label: 'Fertility TFR', value: national_summary.national_fertility_2023.toFixed(2) },
              { label: 'Youth unemp',   value: `${national_summary.national_youth_unemp_2023}%` },
              { label: 'Dependency',    value: `${national_summary.national_dependency_2023.toFixed(0)}%` },
            ].map(k => (
              <div key={k.label} style={{ textAlign: 'right' }}>
                <div className="text-base font-bold" style={{ color: '#f97316', lineHeight: 1 }}>{k.value}</div>
                <div className="text-[10px]" style={{ color: '#9ca3af' }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Section A: Security Risk Index ──────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-primary)', margin: '0 0 10px' }}>
            Security Risk Index — Youth Bulge × Growth × Instability
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {sortedByRisk.map(p => {
              const style = SECURITY_LEVEL_STYLE[p.security.level as SecurityLevel['level']]
              const isActive = activeProvince === p.province
              const isHighlight = HIGHLIGHT_PROVINCES.includes(p.province)
              return (
                <button
                  key={p.province}
                  onClick={() => setActiveProvince(isActive ? null : p.province)}
                  style={{
                    background: isActive ? style.bg : 'var(--color-surface-subtle)',
                    border: `1.5px solid ${isActive ? style.color : isHighlight ? style.border : 'var(--color-border)'}`,
                    borderRadius: 8, padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {p.province}
                    </span>
                    <span style={{
                      background: style.color, color: '#fff', fontSize: 9, fontWeight: 700,
                      padding: '2px 6px', borderRadius: 4,
                    }}>
                      {p.security.level}
                    </span>
                  </div>
                  {/* Risk score bar */}
                  <div style={{ height: 5, background: 'var(--color-border)', borderRadius: 3, marginBottom: 5 }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${p.security.score}%`,
                      background: blendColor(p.security.score, 20, 80, '#86efac', '#dc2626'),
                    }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                    {[
                      ['Risk score', `${p.security.score}/100`],
                      ['Growth',     `${p.growth_rate}%`],
                      ['Youth 15-29',`${p.youth_15_29_pct}%`],
                      ['Fertility',  p.fertility_rate.toFixed(1)],
                    ].map(([l,v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{l}</span>
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {/* Age structure strip */}
                  <div style={{ marginTop: 6 }}>
                    <AgeStructureBadge pdata={p} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      {['<14','15-29','30-64','65+'].map((l,i) => (
                        <span key={i} className="text-[9px]" style={{ color: 'var(--color-text-disabled)' }}>{l}</span>
                      ))}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Active province detail ────────────────────────────────────────── */}
        {activeData && (
          <div style={{ background: 'var(--color-surface-subtle)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {activeData.province} — Detailed Analysis
              </span>
              <button onClick={() => setActiveProvince(null)}
                style={{ fontSize: 11, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ✕ Close
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>
                  Population trajectory
                </p>
                {[
                  ['2017 Census', `${activeData.pop_2017_m.toFixed(1)}M`],
                  ['2023 Census', `${activeData.pop_2023_m.toFixed(1)}M`],
                  ['2030 (NIPS)',  `${activeData.pop_2030_m.toFixed(1)}M`],
                  ['2050 (medium)',`${activeData.pop_2050_m.toFixed(1)}M`],
                ].map(([l,v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{l}</span>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>
                  PSDP dilution (10-yr, flat alloc)
                </p>
                <DilutionBar province={activeData} />
                <p className="text-[10px] mt-2" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  At {activeData.growth_rate}% growth, the same PKR allocation reaches{' '}
                  <strong>{((1 + activeData.growth_rate / 100) ** 10 * 100 - 100).toFixed(0)}% more people</strong>{' '}
                  in 10 years — per-capita spend falls unless allocations scale.
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>
                  Security drivers
                </p>
                {[
                  ['Instability index', `${activeData.instability_index}/100`],
                  ['Dependency ratio',  `${activeData.dependency_ratio}%`],
                  ['Literacy',          `${activeData.literacy_pct}%`],
                  ['Youth of workforce',`${activeData.youth_of_working_pct}%`],
                ].map(([l,v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{l}</span>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>
                  2050 scenario — {activeData.province}
                </p>
                <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                  {(['high','medium','low'] as const).map(s => (
                    <button key={s} onClick={() => setScenario(s)}
                      style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
                        background: scenario === s ? SCENARIO_COLORS[s] : 'var(--color-surface-subtle)',
                        color: scenario === s ? '#fff' : 'var(--color-text-secondary)',
                        border: `1px solid ${SCENARIO_COLORS[s]}`,
                        fontWeight: scenario === s ? 700 : 400,
                      }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                {(() => {
                  const curve = activeData.projections[scenario]
                  const end   = curve[curve.length - 1]
                  const start = curve[0]
                  const growth = ((end.pop_m / start.pop_m) - 1) * 100
                  return (
                    <div>
                      <MiniSparkline
                        points={curve.map(p => ({ year: p.year, value: p.pop_m }))}
                        colorLo="#86efac" colorHi={SCENARIO_COLORS[scenario]}
                      />
                      <p className="text-[10px] mt-1" style={{ color: SCENARIO_COLORS[scenario], fontWeight: 600 }}>
                        {end.pop_m.toFixed(1)}M by 2050 (+{growth.toFixed(0)}%)
                      </p>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── Section B: National Trends ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { title: 'Fertility rate (TFR)', sub: 'Births per woman, 1990–2024', data: fertilityTrend, lo: '#86efac', hi: '#dc2626', goal: '2.1 replacement' },
            { title: 'Population growth %',  sub: 'Annual growth rate, 1990–2024', data: growthTrend,    lo: '#bfdbfe', hi: '#1d4ed8', goal: '1.5% current' },
            { title: 'Youth unemployment %', sub: 'Ages 15-24, 2000–2024',         data: youthUnempTrend, lo: '#fde68a', hi: '#b45309', goal: '26% 15-29 idle' },
          ].map(chart => (
            <div key={chart.title} style={{ background: 'var(--color-surface-subtle)', borderRadius: 8, padding: '10px 12px' }}>
              <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>{chart.title}</div>
              <div className="text-[10px] mb-2" style={{ color: 'var(--color-text-secondary)' }}>{chart.sub}</div>
              <MiniSparkline points={chart.data} colorLo={chart.lo} colorHi={chart.hi} height={36} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>
                  {chart.data[0]?.year} · {chart.data[0]?.value?.toFixed(2)}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: chart.hi }}>
                  {chart.data[chart.data.length - 1]?.year} · {chart.data[chart.data.length - 1]?.value?.toFixed(2)}
                </span>
              </div>
              <div className="text-[9px] mt-1" style={{ color: 'var(--color-text-disabled)' }}>Target: {chart.goal}</div>
            </div>
          ))}
        </div>

        {/* ── Section C: Per-capita PSDP spend vs security risk scatter ────── */}
        <div>
          <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
            PSDP Per-Capita vs Security Risk — the equity gap
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Province','Security Score','Risk Level','Growth %','Youth 15-29','PKR/person','10yr Dilution'].map(h => (
                    <th key={h} style={{ padding: '4px 8px', color: 'var(--color-text-secondary)', fontWeight: 500, textAlign: h === 'Province' ? 'left' : 'right', whiteSpace: 'nowrap', fontSize: 10 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {security_scatter
                  .filter(p => p.province !== 'Federal')   // Federal distorts per-capita (national alloc ÷ small pop)
                  .sort((a,b) => b.security_score - a.security_score)
                  .map(p => {
                    const style = SECURITY_LEVEL_STYLE[p.security_level as SecurityLevel['level']]
                    const pFull = provinces.find(x => x.province === p.province)
                    const dilutionPct = pFull ? (() => {
                      const c = pFull.dilution_curve
                      const start = c[0]?.per_capita_pkr ?? 0
                      const end   = c[c.length-1]?.per_capita_pkr ?? 0
                      return start > 0 ? Math.round(((start - end) / start) * 100) : 0
                    })() : 0
                    return (
                      <tr key={p.province}
                        style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                        onClick={() => setActiveProvince(p.province)}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.province}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <div style={{ width: 40, height: 4, background: 'var(--color-border)', borderRadius: 2 }}>
                              <div style={{ height: '100%', borderRadius: 2, width: `${p.security_score}%`, background: blendColor(p.security_score, 20, 80, '#86efac', '#dc2626') }} />
                            </div>
                            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{p.security_score}</span>
                          </div>
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                          <span style={{ background: style.color, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                            {p.security_level}
                          </span>
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: p.growth_rate > 3 ? '#dc2626' : 'var(--color-text-primary)' }}>
                          {p.growth_rate}%
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: p.youth_bulge_pct > 28 ? '#ea580c' : 'var(--color-text-primary)' }}>
                          {p.youth_bulge_pct}%
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: p.psdp_per_capita_pkr < 3000 ? '#dc2626' : '#16a34a' }}>
                          PKR {p.psdp_per_capita_pkr >= 1000 ? `${(p.psdp_per_capita_pkr/1000).toFixed(1)}k` : p.psdp_per_capita_pkr}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: dilutionPct > 20 ? '#dc2626' : 'var(--color-text-secondary)' }}>
                          −{dilutionPct}%
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          <p className="text-[9px] mt-2" style={{ color: 'var(--color-text-disabled)' }}>
            Sources: {meta.sources.join(' · ')} · Click row for detail
          </p>
        </div>

      </div>
    </div>
  )
}
