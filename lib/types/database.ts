export type UserTier = 'free' | 'pro' | 'institutional'
export type UserRole = 'user' | 'admin'
export type FundingStatus = 'active' | 'closing' | 'closed' | 'frozen' | 'pipeline'
export type TenderStatus = 'open' | 'evaluation' | 'awarded' | 'cancelled'
export type FillLevel = 'Full' | 'Partial' | 'None'
export type IMFStatus = 'green' | 'amber' | 'red'
export type FirmTrend = 'Growing' | 'Stable' | 'Contracting'
export type ScraperStatus = 'healthy' | 'failing' | 'disabled' | 'running'
export type PsdpRisk = 'low' | 'medium' | 'high'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  tier: UserTier
  role: UserRole
  organisation: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  title: string
  donor: string
  sector: string
  province: string | null
  amount_usd: number | null
  status: FundingStatus
  instrument: string | null      // 'Loan' | 'Grant' | 'TA' | 'Humanitarian'
  start_date: string | null
  end_date: string | null
  implementer: string | null
  iati_id: string | null
  context_note: string | null    // editorial: why it matters
  opportunity_note: string | null // editorial: action to take
  source_url: string | null
  source: string                 // 'WB' | 'ADB' | 'IATI' | 'FCDO' | 'GIZ' | 'EU' | ...
  featured: boolean
  created_at: string
  updated_at: string
}

export interface Tender {
  id: string
  title: string
  donor: string
  sector: string | null
  province: string | null
  value_usd: number | null
  deadline: string | null
  days_left: number | null
  status: TenderStatus
  instrument: string | null
  implementer: string | null
  positioning_note: string | null
  source_url: string | null
  source: string
  created_at: string
  updated_at: string
}

export interface Donor {
  id: string
  name: string
  type: string                   // 'MDB' | 'Bilateral' | 'UN' | 'Climate' | 'Private'
  country: string | null
  active_projects: number
  volume_label: string | null    // '$3.2B active'
  historical_volume_usd: number | null
  instrument: string | null
  sectors: string[] | null
  provinces: string[] | null
  opportunity_note: string | null
  pain_point: string | null
  entry_path: string | null
  website: string | null
  procurement_model: string | null
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  title: string
  organisation: string
  org_type: string | null        // 'UN' | 'INGO' | 'Consulting' | 'Local NGO'
  location: string | null
  employment_type: string | null // 'Full-time' | 'Consultant' | 'Part-time'
  seniority: string | null       // 'Entry' | 'Mid' | 'Senior' | 'Director' | 'UN P2-P5'
  sector: string | null
  salary_label: string | null
  apply_url: string | null
  description: string | null
  deadline: string | null
  source: string | null
  created_at: string
}

export interface NewsArticle {
  id: string
  title: string
  source: string
  source_color: string | null
  topic: string | null
  topic_color: string | null
  excerpt: string | null
  full_text: string | null
  url: string | null
  featured: boolean
  published_at: string | null
  created_at: string
}

export interface IMFAction {
  id: string
  region: string
  action: string
  deadline: string | null
  status: IMFStatus
  intelligence_note: string | null
  created_at: string
  updated_at: string
}

export interface UsaidGapProgram {
  id: string
  program_id: string
  title: string
  sector: string
  value_usd: number
  end_date: string | null
  fill_level: FillLevel
  fill_source: string | null
  gap_usd: number
  gap_note: string | null
  implementer: string | null
  province: string | null
  status: string
  created_at: string
}

export interface OverlapRecord {
  id: string
  iati_id: string | null
  title: string
  donor: string
  implementer: string | null
  sector: string
  province: string | null
  instrument: string | null
  start_date: string | null
  end_date: string | null
  amount_usd: number | null
  keywords: string[] | null
  source: string
  created_at: string
}

export interface SalaryBenchmark {
  id: string
  role: string
  level: string | null
  min_pkr: number | null
  max_pkr: number | null
  usd_equivalent: string | null
  notes: string | null
}

export interface ConsultingFirm {
  id: string
  name: string
  type: string                   // 'INGO' | 'Consulting' | 'Local NGO' | 'Research'
  trend: FirmTrend
  hiring_status: string | null
  editorial_note: string | null
  headcount: string | null
  revenue_signal: string | null
  active_contracts: number
  key_programmes: string[] | null
  donors: string[] | null
  opportunity_note: string | null
  risk_note: string | null
  website: string | null
  created_at: string
}

export interface PsdpItem {
  id: string
  category: string               // 'federal' | 'provincial' | 'ministry'
  name: string
  allocation_bn: number
  released_bn: number | null
  spent_bn: number
  execution_pct: number
  target_pct: number | null
  province: string | null
  risk: PsdpRisk | null
  key_project: string | null
  note: string | null
  fiscal_year: string
  created_at: string
}

export interface RegulatoryEntry {
  id: string
  category: string
  title: string
  body: string
  authority: string | null
  last_updated: string | null
  complexity: 'Low' | 'Medium' | 'High'
  tags: string[] | null
  created_at: string
}

export interface ScraperLog {
  id: string
  name: string
  target_url: string | null
  apify_actor_id: string | null
  status: ScraperStatus
  last_run: string | null
  next_run: string | null
  records_last_run: number
  error_message: string | null
  created_at: string
  updated_at: string
}

// Supabase Database interface (for typed client)
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> }
      tenders: { Row: Tender; Insert: Partial<Tender>; Update: Partial<Tender> }
      donors: { Row: Donor; Insert: Partial<Donor>; Update: Partial<Donor> }
      jobs: { Row: Job; Insert: Partial<Job>; Update: Partial<Job> }
      news_articles: { Row: NewsArticle; Insert: Partial<NewsArticle>; Update: Partial<NewsArticle> }
      imf_actions: { Row: IMFAction; Insert: Partial<IMFAction>; Update: Partial<IMFAction> }
      usaid_gap_programs: { Row: UsaidGapProgram; Insert: Partial<UsaidGapProgram>; Update: Partial<UsaidGapProgram> }
      overlap_records: { Row: OverlapRecord; Insert: Partial<OverlapRecord>; Update: Partial<OverlapRecord> }
      salary_benchmarks: { Row: SalaryBenchmark; Insert: Partial<SalaryBenchmark>; Update: Partial<SalaryBenchmark> }
      consulting_firms: { Row: ConsultingFirm; Insert: Partial<ConsultingFirm>; Update: Partial<ConsultingFirm> }
      psdp_items: { Row: PsdpItem; Insert: Partial<PsdpItem>; Update: Partial<PsdpItem> }
      regulatory_entries: { Row: RegulatoryEntry; Insert: Partial<RegulatoryEntry>; Update: Partial<RegulatoryEntry> }
      scraper_logs: { Row: ScraperLog; Insert: Partial<ScraperLog>; Update: Partial<ScraperLog> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
