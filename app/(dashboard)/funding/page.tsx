import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatUSD, daysUntil } from '@/lib/utils'
import type { Project } from '@/lib/types/database'
import { FundingFeed } from './funding-feed'

export const metadata: Metadata = { title: 'Track Funding' }



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
        <h1 className="text-xl font-bold text-ink">Track Funding</h1>
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

      <FundingFeed projects={projects} />
    </div>
  )
}
