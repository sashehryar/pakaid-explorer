'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserTier } from '@/lib/types/database'
import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { GlobalSearch } from './global-search'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const TIER_LABELS: Record<UserTier, string> = {
  free: 'Explorer',
  pro: 'Professional',
  institutional: 'Institutional',
}

const TIER_COLORS: Record<UserTier, string> = {
  free: 'bg-ash/20 text-ash',
  pro: 'bg-gold/20 text-gold',
  institutional: 'bg-pine/20 text-pine',
}

interface HeaderProps {
  email: string | null
  fullName: string | null
  tier: UserTier
}

export function Header({ email, fullName, tier }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (email?.[0] ?? 'U').toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b border-silver bg-card px-4 shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-sm">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Tier badge */}
        <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', TIER_COLORS[tier])}>
          {TIER_LABELS[tier]}
        </span>

        {/* Notifications */}
        <button className="relative rounded-full p-1.5 hover:bg-fog transition-colors">
          <Bell size={16} className="text-slate" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-fog transition-colors outline-none">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-pine text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown size={13} className="text-ash" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">{fullName ?? 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings size={14} className="mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/upgrade')}>
              <User size={14} className="mr-2" /> Upgrade Plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut size={14} className="mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
