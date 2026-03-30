import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { UserRole, ScraperLog } from '@/lib/types/database'
import { Users, Database, Activity, Clock, Server } from 'lucide-react'

export const metadata: Metadata = { title: 'Admin Panel' }

export default async function AdminPage() {
  // Auth check via user-scoped client
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

  // Service-role queries (bypass RLS)
  const admin = createAdminClient()

  const [
    { count: totalUsers },
    { count: totalProjects },
    { count: totalTenders },
    { count: totalJobs },
    { data: lastScraperData },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('projects').select('*', { count: 'exact', head: true }),
    admin.from('tenders').select('*', { count: 'exact', head: true }),
    admin.from('jobs').select('*', { count: 'exact', head: true }),
    admin.from('scraper_logs')
      .select('last_run, name, status')
      .order('last_run', { ascending: false })
      .limit(1),
  ])

  const lastScraper = lastScraperData?.[0] as Pick<ScraperLog, 'last_run' | 'name' | 'status'> | undefined

  const statCards = [
    { label: 'Total Users',    value: totalUsers    ?? 0, icon: Users,    color: 'text-pine',    href: '/admin/users'    },
    { label: 'Total Projects', value: totalProjects ?? 0, icon: Activity,  color: 'text-gold',    href: '/admin/data'     },
    { label: 'Total Tenders',  value: totalTenders  ?? 0, icon: Server,    color: 'text-amber-600', href: '/admin/data'  },
    { label: 'Total Jobs',     value: totalJobs     ?? 0, icon: Database,  color: 'text-fern',    href: '/admin/data'     },
  ]

  const quickLinks = [
    { href: '/admin/users',    label: 'Manage Users',    desc: 'Edit tiers and roles for all accounts',  icon: Users    },
    { href: '/admin/scrapers', label: 'Scraper Pipeline', desc: 'View status and trigger data scrapers',  icon: Clock    },
    { href: '/admin/data',     label: 'Data Tables',     desc: 'Row counts and direct Supabase links',   icon: Database },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Admin Panel</h1>
        <p className="text-sm text-ash mt-0.5">
          System overview · User management · Scraper pipeline
        </p>
      </div>

      {/* System Health Cards */}
      <div>
        <h2 className="text-xs font-bold text-ash uppercase tracking-widest mb-3">System Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(card => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-xl border border-silver bg-card p-4 hover:shadow-sm transition-shadow group"
            >
              <div className="flex items-start justify-between mb-2">
                <card.icon size={16} className={`${card.color} shrink-0`} />
              </div>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value.toLocaleString()}</div>
              <div className="text-xs font-semibold text-ink mt-0.5">{card.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Last Scraper Run */}
      {lastScraper && (
        <div className="rounded-xl border border-silver bg-card p-4 flex items-center gap-4">
          <Clock size={16} className="text-ash shrink-0" />
          <div>
            <div className="text-xs font-semibold text-ink">Last Scraper Run</div>
            <div className="text-xs text-ash mt-0.5">
              <span className="font-medium text-ink">{lastScraper.name}</span>
              {' · '}
              {lastScraper.last_run
                ? new Date(lastScraper.last_run).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                : 'Never run'}
              {' · '}
              <span className={
                lastScraper.status === 'healthy' ? 'text-fern font-semibold' :
                lastScraper.status === 'failing' ? 'text-red-600 font-semibold' :
                lastScraper.status === 'running' ? 'text-amber-600 font-semibold' :
                'text-ash'
              }>
                {lastScraper.status.toUpperCase()}
              </span>
            </div>
          </div>
          <Link href="/admin/scrapers" className="ml-auto text-xs text-pine hover:underline shrink-0">
            View all →
          </Link>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-xs font-bold text-ash uppercase tracking-widest mb-3">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-silver bg-card p-4 hover:shadow-sm hover:border-pine/30 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <link.icon size={15} className="text-pine" />
                <span className="text-sm font-semibold text-ink group-hover:text-pine transition-colors">
                  {link.label}
                </span>
              </div>
              <p className="text-xs text-ash leading-relaxed">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
