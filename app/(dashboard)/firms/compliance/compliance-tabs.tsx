'use client'

import { useState } from 'react'
import type { ComplianceItem, RegulatoryEntry } from '@/lib/types/database'
import { ComplianceTracker } from './compliance-tracker'
import { RegulatoryAccordion } from '../../regulatory/regulatory-accordion'

interface Props {
  items: ComplianceItem[]
  entries: RegulatoryEntry[]
  categories: string[]
  expired: number
  due30: number
  due60: number
  due90: number
}

export function ComplianceTabs({ items, entries, categories, expired, due30, due60, due90 }: Props) {
  const [tab, setTab] = useState<'firm' | 'guide'>('firm')

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex gap-1 border-b mb-6"
        role="tablist"
        aria-label="Compliance sections"
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        {[
          { key: 'firm',  label: 'Firm Compliance' },
          { key: 'guide', label: 'Regulatory Guide' },
        ].map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key as 'firm' | 'guide')}
            className={`subnav-tab${tab === t.key ? ' active' : ''}`}
            style={{ borderRadius: '0', borderBottom: tab === t.key ? '2px solid var(--color-brand-500)' : '2px solid transparent' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Firm Compliance tab */}
      {tab === 'firm' && (
        <div className="space-y-6">
          {/* Alert summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Expired',        value: expired, urgent: expired > 0 },
              { label: 'Due in 30 days', value: due30,   urgent: due30 > 0 },
              { label: 'Due in 60 days', value: due60,   urgent: false },
              { label: 'Due in 90 days', value: due90,   urgent: false },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-xl p-4 card-default"
                style={s.urgent ? { borderColor: 'var(--color-danger-border)', background: 'var(--color-danger-bg)' } : {}}
              >
                <div
                  className="text-2xl font-bold"
                  style={{ color: s.urgent ? 'var(--color-danger)' : 'var(--color-brand-500)' }}
                >
                  {s.value}
                </div>
                <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <ComplianceTracker items={items} />
        </div>
      )}

      {/* Regulatory Guide tab */}
      {tab === 'guide' && (
        <div className="space-y-6">
          {/* Disclaimer */}
          <div
            className="rounded-xl p-3 flex gap-2.5"
            style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)' }}
          >
            <span style={{ color: 'var(--color-warning-600)' }} className="shrink-0">⚠</span>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-warning-600)' }}>
              <strong>Editorial guidance only.</strong> This reflects editorial research as of March 2026 and does not
              constitute legal advice. Always verify with your legal counsel, EAD, FBR, or PPRA.
              Pakistan&apos;s regulatory environment changes frequently.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Entries',          value: entries.length },
              { label: 'High Complexity',  value: entries.filter(e => e.complexity === 'High').length },
              { label: 'Categories',       value: categories.length },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4 card-default">
                <div className="text-2xl font-bold" style={{ color: 'var(--color-brand-500)' }}>{s.value}</div>
                <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center card-default">
              <div className="text-4xl mb-3">⚖️</div>
              <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>No regulatory entries yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Apply the seed SQL to populate the regulatory guide</p>
            </div>
          ) : (
            <RegulatoryAccordion entries={entries} categories={categories} />
          )}
        </div>
      )}
    </div>
  )
}
