'use client'

import { useState, useTransition } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { updateUserTier, updateUserRole } from '@/app/actions/admin'
import type { Profile, UserTier, UserRole } from '@/lib/types/database'

type UserRow = Pick<Profile, 'id' | 'email' | 'full_name' | 'tier' | 'role' | 'created_at'>

interface UserTableProps {
  users: UserRow[]
}

const TIER_COLORS: Record<UserTier, string> = {
  free:          'bg-fog text-ash',
  pro:           'bg-gold/15 text-amber-700',
  institutional: 'bg-pine/10 text-pine',
}

const ROLE_COLORS: Record<UserRole, string> = {
  user:  'bg-fog text-ash',
  admin: 'bg-red-50 text-red-700',
}

export function UserTable({ users }: UserTableProps) {
  const [localUsers, setLocalUsers] = useState(users)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function showFeedback(userId: string, msg: string) {
    setFeedback(prev => ({ ...prev, [userId]: msg }))
    setTimeout(() => setFeedback(prev => {
      const next = { ...prev }
      delete next[userId]
      return next
    }), 3000)
  }

  function handleTierChange(userId: string, tier: UserTier) {
    setLocalUsers(prev =>
      prev.map(u => u.id === userId ? { ...u, tier } : u)
    )
    startTransition(async () => {
      try {
        await updateUserTier(userId, tier)
        showFeedback(userId, 'Tier updated')
      } catch {
        showFeedback(userId, 'Failed to update tier')
      }
    })
  }

  function handleRoleChange(userId: string, role: UserRole) {
    setLocalUsers(prev =>
      prev.map(u => u.id === userId ? { ...u, role } : u)
    )
    startTransition(async () => {
      try {
        await updateUserRole(userId, role)
        showFeedback(userId, 'Role updated')
      } catch {
        showFeedback(userId, 'Failed to update role')
      }
    })
  }

  if (localUsers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-silver bg-card p-12 text-center">
        <p className="font-semibold text-ink">No users found</p>
        <p className="text-sm text-ash mt-1">User profiles will appear here once people sign up</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-silver bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-fog border-b border-silver">
            <TableHead className="text-xs font-semibold text-ash">Email</TableHead>
            <TableHead className="text-xs font-semibold text-ash">Full Name</TableHead>
            <TableHead className="text-xs font-semibold text-ash">Tier</TableHead>
            <TableHead className="text-xs font-semibold text-ash">Role</TableHead>
            <TableHead className="text-xs font-semibold text-ash text-right">Joined</TableHead>
            <TableHead className="text-xs font-semibold text-ash w-28">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-silver">
          {localUsers.map(u => (
            <TableRow key={u.id} className="hover:bg-fog/50 transition-colors">
              <TableCell className="text-sm text-ink font-medium max-w-[220px] truncate">
                {u.email ?? '—'}
              </TableCell>
              <TableCell className="text-sm text-ash max-w-[160px] truncate">
                {u.full_name || <span className="italic text-silver">Not set</span>}
              </TableCell>
              <TableCell>
                <Select
                  value={u.tier}
                  onValueChange={val => handleTierChange(u.id, val as UserTier)}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-7 w-36 text-xs border-silver bg-transparent">
                    <SelectValue>
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${TIER_COLORS[u.tier]}`}>
                        {u.tier}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">free</SelectItem>
                    <SelectItem value="pro">pro</SelectItem>
                    <SelectItem value="institutional">institutional</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={u.role}
                  onValueChange={val => handleRoleChange(u.id, val as UserRole)}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-7 w-24 text-xs border-silver bg-transparent">
                    <SelectValue>
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${ROLE_COLORS[u.role]}`}>
                        {u.role}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-xs text-ash text-right">
                {new Date(u.created_at).toLocaleDateString('en-GB', { dateStyle: 'short' })}
              </TableCell>
              <TableCell className="text-[11px]">
                {feedback[u.id] ? (
                  <span className={
                    feedback[u.id].startsWith('Failed')
                      ? 'text-red-600 font-medium'
                      : 'text-fern font-medium'
                  }>
                    {feedback[u.id]}
                  </span>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
