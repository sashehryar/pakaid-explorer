import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { ContractWin } from '@/lib/types/database'
import { WinsTable } from './wins-table'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Win Tracker' }

export default async function WinsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('contract_wins')
    .select('*')
    .order('award_date', { ascending: false })

  const wins: ContractWin[] = data ?? []

  const totalValue   = wins.reduce((s, w) => s + (w.value_usd ?? 0), 0)
  const primeCount   = wins.filter(w => w.our_role === 'Prime').length
  const subCount     = wins.filter(w => w.our_role === 'Sub').length

  // Sector breakdown
  const sectorMap: Record<string, number> = {}
  wins.forEach(w => {
    if (w.sector) sectorMap[w.sector] = (sectorMap[w.sector] ?? 0) + (w.value_usd ?? 0)
  })
  const topSectors = Object.entries(sectorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Win Tracker</h1>
        <p className="text-sm text-ash mt-0.5">Contract awards log · performance analytics · lessons learned</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Wins',    value: wins.length,                                                    color: 'text-pine' },
          { label: 'Total Value',   value: totalValue ? `$${(totalValue/1e6).toFixed(1)}M` : '—',          color: 'text-pine' },
          { label: 'As Prime',      value: primeCount,                                                     color: 'text-fern' },
          { label: 'As Sub',        value: subCount,                                                       color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Wins Table */}
        <div className="lg:col-span-3">
          <WinsTable wins={wins} />
        </div>

        {/* Sector breakdown */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate uppercase tracking-wide mb-3">Top Sectors by Value</h2>
            {topSectors.length === 0 ? (
              <p className="text-xs text-ash">No data yet</p>
            ) : (
              <div className="space-y-2">
                {topSectors.map(([sector, value]) => {
                  const pct = totalValue > 0 ? (value / totalValue) * 100 : 0
                  return (
                    <div key={sector}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="font-medium text-ink">{sector}</span>
                        <span className="text-ash">${(value/1e6).toFixed(1)}M</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-silver overflow-hidden">
                        <div className="h-full bg-pine rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Donor breakdown */}
          <div>
            <h2 className="text-sm font-bold text-slate uppercase tracking-wide mb-3">By Donor</h2>
            {(() => {
              const donorMap: Record<string, number> = {}
              wins.forEach(w => donorMap[w.donor] = (donorMap[w.donor] ?? 0) + 1)
              return Object.entries(donorMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([donor, count]) => (
                  <div key={donor} className="flex justify-between text-xs py-1 border-b border-silver last:border-0">
                    <span className="text-ink">{donor}</span>
                    <span className="font-bold text-pine">{count}</span>
                  </div>
                ))
            })()}
            {wins.length === 0 && <p className="text-xs text-ash">No wins logged yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
