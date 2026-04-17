'use client'

import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { useState } from 'react'

// jsDelivr CDN — PakData/GISData, all 8 provinces, property: NAME_1
const GEO_URL = 'https://cdn.jsdelivr.net/gh/PakData/GISData@master/PAK-GeoJSON/PAK_adm1.json'

const PROVINCE_NAME_MAP: Record<string, string> = {
  // Modern spellings
  'Punjab':                      'Punjab',
  'Sindh':                       'Sindh',
  'Khyber Pakhtunkhwa':          'KP',
  'Balochistan':                 'Balochistan',
  'Islamabad':                   'Federal',
  'Islamabad Capital Territory': 'Federal',
  'Azad Kashmir':                'AJK',
  'Azad Jammu and Kashmir':      'AJK',
  'Gilgit-Baltistan':            'GB',
  'Gilgit Baltistan':            'GB',
  // Legacy spellings used in PakData GeoJSON
  'N.W.F.P.':                    'KP',
  'Sind':                        'Sindh',
  'Baluchistan':                 'Balochistan',
  'F.C.T.':                      'Federal',
  'Northern Areas':              'GB',
  'F.A.T.A.':                    'KP',   // merged into KP in 2018
}

export interface PsdpProvinceRow {
  province: string
  scheme_count: number
  total_allocation_bn: number
  total_utilized_bn: number
  avg_execution_pct: number
  total_throwforward_bn: number
  slow_moving_count: number
  high_risk_count: number
  avg_opportunity_score: number
  avg_stress_score: number
}

type Metric = 'avg_execution_pct' | 'total_allocation_bn' | 'avg_opportunity_score' | 'avg_stress_score'

const METRIC_CONFIG: Record<Metric, { label: string; format: (v: number) => string; low: string; high: string }> = {
  avg_execution_pct:     { label: 'Execution %',         format: v => `${v.toFixed(0)}%`,        low: '#fee2e2', high: '#15803d' },
  total_allocation_bn:   { label: 'Allocation (PKR B)',  format: v => `PKR ${v.toFixed(1)}B`,    low: '#eff6ff', high: '#1d4ed8' },
  avg_opportunity_score: { label: 'Opportunity Score',   format: v => `${v.toFixed(0)}/100`,     low: '#faf5ff', high: '#7c3aed' },
  avg_stress_score:      { label: 'Execution Stress',    format: v => `${v.toFixed(0)}/100`,     low: '#fef3c7', high: '#b91c1c' },
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.max(0, Math.min(1, t)) }

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

/**
 * Maps value → colour using the *actual* data range [min, max] rather than
 * [0, max].  This prevents all provinces collapsing to the same shade when
 * values cluster (e.g. 35–45 % execution all rendering identically green).
 * A small padding (5 % of range) is applied so the lowest value is never
 * the bare low colour and the highest is never the bare high colour.
 */
function valueToColor(value: number, min: number, max: number, lowHex: string, highHex: string): string {
  const range = max - min
  if (range < 0.001) return lowHex
  const pad = range * 0.05
  const t   = (value - (min - pad)) / (range + 2 * pad)
  const tc  = Math.max(0, Math.min(1, t))
  const [lr, lg, lb] = hexToRgb(lowHex)
  const [hr, hg, hb] = hexToRgb(highHex)
  const r = Math.round(lerp(lr, hr, tc))
  const g = Math.round(lerp(lg, hg, tc))
  const b = Math.round(lerp(lb, hb, tc))
  return `rgb(${r},${g},${b})`
}

interface Props {
  provinces: PsdpProvinceRow[]
}

export function PsdpProvinceMap({ provinces }: Props) {
  const [metric, setMetric] = useState<Metric>('avg_execution_pct')
  const [hovered, setHovered] = useState<string | null>(null)

  const dataMap = Object.fromEntries(provinces.map(p => [p.province, p]))
  const config  = METRIC_CONFIG[metric]

  const values  = provinces.map(p => p[metric] as number).filter(v => v > 0)
  const minVal  = values.length ? Math.min(...values) : 0
  const maxVal  = values.length ? Math.max(...values) : 1

  const hoveredData = hovered ? dataMap[hovered] : null

  return (
    <div className="rounded-xl border p-4" style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Province PSDP Heatmap</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Hover a province to see details</p>
        </div>
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
          {(Object.keys(METRIC_CONFIG) as Metric[]).map(m => (
            <button key={m} onClick={() => setMetric(m)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: metric === m ? '#055C45' : '#fff',
                color:      metric === m ? '#fff'    : 'var(--color-text-secondary)',
              }}>
              {METRIC_CONFIG[m].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Map */}
        <div className="md:col-span-2">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [69, 30], scale: 1800 }}
            width={800}
            height={580}
            style={{ width: '100%', height: 'auto' }}
          >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const geoName: string = geo.properties?.NAME_1 ?? geo.properties?.name ?? ''
                    const provinceKey = PROVINCE_NAME_MAP[geoName] ?? geoName
                    const pd = dataMap[provinceKey]
                    const value = pd ? (pd[metric] as number) : 0
                    const fill = pd
                      ? valueToColor(value, minVal, maxVal, config.low, config.high)
                      : '#e5e7eb'

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke="#ffffff"
                        strokeWidth={1.2}
                        onMouseEnter={() => setHovered(provinceKey)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          default: { outline: 'none', cursor: 'pointer' },
                          hover:   { outline: 'none', opacity: 0.75 },
                          pressed: { outline: 'none' },
                        }}
                      />
                    )
                  })
                }
              </Geographies>
          </ComposableMap>

          {/* Gradient legend */}
          <div className="flex items-center gap-2 mt-1 px-2">
            <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>Low</span>
            <div className="flex-1 h-2 rounded-full"
              style={{ background: `linear-gradient(to right, ${config.low}, ${config.high})` }} />
            <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>High</span>
          </div>
        </div>

        {/* Province detail panel */}
        <div className="space-y-2">
          {hoveredData ? (
            <div className="rounded-lg p-3" style={{ background: 'var(--color-brand-100)' }}>
              <p className="text-sm font-bold mb-2" style={{ color: '#055C45' }}>{hoveredData.province}</p>
              {([
                ['Schemes',      hoveredData.scheme_count,                                          '#055C45'],
                ['Allocation',   `PKR ${hoveredData.total_allocation_bn?.toFixed(1) ?? '—'}B`,     '#1d4ed8'],
                ['Utilized',     `PKR ${hoveredData.total_utilized_bn?.toFixed(1)   ?? '—'}B`,     '#15803d'],
                ['Execution',    `${hoveredData.avg_execution_pct?.toFixed(0)       ?? '—'}%`,     hoveredData.avg_execution_pct < 50 ? '#dc2626' : '#15803d'],
                ['Throwforward', `PKR ${hoveredData.total_throwforward_bn?.toFixed(1) ?? '—'}B`,   '#b45309'],
                ['Slow-Moving',  hoveredData.slow_moving_count,                                    '#dc2626'],
                ['High Risk',    hoveredData.high_risk_count,                                      '#dc2626'],
                ['Opp. Score',   `${hoveredData.avg_opportunity_score?.toFixed(0) ?? '—'}/100`,   '#7c3aed'],
                ['Stress Score', `${hoveredData.avg_stress_score?.toFixed(0)      ?? '—'}/100`,   '#b91c1c'],
              ] as [string, string | number, string][]).map(([label, val, color]) => (
                <div key={label} className="flex justify-between text-xs py-1"
                  style={{ borderBottom: '1px solid rgba(5,92,69,0.1)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                  <span className="font-semibold" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {provinces.slice(0, 8).map(p => {
                const val   = p[metric] as number
                const pct   = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0
                return (
                  <div key={p.province} className="flex items-center gap-2 text-xs">
                    <div className="w-20 truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.province}</div>
                    <div className="flex-1 rounded-full h-1.5" style={{ background: '#e5e7eb' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: config.high }} />
                    </div>
                    <div className="w-14 text-right" style={{ color: 'var(--color-text-secondary)' }}>{config.format(val)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
