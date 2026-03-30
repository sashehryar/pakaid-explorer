-- Migration 0003: Bid Pipeline, Win Tracker, Compliance
-- Run this in Supabase SQL Editor

-- ───────────────────────────────────────────────
-- ENUMS
-- ───────────────────────────────────────────────

CREATE TYPE bid_stage AS ENUM (
  'opportunity_id',
  'go_no_go',
  'teaming',
  'writing',
  'review',
  'submitted',
  'awarded',
  'lost'
);

CREATE TYPE bid_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE task_status  AS ENUM ('open', 'in_progress', 'done', 'blocked');
CREATE TYPE eme_type     AS ENUM ('rfi', 'framework', 'forecast', 'relationship', 'meeting');
CREATE TYPE compliance_category AS ENUM (
  'accreditation', 'insurance', 'framework', 'registration',
  'certification', 'tax', 'legal', 'other'
);

-- ───────────────────────────────────────────────
-- BID PIPELINE
-- ───────────────────────────────────────────────

CREATE TABLE bid_pipeline (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             text NOT NULL,
  donor             text NOT NULL,
  sector            text,
  province          text,
  value_usd         numeric,
  stage             bid_stage NOT NULL DEFAULT 'opportunity_id',
  priority          bid_priority NOT NULL DEFAULT 'medium',
  deadline          date,
  go_no_go_date     date,
  lead_firm         text,
  partners          text[],
  win_probability   int CHECK (win_probability BETWEEN 0 AND 100),
  notes             text,
  source_url        text,
  tender_id         uuid REFERENCES tenders(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bid_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bids"
  ON bid_pipeline FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ───────────────────────────────────────────────
-- BID TASKS
-- ───────────────────────────────────────────────

CREATE TABLE bid_tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id      uuid NOT NULL REFERENCES bid_pipeline(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  assignee    text,
  due_date    date,
  status      task_status NOT NULL DEFAULT 'open',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bid_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bid tasks"
  ON bid_tasks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ───────────────────────────────────────────────
-- CONTRACT WINS
-- ───────────────────────────────────────────────

CREATE TABLE contract_wins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  donor           text NOT NULL,
  sector          text,
  province        text,
  value_usd       numeric,
  award_date      date,
  start_date      date,
  end_date        date,
  client          text,
  lead_firm       text,
  our_role        text,  -- 'Prime' | 'Sub' | 'Consortium Lead'
  bid_id          uuid REFERENCES bid_pipeline(id) ON DELETE SET NULL,
  lessons_learned text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contract_wins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wins"
  ON contract_wins FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ───────────────────────────────────────────────
-- EARLY MARKET ENGAGEMENT
-- ───────────────────────────────────────────────

CREATE TABLE eme_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text NOT NULL,
  type          eme_type NOT NULL DEFAULT 'rfi',
  donor         text,
  sector        text,
  province      text,
  value_usd     numeric,
  expected_date date,
  contact_name  text,
  contact_role  text,
  notes         text,
  action_taken  text,
  next_step     text,
  source_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE eme_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own EME items"
  ON eme_items FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ───────────────────────────────────────────────
-- COMPLIANCE TRACKER
-- ───────────────────────────────────────────────

CREATE TABLE compliance_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  category    compliance_category NOT NULL DEFAULT 'other',
  authority   text,
  reference   text,
  issued_date date,
  expiry_date date,
  renewal_url text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own compliance items"
  ON compliance_items FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ───────────────────────────────────────────────
-- TRIGGERS: updated_at
-- ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_bid_pipeline_updated_at
  BEFORE UPDATE ON bid_pipeline
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_eme_items_updated_at
  BEFORE UPDATE ON eme_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_compliance_items_updated_at
  BEFORE UPDATE ON compliance_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
