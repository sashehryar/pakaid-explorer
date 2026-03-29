-- PakAid Explorer — Production Schema
-- Run this in Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────
-- TYPES
-- ─────────────────────────────────────────────────────────────
CREATE TYPE public.user_tier     AS ENUM ('free', 'pro', 'institutional');
CREATE TYPE public.user_role     AS ENUM ('user', 'admin');
CREATE TYPE public.funding_status AS ENUM ('active', 'closing', 'closed', 'frozen', 'pipeline');
CREATE TYPE public.tender_status  AS ENUM ('open', 'evaluation', 'awarded', 'cancelled');
CREATE TYPE public.fill_level     AS ENUM ('Full', 'Partial', 'None');
CREATE TYPE public.imf_status     AS ENUM ('green', 'amber', 'red');
CREATE TYPE public.firm_trend     AS ENUM ('Growing', 'Stable', 'Contracting');
CREATE TYPE public.scraper_status AS ENUM ('healthy', 'failing', 'disabled', 'running');
CREATE TYPE public.complexity     AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE public.psdp_risk      AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.psdp_category  AS ENUM ('federal', 'provincial', 'ministry');


-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES (extends auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email        TEXT,
  full_name    TEXT,
  organisation TEXT,
  tier         user_tier DEFAULT 'free',
  role         user_role DEFAULT 'user',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 2. PROJECTS (Funding Intelligence + Expiry)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  donor            TEXT NOT NULL,
  sector           TEXT NOT NULL,
  province         TEXT,
  amount_usd       NUMERIC,
  status           funding_status DEFAULT 'active',
  instrument       TEXT,                        -- 'Loan' | 'Grant' | 'TA' | 'Humanitarian'
  start_date       DATE,
  end_date         DATE,
  implementer      TEXT,
  iati_id          TEXT UNIQUE,
  context_note     TEXT,                        -- editorial: why this matters
  opportunity_note TEXT,                        -- editorial: action to take
  source_url       TEXT,
  source           TEXT NOT NULL DEFAULT 'WB',  -- 'WB' | 'ADB' | 'IATI' | 'FCDO' | 'GIZ' | 'EU' | 'JICA'
  featured         BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_sector   ON public.projects(sector);
CREATE INDEX idx_projects_province ON public.projects(province);
CREATE INDEX idx_projects_status   ON public.projects(status);
CREATE INDEX idx_projects_end_date ON public.projects(end_date);
CREATE INDEX idx_projects_donor    ON public.projects(donor);
CREATE INDEX idx_projects_source   ON public.projects(source);


-- ─────────────────────────────────────────────────────────────
-- 3. TENDERS (Procurement)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.tenders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  donor            TEXT NOT NULL,
  sector           TEXT,
  province         TEXT,
  value_usd        NUMERIC,
  deadline         DATE,
  days_left        INTEGER,
  status           tender_status DEFAULT 'open',
  instrument       TEXT,
  implementer      TEXT,
  positioning_note TEXT,
  source_url       TEXT,
  source           TEXT NOT NULL DEFAULT 'WB',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenders_status   ON public.tenders(status);
CREATE INDEX idx_tenders_sector   ON public.tenders(sector);
CREATE INDEX idx_tenders_deadline ON public.tenders(deadline);


-- ─────────────────────────────────────────────────────────────
-- 4. DONORS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.donors (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL UNIQUE,
  type                 TEXT,                 -- 'MDB' | 'Bilateral' | 'UN' | 'Climate' | 'Private'
  country              TEXT,
  active_projects      INTEGER DEFAULT 0,
  volume_label         TEXT,
  historical_volume_usd NUMERIC,
  instrument           TEXT,
  sectors              TEXT[],
  provinces            TEXT[],
  opportunity_note     TEXT,
  pain_point           TEXT,
  entry_path           TEXT,
  procurement_model    TEXT,
  website              TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- 5. JOBS (Careers)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  organisation    TEXT NOT NULL,
  org_type        TEXT,                -- 'UN' | 'INGO' | 'Consulting' | 'Local NGO'
  location        TEXT,
  employment_type TEXT,                -- 'Full-time' | 'Consultant' | 'Part-time'
  seniority       TEXT,
  sector          TEXT,
  salary_label    TEXT,
  apply_url       TEXT,
  description     TEXT,
  deadline        DATE,
  source          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_seniority ON public.jobs(seniority);
CREATE INDEX idx_jobs_sector    ON public.jobs(sector);
CREATE INDEX idx_jobs_deadline  ON public.jobs(deadline);


-- ─────────────────────────────────────────────────────────────
-- 6. NEWS ARTICLES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.news_articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  source       TEXT NOT NULL,
  source_color TEXT,
  topic        TEXT,
  topic_color  TEXT,
  excerpt      TEXT,
  full_text    TEXT,
  url          TEXT,
  featured     BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_topic        ON public.news_articles(topic);
CREATE INDEX idx_news_published_at ON public.news_articles(published_at DESC);


-- ─────────────────────────────────────────────────────────────
-- 7. IMF PRIOR ACTIONS (Political & Donor Intel)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.imf_actions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region            TEXT NOT NULL,
  action            TEXT NOT NULL,
  deadline          DATE,
  status            imf_status NOT NULL DEFAULT 'amber',
  intelligence_note TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_imf_region ON public.imf_actions(region);
CREATE INDEX idx_imf_status ON public.imf_actions(status);


-- ─────────────────────────────────────────────────────────────
-- 8. POST-USAID GAP PROGRAMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.usaid_gap_programs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  sector      TEXT NOT NULL,
  value_usd   NUMERIC NOT NULL,
  end_date    DATE,
  fill_level  fill_level NOT NULL DEFAULT 'None',
  fill_source TEXT,
  gap_usd     NUMERIC DEFAULT 0,
  gap_note    TEXT,
  implementer TEXT,
  province    TEXT,
  status      TEXT DEFAULT 'frozen',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- 9. OVERLAP RECORDS (Duplicate Checker reference DB)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.overlap_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iati_id     TEXT UNIQUE,
  title       TEXT NOT NULL,
  donor       TEXT NOT NULL,
  implementer TEXT,
  sector      TEXT NOT NULL,
  province    TEXT,
  instrument  TEXT,
  start_date  DATE,
  end_date    DATE,
  amount_usd  NUMERIC,
  keywords    TEXT[],
  source      TEXT NOT NULL DEFAULT 'IATI',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_overlap_sector   ON public.overlap_records(sector);
CREATE INDEX idx_overlap_province ON public.overlap_records(province);


-- ─────────────────────────────────────────────────────────────
-- 10. SALARY BENCHMARKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.salary_benchmarks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role           TEXT NOT NULL,
  level          TEXT,
  min_pkr        NUMERIC,
  max_pkr        NUMERIC,
  usd_equivalent TEXT,
  notes          TEXT
);


-- ─────────────────────────────────────────────────────────────
-- 11. CONSULTING FIRMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.consulting_firms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL UNIQUE,
  type             TEXT,
  trend            firm_trend NOT NULL DEFAULT 'Stable',
  hiring_status    TEXT,
  editorial_note   TEXT,
  headcount        TEXT,
  revenue_signal   TEXT,
  active_contracts INTEGER DEFAULT 0,
  key_programmes   TEXT[],
  donors           TEXT[],
  opportunity_note TEXT,
  risk_note        TEXT,
  website          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- 12. PSDP ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.psdp_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      psdp_category NOT NULL,
  name          TEXT NOT NULL,
  allocation_bn NUMERIC NOT NULL,
  released_bn   NUMERIC,
  spent_bn      NUMERIC NOT NULL,
  execution_pct INTEGER NOT NULL,
  target_pct    INTEGER,
  province      TEXT,
  risk          psdp_risk,
  key_project   TEXT,
  note          TEXT,
  fiscal_year   TEXT NOT NULL DEFAULT '2025-26',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- 13. REGULATORY ENTRIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.regulatory_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category     TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  authority    TEXT,
  last_updated TEXT,
  complexity   complexity NOT NULL DEFAULT 'Medium',
  tags         TEXT[],
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_regulatory_category ON public.regulatory_entries(category);


-- ─────────────────────────────────────────────────────────────
-- 14. SCRAPER LOGS (Admin)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.scraper_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  target_url        TEXT,
  apify_actor_id    TEXT,
  status            scraper_status DEFAULT 'healthy',
  last_run          TIMESTAMPTZ,
  next_run          TIMESTAMPTZ,
  records_last_run  INTEGER DEFAULT 0,
  error_message     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 15. DUPLICATION CHECKS (user history)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.duplication_checks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  proposal_title TEXT NOT NULL,
  sector         TEXT,
  province       TEXT,
  keywords       TEXT[],
  results        JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imf_actions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usaid_gap_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overlap_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_firms  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psdp_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplication_checks ENABLE ROW LEVEL SECURITY;

-- Profiles: users manage their own
CREATE POLICY "profiles_own"  ON public.profiles FOR ALL USING (auth.uid() = id);

-- Core data: authenticated users can read
CREATE POLICY "projects_read"          ON public.projects           FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tenders_read"           ON public.tenders            FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "donors_read"            ON public.donors             FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "jobs_read"              ON public.jobs               FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "news_read"              ON public.news_articles      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "imf_read"               ON public.imf_actions        FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "usaid_read"             ON public.usaid_gap_programs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "overlap_read"           ON public.overlap_records    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "salary_read"            ON public.salary_benchmarks  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "firms_read"             ON public.consulting_firms   FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "psdp_read"              ON public.psdp_items         FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "regulatory_read"        ON public.regulatory_entries FOR SELECT USING (auth.role() = 'authenticated');

-- Admin: full access to all tables
CREATE POLICY "admin_all_projects"    ON public.projects           FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_tenders"     ON public.tenders            FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_donors"      ON public.donors             FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_jobs"        ON public.jobs               FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_news"        ON public.news_articles      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_imf"         ON public.imf_actions        FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_usaid"       ON public.usaid_gap_programs FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_overlap"     ON public.overlap_records    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_salary"      ON public.salary_benchmarks  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_firms"       ON public.consulting_firms   FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_psdp"        ON public.psdp_items         FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_regulatory"  ON public.regulatory_entries FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_scrapers"    ON public.scraper_logs       FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Duplication checks: user owns their own
CREATE POLICY "dup_checks_own" ON public.duplication_checks FOR ALL USING (user_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated      BEFORE UPDATE ON public.profiles          FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER trg_projects_updated      BEFORE UPDATE ON public.projects          FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER trg_tenders_updated       BEFORE UPDATE ON public.tenders           FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER trg_donors_updated        BEFORE UPDATE ON public.donors            FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER trg_imf_updated           BEFORE UPDATE ON public.imf_actions       FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER trg_usaid_updated         BEFORE UPDATE ON public.usaid_gap_programs FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER trg_firms_updated         BEFORE UPDATE ON public.consulting_firms  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER trg_scrapers_updated      BEFORE UPDATE ON public.scraper_logs      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
