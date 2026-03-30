import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { ScraperLog, UserRole } from '@/lib/types/database'
import { ScraperPanel } from './scraper-panel'

export const metadata: Metadata = { title: 'Admin — Scrapers' }

export default async function AdminScrapersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: UserRole } | null
  if (profile?.role !== 'admin') redirect('/funding')

  const admin = createAdminClient()
  const { data: logsData } = await admin
    .from('scraper_logs')
    .select('*')
    .order('name')

  const scrapers: ScraperLog[] = (logsData ?? []) as ScraperLog[]

  const healthy  = scrapers.filter(s => s.status === 'healthy').length
  const failing  = scrapers.filter(s => s.status === 'failing').length
  const running  = scrapers.filter(s => s.status === 'running').length
  const disabled = scrapers.filter(s => s.status === 'disabled').length

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Scraper Pipeline</h1>
        <p className="text-sm text-ash mt-0.5">
          Monitor status and trigger edge functions for each data source
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Healthy',  value: healthy,  color: 'text-fern',        dot: 'bg-fern'        },
          { label: 'Failing',  value: failing,  color: 'text-red-600',     dot: 'bg-red-500'     },
          { label: 'Running',  value: running,  color: 'text-amber-600',   dot: 'bg-amber-400'   },
          { label: 'Disabled', value: disabled, color: 'text-ash',         dot: 'bg-ash'         },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              <span className="text-xs font-semibold text-ash">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <ScraperPanel scrapers={scrapers} />
    </div>
  )
}
