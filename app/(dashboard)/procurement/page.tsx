import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatUSD, formatDate } from '@/lib/utils'
import type { Tender } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Find Tenders' }

const STATUS_STYLES = {
  open:       { dot: 'bg-fern', label: 'OPEN',       chip: 'bg-green-50 text-green-700' },
  evaluation: { dot: 'bg-amber-400', label: 'EVAL',  chip: 'bg-amber-50 text-amber-700' },
  awarded:    { dot: 'bg-ash', label: 'AWARDED',     chip: 'bg-fog text-ash' },
  cancelled:  { dot: 'bg-red-400', label: 'CANCELLED', chip: 'bg-red-50 text-red-700' },
}

export default async function ProcurementPage() {

  const supabase = await createClient()
  const tendersRes = await supabase
    .from('tenders')
    .select('*')
    .order('deadline', { ascending: true })
    .limit(60)
  const tenders: Tender[] = tendersRes.data ?? []

  const open = (tenders ?? []).filter(t => t.status === 'open')
  const evaluation = (tenders ?? []).filter(t => t.status === 'evaluation')
  const awarded = (tenders ?? []).filter(t => t.status === 'awarded')

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Find Tenders</h1>
        <p className="text-sm text-ash mt-0.5 flex items-center gap-2">
          <span className="live-dot" />
          Open tenders · WB · ADB · FCDO · EU · GIZ · UN
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open Tenders', value: open.length, color: 'text-fern' },
          { label: 'Under Evaluation', value: evaluation.length, color: 'text-amber-600' },
          { label: 'Awarded', value: awarded.length, color: 'text-ash' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: 'open', items: open, title: 'Open for Bids' },
          { key: 'evaluation', items: evaluation, title: 'Under Evaluation' },
          { key: 'awarded', items: awarded, title: 'Awarded' },
        ].map(col => (
          <div key={col.key}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[col.key as keyof typeof STATUS_STYLES].dot}`} />
              <h2 className="text-xs font-bold text-slate uppercase tracking-wide">{col.title}</h2>
              <span className="ml-auto text-xs text-ash">{col.items.length}</span>
            </div>
            <div className="space-y-2">
              {col.items.length === 0 && (
                <div className="rounded-xl border border-dashed border-silver p-4 text-center text-xs text-ash">
                  No items
                </div>
              )}
              {col.items.map(t => (
                <div key={t.id} className="rounded-xl border border-silver bg-card p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-ash bg-fog px-1.5 py-0.5 rounded">{t.donor}</span>
                    {t.days_left !== null && t.days_left !== undefined && t.days_left <= 14 && t.days_left >= 0 && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                        {t.days_left}d left
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-ink leading-snug">{t.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-ash">
                    {t.sector && <span>{t.sector}</span>}
                    {t.value_usd && <span className="font-semibold text-ink">{formatUSD(t.value_usd)}</span>}
                    {t.deadline && <span>Due {formatDate(t.deadline)}</span>}
                  </div>
                  {t.positioning_note && (
                    <div className="mt-2 rounded-lg bg-mist border border-sage/20 p-2">
                      <p className="text-[11px] text-pine leading-relaxed">{t.positioning_note}</p>
                    </div>
                  )}
                  {t.source_url && (
                    <a
                      href={t.source_url} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-pine hover:underline"
                    >
                      View tender ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
