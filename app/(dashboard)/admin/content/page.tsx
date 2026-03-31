import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ContentManager } from './content-manager'

export const metadata: Metadata = { title: 'Admin — Content' }

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') redirect('/funding')

  const admin = createAdminClient()

  const [projectsRes, tendersRes, donorsRes, jobsRes, newsRes, firmsRes, psdpRes] = await Promise.all([
    admin.from('projects').select('id, title, donor, sector, status, amount_usd, end_date, source, instrument, province, implementer, context_note, opportunity_note, source_url, start_date, featured').order('created_at', { ascending: false }).limit(100),
    admin.from('tenders').select('id, title, donor, sector, status, value_usd, deadline, source, province, implementer, positioning_note, source_url, instrument').order('created_at', { ascending: false }).limit(100),
    admin.from('donors').select('id, name, type, country, opportunity_note, pain_point, entry_path, website, procurement_model').order('name').limit(100),
    admin.from('jobs').select('id, title, organisation, org_type, location, seniority, sector, salary_label, apply_url, description, deadline, source, employment_type').order('created_at', { ascending: false }).limit(100),
    admin.from('news_articles').select('id, title, source, topic, excerpt, url, featured, published_at').order('published_at', { ascending: false }).limit(100),
    admin.from('consulting_firms').select('id, name, type, trend, hiring_status, editorial_note, opportunity_note, risk_note, website').order('name').limit(100),
    admin.from('psdp_schemes').select('id, scheme_id, title, ministry, executing_agency, province, sector, sub_sector, source, fiscal_year, allocation_bn, released_bn, utilized_bn, execution_pct, physical_progress_pct, implementation_stage, risk_level, is_slow_moving, is_revised, is_under_utilized, is_donor_linked, donor_name, donor_loan_pct, implementer, implementer_type, implementer_note, opportunity_type, opportunity_window, ta_value_estimate_m, donor_perspective, firm_perspective, implementer_perspective, warning_signals, source_url, featured').order('allocation_bn', { ascending: false }).limit(100),
  ])

  return (
    <ContentManager
      projects={projectsRes.data ?? []}
      tenders={tendersRes.data ?? []}
      donors={donorsRes.data ?? []}
      jobs={jobsRes.data ?? []}
      news={newsRes.data ?? []}
      firms={firmsRes.data ?? []}
      psdp={psdpRes.data ?? []}
    />
  )
}
