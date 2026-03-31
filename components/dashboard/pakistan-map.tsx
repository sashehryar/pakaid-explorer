'use client'

import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { useState } from 'react'
import { formatUSD } from '@/lib/utils'

// TopoJSON — place pakistan-provinces.json in /public/brand/
// Download from: https://github.com/datashades/pakistan-map or Natural Earth
const GEO_URL = '/brand/pakistan-provinces.json'

// Map TopoJSON province property names → DB province values
const PROVINCE_NAME_MAP: Record<string, string> = {
  'Punjab':              'Punjab',
  'Sindh':               'Sindh',
  'Khyber Pakhtunkhwa':  'KP',
  'Balochistan':         'Balochistan',
  'Islamabad':           'ICT',
  'Islamabad Capital Territory': 'ICT',
  'Azad Kashmir':        'AJK',
  'Azad Jammu and Kashmir': 'AJK',
  'Gilgit-Baltistan':    'GB',
  'Gilgit Baltistan':    'GB',
}

export interface ProvinceData {
  totalFunding: number
  projectCount: number
  donorCount: number
}

type Metric = 'totalFunding' | 'projectCount' | 'donorCount'

interface PakistanMapProps {
  data: Record<string, ProvinceData>
  metric?: Metric
}

const METRIC_CONFIG: Record<Metric, { label: string; format: (v: number) => string }> = {
  totalFunding: { label: 'Total Funding',   format: formatUSD },
  projectCount: { label: 'Active Projects', format: v => `${v} projects` },
  donorCount:   { label: 'Active Donors',   format: v => `${v} donors` },
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

function valueToColor(value: number, max: number): string {
  if (max === 0) return '#cbeadd'
  const t = value / max
  // Interpolate from brand-100 (#cbeadd) to brand-600 (#064c38)
  const r = Math.round(lerp(203, 6, t))
  const g = Math.round(lerp(234, 76, t))
  const b = Math.round(lerp(221, 56, t))
  return `rgb(${r},${g},${b})`
}

export function PakistanMap({ data, metric = 'totalFunding' }: PakistanMapProps) {
  const [tooltip, setTooltip] = useState<{ name: string; province: string } | null>(null)
  const config = METRIC_CONFIG[metric]

  const values = Object.values(data).map(d => d[metric])
  const maxValue = Math.max(...values, 1)

  return (
    <div
      className="card-default rounded-xl p-4"
      aria-label={`Map of Pakistan showing ${config.label} by province`}
    >
      <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Pakistan — {config.label}
      </p>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [69, 30], scale: 1400 }}
        style={{ width: '100%', height: 'auto' }}
        aria-hidden="true"
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const geoName: string = geo.properties?.NAME_1 ?? geo.properties?.name ?? ''
                const provinceKey = PROVINCE_NAME_MAP[geoName] ?? geoName
                const provinceData = data[provinceKey]
                const value = provinceData?.[metric] ?? 0
                const fill = valueToColor(value, maxValue)
                const label = `${geoName}: ${config.format(value)}${provinceData ? `, ${provinceData.projectCount} projects` : ''}`

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={0.8}
                    onMouseEnter={() => setTooltip({ name: geoName, province: provinceKey })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: { outline: 'none', cursor: 'pointer' },
                      hover:   { outline: 'none', opacity: 0.85 },
                      pressed: { outline: 'none' },
                    }}
                    aria-label={label}
                    role="img"
                    tabIndex={0}
                    onFocus={() => setTooltip({ name: geoName, province: provinceKey })}
                    onBlur={() => setTooltip(null)}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (() => {
        const pd = data[tooltip.province]
        return (
          <div
            className="mt-2 rounded-lg p-2 text-xs"
            style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-primary)' }}
          >
            <strong>{tooltip.name}</strong>
            {pd ? (
              <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>
                {config.format(pd[metric])} · {pd.projectCount} projects · {pd.donorCount} donors
              </span>
            ) : (
              <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>No active projects</span>
            )}
          </div>
        )
      })()}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-label" style={{ color: 'var(--color-text-secondary)' }}>Low</span>
        <div
          className="flex-1 h-2 rounded-full"
          style={{ background: 'linear-gradient(to right, #cbeadd, #064c38)' }}
          aria-hidden="true"
        />
        <span className="text-label" style={{ color: 'var(--color-text-secondary)' }}>High</span>
      </div>

      {/* Fallback message if no TopoJSON yet */}
      <p className="text-label mt-2" style={{ color: 'var(--color-text-secondary)' }}>
        Map requires <code>public/brand/pakistan-provinces.json</code> (TopoJSON).
      </p>

      {/* Screen reader summary */}
      <div className="sr-only" role="region" aria-label="Province data summary">
        {Object.entries(data).map(([province, pd]) => (
          <p key={province}>{province}: {config.format(pd[metric])}, {pd.projectCount} projects, {pd.donorCount} donors</p>
        ))}
      </div>
    </div>
  )
}
