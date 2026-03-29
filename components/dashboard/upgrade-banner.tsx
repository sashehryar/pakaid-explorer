import Link from 'next/link'
import { Zap } from 'lucide-react'
import type { UserTier } from '@/lib/types/database'

const UPGRADE_COPY: Record<string, { headline: string; cta: string }> = {
  free: {
    headline: 'Unlock Donor Intelligence, Duplicate Checker & Aid Risk Monitor',
    cta: 'Upgrade to Pro — PKR 8,500/mo',
  },
  pro: {
    headline: 'Get Firm Tracker, PSDP Analysis & full export access',
    cta: 'Upgrade to Institutional — PKR 45,000/mo',
  },
}

export function UpgradeBanner({ tier }: { tier: UserTier }) {
  if (tier === 'institutional') return null

  const copy = UPGRADE_COPY[tier]

  return (
    <div className="flex items-center gap-3 bg-forest border-t border-white/10 px-4 py-2.5">
      <Zap size={14} className="text-gold shrink-0" />
      <p className="flex-1 text-xs text-sage/80">{copy.headline}</p>
      <Link
        href="/upgrade"
        className="shrink-0 rounded-md bg-gold px-3 py-1 text-xs font-bold text-forest hover:bg-gold-light transition-colors"
      >
        {copy.cta}
      </Link>
    </div>
  )
}
