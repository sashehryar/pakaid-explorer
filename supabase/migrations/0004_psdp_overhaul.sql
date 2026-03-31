-- =====================================================================
-- Migration 0004 — PSDP Overhaul
-- Replaces the thin psdp_projects table with a full psdp_schemes table
-- that captures financial progress, execution risk, donor linkage,
-- opportunity signals, and stakeholder views.
-- =====================================================================

-- ── ENUMs ─────────────────────────────────────────────────────────────

CREATE TYPE implementation_stage AS ENUM (
  'pre_award',
  'mobilization',
  'early_implementation',
  'mid_implementation',
  'completion',
  'post_completion',
  'suspended',
  'cancelled'
);

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE opportunity_type AS ENUM (
  'ta_opportunity',
  'supervision',
  'monitoring_evaluation',
  'implementation',
  'none'
);

CREATE TYPE psdp_source AS ENUM ('federal_psdp', 'provincial_adp', 'special_program');

-- ── Main table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS psdp_schemes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  scheme_id               text UNIQUE,                -- PC-1 scheme code e.g. "PSDP-2024-001"
  title                   text NOT NULL,
  ministry                text,
  executing_agency        text,
  province                text,
  district                text,
  sector                  text,
  sub_sector              text,
  source                  psdp_source DEFAULT 'federal_psdp',
  fiscal_year             text,                       -- e.g. "2024-25"

  -- Financial progress
  allocation_bn           numeric(14,3),              -- total approved allocation PKR billions
  revised_allocation_bn   numeric(14,3),              -- if PC-1 revised
  released_bn             numeric(14,3),              -- funds released so far
  utilized_bn             numeric(14,3),              -- actual expenditure
  execution_pct           numeric(5,2),               -- utilized / released * 100
  physical_progress_pct   numeric(5,2),               -- reported physical completion %
  progress_variance       numeric(5,2),               -- physical - financial, negative = execution gap

  -- Timeline
  start_date              date,
  original_end_date       date,
  revised_end_date        date,
  is_time_overrun         boolean DEFAULT false,
  extension_count         integer DEFAULT 0,

  -- Risk signals
  implementation_stage    implementation_stage DEFAULT 'mobilization',
  risk_level              risk_level DEFAULT 'medium',
  is_slow_moving          boolean DEFAULT false,      -- <30% utilized past mid-year
  is_revised              boolean DEFAULT false,      -- scope/cost revised
  is_under_utilized       boolean DEFAULT false,      -- utilization consistently low
  warning_signals         text[],                     -- e.g. ARRAY['delayed_mobilization', 'cost_overrun']

  -- Donor / financing
  is_donor_linked         boolean DEFAULT false,
  donor_name              text,
  donor_loan_pct          numeric(5,2),               -- % of cost financed by donor
  is_ppp                  boolean DEFAULT false,

  -- Implementer
  implementer             text,
  implementer_type        text,                       -- 'TA firm', 'contractor', 'government dept'
  implementer_note        text,

  -- Opportunity signals (for firms / consultants)
  opportunity_type        opportunity_type DEFAULT 'none',
  opportunity_window      text,                       -- free-text: "Supervision contract expected Q3 2025"
  ta_value_estimate_m     numeric(10,2),              -- estimated TA value USD millions

  -- Stakeholder editorial notes
  donor_perspective       text,                       -- What this looks like from donor side
  firm_perspective        text,                       -- Entry / positioning advice for consulting firms
  implementer_perspective text,                       -- Challenges from implementer viewpoint

  -- Geographic detail
  beneficiary_count       integer,
  coverage_area_km2       numeric(12,2),
  geographic_note         text,

  -- Comparative / analytics
  prev_year_allocation_bn numeric(14,2),              -- for YoY comparison
  national_sector_share   numeric(5,2),               -- % of sector budget nationally
  province_rank           integer,                    -- rank among provinces for this sector

  -- Admin
  source_url              text,
  last_verified_at        timestamptz,
  featured                boolean DEFAULT false,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────

CREATE INDEX idx_psdp_sector          ON psdp_schemes(sector);
CREATE INDEX idx_psdp_ministry        ON psdp_schemes(ministry);
CREATE INDEX idx_psdp_province        ON psdp_schemes(province);
CREATE INDEX idx_psdp_risk_level      ON psdp_schemes(risk_level);
CREATE INDEX idx_psdp_stage           ON psdp_schemes(implementation_stage);
CREATE INDEX idx_psdp_fiscal_year     ON psdp_schemes(fiscal_year);
CREATE INDEX idx_psdp_is_slow_moving  ON psdp_schemes(is_slow_moving);
CREATE INDEX idx_psdp_donor_linked    ON psdp_schemes(is_donor_linked);
CREATE INDEX idx_psdp_opportunity     ON psdp_schemes(opportunity_type);

-- ── Updated_at trigger ────────────────────────────────────────────────

CREATE TRIGGER psdp_schemes_updated_at
  BEFORE UPDATE ON psdp_schemes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────

ALTER TABLE psdp_schemes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "psdp_schemes_read" ON psdp_schemes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can write
CREATE POLICY "psdp_schemes_admin_write" ON psdp_schemes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── Sample seed data ──────────────────────────────────────────────────

INSERT INTO psdp_schemes (
  scheme_id, title, ministry, executing_agency, province, sector, sub_sector,
  source, fiscal_year,
  allocation_bn, released_bn, utilized_bn, execution_pct, physical_progress_pct, progress_variance,
  start_date, original_end_date,
  implementation_stage, risk_level,
  is_slow_moving, is_revised, is_donor_linked, donor_name, donor_loan_pct,
  opportunity_type, opportunity_window, ta_value_estimate_m,
  implementer, implementer_type,
  donor_perspective, firm_perspective, implementer_perspective,
  warning_signals, featured, source_url
) VALUES

-- 1. Large energy project, donor-linked, TA opportunity
(
  'PSDP-2024-001',
  'Tarbela Fifth Extension Hydropower Project',
  'Ministry of Water Resources', 'WAPDA', 'KP', 'Energy', 'Hydropower',
  'federal_psdp', '2024-25',
  186.40, 94.20, 71.80, 76.2, 62.0, -14.2,
  '2020-07-01', '2026-06-30',
  'mid_implementation', 'medium',
  false, false, true, 'World Bank', 70.0,
  'supervision', 'Supervision consultant contract renewal due Q4 2025, est. $8M', 8.0,
  'NESPAK + SMEC JV', 'TA firm',
  'World Bank monitoring closely; disbursement contingent on quarterly progress reports. Safeguard compliance is a key concern.',
  'Supervision contract up for renewal — position now. Track tender on WAPDA procurement portal. SMEC relationship key.',
  'Main implementation risk is tunnel boring in fractured rock; 2 extensions already granted.',
  ARRAY['physical_lag', 'extension_risk'],
  true, 'https://psdp.finance.gov.pk'
),

-- 2. Slow-moving education project
(
  'PSDP-2024-002',
  'Higher Education Development in Punjab',
  'Ministry of Federal Education', 'HEC', 'Punjab', 'Education', 'Higher Education',
  'federal_psdp', '2024-25',
  12.50, 8.20, 3.10, 37.8, 28.0, -9.8,
  '2022-01-01', '2025-06-30',
  'mid_implementation', 'high',
  true, true, false, null, null,
  'monitoring_evaluation', 'M&E consultancy likely required before project extension approval', 2.0,
  'HEC Secretariat', 'government dept',
  'Donors tracking this as a reform marker. Low execution signals political will issues.',
  'M&E assignment likely before extension decision. Engage HEC planning wing now.',
  'Procurement delays, low institutional capacity. Staff turnover in PMU.',
  ARRAY['slow_disbursement', 'pmu_weakness', 'under_utilized'],
  false, null
),

-- 3. Health project, ADB-linked, near completion
(
  'PSDP-2024-003',
  'Sindh Secondary Healthcare Strengthening Program',
  'Ministry of National Health Services', 'DoH Sindh', 'Sindh', 'Health', 'Secondary Healthcare',
  'provincial_adp', '2024-25',
  8.70, 8.50, 8.20, 96.5, 91.0, -5.5,
  '2021-04-01', '2025-03-31',
  'completion', 'low',
  false, false, true, 'ADB', 60.0,
  'ta_opportunity', 'Next phase TA design expected — $3–5M, procurement to start late 2025', 4.0,
  'Management Sciences for Health', 'TA firm',
  'ADB pleased with progress; Phase 2 design under discussion. Strong candidate for follow-on.',
  'Phase 2 design consultancy — track ADB Pakistan pipeline. MSH positioned for follow-on.',
  'Completing on time. Sustainability plan under development for district health systems.',
  ARRAY[]::text[],
  true, null
),

-- 4. Infrastructure, critical risk
(
  'PSDP-2024-004',
  'Karachi Circular Railway Revival',
  'Ministry of Railways', 'Pakistan Railways', 'Sindh', 'Transport', 'Urban Rail',
  'federal_psdp', '2024-25',
  75.30, 12.40, 4.20, 33.9, 11.0, -22.9,
  '2019-07-01', '2024-06-30',
  'early_implementation', 'critical',
  true, true, true, 'China Exim Bank', 80.0,
  'none', null, null,
  'China Exim Bank', 'contractor',
  'Donor frustrated by land acquisition delays. Loan drawdown is 8% of schedule.',
  'Avoid this project — no TA opportunity and political risk is very high.',
  'Land acquisition stuck in Sindh–Federal dispute. Site access restricted in 3 zones.',
  ARRAY['land_acquisition', 'political_dispute', 'cost_overrun', 'extension_risk'],
  false, null
),

-- 5. Agriculture, small, provincial ADP
(
  'PSDP-2024-005',
  'KP Livestock Development and Disease Control',
  'Agriculture Department KP', 'Livestock Dept KP', 'KP', 'Agriculture', 'Livestock',
  'provincial_adp', '2024-25',
  1.85, 1.60, 1.45, 90.6, 85.0, -5.6,
  '2023-07-01', '2025-06-30',
  'completion', 'low',
  false, false, false, null, null,
  'none', null, null,
  'Livestock Department KP', 'government dept',
  null,
  'No significant consulting opportunity, but useful for understanding KP livestock sector baseline.',
  'On track; field teams active. Minor procurement delays for vaccines.',
  ARRAY[]::text[],
  false, null
),

-- 6. Water, climate-linked, TA opportunity
(
  'PSDP-2024-006',
  'National Water Efficiency and Productivity Enhancement',
  'Ministry of Water Resources', 'PCRWR', 'National', 'Water', 'Irrigation & Drainage',
  'federal_psdp', '2024-25',
  22.60, 9.40, 5.80, 61.7, 44.0, -17.7,
  '2022-01-01', '2026-12-31',
  'mid_implementation', 'high',
  true, false, true, 'GCF', 55.0,
  'ta_opportunity', 'Mid-term review consultancy expected late 2025; GCF requires independent MTR', 1.5,
  'NESPAK', 'TA firm',
  'GCF flagging physical-financial gap. Independent MTR required before next tranche release.',
  'Position for MTR contract — GCF-registered firms preferred. Contact PCRWR PMU.',
  'Data collection systems weak. Field teams underperforming in Balochistan component.',
  ARRAY['physical_lag', 'data_quality', 'component_underperformance'],
  true, null
);
