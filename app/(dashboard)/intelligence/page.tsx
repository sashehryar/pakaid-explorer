import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { IMFAction } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Assess Political Risk' }

const STATUS_STYLES = {
  green: { dot: 'bg-fern', label: 'ON TRACK', chip: 'bg-green-50 text-green-700 border border-green-200' },
  amber: { dot: 'bg-amber-400', label: 'AT RISK',  chip: 'bg-amber-50 text-amber-700 border border-amber-200' },
  red:   { dot: 'bg-red-400',   label: 'DELAYED',  chip: 'bg-red-50 text-red-700 border border-red-200' },
}

const REGIONS = ['Federal', 'Punjab', 'KP', 'Sindh', 'Balochistan']

export default async function IntelligencePage() {

  const supabase = await createClient()
  const actionsRes = await supabase
    .from('imf_actions')
    .select('*')
    .order('region')
    .order('deadline', { ascending: true })
  const actions: IMFAction[] = actionsRes.data ?? []

  const byRegion = REGIONS.reduce((acc, r) => {
    acc[r] = (actions ?? []).filter(a => a.region === r)
    return acc
  }, {} as Record<string, typeof actions>)

  const critical = (actions ?? []).filter(a => a.status === 'red').length
  const atRisk = (actions ?? []).filter(a => a.status === 'amber').length
  const onTrack = (actions ?? []).filter(a => a.status === 'green').length

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Assess Political Risk</h1>
        <p className="text-sm text-ash mt-0.5">IMF prior actions · provincial fiscal health · donor policy signals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Delayed', value: critical, color: 'text-red-600' },
          { label: 'At Risk', value: atRisk, color: 'text-amber-600' },
          { label: 'On Track', value: onTrack, color: 'text-fern' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink">{s.label}</div>
            <div className="text-xs text-ash">IMF prior actions</div>
          </div>
        ))}
      </div>

      {/* IMF Actions by Region */}
      {(actions ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {REGIONS.map(region => {
            const regionActions = byRegion[region] ?? []
            if (regionActions.length === 0) return null
            return (
              <div key={region}>
                <h2 className="text-sm font-bold text-slate uppercase tracking-wide mb-3">{region}</h2>
                <div className="rounded-xl border border-silver bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-silver bg-fog">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash uppercase tracking-wide">Prior Action</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash uppercase tracking-wide">Deadline</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash uppercase tracking-wide">Status</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash uppercase tracking-wide">Intelligence Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-silver">
                      {regionActions.map(action => {
                        const style = STATUS_STYLES[action.status as keyof typeof STATUS_STYLES]
                        return (
                          <tr key={action.id} className="hover:bg-fog/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-ink">{action.action}</td>
                            <td className="px-4 py-3 text-ash whitespace-nowrap">
                              {action.deadline ? formatDate(action.deadline) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded ${style.chip}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                                {style.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-ash leading-relaxed max-w-xs">
                              {action.intelligence_note ?? '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Donor policy signals */}
      <div className="rounded-xl bg-forest text-white p-5">
        <h2 className="text-sm font-bold text-sage mb-3">Donor Policy Signals — Q1 2026</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-sage/80">
          <div className="rounded-lg bg-white/5 p-3">
            <div className="font-bold text-white mb-1">World Bank</div>
            RISE Programme DLI 3 on track. New FY27 pipeline includes urban resilience and secondary education. Budget envelope stable at $1.2B/year.
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <div className="font-bold text-white mb-1">ADB</div>
            Energy transition facility under design. Punjab agriculture programme executing well. Watch for Q2 2026 country partnership strategy update.
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <div className="font-bold text-white mb-1">FCDO</div>
            CDPS Phase II design starting. Spending review pressure may constrain Pakistan envelope. Girls education Balochistan pilot under discussion.
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <div className="font-bold text-white mb-1">GIZ</div>
            German BMZ Pakistan budget growing. PGCEP Phase II (~€45M) biggest bilateral opportunity in 2026. Energy and governance focus.
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-silver bg-card p-12 text-center">
      <div className="text-4xl mb-3">🏛️</div>
      <p className="font-semibold text-ink">No IMF actions data yet</p>
      <p className="text-sm text-ash mt-1">Apply the seed SQL to populate IMF prior actions tracker</p>
    </div>
  )
}
