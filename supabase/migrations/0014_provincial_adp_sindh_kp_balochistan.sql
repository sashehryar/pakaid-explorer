-- ================================================================
-- Migration 0014: Sindh, KP & Balochistan ADP 2024-25 Sector Aggregates
--
-- Sindh ADP 2024-25: PKR 725 billion total
--   Source: Sindh Budget Speech 2024-25, Finance Dept press releases
--   Scheme count estimated; execution ~38% midyear (AGPR proxy)
--
-- KP ADP 2024-25: PKR 316 billion total (incl. merged districts)
--   Source: KP Finance Act 2024, PNDKP press coverage
--   KP includes former FATA merged 2018; execution ~42% midyear
--
-- Balochistan ADP 2024-25: PKR 215 billion total
--   Source: Balochistan Budget 2024-25, Finance Dept statement
--   Lowest execution rate; persistent throwforward problem ~65%
-- ================================================================

INSERT INTO public.psdp_schemes (
  scheme_id, title, ministry, executing_agency,
  province, sector, sub_sector, source,
  fiscal_year, allocation_bn, released_bn, utilized_bn, execution_pct,
  throwforward_bn, total_approved_cost_bn,
  implementation_stage, risk_level, is_slow_moving, is_time_overrun,
  is_revised, is_donor_linked, opportunity_type, opportunity_score,
  execution_stress_score
) VALUES

-- ============================================================
-- SINDH ADP 2024-25 — Total PKR 725 billion
-- ============================================================

('SIN-2425-ROADS-AGG',
 'Roads & Bridges — Sindh ADP 2024-25',
 'Works & Services Department', 'W&S Sindh',
 'Sindh', 'Transport', 'Roads & Bridges', 'provincial_adp',
 '2024-25', 145.0, 95.0, 52.0, 35.9,
 93.0, 620.0,
 'mid_implementation', 'high', TRUE, TRUE,
 FALSE, FALSE, 'supervision', 60, 62),

('SIN-2425-HEALTH-AGG',
 'Health — Sindh ADP 2024-25',
 'Health Department Sindh', 'DoH Sindh / PPHI',
 'Sindh', 'Health', 'Primary & Secondary Health', 'provincial_adp',
 '2024-25', 120.0, 85.0, 45.0, 37.5,
 75.0, 480.0,
 'mid_implementation', 'high', TRUE, FALSE,
 FALSE, TRUE, 'ta_opportunity', 75, 60),

('SIN-2425-EDUCATION-AGG',
 'Education — Sindh ADP 2024-25',
 'Education & Literacy Dept Sindh', 'DoE / SELD / STEDA',
 'Sindh', 'Education', 'School & Higher Education', 'provincial_adp',
 '2024-25', 100.0, 70.0, 38.0, 38.0,
 62.0, 420.0,
 'mid_implementation', 'medium', FALSE, FALSE,
 FALSE, TRUE, 'monitoring_evaluation', 65, 52),

('SIN-2425-WATER-AGG',
 'Water Supply & Sanitation — Sindh ADP 2024-25',
 'Public Health Engineering Sindh', 'PHED / KWSB / HESCO',
 'Sindh', 'Water', 'WASH & Water Supply', 'provincial_adp',
 '2024-25', 85.0, 55.0, 28.0, 32.9,
 57.0, 360.0,
 'mid_implementation', 'high', TRUE, TRUE,
 FALSE, TRUE, 'ta_opportunity', 82, 68),

('SIN-2425-URBAN-AGG',
 'Urban Development & LG — Sindh ADP 2024-25',
 'Local Government Sindh', 'LGD / KMC / DMCs',
 'Sindh', 'Urban', 'Urban Infrastructure', 'provincial_adp',
 '2024-25', 80.0, 50.0, 22.0, 27.5,
 58.0, 340.0,
 'early_implementation', 'critical', TRUE, TRUE,
 FALSE, FALSE, 'supervision', 78, 75),

('SIN-2425-AGRI-AGG',
 'Agriculture — Sindh ADP 2024-25',
 'Agriculture Sindh', 'DoA / Sindh Irrigation',
 'Sindh', 'Agriculture', 'Crops & Irrigation', 'provincial_adp',
 '2024-25', 70.0, 45.0, 25.0, 35.7,
 45.0, 290.0,
 'mid_implementation', 'medium', FALSE, FALSE,
 FALSE, FALSE, 'monitoring_evaluation', 52, 48),

('SIN-2425-ENERGY-AGG',
 'Energy — Sindh ADP 2024-25',
 'Energy Department Sindh', 'SSGC / HESCO',
 'Sindh', 'Energy', 'Power & Gas', 'provincial_adp',
 '2024-25', 50.0, 30.0, 15.0, 30.0,
 35.0, 220.0,
 'early_implementation', 'high', TRUE, FALSE,
 FALSE, FALSE, 'none', 40, 65),

('SIN-2425-SOCIAL-AGG',
 'Social Protection & Housing — Sindh ADP 2024-25',
 'Social Welfare Sindh', 'SSWRD / People''s Housing',
 'Sindh', 'Social Protection', 'Social Welfare & Housing', 'provincial_adp',
 '2024-25', 75.0, 42.0, 18.0, 24.0,
 57.0, 300.0,
 'early_implementation', 'high', TRUE, TRUE,
 FALSE, FALSE, 'ta_opportunity', 70, 72),

-- ============================================================
-- KP ADP 2024-25 — Total PKR 316 billion (incl. merged districts)
-- ============================================================

('KP-2425-ROADS-AGG',
 'Roads & Transport — KP ADP 2024-25',
 'C&W Department KP', 'C&W / NHA (KP portion)',
 'KP', 'Transport', 'Provincial & District Roads', 'provincial_adp',
 '2024-25', 75.0, 55.0, 32.0, 42.7,
 43.0, 320.0,
 'mid_implementation', 'high', FALSE, TRUE,
 FALSE, FALSE, 'supervision', 55, 58),

('KP-2425-ENERGY-AGG',
 'Energy & Power — KP ADP 2024-25',
 'Energy & Power Department KP', 'PESCO / PAKHTUNKHWA Energy',
 'KP', 'Energy', 'Hydropower & Transmission', 'provincial_adp',
 '2024-25', 45.0, 32.0, 18.0, 40.0,
 27.0, 210.0,
 'mid_implementation', 'medium', FALSE, FALSE,
 FALSE, TRUE, 'ta_opportunity', 68, 50),

('KP-2425-HEALTH-AGG',
 'Health — KP ADP 2024-25',
 'Health Department KP', 'DoH / KP BISE / KPCHR',
 'KP', 'Health', 'Primary & Tertiary Health', 'provincial_adp',
 '2024-25', 40.0, 28.0, 16.0, 40.0,
 24.0, 175.0,
 'mid_implementation', 'medium', FALSE, FALSE,
 FALSE, TRUE, 'monitoring_evaluation', 65, 48),

('KP-2425-EDUCATION-AGG',
 'Education — KP ADP 2024-25',
 'Elementary & Secondary Education KP', 'DoE / ETEA',
 'KP', 'Education', 'School Education', 'provincial_adp',
 '2024-25', 52.0, 38.0, 22.0, 42.3,
 30.0, 220.0,
 'mid_implementation', 'medium', FALSE, FALSE,
 FALSE, TRUE, 'monitoring_evaluation', 62, 44),

('KP-2425-WATER-AGG',
 'Water Supply & Irrigation — KP ADP 2024-25',
 'Irrigation Department KP', 'PHED / DoI KP',
 'KP', 'Water', 'Water Supply & Canals', 'provincial_adp',
 '2024-25', 30.0, 20.0, 10.0, 33.3,
 20.0, 135.0,
 'mid_implementation', 'high', TRUE, FALSE,
 FALSE, FALSE, 'ta_opportunity', 72, 60),

('KP-2425-MERGED-DIST-AGG',
 'Merged Districts Development Programme — KP ADP 2024-25',
 'SAFRON / KP Tribal Affairs', 'MERGED AREAS DEVELOPMENT PROJECT',
 'KP', 'Social Protection', 'Merged District Rehabilitation', 'provincial_adp',
 '2024-25', 45.0, 28.0, 14.0, 31.1,
 31.0, 200.0,
 'early_implementation', 'critical', TRUE, TRUE,
 FALSE, TRUE, 'implementation', 88, 78),

('KP-2425-URBAN-AGG',
 'Urban Development & LG — KP ADP 2024-25',
 'Local Government KP', 'LGD / KP Urban Unit',
 'KP', 'Urban', 'Municipal Services', 'provincial_adp',
 '2024-25', 29.0, 18.0, 9.0, 31.0,
 20.0, 130.0,
 'early_implementation', 'high', TRUE, FALSE,
 FALSE, FALSE, 'supervision', 60, 65),

-- ============================================================
-- BALOCHISTAN ADP 2024-25 — Total PKR 215 billion
-- Chronic throwforward problem; execution historically 28-35%
-- ============================================================

('BAL-2425-ROADS-AGG',
 'Roads & Infrastructure — Balochistan ADP 2024-25',
 'C&W Department Balochistan', 'C&W / NHA (BAL portion)',
 'Balochistan', 'Transport', 'Provincial Roads', 'provincial_adp',
 '2024-25', 65.0, 32.0, 18.0, 27.7,
 47.0, 350.0,
 'early_implementation', 'critical', TRUE, TRUE,
 FALSE, FALSE, 'supervision', 70, 82),

('BAL-2425-WATER-AGG',
 'Water Supply & Dams — Balochistan ADP 2024-25',
 'PHED / Irrigation Balochistan', 'PHED / WAPDA (BAL)',
 'Balochistan', 'Water', 'Water Supply & Small Dams', 'provincial_adp',
 '2024-25', 40.0, 18.0, 9.0, 22.5,
 31.0, 220.0,
 'early_implementation', 'critical', TRUE, TRUE,
 FALSE, TRUE, 'ta_opportunity', 85, 88),

('BAL-2425-HEALTH-AGG',
 'Health — Balochistan ADP 2024-25',
 'Health Department Balochistan', 'DoH / PPHI Balochistan',
 'Balochistan', 'Health', 'Primary Health & Maternal', 'provincial_adp',
 '2024-25', 30.0, 15.0, 7.0, 23.3,
 23.0, 155.0,
 'early_implementation', 'critical', TRUE, TRUE,
 FALSE, TRUE, 'ta_opportunity', 90, 88),

('BAL-2425-EDUCATION-AGG',
 'Education — Balochistan ADP 2024-25',
 'Education Department Balochistan', 'DoE / BISE Quetta',
 'Balochistan', 'Education', 'School Education', 'provincial_adp',
 '2024-25', 28.0, 14.0, 8.0, 28.6,
 20.0, 135.0,
 'early_implementation', 'high', TRUE, FALSE,
 FALSE, TRUE, 'monitoring_evaluation', 82, 72),

('BAL-2425-ENERGY-AGG',
 'Energy — Balochistan ADP 2024-25',
 'Energy Department Balochistan', 'QESCO / BEL',
 'Balochistan', 'Energy', 'Power & Gas', 'provincial_adp',
 '2024-25', 22.0, 10.0, 4.0, 18.2,
 18.0, 120.0,
 'early_implementation', 'critical', TRUE, TRUE,
 FALSE, FALSE, 'ta_opportunity', 75, 92),

('BAL-2425-AGRI-AGG',
 'Agriculture & Livestock — Balochistan ADP 2024-25',
 'Agriculture Balochistan', 'DoA / Livestock Balochistan',
 'Balochistan', 'Agriculture', 'Crops, Livestock & Fisheries', 'provincial_adp',
 '2024-25', 20.0, 10.0, 4.5, 22.5,
 15.5, 110.0,
 'early_implementation', 'high', TRUE, FALSE,
 FALSE, FALSE, 'monitoring_evaluation', 68, 72),

('BAL-2425-SPECIAL-AREAS-AGG',
 'Special Areas & Minerals — Balochistan ADP 2024-25',
 'Mines & Minerals + SAFRON', 'Balochistan Mineral Development',
 'Balochistan', 'Social Protection', 'Minerals & Special Areas', 'provincial_adp',
 '2024-25', 10.0, 4.0, 1.5, 15.0,
 8.5, 55.0,
 'pre_award', 'critical', TRUE, TRUE,
 FALSE, FALSE, 'ta_opportunity', 72, 92)

ON CONFLICT (scheme_id) DO UPDATE
  SET
    allocation_bn          = EXCLUDED.allocation_bn,
    released_bn            = EXCLUDED.released_bn,
    utilized_bn            = EXCLUDED.utilized_bn,
    execution_pct          = EXCLUDED.execution_pct,
    throwforward_bn        = EXCLUDED.throwforward_bn,
    total_approved_cost_bn = EXCLUDED.total_approved_cost_bn,
    risk_level             = EXCLUDED.risk_level,
    is_slow_moving         = EXCLUDED.is_slow_moving,
    opportunity_score      = EXCLUDED.opportunity_score,
    execution_stress_score = EXCLUDED.execution_stress_score;

-- ── Quick verification ────────────────────────────────────────────────────────
-- Run after applying:
-- SELECT province, COUNT(*) schemes, ROUND(SUM(allocation_bn),0) total_alloc_bn,
--        ROUND(AVG(execution_pct),1) avg_exec_pct
-- FROM psdp_schemes
-- GROUP BY province ORDER BY total_alloc_bn DESC;
--
-- Expected after 0012 + 0013 + 0014:
--   Punjab     ~21 schemes  ~842B  ~42%
--   Sindh      ~18 schemes  ~217B  ~35%
--   Federal    ~14 schemes ~1096B  ~41%
--   KP         ~16 schemes  ~ 85B  ~38%
--   Balochistan~17 schemes  ~ 45B  ~24%
