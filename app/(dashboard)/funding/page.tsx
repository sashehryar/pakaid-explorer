import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatUSD, daysUntil, expiryZone, formatDate } from '@/lib/utils'
import type { Project } from '@/lib/types/database'
import { Badge } from '@/components/ui/badge'
import { FundingFilters } from './filters'
import { ExpiryCard } from './expiry-card'

export const metadata: Metadata = { title: 'Funding Intelligence' }


const SOURCES = [
  { label: 'World Bank', color: 'bg-blue-100 text-blue-700' },
  { label: 'ADB', color: 'bg-orange-100 text-orange-700' },
  { label: 'FCDO', color: 'bg-purple-100 text-purple-700' },
  { label: 'GIZ', color: 'bg-green-100 text-green-700' },
  { label: 'EU', color: 'bg-yellow-100 text-yellow-700' },
  { label: 'USAID', color: 'bg-red-100 text-red-700' },
]

const ZONE_STYLES = {
  critical: 'border-l-4 border-l-red-400',
  watch:    'border-l-4 border-l-amber-400',
  active:   'border-l-4 border-l-fern',
  expired:  'border-l-4 border-l-silver opacity-60',
}

const ZONE_BADGE = {
  critical: <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">CRITICAL</span>,
  watch:    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">EXPIRING</span>,
  active:   null,
  expired:  <span className="text-[10px] font-bold text-ash bg-fog px-1.5 py-0.5 rounded">CLOSED</span>,
}

export default async function FundingPage() {

  const supabase = await createClient()

  const [projectsRes, statsRes] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .order('end_date', { ascending: true })
      .limit(50),
    supabase
      .from('projects')
      .select('amount_usd, status', { count: 'exact' }),
  ])

  const projects: Project[] = projectsRes.data ?? []

  // Compute stats
  const active = projects.filter(p => p.status === 'active')
  const expiring = projects.filter(p => {
    const days = daysUntil(p.end_date)
    return days !== null && days <= 90 && days >= 0
  })
  const critical = projects.filter(p => {
    const days = daysUntil(p.end_date)
    return days !== null && days <= 30 && days >= 0
  })
  const frozen = projects.filter(p => p.status === 'frozen')

  const totalActive = active.reduce((s, p) => s + (p.amount_usd ?? 0), 0)

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Funding Intelligence</h1>
        <p className="text-sm text-ash mt-0.5 flex items-center gap-2">
          <span className="live-dot" />
          Live feed · Active programmes + expiry tracker
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Programmes', value: active.length, sub: `${formatUSD(totalActive)} portfolio`, color: 'text-pine' },
          { label: 'Expiring (90 days)', value: expiring.length, sub: 'Closing soon', color: 'text-amber-600' },
          { label: 'Critical (<30 days)', value: critical.length, sub: 'Immediate action', color: 'text-red-600' },
          { label: 'Frozen / USAID', value: frozen.length, sub: 'Stop-work orders', color: 'text-ash' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink mt-0.5">{s.label}</div>
            <div className="text-xs text-ash">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Source pills */}
      <div className="flex flex-wrap gap-2">
        {SOURCES.map(s => (
          <span key={s.label} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
            {s.label}
          </span>
        ))}
      </div>

      {/* Feed */}
      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {projects.map(project => {
            const days = daysUntil(project.end_date)
            const zone = expiryZone(days)
            return (
              <div
                key={project.id}
                className={`rounded-xl border border-silver bg-card p-4 hover:shadow-sm transition-shadow ${ZONE_STYLES[zone]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-ash bg-fog px-2 py-0.5 rounded">{project.donor}</span>
                      {project.sector && (
                        <span className="text-xs text-ash">{project.sector}</span>
                      )}
                      {project.province && (
                        <span className="text-xs text-ash">· {project.province}</span>
                      )}
                      {ZONE_BADGE[zone]}
                      {project.status === 'frozen' && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">FROZEN</span>
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
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-silver bg-card p-12 text-center">
      <div className="text-4xl mb-3">📡</div>
      <p className="font-semibold text-ink">No projects yet</p>
      <p className="text-sm text-ash mt-1">Run the scrapers from Admin Panel to populate data</p>
    </div>
  )
}
