-- ================================================================
-- Migration 0006: RSS News Feeds Table + Scoring Columns
-- ================================================================

-- Create news_feeds table
CREATE TABLE IF NOT EXISTS public.news_feeds (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_name        text        NOT NULL,
  feed_url         text        UNIQUE NOT NULL,
  category         text,
  description      text,
  website          text,
  is_active        boolean     DEFAULT true,
  is_pakistan_priority boolean DEFAULT false,
  last_fetched_at  timestamptz,
  last_item_count  int,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_feeds_active_priority_idx ON public.news_feeds(is_active, is_pakistan_priority);

-- RLS
ALTER TABLE public.news_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_feeds_read_all"  ON public.news_feeds FOR SELECT USING (true);
CREATE POLICY "news_feeds_admin_all" ON public.news_feeds FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add scoring + AI summary columns to news_articles
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS feed_id          uuid REFERENCES public.news_feeds(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recency_score    float,
  ADD COLUMN IF NOT EXISTS relevance_score  float,
  ADD COLUMN IF NOT EXISTS composite_score  float,
  ADD COLUMN IF NOT EXISTS what_happened    text,
  ADD COLUMN IF NOT EXISTS why_it_matters   text,
  ADD COLUMN IF NOT EXISTS potential_action text;

CREATE INDEX IF NOT EXISTS news_articles_composite_score_idx ON public.news_articles(composite_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS news_articles_feed_id_idx         ON public.news_articles(feed_id);

-- ── Seed all 47 RSS feeds ──────────────────────────────────────────────────────
INSERT INTO public.news_feeds (feed_name, feed_url, category, description, website, is_active, is_pakistan_priority) VALUES

-- Pakistan-Specific (highest priority)
('Tribune Economy',          'https://tribune.com.pk/rss',                                        'Pakistan-Specific',         'Pakistan economic and development news',                            'tribune.com.pk',                      true, true),
('UNDP Pakistan',            'https://www.undp.org/pakistan/news/rss',                            'Pakistan-Specific',         'UNDP Pakistan governance and development updates',                  'undp.org/pakistan',                   true, true),
('PBS Stats',                'https://www.pbs.gov.pk/rss',                                        'Pakistan-Specific',         'Pakistan Bureau of Statistics data releases',                       'pbs.gov.pk',                          true, true),
('SBP Pakistan',             'https://www.sbp.org.pk/rss',                                        'Economic Development',      'State Bank of Pakistan monetary policy updates',                    'sbp.org.pk',                          true, true),
('DevAid Tenders',           'https://developmentaid.org/api/frontend/tender/rss',                'Pakistan-Specific',         'Development aid grants and tenders',                                'developmentaid.org',                  true, true),

-- International Development
('From Poverty to Power',    'https://frompoverty.oxfam.org.uk/feed',                             'International Development',  'Oxfam policy and power dynamics blog',                              'frompoverty.oxfam.org.uk',            true, false),
('IDEAS',                    'https://ideas-global.org/feed',                                      'International Development',  'Development evaluations and impact',                                'ideas-global.org',                    true, false),
('IDRC',                     'https://www.idrc-crdi.ca/en/news/rss',                              'International Development',  'International Development Research Centre funding',                 'idrc-crdi.ca',                        true, false),
('USAID',                    'https://www.usaid.gov/rss',                                          'International Development',  'USAID aid projects and announcements',                              'usaid.gov',                           true, false),
('CGD',                      'https://www.cgdev.org/page/rss',                                    'International Development',  'Center for Global Development analysis',                            'cgdev.org',                           true, false),

-- Economic Development
('UN Economic Development',  'https://news.un.org/feed/subscribe/en/news/topic/economic-development/feed/rss.xml', 'Economic Development', 'UN economic progress stories',               'news.un.org',                         true, false),
('Developing Economics',     'https://developingeconomics.org/feed',                              'Economic Development',       'Alternative development economics views',                           'developingeconomics.org',             true, false),
('IEDC',                     'https://www.iedconline.org/blog/rss',                               'Economic Development',       'International Economic Development Council trends',                 'iedconline.org',                      true, false),

-- Aid / Socio-Economic
('UN Humanitarian',          'https://news.un.org/en/rss',                                        'Aid/Socio-Econ',            'UN humanitarian crises coverage',                                   'news.un.org',                         true, false),

-- Global Funds
('Global Fund',              'https://www.theglobalfund.org/en/site/rss/latest',                  'Global Funds',              'Global Fund health funding updates',                                'theglobalfund.org',                   true, false),
('Gavi Vaccines Work',       'https://www.gavi.org/vaccineswork/rss.xml',                         'Global Funds',              'Gavi vaccine access stories',                                       'gavi.org',                            true, false),
('GPE Education',            'https://www.globalpartnership.org/rss.xml',                         'Global Funds',              'Global Partnership for Education updates',                          'globalpartnership.org',               true, false),
('World Bank PSD Blog',      'https://feeds.feedburner.com/PSDBlog',                              'Global Funds',              'World Bank private sector development blog',                        'blogs.worldbank.org/psd',             true, false),
('ADB',                      'https://www.adb.org/rss',                                           'Global Funds',              'Asian Development Bank projects and news',                          'adb.org',                             true, false),

-- Climate
('Yale Climate Connections', 'https://yaleclimateconnections.org/feed',                           'Climate',                   'Yale climate change reporting and analysis',                         'yaleclimateconnections.org',          true, false),
('Nature Climate Change',    'https://www.nature.com/nclimate.rss',                               'Climate',                   'Nature journal climate science articles',                           'nature.com/nclimate',                 true, false),
('PBL Climate Policy',       'https://www.pbl.nl/en/feed/topic/16/article/rss.xml',               'Climate',                   'PBL Netherlands energy and climate policy',                         'pbl.nl',                              true, false),

-- Health
('Global Fund News',         'https://www.theglobalfund.org/en/site/rss/news',                    'Health',                    'Global Fund disease funding news',                                  'theglobalfund.org',                   true, false),
('Gavi Releases',            'https://www.gavi.org/rss/news',                                     'Health',                    'Gavi press releases on vaccine access',                             'gavi.org',                            true, false),

-- Governance/Reforms
('UNDP Governance',          'https://www.undp.org/rss/governance',                               'Governance/Reforms',        'UNDP governance and institutional updates',                         'undp.org',                            true, false),

-- Social Protection
('DSS Australia',            'https://www.dss.gov.au/news/rss',                                   'Social Protection',         'Australia DSS welfare and resources model',                         'dss.gov.au',                          true, false),

-- Poverty
('CARE Fighting Poverty',    'https://www.care.org/rss',                                          'Poverty',                   'CARE humanitarian aid coverage',                                    'care.org',                            true, false),
('Food for the Hungry',      'https://www.fh.org/blog/feed',                                      'Poverty',                   'Food for the Hungry community poverty work',                        'fh.org/blog',                         true, false),
('Spotlight on Poverty',     'https://www.spotlightonpoverty.org/rss',                            'Poverty',                   'Spotlight on Poverty research and opportunity',                     'spotlightonpoverty.org',              true, false),

-- Population
('Demotrends',               'https://www.demotrends.org/feed',                                   'Population',                'Demographic trends and research',                                   'demotrends.org',                      true, false),
('Overpopulation Project',   'https://overpopulation-project.com/blog/feed',                      'Population',                'Overpopulation impacts and policies',                               'overpopulation-project.com',          true, false),

-- Education
('GEM Report UNESCO',        'https://world-education-blog.org/feed',                             'Education',                 'UNESCO Global Education Monitoring SDG updates',                    'world-education-blog.org',            true, false),
('Edutopia',                 'https://www.edutopia.org/feed',                                     'Education',                 'K-12 education strategies and resources',                           'edutopia.org',                        true, false),
('US Dept Ed Blog',          'https://blog.ed.gov/feed',                                          'Education',                 'US Department of Education reforms blog',                           'blog.ed.gov',                         true, false),

-- Democracy
('Democracy in Peril',       'https://digitalcommons.usf.edu/istc/feed',                          'Democracy',                 'Democracy crisis analysis',                                         'digitalcommons.usf.edu',              true, false),

-- Sustainability
('PBL Sustainable Dev',      'https://www.pbl.nl/en/feed/topic/21/article/rss.xml',               'Sustainability',             'PBL sustainable development policies',                              'pbl.nl',                              true, false),
('Sustainable Communities',  'https://digitalcommons.usm.maine.edu/sustainable_communities/feed', 'Sustainability',             'Sustainable Communities building capacity',                         'digitalcommons.usm.maine.edu',        true, false),

-- Gender Equality
('UN Women',                 'https://www.unwomen.org/en/news-stories/rss',                       'Gender Equality',           'UN Women rights and equality stories',                              'unwomen.org',                         true, false),

-- Human Rights
('Human Rights Watch',       'https://www.hrw.org/rss',                                           'Human Rights',              'Human Rights Watch global reports',                                 'hrw.org',                             true, false),

-- Peace / Security
('UN Peacekeeping',          'https://peacekeeping.un.org/rss',                                   'Peace/Security',            'UN peacekeeping operations updates',                                'peacekeeping.un.org',                 true, false)

ON CONFLICT (feed_url) DO UPDATE SET
  feed_name           = EXCLUDED.feed_name,
  category            = EXCLUDED.category,
  description         = EXCLUDED.description,
  website             = EXCLUDED.website,
  is_pakistan_priority = EXCLUDED.is_pakistan_priority;
