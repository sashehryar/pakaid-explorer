import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { NewsArticle } from '@/lib/types/database'
import { NewsClient } from './news-client'

export const metadata: Metadata = { title: 'News & Updates' }

export default async function NewsPage() {
  const supabase = await createClient()

  // Latest articles first — published_at is often null, fall back to created_at; secondary sort by relevance
  const { data: articles } = await supabase
    .from('news_articles')
    .select('*')
    .order('created_at',      { ascending: false, nullsFirst: false })
    .order('composite_score', { ascending: false, nullsFirst: false })
    .limit(100)

  // Feed stats for the header
  const { data: feeds } = await supabase
    .from('news_feeds')
    .select('id, feed_name, category, is_pakistan_priority, last_fetched_at, last_item_count')
    .eq('is_active', true)
    .order('is_pakistan_priority', { ascending: false })

  const rows: NewsArticle[] = articles ?? []

  const totalFeeds   = feeds?.length ?? 0
  const aiSummaries  = rows.filter(a => !!a.what_happened).length
  const highRelevant = rows.filter(a => (a.composite_score ?? 0) >= 0.5).length

  return (
    <NewsClient
      articles={rows}
      totalFeeds={totalFeeds}
      aiSummaries={aiSummaries}
      highRelevant={highRelevant}
    />
  )
}
