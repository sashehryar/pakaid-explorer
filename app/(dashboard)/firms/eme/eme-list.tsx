'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import type { EmeItem, EmeType } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

const TYPE_COLORS: Record<string, string> = {
  rfi:          'bg-amber-50 text-amber-700',
  framework:    'bg-blue-50 text-blue-700',
  forecast:     'bg-purple-50 text-purple-700',
  relationship: 'bg-fern/10 text-fern',
  meeting:      'bg-fog text-ash',
}

interface Props {
  items: EmeItem[]
  typeLabels: Record<string, string>
}

export function EmeList({ items: initialItems, typeLabels }: Props) {
  const [items, setItems] = useState(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    title: '', type: 'rfi' as EmeType, donor: '', sector: '',
    value_usd: '', expected_date: '', contact_name: '', contact_role: '',
    notes: '', next_step: '',
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase.from('eme_items').insert({
        user_id: user.id,
        title: form.title,
        type: form.type,
        donor: form.donor || null,
        sector: form.sector || null,
        value_usd: form.value_usd ? Number(form.value_usd) : null,
        expected_date: form.expected_date || null,
        contact_name: form.contact_name || null,
        contact_role: form.contact_role || null,
        notes: form.notes || null,
        next_step: form.next_step || null,
      }).select().single()
      if (!error && data) {
        setItems(prev => [data as EmeItem, ...prev])
        setForm({ title: '', type: 'rfi', donor: '', sector: '', value_usd: '', expected_date: '', contact_name: '', contact_role: '', notes: '', next_step: '' })
        setShowForm(false)
      }
    })
  }

  async function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('eme_items').delete().eq('id', id)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate uppercase tracking-wide">Engagement Log</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-pine hover:text-forest px-3 py-1.5 rounded-lg border border-pine/30 hover:bg-pine/5"
        >
          <Plus size={12} /> Add Item
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="rounded-xl border border-silver bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-ash">Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                placeholder="e.g. FCDO New Program — RFI Response"
              />
            </div>
            <div>
              <label className="text-xs text-ash">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as EmeType }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-pine"
              >
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-ash">Donor</label>
              <input
                value={form.donor}
                onChange={e => setForm(f => ({ ...f, donor: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                placeholder="e.g. FCDO"
              />
            </div>
            <div>
              <label className="text-xs text-ash">Estimated Value (USD)</label>
              <input
                type="number"
                value={form.value_usd}
                onChange={e => setForm(f => ({ ...f, value_usd: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                placeholder="1000000"
              />
            </div>
            <div>
              <label className="text-xs text-ash">Expected Date</label>
              <input
                type="date"
                value={form.expected_date}
                onChange={e => setForm(f => ({ ...f, expected_date: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
              />
            </div>
            <div>
              <label className="text-xs text-ash">Contact Name</label>
              <input
                value={form.contact_name}
                onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="text-xs text-ash">Contact Role</label>
              <input
                value={form.contact_role}
                onChange={e => setForm(f => ({ ...f, contact_role: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                placeholder="Programme Manager"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-ash">Next Step</label>
              <input
                value={form.next_step}
                onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                placeholder="Send capability statement by April 5"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-pine text-white text-sm font-medium rounded-lg hover:bg-forest disabled:opacity-60">
              Save
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 text-sm text-ash hover:text-ink">
              Cancel
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-silver bg-card p-8 text-center">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-sm text-ash">Log RFIs, framework bids, and early conversations to build your pipeline</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const isExpanded = expanded === item.id
            const daysLeft = item.expected_date
              ? Math.ceil((new Date(item.expected_date).getTime() - Date.now()) / 86400000)
              : null
            return (
              <div key={item.id} className="rounded-xl border border-silver bg-card overflow-hidden">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-fog/50"
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                >
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0', TYPE_COLORS[item.type])}>
                    {typeLabels[item.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-ink truncate block">{item.title}</span>
                    <div className="flex items-center gap-2 text-xs text-ash mt-0.5 flex-wrap">
                      {item.donor && <span>{item.donor}</span>}
                      {item.sector && <span>· {item.sector}</span>}
                      {item.value_usd && (
                        <span className="text-pine font-medium">
                          · ${item.value_usd >= 1e6 ? `${(item.value_usd/1e6).toFixed(1)}M` : `${(item.value_usd/1000).toFixed(0)}K`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {daysLeft !== null && (
                      <span className={cn('text-[10px]', daysLeft < 0 ? 'text-danger' : daysLeft <= 14 ? 'text-amber-600' : 'text-ash')}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `in ${daysLeft}d`}
                      </span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                      className="text-silver hover:text-danger"
                    >
                      <Trash2 size={11} />
                    </button>
                    {isExpanded ? <ChevronUp size={13} className="text-ash" /> : <ChevronDown size={13} className="text-ash" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-silver space-y-2 text-xs">
                    {item.contact_name && (
                      <p><span className="text-ash">Contact: </span>
                        <span className="font-medium text-ink">{item.contact_name}</span>
                        {item.contact_role && <span className="text-ash"> · {item.contact_role}</span>}
                      </p>
                    )}
                    {item.next_step && (
                      <div className="rounded-lg bg-pine/5 border border-pine/20 px-3 py-2">
                        <span className="text-pine font-semibold">Next Step: </span>
                        <span className="text-ink">{item.next_step}</span>
                      </div>
                    )}
                    {item.notes && <p className="text-ash">{item.notes}</p>}
                    {item.source_url && (
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-pine hover:underline">
                        <ExternalLink size={10} /> Source
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
