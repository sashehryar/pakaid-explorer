-- ================================================================
-- Migration 0005: Normalized Sectors Table
-- ================================================================

-- Create sectors table
CREATE TABLE IF NOT EXISTS public.sectors (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        UNIQUE NOT NULL,
  parent_id  uuid        REFERENCES public.sectors(id) ON DELETE SET NULL,
  slug       text        UNIQUE NOT NULL,
  sdg_aligned boolean    DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sectors_parent_id_idx ON public.sectors(parent_id);
CREATE INDEX IF NOT EXISTS sectors_slug_idx      ON public.sectors(slug);

-- RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sectors_read_all"  ON public.sectors FOR SELECT USING (true);
CREATE POLICY "sectors_admin_all" ON public.sectors FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Seed parent sectors ────────────────────────────────────────────────────────
INSERT INTO public.sectors (name, slug, sdg_aligned) VALUES
  ('Health',                                    'health',                          true),
  ('Education',                                 'education',                       true),
  ('Governance',                                'governance',                      true),
  ('Climate',                                   'climate',                         true),
  ('Energy',                                    'energy',                          true),
  ('Infrastructure',                            'infrastructure',                  true),
  ('Rural Development',                         'rural-development',               true),
  ('Agriculture',                               'agriculture',                     true),
  ('Social Protection',                         'social-protection',               true),
  ('Public Financial Management',               'public-financial-management',     true),
  ('Water and Sanitation',                      'water-and-sanitation',            true),
  ('Humanitarian Response',                     'humanitarian-response',           true),
  ('Gender Equality',                           'gender-equality',                 true),
  ('Digital Financial Inclusion',               'digital-financial-inclusion',     true),
  ('Digital Economy',                           'digital-economy',                 true),
  ('ICT for All',                               'ict-for-all',                     true),
  ('Civic Technology',                          'civic-technology',                true),
  ('Digital Government and Public Service Delivery', 'digital-government',         true)
ON CONFLICT (name) DO NOTHING;

-- ── Seed sub-sectors ───────────────────────────────────────────────────────────
-- Health sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Health')
FROM (VALUES
  ('Reproductive Health',                   'reproductive-health'),
  ('Maternal and Child Health',             'maternal-child-health'),
  ('Nutrition',                             'nutrition'),
  ('WASH in Health',                        'wash-in-health'),
  ('Mental Health',                         'mental-health'),
  ('Epidemiology and Disease Control',      'epidemiology-disease-control'),
  ('Primary Health Care',                   'primary-health-care')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Education sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Education')
FROM (VALUES
  ('Foundational Learning',                 'foundational-learning'),
  ('STEM Education',                        'stem-education'),
  ('Higher Education',                      'higher-education'),
  ('Technical and Vocational Education and Training', 'tvet'),
  ('Early Childhood Development',           'early-childhood-development'),
  ('Teacher Training',                      'teacher-training'),
  ('Education Finance',                     'education-finance')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Governance sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Governance')
FROM (VALUES
  ('Public Administration',                 'public-administration'),
  ('Anti-Corruption',                       'anti-corruption'),
  ('Parliamentary Support',                 'parliamentary-support'),
  ('Decentralisation',                      'decentralisation'),
  ('Justice and Rule of Law',               'justice-rule-of-law'),
  ('Electoral Processes',                   'electoral-processes')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Climate sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Climate')
FROM (VALUES
  ('Climate Adaptation',                    'climate-adaptation'),
  ('Climate Mitigation',                    'climate-mitigation'),
  ('Disaster Risk Reduction',               'disaster-risk-reduction'),
  ('Loss and Damage',                       'loss-and-damage')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Energy sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Energy')
FROM (VALUES
  ('Renewable Energy',                      'renewable-energy'),
  ('Energy Efficiency',                     'energy-efficiency'),
  ('Energy Access',                         'energy-access'),
  ('Transmission and Distribution',         'transmission-distribution')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Infrastructure sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Infrastructure')
FROM (VALUES
  ('Transport',                             'transport'),
  ('Urban Infrastructure',                  'urban-infrastructure'),
  ('Housing',                               'housing'),
  ('Digital Infrastructure',                'digital-infrastructure')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Rural Development sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Rural Development')
FROM (VALUES
  ('Livelihoods',                           'livelihoods'),
  ('Community Mobilisation',                'community-mobilisation'),
  ('Village Development',                   'village-development')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Agriculture sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Agriculture')
FROM (VALUES
  ('Food Security',                         'food-security'),
  ('Irrigation',                            'irrigation'),
  ('Agricultural Value Chains',             'agricultural-value-chains'),
  ('Livestock',                             'livestock'),
  ('Agricultural Finance',                  'agricultural-finance')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Social Protection sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Social Protection')
FROM (VALUES
  ('Cash Transfers',                        'cash-transfers'),
  ('Safety Nets',                           'safety-nets'),
  ('Disability Inclusion',                  'disability-inclusion'),
  ('Child Protection',                      'child-protection')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Public Financial Management sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Public Financial Management')
FROM (VALUES
  ('Tax Administration',                    'tax-administration'),
  ('Budget Transparency',                   'budget-transparency'),
  ('Audit and Accountability',              'audit-accountability'),
  ('Debt Management',                       'debt-management')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Water and Sanitation sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Water and Sanitation')
FROM (VALUES
  ('WASH',                                  'wash'),
  ('Drinking Water Supply',                 'drinking-water-supply'),
  ('Wastewater Management',                 'wastewater-management'),
  ('Solid Waste Management',                'solid-waste-management')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Humanitarian Response sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Humanitarian Response')
FROM (VALUES
  ('Emergency Relief',                      'emergency-relief'),
  ('Refugee Support',                       'refugee-support'),
  ('Early Recovery',                        'early-recovery'),
  ('Food Assistance',                       'food-assistance')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Gender Equality sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Gender Equality')
FROM (VALUES
  ('Women''s Economic Empowerment',         'womens-economic-empowerment'),
  ('Gender-Based Violence Prevention',      'gbv-prevention'),
  ('Women in Politics',                     'women-in-politics'),
  ('Girls'' Education',                     'girls-education')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Digital Financial Inclusion sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Digital Financial Inclusion')
FROM (VALUES
  ('Mobile Money',                          'mobile-money'),
  ('Agent Banking',                         'agent-banking'),
  ('Microfinance Technology',               'microfinance-technology'),
  ('Insurance Technology',                  'insurance-technology')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Digital Economy sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Digital Economy')
FROM (VALUES
  ('E-Commerce',                            'e-commerce'),
  ('Digital Skills',                        'digital-skills'),
  ('Startup Ecosystem',                     'startup-ecosystem'),
  ('Digital Trade',                         'digital-trade')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- ICT for All sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'ICT for All')
FROM (VALUES
  ('Connectivity',                          'connectivity'),
  ('Broadband Access',                      'broadband-access'),
  ('Digital Literacy',                      'digital-literacy'),
  ('Community Telecentres',                 'community-telecentres')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Civic Technology sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Civic Technology')
FROM (VALUES
  ('Open Data',                             'open-data'),
  ('Citizen Feedback',                      'citizen-feedback'),
  ('Government Portals',                    'government-portals'),
  ('Public Accountability Tools',           'public-accountability-tools')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- Digital Government sub-sectors
INSERT INTO public.sectors (name, slug, sdg_aligned, parent_id)
SELECT name, slug, true, (SELECT id FROM public.sectors WHERE name = 'Digital Government and Public Service Delivery')
FROM (VALUES
  ('E-Government',                          'e-government'),
  ('Digital Identity',                      'digital-identity'),
  ('Online Public Services',                'online-public-services'),
  ('Interoperability',                      'interoperability')
) AS t(name, slug)
ON CONFLICT (name) DO NOTHING;

-- ── Add sector_id to core tables ───────────────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL;

ALTER TABLE public.tenders
  ADD COLUMN IF NOT EXISTS sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL;

ALTER TABLE public.psdp_items
  ADD COLUMN IF NOT EXISTS sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL;

ALTER TABLE public.consulting_firms
  ADD COLUMN IF NOT EXISTS sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL;

-- ── Donor-sector join table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.donor_sectors (
  donor_id  uuid NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  sector_id uuid NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  PRIMARY KEY (donor_id, sector_id)
);

-- ── Best-effort backfill from existing text sector column ──────────────────────
UPDATE public.projects
  SET sector_id = (SELECT id FROM public.sectors WHERE name ILIKE projects.sector LIMIT 1)
  WHERE sector_id IS NULL AND sector IS NOT NULL;

UPDATE public.tenders
  SET sector_id = (SELECT id FROM public.sectors WHERE name ILIKE tenders.sector LIMIT 1)
  WHERE sector_id IS NULL AND sector IS NOT NULL;
