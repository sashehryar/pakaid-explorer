import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { ComplianceItem, RegulatoryEntry } from '@/lib/types/database'
import { ComplianceTracker } from './compliance-tracker'
import { RegulatoryAccordion } from '../../regulatory/regulatory-accordion'

export const metadata: Metadata = { title: 'Compliance' }

export default async function CompliancePage() {
  const supabase = await createClient()

  const [complianceRes, regulatoryRes] = await Promise.all([
    supabase
      .from('compliance_items')
      .select('*')
      .order('expiry_date', { ascending: true }),
    supabase
      .from('regulatory_entries')
      .select('*')
      .order('category')
      .order('complexity', { ascending: false }),
  ])

  const items: ComplianceItem[] = complianceRes.data ?? []
  const entries: RegulatoryEntry[] = regulatoryRes.data ?? []
  const categories = [...new Set(entries.map(e => e.category))]

  const now    = new Date()
  const in30   = new Date(now.getTime() + 30  * 86400000)
  const in60   = new Date(now.getTime() + 60  * 86400000)
  const in90   = new Date(now.getTime() + 90  * 86400000)

  const expired = items.filter(i => i.expiry_date && new Date(i.expiry_date) < now).length
  const due30   = items.filter(i => i.expiry_date && new Date(i.expiry_date) >= now && new Date(i.expiry_date) <= in30).length
  const due60   = items.filter(i => i.expiry_date && new Date(i.expiry_date) > in30 && new Date(i.expiry_date) <= in60).length
  const due90   = items.filter(i => i.expiry_date && new Date(i.expiry_date) > in60 && new Date(i.expiry_date) <= in90).length

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Compliance</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Registration, tax, eligibility rules, and regulatory guide for Pakistan
        </p>
      </div>

      {/* ── Tab switcher ─────────────────────────────────────────── */}
      <CompliancePageTabs
        items={items}
        entries={entries}
        categories={categories}
        expired={expired}
        due30={due30}
        due60={due60}
        due90={due90}
      />
    </div>
  )
}

// ── Client tab switcher ────────────────────────────────────────────────────────
import { ComplianceTabs } from './compliance-tabs'

function CompliancePageTabs({
  items, entries, categories, expired, due30, due60, due90,
}: {
  items: ComplianceItem[]
  entries: RegulatoryEntry[]
  categories: string[]
  expired: number
  due30: number
  due60: number
  due90: number
}) {
  return (
    <ComplianceTabs
      items={items}
      entries={entries}
      categories={categories}
      expired={expired}
      due30={due30}
      due60={due60}
      due90={due90}
    />
  )
}
