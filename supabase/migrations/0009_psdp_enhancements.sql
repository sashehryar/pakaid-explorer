-- ================================================================
-- Migration 0009: PSDP Enhancements
-- Adds throwforward, opportunity score, execution stress score,
-- province efficiency view, and longitudinal year fields.
-- Author: Syed Ali Shehryar
-- ================================================================

-- ── Add missing columns to psdp_schemes ─────────────────────────────────────

-- Throwforward: uncommitted future liability (total cost minus cumulative expenditure)
ALTER TABLE public.psdp_schemes
  ADD COLUMN IF NOT EXISTS throwforward_bn            float,
  ADD COLUMN IF NOT EXISTS cumulative_expenditure_bn  float,
  ADD COLUMN IF NOT EXISTS total_approved_cost_bn     float,
  ADD COLUMN IF NOT EXISTS completion_year            integer,
  ADD COLUMN IF NOT EXISTS pc1_revision_count         integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS years_in_portfolio         integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS release_bn                 float,
  ADD COLUMN IF NOT EXISTS opportunity_score          float,  -- 0-100 ICP opportunity score
  ADD COLUMN IF NOT EXISTS execution_stress_score     float,  -- 0-100 execution stress
  ADD COLUMN IF NOT EXISTS pslm_outcome_gap_note      text,   -- derived sector gap narrative
  ADD COLUMN IF NOT EXISTS lfs_labour_gap_note        text,   -- derived labour gap narrative
  ADD COLUMN IF NOT EXISTS macro_fit_note             text;   -- economic survey alignment note

-- ── Computed opportunity_score formula ──────────────────────────────────────
-- Score = 25% low execution + 25% PSLM outcome proxy + 25% labour stress + 25% macro fit
-- We store a computed float using available execution data as proxy for the full 4-factor score.
-- Full cross-referencing with PSLM/LFS is done in the UI layer via derived views.

-- Populate opportunity_score from existing data where execution data exists
UPDATE public.psdp_schemes
SET opportunity_score = LEAST(100, GREATEST(0,
  -- Low execution component (25 pts): score inversely with execution %
  (CASE WHEN execution_pct IS NULL THEN 12.5
        WHEN execution_pct < 30    THEN 25
        WHEN execution_pct < 50    THEN 20
        WHEN execution_pct < 70    THEN 12
        ELSE 5
   END)
  +
  -- Risk level component (25 pts proxy for PSLM outcome need)
  (CASE risk_level
        WHEN 'critical' THEN 25
        WHEN 'high'     THEN 20
        WHEN 'medium'   THEN 12
        ELSE 5
   END)
  +
  -- Slow moving / time overrun component (25 pts proxy for labour/delivery stress)
  (CASE WHEN is_slow_moving AND is_time_overrun THEN 25
        WHEN is_slow_moving OR  is_time_overrun  THEN 18
        ELSE 5
   END)
  +
  -- Opportunity type component (25 pts macro fit)
  (CASE opportunity_type
        WHEN 'ta_opportunity'        THEN 25
        WHEN 'supervision'           THEN 22
        WHEN 'monitoring_evaluation' THEN 18
        WHEN 'implementation'        THEN 15
        ELSE 5
   END)
))
WHERE opportunity_score IS NULL;

-- Populate execution_stress_score
UPDATE public.psdp_schemes
SET execution_stress_score = LEAST(100, GREATEST(0,
  (CASE WHEN execution_pct IS NULL THEN 50
        WHEN execution_pct < 20    THEN 95
        WHEN execution_pct < 40    THEN 80
        WHEN execution_pct < 60    THEN 60
        WHEN execution_pct < 80    THEN 30
        ELSE 10
   END)
  +
  (CASE WHEN extension_count >= 3 THEN 20
        WHEN extension_count = 2  THEN 12
        WHEN extension_count = 1  THEN 6
        ELSE 0
   END)
  +
  (CASE WHEN is_time_overrun THEN 10 ELSE 0 END)
))
WHERE execution_stress_score IS NULL;

-- Populate throwforward from available allocation/utilization data
UPDATE public.psdp_schemes
SET throwforward_bn = GREATEST(0, (allocation_bn - COALESCE(utilized_bn, 0)))
WHERE throwforward_bn IS NULL AND allocation_bn IS NOT NULL;

-- ── Province-level summary view ──────────────────────────────────────────────
CREATE OR REPLACE VIEW public.psdp_province_summary AS
SELECT
  COALESCE(province, 'Federal') AS province,
  COUNT(*)                                                      AS scheme_count,
  ROUND(SUM(COALESCE(allocation_bn, 0))::numeric, 2)           AS total_allocation_bn,
  ROUND(SUM(COALESCE(utilized_bn, 0))::numeric, 2)             AS total_utilized_bn,
  ROUND(AVG(COALESCE(execution_pct, 0))::numeric, 1)           AS avg_execution_pct,
  ROUND(SUM(COALESCE(throwforward_bn, 0))::numeric, 2)         AS total_throwforward_bn,
  COUNT(*) FILTER (WHERE is_slow_moving)                        AS slow_moving_count,
  COUNT(*) FILTER (WHERE risk_level IN ('high','critical'))     AS high_risk_count,
  COUNT(*) FILTER (WHERE is_donor_linked)                       AS donor_linked_count,
  ROUND(AVG(COALESCE(opportunity_score, 0))::numeric, 1)       AS avg_opportunity_score,
  ROUND(AVG(COALESCE(execution_stress_score, 0))::numeric, 1)  AS avg_stress_score
FROM public.psdp_schemes
GROUP BY COALESCE(province, 'Federal');

-- ── Ministry/department efficiency view ─────────────────────────────────────
CREATE OR REPLACE VIEW public.psdp_ministry_efficiency AS
SELECT
  COALESCE(ministry, 'Unknown') AS ministry,
  COUNT(*)                                                      AS scheme_count,
  ROUND(SUM(COALESCE(allocation_bn, 0))::numeric, 2)           AS total_allocation_bn,
  ROUND(SUM(COALESCE(utilized_bn, 0))::numeric, 2)             AS total_utilized_bn,
  ROUND(AVG(COALESCE(execution_pct, 0))::numeric, 1)           AS avg_execution_pct,
  ROUND(SUM(COALESCE(throwforward_bn, 0))::numeric, 2)         AS total_throwforward_bn,
  COUNT(*) FILTER (WHERE is_slow_moving)                        AS slow_moving_count,
  ROUND(AVG(COALESCE(opportunity_score, 0))::numeric, 1)       AS avg_opportunity_score,
  -- Backlog burden: throwforward as % of allocation
  ROUND(
    CASE WHEN SUM(COALESCE(allocation_bn, 0)) > 0
         THEN (SUM(COALESCE(throwforward_bn, 0)) / SUM(COALESCE(allocation_bn, 0)) * 100)
         ELSE 0 END::numeric, 1
  ) AS backlog_pct
FROM public.psdp_schemes
GROUP BY COALESCE(ministry, 'Unknown')
ORDER BY total_allocation_bn DESC;

-- ── Sector gap intelligence view ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.psdp_sector_intelligence AS
SELECT
  COALESCE(sector, 'Uncategorised') AS sector,
  COUNT(*)                                                      AS scheme_count,
  ROUND(SUM(COALESCE(allocation_bn, 0))::numeric, 2)           AS total_allocation_bn,
  ROUND(SUM(COALESCE(utilized_bn, 0))::numeric, 2)             AS total_utilized_bn,
  ROUND(AVG(COALESCE(execution_pct, 0))::numeric, 1)           AS avg_execution_pct,
  ROUND(SUM(COALESCE(throwforward_bn, 0))::numeric, 2)         AS total_throwforward_bn,
  COUNT(*) FILTER (WHERE opportunity_type != 'none')           AS schemes_with_opportunities,
  ROUND(AVG(COALESCE(opportunity_score, 0))::numeric, 1)       AS avg_opportunity_score,
  ROUND(AVG(COALESCE(execution_stress_score, 0))::numeric, 1)  AS avg_stress_score,
  COUNT(*) FILTER (WHERE is_donor_linked)                       AS donor_linked_count
FROM public.psdp_schemes
GROUP BY COALESCE(sector, 'Uncategorised')
ORDER BY total_allocation_bn DESC;

-- Grant SELECT on views to authenticated users
GRANT SELECT ON public.psdp_province_summary   TO authenticated;
GRANT SELECT ON public.psdp_ministry_efficiency TO authenticated;
GRANT SELECT ON public.psdp_sector_intelligence  TO authenticated;
