import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types/database'
import { ExternalLink } from 'lucide-react'

export const metadata: Metadata = { title: 'Admin — Data Tables' }

const SUPABASE_URL = 'https://supabase.com/dashboard/project/retxfaffuawwabhcihmb/editor'

const TABLES = [
  { name: 'profiles',            label: 'Profiles'           },
  { name: 'projects',            label: 'Projects'           },
  { name: 'tenders',             label: 'Tenders'            },
  { name: 'donors',              label: 'Donors'             },
  { name: 'jobs',                label: 'Jobs'               },
  { name: 'news_articles',       label: 'News Articles'      },
  { name: 'imf_actions',         label: 'IMF Actions'        },
  { name: 'usaid_gap_programs',  label: 'USAID Gap Programs' },
  { name: 'overlap_records',     label: 'Overlap Records'    },
  { name: 'salary_benchmarks',   label: 'Salary Benchmarks'  },
  { name: 'consulting_firms',    label: 'Consulting Firms'   },
  { name: 'psdp_items',          label: 'PSDP Items'         },
  { name: 'regulatory_entries',  label: 'Regulatory Entries' },
  { name: 'scraper_logs',        label: 'Scraper Logs'       },
] as const

type TableName = typeof TABLES[number]['name']

export default async function AdminDataPage() {
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

  // Fetch all row counts in parallel
  const countResults = await Promise.all(
    TABLES.map(async ({ name }) => {
      const { count, error } = await admin
        .from(name)
        .select('*', { count: 'exact', head: true })
      return { name, count: error ? null : (count ?? 0) }
    })
  )

  const counts: Record<TableName, number | null> = Object.fromEntries(
    countResults.map(r => [r.name, r.count])
  ) as Record<TableName, number | null>

  const totalRows = countResults.reduce((sum, r) => sum + (r.count ?? 0), 0)

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Data Tables</h1>
        <p className="text-sm text-ash mt-0.5">
          {totalRows.toLocaleString()} total rows across {TABLES.length} tables
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {TABLES.map(({ name, label }) => {
          const count = counts[name]
          const isEmpty = count === 0

          return (
            <div
              key={name}
              className={`rounded-xl border bg-card p-4 flex flex-col gap-2 ${
                isEmpty ? 'border-silver opacity-70' : 'border-silver'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-ink truncate">{label}</div>
                  <div className="text-[10px] font-mono text-ash mt-0.5">{name}</div>
                </div>
                <a
                  href={SUPABASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-ash hover:text-pine transition-colors mt-0.5"
                  title="View in Supabase"
                >
                  <ExternalLink size={13} />
                </a>
              </div>

              <div className="mt-auto">
                {count === null ? (
                  <span className="text-xs text-red-500 font-medium">Error</span>
                ) : (
                  <span className={`text-xl font-bold ${isEmpty ? 'text-ash' : 'text-pine'}`}>
                    {count.toLocaleString()}
                  </span>
                )}
                <span className="text-xs text-ash ml-1.5">rows</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer link */}
      <div className="text-center pt-2">
        <a
          href={SUPABASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-pine hover:underline"
        >
          Open Supabase Table Editor
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  )
}
