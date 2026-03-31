import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { timeAgo } from '@/lib/utils'
import type { NewsArticle } from '@/lib/types/database'
import { NewsModal } from './news-modal'

export const metadata: Metadata = { title: 'News & Updates' }

export default async function NewsPage() {

  const supabase = await createClient()
  const articlesRes = await supabase
    .from('news_articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(30)
  const articles: NewsArticle[] = articlesRes.data ?? []

  const featured = (articles ?? []).find(a => a.featured)
  const rest = (articles ?? []).filter(a => !a.featured)

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">News &amp; Updates</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Watch real-time shifts in reforms, budgets, and donor decisions</p>
        <p className="text-sm text-ash mt-0.5 flex items-center gap-2">
          <span className="live-dot" />
          Pakistan development, fiscal policy, donor intelligence
        </p>
      </div>

      {(articles ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Featured */}
          {featured && (
            <div className="rounded-2xl bg-forest text-white p-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  {featured.source_color && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: featured.source_color + '30', color: featured.source_color }}>
                      {featured.source}
                    </span>
                  )}
                  {featured.topic && (
                    <span className="text-xs text-sage/70">{featured.topic}</span>
                  )}
                  <span className="text-xs text-sage/50 ml-auto">{timeAgo(featured.published_at)}</span>
                </div>
                <h2 className="text-lg font-bold leading-snug mb-2">{featured.title}</h2>
                {featured.excerpt && <p className="text-sm text-sage/80 leading-relaxed">{featured.excerpt}</p>}
                <NewsModal article={featured} />
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map(article => (
              <div key={article.id}
                className="rounded-xl border border-silver bg-card hover:shadow-sm transition-shadow overflow-hidden flex flex-col"
              >
                {article.source_color && (
                  <div className="h-1" style={{ background: article.source_color }} />
                )}
                <div className="p-4 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-ash">{article.source}</span>
                    {article.topic && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={article.topic_color ? { background: article.topic_color + '20', color: article.topic_color } : {}}>
                        {article.topic}
                      </span>
                    )}
                    <span className="text-xs text-ash ml-auto">{timeAgo(article.published_at)}</span>
                  </div>
                  <h3 className="font-semibold text-sm text-ink leading-snug">{article.title}</h3>
                  {article.excerpt && (
                    <p className="text-xs text-ash mt-1.5 line-clamp-2 leading-relaxed">{article.excerpt}</p>
                  )}
                </div>
                <div className="px-4 pb-3">
                  <NewsModal article={article} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-silver bg-card p-12 text-center">
      <div className="text-4xl mb-3">📰</div>
      <p className="font-semibold text-ink">No articles yet</p>
      <p className="text-sm text-ash mt-1">Scrapers will populate news from Dawn, The News, and more</p>
    </div>
  )
}
