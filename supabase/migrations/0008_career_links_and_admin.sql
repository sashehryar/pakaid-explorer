-- ============================================================
-- 0008: Career scraping links + admin data management support
-- Author: Syed Ali Shehryar
-- ============================================================

-- Career scraping links table
CREATE TABLE IF NOT EXISTS career_scraping_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  url         text NOT NULL UNIQUE,
  category    text NOT NULL DEFAULT 'general',   -- reliefweb | impactpool | devex | general
  is_active   boolean NOT NULL DEFAULT true,
  notes       text,
  last_scraped_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed career scraping links
INSERT INTO career_scraping_links (name, url, category, notes) VALUES
  ('ReliefWeb Jobs',               'https://reliefweb.int/jobs',                                                                        'reliefweb',  'Main humanitarian job board'),
  ('Impactpool',                   'https://www.impactpool.org/search',                                                                  'impactpool',  'International development jobs'),
  ('GenderJobs',                   'https://genderjobs.org/jobs',                                                                        'general',     'Gender-focused development roles'),
  ('Bond UK Jobs',                 'https://my.bond.org.uk/s/jobs?language=en_US',                                                       'general',     'UK NGO sector jobs'),
  ('Global Charity Jobs',          'https://globalcharityjobs.com/',                                                                     'general',     'Global charity and NGO roles'),
  ('Global South Opportunities',   'https://www.globalsouthopportunities.com/category/jobs/',                                            'general',     'Opportunities focused on Global South'),
  ('Devex Pakistan',               'https://www.devex.com/jobs/search?filter%5Blocations%5D%5B%5D=Pakistan&sorting%5Border%5D=desc',   'devex',       'Devex jobs filtered to Pakistan'),
  ('UNDP Pakistan Jobs',           'https://www.undp.org/pakistan/jobs',                                                                 'un',          'UNDP Pakistan specific vacancies'),
  ('UNICEF Pakistan Jobs',         'https://www.unicef.org/pakistan/careers',                                                            'un',          'UNICEF Pakistan vacancies'),
  ('World Bank Jobs',              'https://www.worldbank.org/en/about/careers',                                                         'multilateral','World Bank careers portal'),
  ('ADB Careers',                  'https://www.adb.org/work-with-us/careers',                                                           'multilateral','Asian Development Bank careers'),
  ('FCDO Jobs',                    'https://www.gov.uk/government/organisations/foreign-commonwealth-development-office/about/recruitment','bilateral',  'UK FCDO recruitment'),
  ('GIZ Jobs',                     'https://www.giz.de/en/jobs/index.html',                                                              'bilateral',   'German GIZ careers'),
  ('JICA Jobs',                    'https://www.jica.go.jp/english/about/recruit/index.html',                                            'bilateral',   'Japan JICA careers'),
  ('USAID Jobs',                   'https://www.usajobs.gov/Search/Results?a=USAID',                                                     'bilateral',   'USAID USAJobs postings'),
  ('Aga Khan Development Network', 'https://www.akdn.org/careers',                                                                       'ngo',         'AKDN across all entities'),
  ('IRC Jobs Pakistan',            'https://rescue.org/careers',                                                                         'ngo',         'International Rescue Committee'),
  ('Save the Children Pakistan',   'https://www.savethechildren.net/careers',                                                            'ngo',         'STC global careers'),
  ('Mercy Corps',                  'https://www.mercycorps.org/careers',                                                                 'ngo',         'Mercy Corps global careers'),
  ('Oxfam Jobs',                   'https://jobs.oxfam.org.uk/',                                                                         'ngo',         'Oxfam GB careers portal')
ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes,
  updated_at = now();

-- Enable RLS
ALTER TABLE career_scraping_links ENABLE ROW LEVEL SECURITY;

-- Admins can do everything; authenticated users can read
CREATE POLICY "career_links_admin" ON career_scraping_links
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "career_links_read" ON career_scraping_links
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Allow service role full access (for scrapers)
CREATE POLICY "career_links_service" ON career_scraping_links
  FOR ALL TO service_role
  USING (true);

-- ── Ensure scraper_logs table exists (may not be in previous migrations) ──
CREATE TABLE IF NOT EXISTS scraper_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL UNIQUE,
  target_url       text,
  status           text NOT NULL DEFAULT 'idle',   -- idle | running | healthy | failing
  last_run         timestamptz,
  records_last_run integer DEFAULT 0,
  error_message    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scraper_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logs_admin" ON scraper_logs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "logs_service" ON scraper_logs
  FOR ALL TO service_role USING (true);
