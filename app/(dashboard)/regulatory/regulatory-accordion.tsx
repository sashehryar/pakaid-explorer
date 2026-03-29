'use client'

import { useState } from 'react'
import { ChevronDown, Shield, Clock } from 'lucide-react'
import type { RegulatoryEntry } from '@/lib/types/database'

const COMPLEXITY_STYLES = {
  Low:    'bg-green-50 text-green-700',
  Medium: 'bg-amber-50 text-amber-700',
  High:   'bg-red-50 text-red-700',
}

export function RegulatoryAccordion({ entries, categories }: { entries: RegulatoryEntry[]; categories: string[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(entries[0]?.id ?? null)
  const [catFilter, setCatFilter] = useState<string>('All')

  const filtered = catFilter === 'All' ? entries : entries.filter(e => e.category === catFilter)

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {['All', ...categories].map(c => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              catFilter === c ? 'bg-pine text-white' : 'bg-fog text-ash hover:bg-silver'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Accordion */}
      <div className="space-y-1.5">
        {filtered.map(entry => {
          const isOpen = expandedId === entry.id
          return (
            <div key={entry.id} className="rounded-xl border border-silver bg-card overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-fog/50 transition-colors text-left"
              >
                <Shield size={14} className="text-pine shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-ink leading-snug">{entry.title}</div>
                  <div className="text-xs text-ash mt-0.5">{entry.category} · {entry.authority}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${COMPLEXITY_STYLES[entry.complexity as keyof typeof COMPLEXITY_STYLES]}`}>
                    {entry.complexity}
                  </span>
                  {entry.last_updated && (
                    <span className="flex items-center gap-1 text-[10px] text-ash">
                      <Clock size={10} />{entry.last_updated}
                    </span>
                  )}
                  <ChevronDown size={14} className={`text-ash transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-silver px-4 py-4">
                  <p className="text-sm text-ink leading-relaxed mb-3">{entry.body}</p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-fog text-ash px-2 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
