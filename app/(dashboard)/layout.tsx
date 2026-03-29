import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
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
    <div className="flex h-screen flex-col bg-canvas">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar userTier={tier} isAdmin={isAdmin} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            email={user.email ?? null}
            fullName={profile?.full_name ?? null}
            tier={tier}
          />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
          <UpgradeBanner tier={tier} />
        </div>
      </div>
    </div>
  )
}
