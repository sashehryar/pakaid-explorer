import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types/database'
import { ExternalLink } from 'lucide-react'
import { AdminDataTabs } from './admin-data-tabs'

export const metadata: Metadata = { title: 'Admin — Data Management' }

const SUPABASE_URL = 'https://supabase.com/dashboard/project/retxfaffuawwabhcihmb/editor'

const TABLES = [
  { name: 'profiles',           label: 'Profiles'          },
  { name: 'projects',           label: 'Projects'          },
  { name: 'tenders',            label: 'Tenders'           },
  { name: 'donors',             label: 'Donors'            },
  { name: 'jobs',               label: 'Jobs'              },
  { name: 'news_articles',      label: 'News Articles'     },
  { name: 'news_feeds',         label: 'News Feeds'        },
  { name: 'career_scraping_links', label: 'Career Links'  },
  { name: 'imf_actions',        label: 'IMF Actions'       },
  { name: 'overlap_records',    label: 'Overlap Records'   },
  { name: 'consulting_firms',   label: 'Consulting Firms'  },
  { name: 'psdp_items',         label: 'PSDP Items'        },
  { name: 'sectors',            label: 'Sectors'           },
  { name: 'scraper_logs',       label: 'Scraper Logs'      },
] as const

type TableName = typeof TABLES[number]['name']

export default async function AdminDataPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profileData as { role: UserRole } | null)?.role !== 'admin') redirect('/home')

  const admin = createAdminClient()

  const [countResults, { data: feeds }, { data: careerLinks }] = await Promise.all([
    Promise.all(
      TABLES.map(async ({ name }) => {
        const { count, error } = await admin.from(name).select('*', { count: 'exact', head: true })
        return { name, count: error ? null : (count ?? 0) }
      })
    ),
    admin.from('news_feeds').select('*').order('is_pakistan_priority', { ascending: false }).order('feed_name'),
    admin.from('career_scraping_links').select('*').order('category').order('name'),
  ])

  const counts: Record<TableName, number | null> = Object.fromEntries(
    countResults.map(r => [r.name, r.count])
  ) as Record<TableName, number | null>

  const totalRows = countResults.reduce((sum, r) => sum + (r.count ?? 0), 0)

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Data Management</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {totalRows.toLocaleString()} total rows · Manage feeds, career links, and data sources
          </p>
        </div>
        <a
          href={SUPABASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm hover:underline"
          style={{ color: '#055C45' }}
        >
          Supabase Editor <ExternalLink size={13} />
        </a>
      </div>

      {/* Row counts grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {TABLES.map(({ name, label }) => {
          const count = counts[name]
          return (
            <div key={name} className="rounded-xl border p-3 flex flex-col gap-1"
              style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
              <div className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-secondary)' }}>{label}</div>
              <div className="text-lg font-bold" style={{ color: count === 0 ? 'var(--color-text-disabled)' : '#055C45' }}>
                {count === null ? '—' : count.toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Interactive management tabs */}
      <AdminDataTabs
        initialFeeds={feeds ?? []}
        initialCareerLinks={careerLinks ?? []}
        serviceKey={process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}
      />
    </div>
  )
}
