-- Migration: 0011_news_enhancements
-- Adds relevance_country, feed_category to news_articles
-- Adds preferred_sectors, preferred_provinces to profiles
-- Cleans existing excerpt HTML, adds UNIQUE constraint on url, adds indexes

-- 1. Add relevance_country to news_articles
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS relevance_country TEXT;

-- 2. Add feed_category to news_articles
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS feed_category TEXT;

-- 3. Add preferred_sectors to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_sectors TEXT[] DEFAULT '{}';

-- 4. Add preferred_provinces to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_provinces TEXT[] DEFAULT '{}';

-- 5. Strip HTML from existing excerpt values, trim whitespace, cap at 200 chars
UPDATE public.news_articles
SET excerpt = LEFT(
  TRIM(
    regexp_replace(
      regexp_replace(excerpt, '<[^>]+>', '', 'g'),
      '\s+', ' ', 'g'
    )
  ),
  200
)
WHERE excerpt IS NOT NULL
  AND excerpt ~ '<[^>]+>';

-- 6. Add UNIQUE constraint on news_articles.url if not already present
DO $$ BEGIN
  ALTER TABLE public.news_articles ADD CONSTRAINT news_articles_url_key UNIQUE (url);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. Indexes on new columns
CREATE INDEX IF NOT EXISTS idx_news_articles_relevance_country
  ON public.news_articles (relevance_country);

CREATE INDEX IF NOT EXISTS idx_news_articles_feed_category
  ON public.news_articles (feed_category);
