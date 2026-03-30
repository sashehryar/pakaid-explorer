'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import type { BidPipeline, BidTask, BidStage } from '@/lib/types/database'
import { createBid, updateBidStage, deleteBid, createTask, updateTaskStatus } from '@/app/actions/pipeline'
import { ChevronRight, Plus, Trash2, CheckSquare, Square, Calendar, DollarSign, AlertTriangle } from 'lucide-react'

type Stage = { key: string; label: string }

interface Props {
  bids: BidPipeline[]
  tasks: BidTask[]
  stages: readonly Stage[]
}

const PRIORITY_COLORS: Record<string, string> = {
  low:      'bg-blue-50 text-blue-600',
  medium:   'bg-amber-50 text-amber-700',
  high:     'bg-orange-50 text-orange-700',
  critical: 'bg-red-50 text-red-700',
}

function ProbabilityBar({ value }: { value: number | null }) {
  const p = value ?? 50
  const color = p >= 70 ? 'bg-fern' : p >= 40 ? 'bg-amber-400' : 'bg-danger'
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="flex-1 h-1 rounded-full bg-silver overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${p}%` }} />
      </div>
      <span className="text-[10px] font-medium text-ash">{p}%</span>
    </div>
  )
}

function BidCard({ bid, tasks, onStageChange, onDelete }: {
  bid: BidPipeline
  tasks: BidTask[]
  onStageChange: (id: string, stage: BidStage) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const bidTasks = tasks.filter(t => t.bid_id === bid.id)
  const openTasks = bidTasks.filter(t => t.status !== 'done').length

  const isOverdue = bid.deadline && new Date(bid.deadline) < new Date()
  const daysLeft = bid.deadline
    ? Math.ceil((new Date(bid.deadline).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className={cn(
      'rounded-lg border bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer',
      isOverdue ? 'border-danger/50' : 'border-silver'
    )}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-ink leading-tight flex-1">{bid.title}</p>
        <button
          onClick={e => { e.stopPropagation(); startTransition(() => onDelete(bid.id)) }}
          className="text-silver hover:text-danger shrink-0"
        >
          <Trash2 size={11} />
        </button>
      </div>

      <p className="text-[10px] text-ash mt-0.5">{bid.donor}</p>

      <ProbabilityBar value={bid.win_probability} />

      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <span className={cn('text-[9px] font-bold px-1 py-0.5 rounded uppercase', PRIORITY_COLORS[bid.priority])}>
          {bid.priority}
        </span>
        {bid.value_usd && (
          <span className="flex items-center gap-0.5 text-[10px] text-pine font-medium">
            <DollarSign size={9} />
            {bid.value_usd >= 1e6
              ? `${(bid.value_usd/1e6).toFixed(1)}M`
              : `${(bid.value_usd/1000).toFixed(0)}K`}
          </span>
        )}
        {daysLeft !== null && (
          <span className={cn('flex items-center gap-0.5 text-[10px]', isOverdue ? 'text-danger' : daysLeft <= 7 ? 'text-amber-600' : 'text-ash')}>
            <Calendar size={9} />
            {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
          </span>
        )}
        {openTasks > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-ash">
            <CheckSquare size={9} />
            {openTasks}
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-silver space-y-2" onClick={e => e.stopPropagation()}>
          {/* Tasks */}
          {bidTasks.length > 0 && (
            <div className="space-y-1">
              {bidTasks.map(t => (
                <div key={t.id} className="flex items-center gap-1.5">
                  <button
                    onClick={() => startTransition(() => updateTaskStatus(t.id, t.status === 'done' ? 'open' : 'done'))}
                    className="text-ash hover:text-pine"
                  >
                    {t.status === 'done' ? <CheckSquare size={11} className="text-fern" /> : <Square size={11} />}
                  </button>
                  <span className={cn('text-[10px]', t.status === 'done' ? 'line-through text-ash' : 'text-ink')}>
                    {t.title}
                  </span>
                  {t.assignee && <span className="text-[9px] text-ash ml-auto">@{t.assignee}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Move stage */}
          <div className="flex gap-1 flex-wrap">
            <span className="text-[9px] text-ash mr-1">Move:</span>
            {['teaming', 'writing', 'submitted', 'awarded', 'lost'].map(s => (
              <button
                key={s}
                disabled={bid.stage === s || isPending}
                onClick={() => startTransition(() => onStageChange(bid.id, s as BidStage))}
                className="text-[9px] px-1.5 py-0.5 rounded border border-silver hover:bg-fog disabled:opacity-40 capitalize"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function PipelineBoard({ bids, tasks, stages }: Props) {
  const [localBids, setLocalBids] = useState(bids)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingStage, setAddingStage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ title: '', donor: '', value_usd: '', deadline: '', win_probability: '50' })

  const activeStages = stages.filter(s => !['awarded', 'lost'].includes(s.key))
  const closedStages = stages.filter(s => ['awarded', 'lost'].includes(s.key))

  function handleStageChange(id: string, stage: BidStage) {
    setLocalBids(prev => prev.map(b => b.id === id ? { ...b, stage } : b))
    startTransition(async () => { await updateBidStage(id, stage) })
  }

  function handleDelete(id: string) {
    setLocalBids(prev => prev.filter(b => b.id !== id))
    startTransition(async () => { await deleteBid(id) })
  }

  async function handleAddBid(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.donor) return
    startTransition(async () => {
      await createBid({
        title: form.title,
        donor: form.donor,
        value_usd: form.value_usd ? Number(form.value_usd) : undefined,
        deadline: form.deadline || undefined,
        win_probability: Number(form.win_probability),
        stage: (addingStage ?? 'opportunity_id') as BidStage,
      })
      setForm({ title: '', donor: '', value_usd: '', deadline: '', win_probability: '50' })
      setShowAddForm(false)
      setAddingStage(null)
    })
  }

  return (
    <div className="space-y-4">
      {/* Add bid button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setShowAddForm(true); setAddingStage('opportunity_id') }}
          className="flex items-center gap-1.5 text-sm font-medium text-pine hover:text-forest px-3 py-1.5 rounded-lg border border-pine/30 hover:bg-pine/5 transition-colors"
        >
          <Plus size={14} /> Add Bid
        </button>
        {isPending && <span className="text-xs text-ash">Saving...</span>}
      </div>

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleAddBid} className="rounded-xl border border-silver bg-card p-4 space-y-3">
          <h3 className="text-sm font-bold text-ink">New Bid Opportunity</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ash">Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                placeholder="e.g. USAID WASH Evaluation"
                required
              />
            </div>
            <div>
              <label className="text-xs text-ash">Donor *</label>
              <input
                value={form.donor}
                onChange={e => setForm(f => ({ ...f, donor: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                placeholder="e.g. USAID"
                required
              />
            </div>
            <div>
              <label className="text-xs text-ash">Value (USD)</label>
              <input
                type="number"
                value={form.value_usd}
                onChange={e => setForm(f => ({ ...f, value_usd: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                placeholder="500000"
              />
            </div>
            <div>
              <label className="text-xs text-ash">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
              />
            </div>
            <div>
              <label className="text-xs text-ash">Win Probability: {form.win_probability}%</label>
              <input
                type="range" min="0" max="100" step="5"
                value={form.win_probability}
                onChange={e => setForm(f => ({ ...f, win_probability: e.target.value }))}
                className="mt-0.5 w-full accent-pine"
              />
            </div>
            <div>
              <label className="text-xs text-ash">Initial Stage</label>
              <select
                value={addingStage ?? 'opportunity_id'}
                onChange={e => setAddingStage(e.target.value)}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine bg-white"
              >
                {stages.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-1.5 bg-pine text-white text-sm font-medium rounded-lg hover:bg-forest transition-colors">
              Add to Pipeline
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-1.5 text-sm text-ash hover:text-ink">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Kanban — active stages */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: `${activeStages.length * 200}px` }}>
          {activeStages.map(stage => {
            const stageBids = localBids.filter(b => b.stage === stage.key)
            return (
              <div key={stage.key} className="w-48 shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ash">{stage.label}</span>
                  <span className="text-[10px] font-bold text-ash bg-fog rounded-full px-1.5 py-0.5">{stageBids.length}</span>
                </div>
                <div className="space-y-2 min-h-[80px]">
                  {stageBids.map(bid => (
                    <BidCard
                      key={bid.id}
                      bid={bid}
                      tasks={tasks}
                      onStageChange={handleStageChange}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Awarded / Lost */}
      <div className="grid grid-cols-2 gap-4">
        {closedStages.map(stage => {
          const stageBids = localBids.filter(b => b.stage === stage.key)
          return (
            <div key={stage.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  'text-xs font-bold uppercase tracking-wide',
                  stage.key === 'awarded' ? 'text-fern' : 'text-danger'
                )}>{stage.label}</span>
                <span className="text-[10px] text-ash">({stageBids.length})</span>
              </div>
              <div className="space-y-1.5">
                {stageBids.slice(0, 5).map(bid => (
                  <div key={bid.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-silver bg-card text-xs">
                    <div>
                      <span className="font-medium text-ink">{bid.title}</span>
                      <span className="text-ash ml-2">{bid.donor}</span>
                    </div>
                    {bid.value_usd && (
                      <span className={stage.key === 'awarded' ? 'text-fern font-semibold' : 'text-ash'}>
                        ${bid.value_usd >= 1e6 ? `${(bid.value_usd/1e6).toFixed(1)}M` : `${(bid.value_usd/1000).toFixed(0)}K`}
                      </span>
                    )}
                  </div>
                ))}
                {stageBids.length === 0 && (
                  <div className="text-xs text-ash px-3 py-2">None yet</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
