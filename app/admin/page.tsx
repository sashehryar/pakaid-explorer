import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { ScraperLog, UserRole } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Admin Panel' }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRes = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const profile = profileRes.data as { role: UserRole } | null

  if (profile?.role !== 'admin') redirect('/funding')

  const scrapersRes = await supabase
    .from('scraper_logs')
    .select('*')
    .order('status')
    .order('name')
  const scrapers: ScraperLog[] = scrapersRes.data ?? []

  const healthy  = (scrapers ?? []).filter(s => s.status === 'healthy').length
  const failing  = (scrapers ?? []).filter(s => s.status === 'failing').length
  const disabled = (scrapers ?? []).filter(s => s.status === 'disabled').length

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Admin Panel</h1>
        <p className="text-sm text-ash mt-0.5">Scraper pipeline · Editorial queue · Data management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Healthy', value: healthy, color: 'text-fern' },
          { label: 'Failing', value: failing, color: 'text-danger' },
          { label: 'Disabled', value: disabled, color: 'text-ash' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink">Scrapers {s.label}</div>
          </div>
        ))}
      </div>

      {/* Scraper table */}
      <div>
        <h2 className="text-sm font-bold text-slate uppercase tracking-wide mb-3">Scraper Pipeline</h2>
        <div className="rounded-xl border border-silver bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-silver bg-fog">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Scraper</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Actor</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-ash">Status</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-ash">Last Run</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-ash">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver">
              {(scrapers ?? []).map(s => (
                <tr key={s.id} className="hover:bg-fog/50">
                  <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                  <td className="px-4 py-3 text-xs text-ash font-mono">{s.apify_actor_id ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded ${
                      s.status === 'healthy'  ? 'bg-green-50 text-green-700' :
                      s.status === 'failing'  ? 'bg-red-50 text-red-700' :
                      s.status === 'running'  ? 'bg-blue-50 text-blue-700' :
                      'bg-fog text-ash'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        s.status === 'healthy' ? 'bg-fern' :
                        s.status === 'failing' ? 'bg-danger' :
                        s.status === 'running' ? 'bg-blue-400' : 'bg-ash'
                      }`} />
                      {s.status.toUpperCase()}
                    </span>
                    {s.error_message && (
                      <div className="text-[10px] text-danger mt-0.5">{s.error_message}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-ash">
                    {s.last_run ? new Date(s.last_run).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-pine">{s.records_last_run}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tables managed */}
      <div>
        <h2 className="text-sm font-bold text-slate uppercase tracking-wide mb-3">Data Tables</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['projects', 'tenders', 'donors', 'jobs', 'news_articles', 'overlap_records'].map(t => (
            <div key={t} className="rounded-xl border border-silver bg-card p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-ink">{t}</div>
                <div className="text-xs text-ash">Supabase table</div>
              </div>
              <a
                href={`https://supabase.com/dashboard/project/retxfaffuawwabhcihmb/editor`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-pine hover:underline"
              >
                View ↗
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
