'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import type { ComplianceItem, ComplianceCategory } from '@/lib/types/database'
import { createComplianceItem, deleteComplianceItem } from '@/app/actions/compliance'
import { Plus, Trash2, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react'

const CATEGORY_LABELS: Record<ComplianceCategory, string> = {
  accreditation: 'Accreditation',
  insurance:     'Insurance',
  framework:     'Framework',
  registration:  'Registration',
  certification: 'Certification',
  tax:           'Tax',
  legal:         'Legal',
  other:         'Other',
}

const CATEGORY_COLORS: Record<ComplianceCategory, string> = {
  accreditation: 'bg-blue-50 text-blue-700',
  insurance:     'bg-green-50 text-green-700',
  framework:     'bg-purple-50 text-purple-700',
  registration:  'bg-amber-50 text-amber-700',
  certification: 'bg-sky-50 text-sky-700',
  tax:           'bg-red-50 text-red-700',
  legal:         'bg-orange-50 text-orange-700',
  other:         'bg-fog text-ash',
}

function StatusIcon({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return <CheckCircle size={14} className="text-ash" />
  const now = new Date()
  const expiry = new Date(expiryDate)
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86400000)
  if (daysLeft < 0)  return <AlertTriangle size={14} className="text-danger" />
  if (daysLeft <= 30) return <AlertTriangle size={14} className="text-danger" />
  if (daysLeft <= 60) return <Clock size={14} className="text-amber-500" />
  if (daysLeft <= 90) return <Clock size={14} className="text-amber-400" />
  return <CheckCircle size={14} className="text-fern" />
}

function DaysLabel({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return <span className="text-ash">No expiry</span>
  const now = new Date()
  const expiry = new Date(expiryDate)
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86400000)
  if (daysLeft < 0) return <span className="text-danger font-semibold">{Math.abs(daysLeft)}d overdue</span>
  if (daysLeft === 0) return <span className="text-danger font-semibold">Expires today</span>
  if (daysLeft <= 30) return <span className="text-danger font-semibold">{daysLeft}d left</span>
  if (daysLeft <= 90) return <span className="text-amber-600 font-medium">{daysLeft}d left</span>
  return <span className="text-ash">{expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
}

export function ComplianceTracker({ items: initialItems }: { items: ComplianceItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState<ComplianceCategory | 'all'>('all')
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    title: '', category: 'accreditation' as ComplianceCategory,
    authority: '', reference: '', issued_date: '', expiry_date: '', renewal_url: '', notes: '',
  })

  const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createComplianceItem({
        title: form.title,
        category: form.category,
        authority: form.authority || undefined,
        reference: form.reference || undefined,
        issued_date: form.issued_date || undefined,
        expiry_date: form.expiry_date || undefined,
        renewal_url: form.renewal_url || undefined,
        notes: form.notes || undefined,
      })
      if (result.ok) {
        setForm({ title: '', category: 'accreditation', authority: '', reference: '', issued_date: '', expiry_date: '', renewal_url: '', notes: '' })
        setShowForm(false)
      }
    })
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    startTransition(async () => { await deleteComplianceItem(id) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterCat('all')}
            className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors',
              filterCat === 'all' ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}
          >
            All ({items.length})
          </button>
          {(Object.keys(CATEGORY_LABELS) as ComplianceCategory[]).map(cat => {
            const count = items.filter(i => i.category === cat).length
            if (count === 0) return null
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors',
                  filterCat === cat ? 'bg-pine text-white border-pine' : 'border-silver text-ash hover:bg-fog')}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            )
          })}
        </div>

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
                placeholder="e.g. PPRA Vendor Registration"
              />
            </div>
            <div>
              <label className="text-xs text-ash">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as ComplianceCategory }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-pine"
              >
                {(Object.entries(CATEGORY_LABELS) as [ComplianceCategory, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-ash">Issuing Authority</label>
              <input
                value={form.authority}
                onChange={e => setForm(f => ({ ...f, authority: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                placeholder="e.g. PPRA"
              />
            </div>
            <div>
              <label className="text-xs text-ash">Reference / Certificate No.</label>
              <input
                value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                placeholder="PKR-2024-1234"
              />
            </div>
            <div>
              <label className="text-xs text-ash">Issue Date</label>
              <input
                type="date"
                value={form.issued_date}
                onChange={e => setForm(f => ({ ...f, issued_date: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
              />
            </div>
            <div>
              <label className="text-xs text-ash">Expiry Date</label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-ash">Renewal URL</label>
              <input
                value={form.renewal_url}
                onChange={e => setForm(f => ({ ...f, renewal_url: e.target.value }))}
                className="mt-0.5 w-full rounded border border-silver px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
                placeholder="https://..."
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

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-silver bg-card p-8 text-center">
          <div className="text-3xl mb-2">📄</div>
          <p className="text-sm text-ash">Add accreditations, insurance policies, and registrations to track renewal dates</p>
        </div>
      ) : (
        <div className="rounded-xl border border-silver bg-card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-silver bg-fog">
                <th className="px-3 py-2 text-left text-ash font-semibold w-4" />
                <th className="px-3 py-2 text-left text-ash font-semibold">Item</th>
                <th className="px-3 py-2 text-left text-ash font-semibold">Category</th>
                <th className="px-3 py-2 text-left text-ash font-semibold">Authority</th>
                <th className="px-3 py-2 text-left text-ash font-semibold">Reference</th>
                <th className="px-3 py-2 text-left text-ash font-semibold">Expiry</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-silver">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-fog/50">
                  <td className="px-3 py-2.5">
                    <StatusIcon expiryDate={item.expiry_date} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-ink">{item.title}</div>
                    {item.notes && <div className="text-ash text-[10px] mt-0.5 truncate max-w-[200px]">{item.notes}</div>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', CATEGORY_COLORS[item.category])}>
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-ash">{item.authority ?? '—'}</td>
                  <td className="px-3 py-2.5 text-ash font-mono text-[10px]">{item.reference ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <DaysLabel expiryDate={item.expiry_date} />
                      {item.renewal_url && (
                        <a href={item.renewal_url} target="_blank" rel="noopener noreferrer" className="text-pine hover:text-forest">
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => handleDelete(item.id)} className="text-silver hover:text-danger">
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
