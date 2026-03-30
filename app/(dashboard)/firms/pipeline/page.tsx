import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { BidPipeline, BidTask } from '@/lib/types/database'
import { PipelineBoard } from './pipeline-board'

export const metadata: Metadata = { title: 'Bid Pipeline' }

const STAGES = [
  { key: 'opportunity_id', label: 'Opportunity ID' },
  { key: 'go_no_go',       label: 'Go / No-Go' },
  { key: 'teaming',        label: 'Teaming' },
  { key: 'writing',        label: 'Writing' },
  { key: 'review',         label: 'Review' },
  { key: 'submitted',      label: 'Submitted' },
  { key: 'awarded',        label: 'Awarded' },
  { key: 'lost',           label: 'Lost' },
] as const

export default async function PipelinePage() {
  const supabase = await createClient()

  const [bidsRes, tasksRes] = await Promise.all([
    supabase
      .from('bid_pipeline')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('bid_tasks')
      .select('*')
      .order('due_date', { ascending: true }),
  ])

  const bids: BidPipeline[] = bidsRes.data ?? []
  const tasks: BidTask[] = tasksRes.data ?? []

  // Pipeline stats
  const activeBids    = bids.filter(b => !['awarded', 'lost'].includes(b.stage))
  const totalValue    = activeBids.reduce((s, b) => s + (b.value_usd ?? 0), 0)
  const weightedValue = activeBids.reduce((s, b) => s + (b.value_usd ?? 0) * ((b.win_probability ?? 50) / 100), 0)
  const dueThisWeek   = activeBids.filter(b => {
    if (!b.deadline) return false
    const d = new Date(b.deadline)
    const now = new Date()
    const diff = (d.getTime() - now.getTime()) / 86400000
    return diff >= 0 && diff <= 7
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Bid Pipeline</h1>
        <p className="text-sm text-ash mt-0.5">Track every bid from identification to award</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Bids',       value: activeBids.length,                         color: 'text-pine' },
          { label: 'Pipeline Value',    value: totalValue ? `$${(totalValue/1e6).toFixed(1)}M` : '—', color: 'text-pine' },
          { label: 'Weighted Value',    value: weightedValue ? `$${(weightedValue/1e6).toFixed(1)}M` : '—', color: 'text-amber-600' },
          { label: 'Due This Week',     value: dueThisWeek,                                color: dueThisWeek > 0 ? 'text-danger' : 'text-pine' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <PipelineBoard bids={bids} tasks={tasks} stages={STAGES} />
    </div>
  )
}
