'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, ChevronDown, ChevronUp, RefreshCw, Rss } from 'lucide-react'
import type { NewsArticle } from '@/lib/types/database'

const CATEGORIES = ['All', 'Pakistan', 'Donors & Funders', 'Climate', 'Health', 'Governance', 'Education', 'Poverty'] as const
type Category = typeof CATEGORIES[number]

type NewsArticleWithCountry = NewsArticle & { relevance_country?: string | null }

const CATEGORY_FILTER: Record<Category, (a: NewsArticleWithCountry) => boolean> = {
  'All':              () => true,
  'Pakistan': a => {
    const isPakGeo = (text: string) => {
      const t = (text ?? '').toLowerCase()
      return ['pakistan', "pakistan's", 'pakistani', 'punjab', 'sindh', 'balochistan',
        'khyber', 'pakhtunkhwa', 'lahore', 'karachi', 'islamabad', 'peshawar', 'quetta',
        'gilgit', 'azad kashmir'].some(kw => t.includes(kw))
    }
    const EXPLICIT_PAK_SOURCES = ['Tribune Economy', 'UNDP Pakistan', 'PBS Stats',
      'SBP Pakistan', 'DevAid Tenders']
    return EXPLICIT_PAK_SOURCES.includes(a.source ?? '') ||
      a.relevance_country === 'PK' ||
      isPakGeo(a.title ?? '') ||
      isPakGeo(a.excerpt ?? '')
  },
  'Donors & Funders': a => {
    const DONOR_SOURCES = ['world bank', 'adb', 'fcdo', 'dfid', 'usaid', 'giz',
      'jica', 'undp', 'unicef', 'unfpa', 'wfp', 'kfw', 'european', 'eu ',
      'aga khan', 'gates', 'global fund', 'gavi', 'gpe', 'devaid']
    const isDonorSource = DONOR_SOURCES.some(d => (a.source ?? '').toLowerCase().includes(d))
    const isPakRelevant = ['pakistan', 'lahore', 'karachi', 'islamabad', 'punjab',
      'sindh', 'balochistan'].some(kw =>
      ((a.title ?? '') + ' ' + (a.excerpt ?? '')).toLowerCase().includes(kw)
    )
    return isDonorSource && isPakRelevant
  },
  'Climate':          a => ['climate', 'nature', 'pbl', 'yale'].some(k => (a.source ?? '').toLowerCase().includes(k)),
  'Health':           a => ['health', 'gavi', 'global fund', 'who', 'care'].some(k => (a.source ?? '').toLowerCase().includes(k)),
  'Governance':       a => ['governance', 'undp', 'democracy', 'human rights'].some(k => (a.source ?? '').toLowerCase().includes(k)),
  'Education':        a => ['edutopia', 'gem', 'education', 'gpe'].some(k => (a.source ?? '').toLowerCase().includes(k)),
  'Poverty':          a => ['poverty', 'care', 'food for the hungry', 'spotlight'].some(k => (a.source ?? '').toLowerCase().includes(k)),
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function scoreBar(score: number | null) {
  const s = score ?? 0
  const pct = Math.round(s * 100)
  const color = s >= 0.7 ? '#055C45' : s >= 0.4 ? '#82A290' : '#9AA0A6'
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px]" style={{ color }}>{pct}%</span>
    </div>
  )
}

function ArticleCard({ article }: { article: NewsArticle }) {
  const [expanded, setExpanded] = useState(false)
  const hasInsight = !!(article.what_happened || article.why_it_matters || article.potential_action)

  return (
    <div className="rounded-xl border flex flex-col overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderColor: 'var(--color-border-subtle)', background: '#fff' }}>
      {/* Top accent */}
      <div className="h-0.5" style={{ background: '#055C45' }} />

      <div className="p-4 flex-1 space-y-2">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-brand-100)', color: '#055C45' }}>
            {article.source}
          </span>
          {article.composite_score != null && scoreBar(article.composite_score)}
          <span className="text-xs ml-auto" style={{ color: 'var(--color-text-secondary)' }}>
            {timeAgo(article.published_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
          {article.title}
        </h3>

        {/* Excerpt */}
        {article.excerpt && !expanded && (
          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--color-text-secondary)' }}>
            {article.excerpt}
          </p>
        )}

        {/* AI Insight (expanded) */}
        {hasInsight && expanded && (
          <div className="space-y-2 mt-2 rounded-lg p-3"
            style={{ background: 'var(--color-brand-100)', border: '1px solid #cbeadd' }}>
            {article.what_happened && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#055C45' }}>What happened</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{article.what_happened}</p>
              </div>
            )}
            {article.why_it_matters && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#055C45' }}>Why it matters</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{article.why_it_matters}</p>
              </div>
            )}
            {article.potential_action && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#055C45' }}>Potential action</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{article.potential_action}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center gap-2 border-t pt-2"
        style={{ borderColor: 'var(--color-border-subtle)' }}>
        {article.url && (
          <a href={article.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: '#055C45' }}>
            <ExternalLink size={11} /> Read source
          </a>
        )}
        {hasInsight && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="ml-auto flex items-center gap-1 text-xs font-medium"
            style={{ color: '#82A290' }}
          >
            {expanded ? <><ChevronUp size={11} /> Hide insight</> : <><ChevronDown size={11} /> AI insight</>}
          </button>
        )}
      </div>
    </div>
  )
}

interface Props {
  articles: NewsArticle[]
  totalFeeds: number
  aiSummaries: number
  highRelevant: number
}

export function NewsClient({ articles, totalFeeds, aiSummaries, highRelevant }: Props) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const [scraping, setScraping]   = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState('')

  const filtered = (articles as NewsArticleWithCountry[]).filter(CATEGORY_FILTER[activeCategory])

  async function triggerScrape() {
    setScraping(true)
    setScrapeMsg('Fetching feeds…')
    try {
      const resp = await fetch('/api/scrape-news', { method: 'POST' })
      if (resp.ok) {
        const d = await resp.json()
        const errNote = d.errors?.length ? ` (${d.errors.length} feeds failed)` : ''
        setScrapeMsg(`Done — ${d.articles_inserted} articles saved, ${d.articles_summarized} AI summaries${errNote}. Refreshing…`)
        router.refresh()
      } else {
        const body = await resp.text()
        setScrapeMsg(`Scrape error ${resp.status}: ${body.slice(0, 200)}`)
      }
    } catch (e) {
      setScrapeMsg(`Network error: ${e instanceof Error ? e.message : String(e)}`)
    }
    setScraping(false)
  }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>News &amp; Updates</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Watch real-time shifts in reforms, budgets, and donor decisions
          </p>
        </div>
        <button
          onClick={triggerScrape}
          disabled={scraping}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 transition-opacity"
          style={{ background: '#055C45' }}
        >
          <RefreshCw size={14} className={scraping ? 'animate-spin' : ''} />
          {scraping ? 'Fetching feeds…' : 'Refresh Feeds'}
        </button>
      </div>

      {scrapeMsg && (
        <div className="rounded-lg px-4 py-2.5 text-sm" style={{ background: 'var(--color-brand-100)', color: '#055C45' }}>
          {scrapeMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Feeds',    value: totalFeeds,   icon: <Rss size={14} /> },
          { label: 'Articles',        value: articles.length },
          { label: 'AI Summaries',    value: aiSummaries },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3"
            style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              {s.icon && <span style={{ color: '#055C45' }}>{s.icon}</span>}
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</span>
            </div>
            <div className="text-xl font-bold" style={{ color: '#055C45' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: activeCategory === cat ? '#055C45' : 'var(--color-surface-subtle)',
              color:      activeCategory === cat ? '#fff' : 'var(--color-text-secondary)',
              border:     `1px solid ${activeCategory === cat ? '#055C45' : 'var(--color-border-subtle)'}`,
            }}
          >
            {cat} {activeCategory === cat && `(${filtered.length})`}
          </button>
        ))}
      </div>

      {/* Articles grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center"
          style={{ borderColor: 'var(--color-border-subtle)' }}>
          <div className="text-3xl mb-3">📰</div>
          <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>No articles yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Click <strong>Refresh Feeds</strong> above or go to Admin → Data → Trigger Scrape to populate articles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.slice(0, 60).map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {filtered.length > 60 && (
        <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Showing 60 of {filtered.length} articles
        </p>
      )}
    </div>
  )
}
