export const runtime = 'nodejs'   // required for fs access

import { redirect } from 'next/navigation'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { MaintenanceClient } from './maintenance-client'

export const metadata: Metadata = { title: 'Data Maintenance — Admin' }

interface CanonicalEntry { name: string; type?: string; url?: string; pakistan_priority?: boolean }
interface CanonicalSector { name: string; slug: string; sub_sectors?: CanonicalEntry[] }
interface CanonicalConfig {
  donors:    CanonicalEntry[]
  firms:     CanonicalEntry[]
  rss_feeds: CanonicalEntry[]
  sectors:   CanonicalSector[]
}

function loadCanonical(): CanonicalConfig | null {
  try {
    // js-yaml must be installed (devDep)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const yaml = require('js-yaml') as { load: (s: string) => unknown }
    const raw = readFileSync(join(process.cwd(), 'config', 'canonical.yaml'), 'utf8')
    return yaml.load(raw) as CanonicalConfig
  } catch {
    return null
  }
}

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRes = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profileRes.data?.role !== 'admin') redirect('/home')

  const canonical = loadCanonical()
  if (!canonical) {
    return (
      <div className="space-y-4 max-w-4xl">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Data Maintenance</h1>
        <div className="card-default rounded-xl p-6" style={{ borderColor: 'var(--color-danger-border)', background: 'var(--color-danger-bg)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
            Could not load config/canonical.yaml. Make sure js-yaml is installed (npm install js-yaml) and the file exists.
          </p>
        </div>
      </div>
    )
  }

  // Query DB
  const [firmsRes, donorsRes, feedsRes, sectorsRes] = await Promise.all([
    supabase.from('consulting_firms').select('name'),
    supabase.from('donors').select('name'),
    supabase.from('news_feeds').select('feed_url, is_active'),
    supabase.from('sectors').select('name'),
  ])

  const dbFirms   = new Set((firmsRes.data  ?? []).map(r => r.name))
  const dbDonors  = new Set((donorsRes.data ?? []).map(r => r.name))
  const dbFeeds   = new Set((feedsRes.data  ?? []).filter(r => r.is_active).map(r => r.feed_url))
  const dbSectors = new Set((sectorsRes.data ?? []).map(r => r.name))

  // All canonical sector names (parent + sub)
  const allCanonicalSectors = canonical.sectors.flatMap(s => [
    s.name,
    ...(s.sub_sectors ?? []).map(ss => ss.name),
  ])

  const missingFirms   = canonical.firms.filter(f => !dbFirms.has(f.name))
  const missingDonors  = canonical.donors.filter(d => !dbDonors.has(d.name))
  const missingFeeds   = canonical.rss_feeds.filter(f => !dbFeeds.has(f.url!))
  const missingSectors = allCanonicalSectors.filter(s => !dbSectors.has(s))

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Data Maintenance</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Diff between canonical.yaml and live database — run migrations to resolve gaps
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Missing RSS Feeds',  count: missingFeeds.length },
          { label: 'Missing Donors',     count: missingDonors.length },
          { label: 'Missing Firms',      count: missingFirms.length },
          { label: 'Missing Sectors',    count: missingSectors.length },
        ].map(item => (
          <div
            key={item.label}
            className="card-default rounded-xl p-4"
            style={item.count > 0 ? { borderColor: 'var(--color-warning-border)', background: 'var(--color-warning-bg)' } : {}}
          >
            <div
              className="text-3xl font-bold"
              style={{ color: item.count > 0 ? 'var(--color-warning-600)' : 'var(--color-success)' }}
            >
              {item.count}
            </div>
            <div className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-primary)' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Detail tables — client component for copy functionality */}
      <MaintenanceClient
        missingFirms={missingFirms.map(f => f.name)}
        missingDonors={missingDonors.map(d => d.name)}
        missingFeeds={missingFeeds.map(f => ({ name: f.name!, url: f.url! }))}
        missingSectors={missingSectors}
      />
    </div>
  )
}
