'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import type { ContractWin } from '@/lib/types/database'
import { createWin, deleteWin } from '@/app/actions/wins'
import { Plus, Trash2 } from 'lucide-react'

const ROLE_COLORS: Record<string, string> = {
  Prime:             'bg-fern/10 text-fern',
  Sub:               'bg-amber-50 text-amber-700',
  'Consortium Lead': 'bg-pine/10 text-pine',
}

export function WinsTable({ wins: initialWins }: { wins: ContractWin[] }) {
  const [wins, setWins] = useState(initialWins)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    title: '', donor: '', sector: '', value_usd: '',
    award_date: '', our_role: 'Prime', lessons_learned: '',
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await createWin({
        title: form.title,
        donor: form.donor,
        sector: form.sector || undefined,
        value_usd: form.value_usd ? Number(form.value_usd) : undefined,
        award_date: form.award_date || undefined,
        our_role: form.our_role || undefined,
        lessons_learned: form.lessons_learned || undefined,
      })
      setForm({ title: '', donor: '', sector: '', value_usd: '', award_date: '', our_role: 'Prime', lessons_learned: '' })
      setShowForm(false)
    })
  }

  function handleDelete(id: string) {
    setWins(prev => prev.filter(w => w.id !== id))
    startTransition(async () => { await deleteWin(id) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate uppercase tracking-wide">Contract Awards</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-pine hover:text-forest px-3 py-1.5 rounded-lg border border-pine/30 hover:bg-pine/5"
        >
          <Plus size={12} /> Log Win
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="rounded-xl border border-silver bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'title',     label: 'Contract Title *', placeholder: 'e.g. WASH Survey KP' },
              { key: 'donor',     label: 'Donor *',           placeholder: 'e.g. UNICEF' },
              { key: 'sector',    label: 'Sector',            placeholder: 'Health' },
              { key: 'value_usd', label: 'Value (USD)',        placeholder: '250000', type: 'number' },
              { key: 'award_date',label: 'Award Date',         type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-ash">{f.label}</label>
                <input
                  type={f.type ?? 'text'}
                  value={(form as Record<string, string>)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  required={f.label.endsWith('*')}
                  className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-ash">Our Role</label>
              <select
                value={form.our_role}
                onChange={e => setForm(f => ({ ...f, our_role: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-pine"
              >
                {['Prime', 'Sub', 'Consortium Lead'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-ash">Lessons Learned</label>
            <textarea
              value={form.lessons_learned}
              onChange={e => setForm(f => ({ ...f, lessons_learned: e.target.value }))}
              rows={2}
              className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine resize-none"
              placeholder="What worked? What would you do differently?"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-pine text-white text-sm font-medium rounded-lg hover:bg-forest disabled:opacity-60">
              Save Win
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 text-sm text-ash hover:text-ink">
              Cancel
            </button>
          </div>
        </form>
      )}

      {wins.length === 0 ? (
        <div className="rounded-xl border border-dashed border-silver bg-card p-8 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-sm text-ash">Log your first contract win to start tracking performance</p>
        </div>
      ) : (
        <div className="rounded-xl border border-silver bg-card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-silver bg-fog">
                <th className="px-3 py-2 text-left text-ash font-semibold">Contract</th>
                <th className="px-3 py-2 text-left text-ash font-semibold">Donor</th>
                <th className="px-3 py-2 text-left text-ash font-semibold">Sector</th>
                <th className="px-3 py-2 text-right text-ash font-semibold">Value</th>
                <th className="px-3 py-2 text-left text-ash font-semibold">Role</th>
                <th className="px-3 py-2 text-left text-ash font-semibold">Awarded</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-silver">
              {wins.map(w => (
                <tr key={w.id} className="hover:bg-fog/50">
                  <td className="px-3 py-2.5 font-medium text-ink max-w-[180px] truncate">{w.title}</td>
                  <td className="px-3 py-2.5 text-ash">{w.donor}</td>
                  <td className="px-3 py-2.5 text-ash">{w.sector ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-pine">
                    {w.value_usd
                      ? `$${w.value_usd >= 1e6 ? `${(w.value_usd/1e6).toFixed(1)}M` : `${(w.value_usd/1000).toFixed(0)}K`}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {w.our_role && (
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', ROLE_COLORS[w.our_role] ?? 'bg-fog text-ash')}>
                        {w.our_role}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-ash">
                    {w.award_date ? new Date(w.award_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="text-silver hover:text-danger"
                    >
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
