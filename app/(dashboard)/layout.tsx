import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/dashboard/top-bar'
import { TopNav } from '@/components/dashboard/top-nav'
import { AppFooter } from '@/components/dashboard/app-footer'
import { FirstVisitDisclaimer } from '@/components/dashboard/disclaimer-modal'
import { UpgradeBanner } from '@/components/dashboard/upgrade-banner'
import type { UserTier, Profile } from '@/lib/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profileRes = await supabase
    .from('profiles')
    .select('tier, role, full_name')
    .eq('id', user.id)
    .single()

  const profile = profileRes.data as Pick<Profile, 'tier' | 'role' | 'full_name'> | null
  const tier: UserTier = profile?.tier ?? 'free'
  const isAdmin = profile?.role === 'admin'

  return (
    <div
      className="flex h-screen flex-col"
      style={{ background: 'var(--color-canvas)' }}
    >
      {/* ── Top bar: Logo + Search + Bell + Avatar ──────────────── */}
      <TopBar
        email={user.email ?? null}
        fullName={profile?.full_name ?? null}
        tier={tier}
        alertCount={0}
      />

      {/* ── Top nav tabs (desktop) / bottom nav (mobile) ─────────── */}
      <TopNav userTier={tier} isAdmin={isAdmin} />

      {/* ── Upgrade banner (non-intrusive, dismissible) ───────────── */}
      <UpgradeBanner tier={tier} />

      {/* ── Main content ─────────────────────────────────────────── */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '20px',
          paddingBottom: '80px',  /* clearance for mobile bottom nav */
        }}
      >
        {children}
      </main>

      {/* ── Footer (desktop only) ────────────────────────────────── */}
      <AppFooter />

      {/* ── First-visit disclaimer modal ─────────────────────────── */}
      <FirstVisitDisclaimer />
    </div>
  )
}
