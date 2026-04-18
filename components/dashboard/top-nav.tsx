'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home, TrendingUp, ClipboardList, Newspaper, Users,
  AlertTriangle, ShieldAlert, BarChart2, Briefcase,
  GraduationCap, MoreHorizontal,
} from 'lucide-react'
import { useState, useRef, useCallback } from 'react'
import type { UserTier } from '@/lib/types/database'

interface NavTab {
  href: string
  label: string
  shortLabel: string
  Icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties; 'aria-hidden'?: boolean | 'true' | 'false' }>
  tier: UserTier | 'free'
}

const TABS: NavTab[] = [
  { href: '/home',         label: 'Home',                           shortLabel: 'Home',    Icon: Home,          tier: 'free' },
  { href: '/funding',      label: 'Aid Pipeline',                   shortLabel: 'Funding', Icon: TrendingUp,    tier: 'free' },
  { href: '/procurement',  label: 'Tenders',                        shortLabel: 'Tenders', Icon: ClipboardList, tier: 'free' },
  { href: '/news',         label: 'News',                           shortLabel: 'News',    Icon: Newspaper,     tier: 'free' },
  { href: '/donors',       label: 'Donors',                         shortLabel: 'Donors',  Icon: Users,         tier: 'pro' },
  { href: '/duplicates',   label: 'Overlaps',                       shortLabel: 'Overlaps',Icon: AlertTriangle, tier: 'pro' },
  { href: '/intelligence', label: 'Political & Fiscal Risk',        shortLabel: 'Risk',    Icon: ShieldAlert,   tier: 'pro' },
  { href: '/psdp',         label: 'PSDP & ADP Spend',              shortLabel: 'PSDP',    Icon: BarChart2,     tier: 'institutional' },
  { href: '/firms',        label: 'Partners & Firms',               shortLabel: 'Partners',Icon: Briefcase,     tier: 'institutional' },
  { href: '/careers',      label: 'Browse Careers',                 shortLabel: 'Careers', Icon: GraduationCap, tier: 'free' },
]

const TIER_ORDER: Record<UserTier, number> = { free: 0, pro: 1, institutional: 2 }

function canAccess(tabTier: UserTier | 'free', userTier: UserTier, isAdmin: boolean): boolean {
  if (isAdmin) return true
  return TIER_ORDER[userTier] >= TIER_ORDER[tabTier as UserTier]
}

function isActive(href: string, pathname: string): boolean {
  if (href === '/home') return pathname === '/home' || pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

interface TopNavProps {
  userTier: UserTier
  isAdmin: boolean
}

export function TopNav({ userTier, isAdmin }: TopNavProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const tabsRef = useRef<(HTMLAnchorElement | null)[]>([])

  // Primary tabs (always visible on mobile): first 4
  const primaryTabs = TABS.slice(0, 4)
  // Overflow tabs (behind "More" on mobile): rest
  const overflowTabs = TABS.slice(4)

  const handleKeyDown = useCallback((e: React.KeyboardEvent, idx: number, allTabs: NavTab[]) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (idx + 1) % allTabs.length
      tabsRef.current[next]?.focus()
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (idx - 1 + allTabs.length) % allTabs.length
      tabsRef.current[prev]?.focus()
    }
  }, [])

  return (
    <>
      {/* ── Desktop Top Tab Bar ───────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className="hidden md:flex items-center overflow-x-auto"
        style={{
          background: '#055C45',
          minHeight: '44px',
          paddingLeft: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
        role="tablist"
      >
        {TABS.map((tab, idx) => {
          const accessible = canAccess(tab.tier, userTier, isAdmin)
          const active = isActive(tab.href, pathname)
          return (
            <Link
              key={tab.href}
              href={accessible ? tab.href : '#'}
              ref={el => { tabsRef.current[idx] = el }}
              role="tab"
              aria-selected={active}
              aria-disabled={!accessible}
              tabIndex={active ? 0 : -1}
              onKeyDown={e => handleKeyDown(e, idx, TABS)}
              onClick={!accessible ? e => e.preventDefault() : undefined}
              className={`top-nav-tab${active ? ' active' : ''}${!accessible ? ' locked' : ''}`}
              title={!accessible ? `Upgrade to access ${tab.label}` : undefined}
            >
              <tab.Icon size={15} aria-hidden="true" />
              {tab.label}
              {!accessible && (
                <span
                  className="ml-1 rounded px-1 py-0.5 text-[10px] font-bold"
                  style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}
                >
                  {tab.tier === 'pro' ? 'PRO' : 'INST'}
                </span>
              )}
            </Link>
          )
        })}

        {/* Admin tab */}
        {isAdmin && (
          <Link
            href="/admin"
            role="tab"
            aria-selected={pathname.startsWith('/admin')}
            className={`top-nav-tab${pathname.startsWith('/admin') ? ' active' : ''}`}
          >
            Admin
          </Link>
        )}
      </nav>

      {/* ── Mobile Bottom Tab Bar ─────────────────────────────────── */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border-subtle)',
          boxShadow: '0 -1px 4px rgba(15,23,42,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        role="tablist"
      >
        {primaryTabs.map(tab => {
          const active = isActive(tab.href, pathname)
          const accessible = canAccess(tab.tier, userTier, isAdmin)
          return (
            <Link
              key={tab.href}
              href={accessible ? tab.href : '#'}
              role="tab"
              aria-selected={active}
              aria-label={tab.label}
              onClick={!accessible ? e => e.preventDefault() : undefined}
              className={`mobile-nav-tab${active ? ' active' : ''}`}
            >
              <tab.Icon
                size={22}
                aria-hidden="true"
                className={active ? '' : ''}
                style={{ color: active ? 'var(--color-brand-500)' : 'var(--color-text-secondary)' }}
              />
              <span>{tab.shortLabel}</span>
            </Link>
          )
        })}

        {/* More button */}
        <div className="relative flex-1">
          <button
            onClick={() => setMoreOpen(v => !v)}
            aria-haspopup="true"
            aria-expanded={moreOpen}
            aria-label="More navigation options"
            className="mobile-nav-tab w-full"
            style={{ color: overflowTabs.some(t => isActive(t.href, pathname)) ? 'var(--color-brand-500)' : 'var(--color-text-secondary)' }}
          >
            <MoreHorizontal size={22} aria-hidden="true" />
            <span>More</span>
          </button>

          {moreOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMoreOpen(false)}
                aria-hidden="true"
              />
              <div
                className="absolute bottom-full right-0 z-50 mb-1 w-48 overflow-hidden rounded-lg border py-1"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border-subtle)',
                  boxShadow: '0 4px 8px rgba(15,23,42,0.12)',
                }}
                role="menu"
              >
                {overflowTabs.map(tab => {
                  const accessible = canAccess(tab.tier, userTier, isAdmin)
                  const active = isActive(tab.href, pathname)
                  return (
                    <Link
                      key={tab.href}
                      href={accessible ? tab.href : '#'}
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                      style={{
                        color: active ? 'var(--color-brand-500)' : 'var(--color-text-primary)',
                        fontWeight: active ? 600 : 400,
                        background: active ? 'var(--color-selected-row)' : 'transparent',
                      }}
                      onMouseOver={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-hover-surface)' }}
                      onMouseOut={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
                    >
                      <tab.Icon size={16} aria-hidden="true" />
                      {tab.label}
                      {!accessible && (
                        <span className="ml-auto text-[10px] font-bold" style={{ color: 'var(--color-brand-400)' }}>
                          {tab.tier === 'pro' ? 'PRO' : 'INST'}
                        </span>
                      )}
                    </Link>
                  )
                })}
                {isAdmin && (
                  <Link
                    href="/admin"
                    role="menuitem"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Admin
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  )
}
