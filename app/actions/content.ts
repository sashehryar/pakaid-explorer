'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type {
  FundingStatus,
  TenderStatus,
  FirmTrend,
} from '@/lib/types/database'

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

// ── Projects ──────────────────────────────────────────────────────────────────

export interface ProjectFormData {
  title: string
  donor: string
  sector: string
  province: string
  amount_usd: string
  status: FundingStatus
  instrument: string
  start_date: string
  end_date: string
  implementer: string
  context_note: string
  opportunity_note: string
  source_url: string
  source: string
  featured: boolean
}

export async function createProject(data: ProjectFormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('projects').insert({
    title: data.title,
    donor: data.donor,
    sector: data.sector,
    province: data.province || null,
    amount_usd: data.amount_usd ? Number(data.amount_usd) : null,
    status: data.status,
    instrument: data.instrument || null,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    implementer: data.implementer || null,
    context_note: data.context_note || null,
    opportunity_note: data.opportunity_note || null,
    source_url: data.source_url || null,
    source: data.source,
    featured: data.featured,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/funding')
}

export async function updateProject(id: string, data: ProjectFormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('projects')
    .update({
      title: data.title,
      donor: data.donor,
      sector: data.sector,
      province: data.province || null,
      amount_usd: data.amount_usd ? Number(data.amount_usd) : null,
      status: data.status,
      instrument: data.instrument || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      implementer: data.implementer || null,
      context_note: data.context_note || null,
      opportunity_note: data.opportunity_note || null,
      source_url: data.source_url || null,
      source: data.source,
      featured: data.featured,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/funding')
}

export async function deleteProject(id: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/funding')
}

// ── Tenders ───────────────────────────────────────────────────────────────────

export interface TenderFormData {
  title: string
  donor: string
  sector: string
  province: string
  value_usd: string
  deadline: string
  status: TenderStatus
  instrument: string
  implementer: string
  positioning_note: string
  source_url: string
  source: string
}

export async function createTender(data: TenderFormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('tenders').insert({
    title: data.title,
    donor: data.donor,
    sector: data.sector || null,
    province: data.province || null,
    value_usd: data.value_usd ? Number(data.value_usd) : null,
    deadline: data.deadline || null,
    status: data.status,
    instrument: data.instrument || null,
    implementer: data.implementer || null,
    positioning_note: data.positioning_note || null,
    source_url: data.source_url || null,
    source: data.source,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/procurement')
}

export async function updateTender(id: string, data: TenderFormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('tenders')
    .update({
      title: data.title,
      donor: data.donor,
      sector: data.sector || null,
      province: data.province || null,
      value_usd: data.value_usd ? Number(data.value_usd) : null,
      deadline: data.deadline || null,
      status: data.status,
      instrument: data.instrument || null,
      implementer: data.implementer || null,
      positioning_note: data.positioning_note || null,
      source_url: data.source_url || null,
      source: data.source,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/procurement')
}

export async function deleteTender(id: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('tenders').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/procurement')
}

// ── Donors ────────────────────────────────────────────────────────────────────

export interface DonorFormData {
  name: string
  type: string
  country: string
  opportunity_note: string
  pain_point: string
  entry_path: string
  website: string
  procurement_model: string
}

export async function createDonor(data: DonorFormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('donors').insert({
    name: data.name,
    type: data.type,
    country: data.country || null,
    opportunity_note: data.opportunity_note || null,
    pain_point: data.pain_point || null,
    entry_path: data.entry_path || null,
    website: data.website || null,
    procurement_model: data.procurement_model || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/donors')
}

export async function updateDonor(id: string, data: DonorFormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('donors')
    .update({
      name: data.name,
      type: data.type,
      country: data.country || null,
      opportunity_note: data.opportunity_note || null,
      pain_point: data.pain_point || null,
      entry_path: data.entry_path || null,
      website: data.website || null,
      procurement_model: data.procurement_model || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/donors')
}

export async function deleteDonor(id: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('donors').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/donors')
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export interface JobFormData {
  title: string
  organisation: string
  org_type: string
  location: string
  employment_type: string
  seniority: string
  sector: string
  salary_label: string
  apply_url: string
  description: string
  deadline: string
  source: string
}

export async function createJob(data: JobFormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('jobs').insert({
    title: data.title,
    organisation: data.organisation,
    org_type: data.org_type || null,
    location: data.location || null,
    employment_type: data.employment_type || null,
    seniority: data.seniority || null,
    sector: data.sector || null,
    salary_label: data.salary_label || null,
    apply_url: data.apply_url || null,
    description: data.description || null,
    deadline: data.deadline || null,
    source: data.source || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/careers')
}

export async function updateJob(id: string, data: JobFormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('jobs')
    .update({
      title: data.title,
      organisation: data.organisation,
      org_type: data.org_type || null,
      location: data.location || null,
      employment_type: data.employment_type || null,
      seniority: data.seniority || null,
      sector: data.sector || null,
      salary_label: data.salary_label || null,
      apply_url: data.apply_url || null,
      description: data.description || null,
      deadline: data.deadline || null,
      source: data.source || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/careers')
}

export async function deleteJob(id: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('jobs').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/careers')
}

// ── News ──────────────────────────────────────────────────────────────────────

export interface NewsFormData {
  title: string
  source: string
  topic: string
  excerpt: string
  url: string
  featured: boolean
  published_at: string
}

export async function createNews(data: NewsFormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('news_articles').insert({
    title: data.title,
    source: data.source,
    topic: data.topic || null,
    excerpt: data.excerpt || null,
    url: data.url || null,
    featured: data.featured,
    published_at: data.published_at || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/news')
}

export async function updateNews(id: string, data: NewsFormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('news_articles')
    .update({
      title: data.title,
      source: data.source,
      topic: data.topic || null,
      excerpt: data.excerpt || null,
      url: data.url || null,
      featured: data.featured,
      published_at: data.published_at || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/news')
}

export async function deleteNews(id: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('news_articles').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/news')
}

// ── Firms ─────────────────────────────────────────────────────────────────────

export interface FirmFormData {
  name: string
  type: string
  trend: FirmTrend
  hiring_status: string
  editorial_note: string
  opportunity_note: string
  risk_note: string
  website: string
}

export async function createFirm(data: FirmFormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('consulting_firms').insert({
    name: data.name,
    type: data.type,
    trend: data.trend,
    hiring_status: data.hiring_status || null,
    editorial_note: data.editorial_note || null,
    opportunity_note: data.opportunity_note || null,
    risk_note: data.risk_note || null,
    website: data.website || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/firms')
}

export async function updateFirm(id: string, data: FirmFormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('consulting_firms')
    .update({
      name: data.name,
      type: data.type,
      trend: data.trend,
      hiring_status: data.hiring_status || null,
      editorial_note: data.editorial_note || null,
      opportunity_note: data.opportunity_note || null,
      risk_note: data.risk_note || null,
      website: data.website || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/firms')
}

export async function deleteFirm(id: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('consulting_firms').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/firms')
}

// ── PSDP Schemes ──────────────────────────────────────────────────────────────

export interface PsdpSchemeFormData {
  scheme_id: string
  title: string
  ministry: string
  executing_agency: string
  province: string
  sector: string
  sub_sector: string
  source: string
  fiscal_year: string
  allocation_bn: string
  released_bn: string
  utilized_bn: string
  execution_pct: string
  physical_progress_pct: string
  implementation_stage: string
  risk_level: string
  is_slow_moving: boolean
  is_revised: boolean
  is_under_utilized: boolean
  is_donor_linked: boolean
  donor_name: string
  donor_loan_pct: string
  implementer: string
  implementer_type: string
  implementer_note: string
  opportunity_type: string
  opportunity_window: string
  ta_value_estimate_m: string
  donor_perspective: string
  firm_perspective: string
  implementer_perspective: string
  warning_signals: string
  source_url: string
  featured: boolean
}

function parsePsdp(data: PsdpSchemeFormData) {
  return {
    scheme_id:               data.scheme_id || null,
    title:                   data.title,
    ministry:                data.ministry || null,
    executing_agency:        data.executing_agency || null,
    province:                data.province || null,
    sector:                  data.sector || null,
    sub_sector:              data.sub_sector || null,
    source:                  data.source || 'federal_psdp',
    fiscal_year:             data.fiscal_year || null,
    allocation_bn:           data.allocation_bn ? Number(data.allocation_bn) : null,
    released_bn:             data.released_bn ? Number(data.released_bn) : null,
    utilized_bn:             data.utilized_bn ? Number(data.utilized_bn) : null,
    execution_pct:           data.execution_pct ? Number(data.execution_pct) : null,
    physical_progress_pct:   data.physical_progress_pct ? Number(data.physical_progress_pct) : null,
    implementation_stage:    data.implementation_stage || 'mobilization',
    risk_level:              data.risk_level || 'medium',
    is_slow_moving:          data.is_slow_moving,
    is_revised:              data.is_revised,
    is_under_utilized:       data.is_under_utilized,
    is_donor_linked:         data.is_donor_linked,
    donor_name:              data.donor_name || null,
    donor_loan_pct:          data.donor_loan_pct ? Number(data.donor_loan_pct) : null,
    implementer:             data.implementer || null,
    implementer_type:        data.implementer_type || null,
    implementer_note:        data.implementer_note || null,
    opportunity_type:        data.opportunity_type || 'none',
    opportunity_window:      data.opportunity_window || null,
    ta_value_estimate_m:     data.ta_value_estimate_m ? Number(data.ta_value_estimate_m) : null,
    donor_perspective:       data.donor_perspective || null,
    firm_perspective:        data.firm_perspective || null,
    implementer_perspective: data.implementer_perspective || null,
    warning_signals:         data.warning_signals ? data.warning_signals.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    source_url:              data.source_url || null,
    featured:                data.featured,
  }
}

export async function createPsdpScheme(data: PsdpSchemeFormData) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('psdp_schemes').insert(parsePsdp(data))
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/psdp')
}

export async function updatePsdpScheme(id: string, data: PsdpSchemeFormData) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('psdp_schemes').update({
    ...parsePsdp(data),
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/psdp')
}

export async function deletePsdpScheme(id: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('psdp_schemes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content')
  revalidatePath('/psdp')
}
