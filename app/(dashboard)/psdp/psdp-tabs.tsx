'use client'

import { useState } from 'react'
import type { PsdpItem } from '@/lib/types/database'

const RISK_STYLE = {
  low:    'bg-green-50 text-green-700',
  medium: 'bg-amber-50 text-amber-700',
  high:   'bg-red-50 text-red-700',
}

function ExecutionBar({ pct, target, risk }: { pct: number; target?: number | null; risk?: string | null }) {
  const color = risk === 'high' ? 'bg-danger' : risk === 'medium' ? 'bg-amber-400' : 'bg-fern'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-silver rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-bold w-8 ${color.replace('bg-', 'text-')}`}>{pct}%</span>
      {target && pct < target && (
        <span className="text-[10px] text-danger font-bold">{target - pct}pp behind</span>
      )}
    </div>
  )
}

export function PsdpTabs({ federal, provincial, ministries }: {
  federal: PsdpItem[]; provincial: PsdpItem[]; ministries: PsdpItem[]
}) {
  const [tab, setTab] = useState<'federal' | 'provincial' | 'ministries'>('federal')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-silver">
        {([['federal', 'Federal PSDP'], ['provincial', 'Provincial ADPs'], ['ministries', 'Ministry Tracker']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === id ? 'border-pine text-pine' : 'border-transparent text-ash hover:text-slate'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'federal' && (
        <div className="rounded-xl border border-silver bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-silver bg-fog">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Sector</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Allocation</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Spent</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash w-48">Execution</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver">
              {federal.map(item => (
                <tr key={item.id} className="hover:bg-fog/50">
                  <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                  <td className="px-4 py-3 text-ash">PKR {item.allocation_bn}B</td>
                  <td className="px-4 py-3 font-bold text-pine">PKR {item.spent_bn}B</td>
                  <td className="px-4 py-3"><ExecutionBar pct={item.execution_pct} risk={item.risk} /></td>
                  <td className="px-4 py-3 text-xs text-ash leading-relaxed max-w-xs">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'provincial' && (
        <div className="space-y-3">
          {provincial.map(item => (
            <div key={item.id} className="rounded-xl border border-silver bg-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-ink">{item.name}</div>
                  <div className="text-xs text-ash">{item.note}</div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black leading-none ${
                    item.execution_pct < 50 ? 'text-danger' : 'text-amber-600'
                  }`}>{item.execution_pct}%</div>
                  {item.target_pct && <div className="text-xs text-ash">of {item.target_pct}% target</div>}
                </div>
              </div>
              <ExecutionBar pct={item.execution_pct} target={item.target_pct} risk={item.risk} />
              <div className="flex gap-5 mt-3 text-xs">
                <div><span className="text-ash">ADP: </span><span className="font-bold">PKR {item.allocation_bn}B</span></div>
                <div><span className="text-ash">Spent: </span><span className="font-bold text-pine">PKR {item.spent_bn}B</span></div>
                <div><span className="text-ash">Remaining: </span><span className="font-bold text-amber-600">PKR {(item.allocation_bn - item.spent_bn).toFixed(0)}B</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'ministries' && (
        <div className="rounded-xl border border-silver bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-silver bg-fog">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Ministry / Agency</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Allocation</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Spent</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash w-40">Execution</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Key Project</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver">
              {ministries.map(item => (
                <tr key={item.id} className="hover:bg-fog/50">
                  <td className="px-4 py-3 font-medium text-ink text-xs">{item.name}</td>
                  <td className="px-4 py-3 text-ash text-xs">PKR {item.allocation_bn}B</td>
                  <td className="px-4 py-3 font-bold text-pine text-xs">PKR {item.spent_bn}B</td>
                  <td className="px-4 py-3"><ExecutionBar pct={item.execution_pct} risk={item.risk} /></td>
                  <td className="px-4 py-3 text-xs text-ash">{item.key_project}</td>
                  <td className="px-4 py-3">
                    {item.risk && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${RISK_STYLE[item.risk]}`}>
                        {item.risk === 'high' ? 'DELAYED' : item.risk === 'medium' ? 'AT RISK' : 'ON TRACK'}
                      </span>
                    )}
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
