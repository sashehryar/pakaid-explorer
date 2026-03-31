'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { formatUSD } from '@/lib/utils'

interface ChartItem {
  name: string
  value: number
}

interface HomeChartProps {
  data: ChartItem[]
  title: string
  valueFormatter?: (v: number) => string
}

const SERIES_COLORS = [
  '#0b7a59', '#2563eb', '#ea580c', '#7c3aed',
  '#16a34a', '#e11d48', '#0891b2', '#f97316',
]

export function HomeChart({ data, title, valueFormatter = formatUSD }: HomeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="card-default rounded-xl p-4 flex items-center justify-center"
        style={{ minHeight: '200px' }}
        aria-label={title}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No data available</p>
      </div>
    )
  }

  return (
    <figure
      className="card-default rounded-xl p-4"
      aria-label={title}
    >
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={48}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => formatUSD(v)}
            width={60}
          />
          <Tooltip
            formatter={(value) => [valueFormatter(Number(value ?? 0)), 'Amount']}
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--color-text-primary)',
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={SERIES_COLORS[idx % SERIES_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Screen reader fallback */}
      <figcaption className="sr-only">
        {title}: {data.map(d => `${d.name} ${valueFormatter(d.value)}`).join(', ')}
      </figcaption>
    </figure>
  )
}
