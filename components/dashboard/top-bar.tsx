'use client'

import Image from 'next/image'
import { Bell, MapPin } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserTier } from '@/lib/types/database'
import { GlobalSearch } from './global-search'

interface TopBarProps {
  email: string | null
  fullName: string | null
  tier: UserTier
  alertCount?: number
}

export function TopBar({ email, fullName, tier, alertCount = 0 }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (email?.[0] ?? 'U').toUpperCase()

  const tierLabel: Record<UserTier, string> = {
    free: 'Explorer',
    pro: 'Professional',
    institutional: 'Institutional',
  }

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 md:px-6"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border-subtle)',
        boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
      }}
    >
      {/* ── Logo ────────────────────────────────────────────────── */}
      <a href="/home" className="flex shrink-0 items-center gap-2" aria-label="PakAid Explorer home">
        {/* Show actual logo if present, fallback to icon + wordmark */}
        <div className="relative h-8 w-8 shrink-0">
          <Image
            src="/brand/logo.svg"
            alt="PakAid Explorer"
            fill
            sizes="32px"
            className="object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          {/* Fallback icon shown when logo.svg not yet placed */}
          <MapPin
            size={28}
            style={{ color: 'var(--color-brand-500)' }}
            className="absolute inset-0"
            aria-hidden="true"
          />
        </div>
        <span
          className="hidden font-bold sm:block text-[15px] tracking-tight"
          style={{ color: 'var(--color-brand-500)' }}
        >
          PakAid Explorer
        </span>
      </a>

      {/* ── Global Search ────────────────────────────────────────── */}
      <div className="flex-1 max-w-xl">
        <GlobalSearch />
      </div>

      {/* ── Right Controls ───────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Alerts Bell */}
        <button
          aria-label={`${alertCount} alerts`}
          className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ background: 'transparent' }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--color-hover-surface)')}
          onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell size={18} style={{ color: 'var(--color-text-secondary)' }} />
          {alertCount > 0 && (
            <span
              className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: 'var(--color-danger)' }}
            >
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* User Avatar + Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label="User menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-brand-500)' }}
          >
            {initials}
          </button>

          {menuOpen && (
            <>
              {/* Click-away backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div
                className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-lg border py-1"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border-subtle)',
                  boxShadow: '0 4px 8px rgba(15,23,42,0.08)',
                }}
                role="menu"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {fullName ?? 'User'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    {email}
                  </p>
                  <span
                    className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}
                  >
                    {tierLabel[tier]}
                  </span>
                </div>

                {/* Menu items */}
                {[
                  { label: 'Profile', href: '/profile' },
                  { label: 'Settings', href: '/settings' },
                ].map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className="block px-4 py-2 text-sm transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--color-hover-surface)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {item.label}
                  </a>
                ))}

                <div className="my-1 border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />

                <button
                  onClick={handleSignOut}
                  role="menuitem"
                  className="block w-full px-4 py-2 text-left text-sm transition-colors"
                  style={{ color: 'var(--color-danger)' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--color-danger-bg)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
