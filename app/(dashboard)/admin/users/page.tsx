import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/lib/types/database'
import { UserTable } from './user-table'

export const metadata: Metadata = { title: 'Admin — Users' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const myProfile = profileData as { role: UserRole } | null
  if (myProfile?.role !== 'admin') redirect('/funding')

  const admin = createAdminClient()
  const { data: usersData } = await admin
    .from('profiles')
    .select('id, email, full_name, tier, role, created_at')
    .order('created_at', { ascending: false })

  const users = (usersData ?? []) as Pick<Profile, 'id' | 'email' | 'full_name' | 'tier' | 'role' | 'created_at'>[]

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Users</h1>
        <p className="text-sm text-ash mt-0.5">
          {users.length} registered account{users.length !== 1 ? 's' : ''} · Edit tier and role inline
        </p>
      </div>

      <UserTable users={users} />
    </div>
  )
}
