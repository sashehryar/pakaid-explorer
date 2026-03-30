import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { ComplianceItem } from '@/lib/types/database'
import { ComplianceTracker } from './compliance-tracker'

export const metadata: Metadata = { title: 'Compliance Tracker' }

export default async function CompliancePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('compliance_items')
    .select('*')
    .order('expiry_date', { ascending: true })

  const items: ComplianceItem[] = data ?? []

  const now = new Date()
  const in30  = new Date(now.getTime() + 30  * 86400000)
  const in60  = new Date(now.getTime() + 60  * 86400000)
  const in90  = new Date(now.getTime() + 90  * 86400000)

  const expired  = items.filter(i => i.expiry_date && new Date(i.expiry_date) < now).length
  const due30    = items.filter(i => i.expiry_date && new Date(i.expiry_date) >= now && new Date(i.expiry_date) <= in30).length
  const due60    = items.filter(i => i.expiry_date && new Date(i.expiry_date) > in30 && new Date(i.expiry_date) <= in60).length
  const due90    = items.filter(i => i.expiry_date && new Date(i.expiry_date) > in60 && new Date(i.expiry_date) <= in90).length

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Compliance Tracker</h1>
        <p className="text-sm text-ash mt-0.5">Accreditations · insurance · frameworks · registrations · renewal alerts</p>
      </div>

      {/* Alert summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Expired',       value: expired, color: expired > 0 ? 'text-danger' : 'text-pine', bg: expired > 0 ? 'border-danger/30 bg-danger/5' : '' },
          { label: 'Due in 30 days', value: due30,  color: due30 > 0 ? 'text-danger' : 'text-pine',   bg: due30 > 0 ? 'border-danger/30 bg-danger/5' : '' },
          { label: 'Due in 60 days', value: due60,  color: due60 > 0 ? 'text-amber-600' : 'text-pine', bg: '' },
          { label: 'Due in 90 days', value: due90,  color: 'text-pine',                                 bg: '' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border border-silver bg-card p-4 ${s.bg}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <ComplianceTracker items={items} />
    </div>
  )
}
