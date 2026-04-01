export type UserTier = 'free' | 'pro' | 'institutional'
export type UserRole = 'user' | 'admin'
export type FundingStatus = 'active' | 'closing' | 'closed' | 'frozen' | 'pipeline'
export type TenderStatus = 'open' | 'evaluation' | 'awarded' | 'cancelled'
export type FillLevel = 'Full' | 'Partial' | 'None'
export type IMFStatus = 'green' | 'amber' | 'red'
export type FirmTrend = 'Growing' | 'Stable' | 'Contracting'
export type ScraperStatus = 'healthy' | 'failing' | 'disabled' | 'running'
export type PsdpRisk = 'low' | 'medium' | 'high'
export type ImplementationStage = 'pre_award' | 'mobilization' | 'early_implementation' | 'mid_implementation' | 'completion' | 'post_completion' | 'suspended' | 'cancelled'
export type SchemeRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type OpportunityType = 'ta_opportunity' | 'supervision' | 'monitoring_evaluation' | 'implementation' | 'none'
export type PsdpSource = 'federal_psdp' | 'provincial_adp' | 'special_program'
export type BidStage = 'opportunity_id' | 'go_no_go' | 'teaming' | 'writing' | 'review' | 'submitted' | 'awarded' | 'lost'
export type BidPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'open' | 'in_progress' | 'done' | 'blocked'
export type EmeType = 'rfi' | 'framework' | 'forecast' | 'relationship' | 'meeting'
export type ComplianceCategory = 'accreditation' | 'insurance' | 'framework' | 'registration' | 'certification' | 'tax' | 'legal' | 'other'

export interface Sector {
  id: string
  name: string
  parent_id: string | null
  slug: string
  sdg_aligned: boolean
  created_at: string
}

export interface NewsFeed {
  id: string
  feed_name: string
  feed_url: string
  category: string | null
  description: string | null
  website: string | null
  is_active: boolean
  is_pakistan_priority: boolean
  last_fetched_at: string | null
  last_item_count: number | null
  created_at: string
}

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
  sector_id: string | null
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
  sector_id: string | null
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
  // New scoring + AI summary fields (nullable — added in migration 0006)
  feed_id: string | null
  recency_score: number | null
  relevance_score: number | null
  composite_score: number | null
  what_happened: string | null
  why_it_matters: string | null
  potential_action: string | null
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
  type: string                   // 'INGO' | 'Consulting' | 'Local NGO' | 'Research' | 'Engineering'
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
  sector_id: string | null
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
  sector_id: string | null
  created_at: string
}

export interface PsdpScheme {
  id: string
  scheme_id: string | null
  title: string
  ministry: string | null
  executing_agency: string | null
  province: string | null
  district: string | null
  sector: string | null
  sub_sector: string | null
  source: PsdpSource
  fiscal_year: string | null

  allocation_bn: number | null
  revised_allocation_bn: number | null
  released_bn: number | null
  utilized_bn: number | null
  execution_pct: number | null
  physical_progress_pct: number | null
  progress_variance: number | null

  start_date: string | null
  original_end_date: string | null
  revised_end_date: string | null
  is_time_overrun: boolean
  extension_count: number

  implementation_stage: ImplementationStage
  risk_level: SchemeRiskLevel
  is_slow_moving: boolean
  is_revised: boolean
  is_under_utilized: boolean
  warning_signals: string[] | null

  is_donor_linked: boolean
  donor_name: string | null
  donor_loan_pct: number | null
  is_ppp: boolean

  implementer: string | null
  implementer_type: string | null
  implementer_note: string | null

  opportunity_type: OpportunityType
  opportunity_window: string | null
  ta_value_estimate_m: number | null

  donor_perspective: string | null
  firm_perspective: string | null
  implementer_perspective: string | null

  beneficiary_count: number | null
  coverage_area_km2: number | null
  geographic_note: string | null

  prev_year_allocation_bn: number | null
  national_sector_share: number | null
  province_rank: number | null

  // Added in migration 0009
  throwforward_bn: number | null
  cumulative_expenditure_bn: number | null
  total_approved_cost_bn: number | null
  completion_year: number | null
  pc1_revision_count: number | null
  years_in_portfolio: number | null
  release_bn: number | null
  opportunity_score: number | null
  execution_stress_score: number | null
  pslm_outcome_gap_note: string | null
  lfs_labour_gap_note: string | null
  macro_fit_note: string | null

  source_url: string | null
  last_verified_at: string | null
  featured: boolean
  created_at: string
  updated_at: string
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

export interface BidPipeline {
  id: string
  user_id: string
  title: string
  donor: string
  sector: string | null
  province: string | null
  value_usd: number | null
  stage: BidStage
  priority: BidPriority
  deadline: string | null
  go_no_go_date: string | null
  lead_firm: string | null
  partners: string[] | null
  win_probability: number | null
  notes: string | null
  source_url: string | null
  tender_id: string | null
  created_at: string
  updated_at: string
}

export interface BidTask {
  id: string
  bid_id: string
  user_id: string
  title: string
  assignee: string | null
  due_date: string | null
  status: TaskStatus
  notes: string | null
  created_at: string
}

export interface ContractWin {
  id: string
  user_id: string
  title: string
  donor: string
  sector: string | null
  province: string | null
  value_usd: number | null
  award_date: string | null
  start_date: string | null
  end_date: string | null
  client: string | null
  lead_firm: string | null
  our_role: string | null
  bid_id: string | null
  lessons_learned: string | null
  created_at: string
}

export interface EmeItem {
  id: string
  user_id: string
  title: string
  type: EmeType
  donor: string | null
  sector: string | null
  province: string | null
  value_usd: number | null
  expected_date: string | null
  contact_name: string | null
  contact_role: string | null
  notes: string | null
  action_taken: string | null
  next_step: string | null
  source_url: string | null
  created_at: string
  updated_at: string
}

export interface ComplianceItem {
  id: string
  user_id: string
  title: string
  category: ComplianceCategory
  authority: string | null
  reference: string | null
  issued_date: string | null
  expiry_date: string | null
  renewal_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Supabase Database interface (for typed client)
export interface Database {
  public: {
    Tables: {
      profiles:          { Row: Profile;          Insert: Partial<Profile>;          Update: Partial<Profile> }
      projects:          { Row: Project;          Insert: Partial<Project>;          Update: Partial<Project> }
      tenders:           { Row: Tender;           Insert: Partial<Tender>;           Update: Partial<Tender> }
      donors:            { Row: Donor;            Insert: Partial<Donor>;            Update: Partial<Donor> }
      jobs:              { Row: Job;              Insert: Partial<Job>;              Update: Partial<Job> }
      news_articles:     { Row: NewsArticle;      Insert: Partial<NewsArticle>;      Update: Partial<NewsArticle> }
      news_feeds:        { Row: NewsFeed;         Insert: Partial<NewsFeed>;         Update: Partial<NewsFeed> }
      sectors:           { Row: Sector;           Insert: Partial<Sector>;           Update: Partial<Sector> }
      imf_actions:       { Row: IMFAction;        Insert: Partial<IMFAction>;        Update: Partial<IMFAction> }
      usaid_gap_programs:{ Row: UsaidGapProgram;  Insert: Partial<UsaidGapProgram>;  Update: Partial<UsaidGapProgram> }
      overlap_records:   { Row: OverlapRecord;    Insert: Partial<OverlapRecord>;    Update: Partial<OverlapRecord> }
      salary_benchmarks: { Row: SalaryBenchmark;  Insert: Partial<SalaryBenchmark>;  Update: Partial<SalaryBenchmark> }
      consulting_firms:  { Row: ConsultingFirm;   Insert: Partial<ConsultingFirm>;   Update: Partial<ConsultingFirm> }
      psdp_items:        { Row: PsdpItem;         Insert: Partial<PsdpItem>;         Update: Partial<PsdpItem> }
      psdp_schemes:      { Row: PsdpScheme;       Insert: Partial<PsdpScheme>;       Update: Partial<PsdpScheme> }
      regulatory_entries:{ Row: RegulatoryEntry;  Insert: Partial<RegulatoryEntry>;  Update: Partial<RegulatoryEntry> }
      scraper_logs:      { Row: ScraperLog;       Insert: Partial<ScraperLog>;       Update: Partial<ScraperLog> }
      bid_pipeline:      { Row: BidPipeline;      Insert: Partial<BidPipeline>;      Update: Partial<BidPipeline> }
      bid_tasks:         { Row: BidTask;          Insert: Partial<BidTask>;          Update: Partial<BidTask> }
      contract_wins:     { Row: ContractWin;      Insert: Partial<ContractWin>;      Update: Partial<ContractWin> }
      eme_items:         { Row: EmeItem;          Insert: Partial<EmeItem>;          Update: Partial<EmeItem> }
      compliance_items:  { Row: ComplianceItem;   Insert: Partial<ComplianceItem>;   Update: Partial<ComplianceItem> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
