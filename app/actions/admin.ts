'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { UserRole, UserTier } from '@/lib/types/database'

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return user
}

// ── User management ───────────────────────────────────────────────────────────

export async function updateUserTier(userId: string, tier: UserTier) {
  await requireAdmin()

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ tier, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function updateUserRole(userId: string, role: UserRole) {
  await requireAdmin()

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

// ── Scraper triggering ────────────────────────────────────────────────────────

const SCRAPER_FUNCTION_MAP: Record<string, string> = {
  'World Bank Projects API': 'scrape-wb',
  'ReliefWeb Jobs':          'scrape-jobs',
  'Dawn Business':           'scrape-news',
  'The News Economy':        'scrape-news',
  'WB Procurement Notices':  'scrape-tenders',
  'ADB Procurement Notices': 'scrape-tenders',
}

export async function triggerScraper(scraperName: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin()

  const fnName = SCRAPER_FUNCTION_MAP[scraperName]
  if (!fnName) {
    return { ok: false, message: `No edge function mapped for "${scraperName}"` }
  }

  const url = `https://retxfaffuawwabhcihmb.supabase.co/functions/v1/${fnName}`
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ triggered_by: 'admin_panel' }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, message: `HTTP ${res.status}: ${text.slice(0, 200)}` }
    }

    revalidatePath('/admin/scrapers')
    return { ok: true, message: `${scraperName} triggered successfully` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, message: msg }
  }
}
