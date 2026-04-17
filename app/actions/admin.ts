'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { UserRole, UserTier } from '@/lib/types/database'
import {
  scrapeReliefWebJobs,
  scrapeDevNetJobs,
  scrapeADBProjects,
  scrapeEADPipeline,
  scrapePPRATenders,
  scrapeGIZProjects,
  scrapeIATIDatastore,
  scrapeNewsFeeds,
  scrapeWorldBankProjects,
  scrapeProcurementNotices,
} from '@/lib/scraper-handlers'

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

export async function triggerScraper(scraperName: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin()

  let result: { ok: boolean; message: string }

  switch (scraperName) {
    case 'ReliefWeb Jobs':
      result = await scrapeReliefWebJobs()
      break
    case 'DevNetJobs Pakistan':
      result = await scrapeDevNetJobs()
      break
    case 'ADB Pakistan Projects':
      result = await scrapeADBProjects()
      break
    case 'EAD Project Pipeline':
      result = await scrapeEADPipeline()
      break
    case 'PPRA Federal Tenders':
      result = await scrapePPRATenders()
      break
    case 'GIZ Project Finder':
      result = await scrapeGIZProjects()
      break
    case 'IATI Datastore':
      result = await scrapeIATIDatastore()
      break
    case 'Dawn Business':
    case 'The News Economy':
      result = await scrapeNewsFeeds(scraperName)
      break
    case 'World Bank Projects API':
      result = await scrapeWorldBankProjects()
      break
    case 'WB Procurement Notices':
      result = await scrapeProcurementNotices('WB', scraperName)
      break
    case 'ADB Procurement Notices':
      result = await scrapeProcurementNotices('ADB', scraperName)
      break
    default:
      result = { ok: false, message: `No handler configured for "${scraperName}"` }
  }

  if (result.ok) revalidatePath('/admin/scrapers')
  return result
}
