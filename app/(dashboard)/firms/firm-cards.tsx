'use client'

import { useState } from 'react'
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ConsultingFirm } from '@/lib/types/database'

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'Growing')     return <TrendingUp size={13} className="text-fern" />
  if (trend === 'Contracting') return <TrendingDown size={13} className="text-danger" />
  return <Minus size={13} className="text-amber-500" />
}

export function FirmCards({ firms }: { firms: ConsultingFirm[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {firms.map(f => {
        const isOpen = expandedId === f.id
        return (
          <div key={f.id} className="rounded-xl border border-silver bg-card overflow-hidden">
            <button
              onClick={() => setExpandedId(isOpen ? null : f.id)}
              className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-fog/50 transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-lg bg-pine flex items-center justify-center text-white font-black shrink-0">
                {f.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-ink">{f.name}</div>
                <div className="text-xs text-ash truncate">{f.hiring_status}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${
                  f.trend === 'Growing' ? 'bg-green-50 text-green-700' :
                  f.trend === 'Contracting' ? 'bg-red-50 text-red-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  <TrendIcon trend={f.trend} />{f.trend}
                </span>
                <ChevronDown size={15} className={`text-ash transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-silver px-5 py-4 grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-bold text-ash uppercase tracking-wide mb-1.5">Intelligence Note</p>
                  <p className="text-sm text-ink leading-relaxed">{f.editorial_note}</p>
                  {f.revenue_signal && (
                    <>
                      <p className="text-xs font-bold text-ash uppercase tracking-wide mt-3 mb-1">Revenue Signal</p>
                      <p className="text-sm text-slate leading-relaxed">{f.revenue_signal}</p>
                    </>
                  )}
                  <div className="flex gap-5 mt-3 text-xs">
                    <div><span className="text-ash">Headcount: </span><span className="font-medium">{f.headcount ?? '—'}</span></div>
                    <div><span className="text-ash">Contracts: </span><span className="font-bold text-pine">{f.active_contracts}</span></div>
                  </div>
                </div>
                <div>
                  {f.key_programmes && f.key_programmes.length > 0 && (
                    <>
                      <p className="text-xs font-bold text-ash uppercase tracking-wide mb-1.5">Key Programmes</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {f.key_programmes.map(p => (
                          <span key={p} className="text-[11px] bg-mist text-pine px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    </>
                  )}
                  {f.opportunity_note && (
                    <div className="rounded-lg bg-mist border-l-2 border-fern pl-3 py-2 pr-2">
                      <p className="text-xs font-bold text-fern mb-0.5">OPPORTUNITY</p>
                      <p className="text-xs text-slate leading-relaxed">{f.opportunity_note}</p>
                    </div>
                  )}
                  {f.risk_note && (
                    <div className="rounded-lg bg-red-50 border-l-2 border-danger pl-3 py-2 pr-2 mt-2">
                      <p className="text-xs font-bold text-danger mb-0.5">RISK FLAG</p>
                      <p className="text-xs text-slate leading-relaxed">{f.risk_note}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
