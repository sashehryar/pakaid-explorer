'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserTier } from '@/lib/types/database'
import {
  Activity, ShoppingBag, Newspaper, Globe2, Brain,
  AlertTriangle, Copy, Briefcase, Users, BarChart3,
  Shield, Settings, ChevronRight, Database, Clock,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: string
  tier?: UserTier
}

const MONITOR: NavItem[] = [
  { href: '/funding',     label: 'Track Funding',        icon: Activity },
  { href: '/procurement', label: 'Find Tenders',         icon: ShoppingBag },
  { href: '/news',        label: 'Follow News',          icon: Newspaper },
]

const ANALYZE: NavItem[] = [
  { href: '/donors',      label: 'Explore Donors',       icon: Globe2,       tier: 'pro' },
  { href: '/intelligence',label: 'Assess Political Risk', icon: Brain,       tier: 'pro', badge: '★ PRO' },
  { href: '/usaid-gap',   label: 'Monitor Aid Risk',     icon: AlertTriangle,tier: 'pro', badge: 'NEW' },
  { href: '/duplicates',  label: 'Detect Overlaps',      icon: Copy,         tier: 'pro', badge: '★ PRO' },
]

const RESEARCH: NavItem[] = [
  { href: '/firms',       label: 'Profile Firms',        icon: Users,        tier: 'institutional', badge: '★ PRO' },
  { href: '/psdp',        label: 'Analyze PSDP',         icon: BarChart3,    tier: 'institutional', badge: '★ PRO' },
  { href: '/careers',     label: 'Browse Careers',       icon: Briefcase },
  { href: '/regulatory',  label: 'Navigate Regulations', icon: Shield },
]

interface SidebarProps {
  userTier: UserTier
  isAdmin?: boolean
}

function NavLink({ item, userTier }: { item: NavItem; userTier: UserTier }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  const tierOrder: Record<UserTier, number> = { free: 0, pro: 1, institutional: 2 }
  const requiredTier = item.tier ?? 'free'
  const hasAccess = tierOrder[userTier] >= tierOrder[requiredTier]

  return (
    <Link
      href={hasAccess ? item.href : '/upgrade'}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-gold/15 text-gold border-l-2 border-gold pl-[10px]'
          : 'text-white/90 hover:bg-white/10 hover:text-white',
        !hasAccess && 'opacity-50 cursor-not-allowed'
      )}
    >
      <item.icon size={15} className="shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded',
          item.badge === 'NEW'
            ? 'bg-danger text-white'
            : 'bg-gold/20 text-gold'
        )}>
          {item.badge}
        </span>
      )}
      {!hasAccess && <ChevronRight size={12} className="shrink-0 text-white/50" />}
    </Link>
  )
}

export function Sidebar({ userTier, isAdmin }: SidebarProps) {
  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col bg-forest border-r border-white/10">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-white/10">
        <Link href="/funding" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-pine">
            <span className="text-xs font-black text-white">P</span>
          </div>
          <span className="text-sm font-bold text-white">PakAid Explorer</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        <section>
          <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
            Monitor
          </p>
          {MONITOR.map(item => <NavLink key={item.href} item={item} userTier={userTier} />)}
        </section>

        <section>
          <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
            Analyze
          </p>
          {ANALYZE.map(item => <NavLink key={item.href} item={item} userTier={userTier} />)}
        </section>

        <section>
          <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
            Research
          </p>
          {RESEARCH.map(item => <NavLink key={item.href} item={item} userTier={userTier} />)}
        </section>

        {isAdmin && (
          <section>
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
              Admin
            </p>
            <NavLink item={{ href: '/admin', label: 'Admin Panel', icon: Settings }} userTier={userTier} />
            <div className="ml-3 mt-0.5 border-l border-white/10 pl-2 space-y-0.5">
              <NavLink item={{ href: '/admin/users',    label: 'Users',    icon: Users    }} userTier={userTier} />
              <NavLink item={{ href: '/admin/scrapers', label: 'Scrapers', icon: Clock    }} userTier={userTier} />
              <NavLink item={{ href: '/admin/data',     label: 'Data',     icon: Database }} userTier={userTier} />
            </div>
          </section>
        )}
      </nav>

      {/* Footer — live data signal */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-[11px] text-white/55">Data refreshed 06:14 PKT</span>
        </div>
      </div>
    </aside>
  )
}
