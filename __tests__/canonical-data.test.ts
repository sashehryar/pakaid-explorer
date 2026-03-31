/**
 * Canonical data integrity tests
 *
 * These are integration tests that compare config/canonical.yaml against
 * the live Supabase database.
 *
 * Prerequisites:
 *   1. Create .env.test.local with:
 *        NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *   2. Migrations 0005–0007 must have been applied.
 *   3. Run: npm test
 */

import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import yaml from 'js-yaml'
import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll } from 'vitest'

// ── Load canonical config ──────────────────────────────────────────────────────
const canonicalPath = join(process.cwd(), 'config', 'canonical.yaml')
const canonical = yaml.load(readFileSync(canonicalPath, 'utf8')) as {
  donors:    Array<{ name: string; type: string }>
  firms:     Array<{ name: string; type: string }>
  rss_feeds: Array<{ name: string; url: string; category: string; pakistan_priority: boolean }>
  sectors:   Array<{ name: string; slug: string; sdg_aligned: boolean; sub_sectors?: Array<{ name: string; slug: string }> }>
}

// ── Supabase client ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error(
    'Missing environment variables. Create .env.test.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  )
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Test data sets ─────────────────────────────────────────────────────────────
let dbFirms:   Set<string>
let dbDonors:  Set<string>
let dbFeeds:   Set<string>   // active feed_urls
let dbSectors: Set<string>

beforeAll(async () => {
  const [firmsRes, donorsRes, feedsRes, sectorsRes] = await Promise.all([
    supabase.from('consulting_firms').select('name'),
    supabase.from('donors').select('name'),
    supabase.from('news_feeds').select('feed_url, is_active'),
    supabase.from('sectors').select('name'),
  ])

  if (firmsRes.error)   throw new Error(`consulting_firms query failed: ${firmsRes.error.message}`)
  if (donorsRes.error)  throw new Error(`donors query failed: ${donorsRes.error.message}`)
  if (feedsRes.error)   throw new Error(`news_feeds query failed: ${feedsRes.error.message}`)
  if (sectorsRes.error) throw new Error(`sectors query failed: ${sectorsRes.error.message}`)

  dbFirms   = new Set(firmsRes.data.map(r => r.name))
  dbDonors  = new Set(donorsRes.data.map(r => r.name))
  dbFeeds   = new Set(feedsRes.data.filter(r => r.is_active).map(r => r.feed_url))
  dbSectors = new Set(sectorsRes.data.map(r => r.name))
}, 30000)  // 30s timeout for DB connections

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Canonical data integrity', () => {

  it('all canonical firm names exist in consulting_firms table', () => {
    const missing = canonical.firms
      .filter(f => !dbFirms.has(f.name))
      .map(f => f.name)

    expect(
      missing,
      `\n${missing.length} firms missing from DB:\n  ${missing.join('\n  ')}\n\nRun migration 0007_extended_data.sql to fix.`
    ).toHaveLength(0)
  })

  it('all canonical RSS feed URLs exist in news_feeds and are active', () => {
    const missing = canonical.rss_feeds
      .filter(f => !dbFeeds.has(f.url))
      .map(f => `${f.name} → ${f.url}`)

    expect(
      missing,
      `\n${missing.length} feeds missing or inactive in DB:\n  ${missing.join('\n  ')}\n\nRun migration 0006_news_feeds.sql to fix.`
    ).toHaveLength(0)
  })

  it('all canonical donor names exist in donors table', () => {
    const missing = canonical.donors
      .filter(d => !dbDonors.has(d.name))
      .map(d => d.name)

    expect(
      missing,
      `\n${missing.length} donors missing from DB:\n  ${missing.join('\n  ')}\n\nRun migration 0007_extended_data.sql to fix.`
    ).toHaveLength(0)
  })

  it('all canonical sector names (parent + sub) exist in sectors table', () => {
    const allSectors: string[] = canonical.sectors.flatMap(s => [
      s.name,
      ...(s.sub_sectors ?? []).map(ss => ss.name),
    ])

    const missing = allSectors.filter(name => !dbSectors.has(name))

    expect(
      missing,
      `\n${missing.length} sectors missing from DB:\n  ${missing.join('\n  ')}\n\nRun migration 0005_sectors.sql to fix.`
    ).toHaveLength(0)
  })

})
