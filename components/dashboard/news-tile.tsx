'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { NewsArticle } from '@/lib/types/database'

interface NewsTileProps {
  article: Pick<NewsArticle, 'id' | 'title' | 'source' | 'published_at' | 'what_happened' | 'why_it_matters' | 'potential_action' | 'url' | 'composite_score' | 'excerpt'>
}

export function NewsTile({ article }: NewsTileProps) {
  const [expanded, setExpanded] = useState(false)

  const summary = article.what_happened ?? (article.excerpt ? article.excerpt.slice(0, 180) : null)
  const hasDetails = article.why_it_matters || article.potential_action

  return (
    <article
      className="card-default rounded-xl p-4 flex flex-col gap-2"
      aria-label={article.title}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-label rounded-full px-2 py-0.5 font-medium"
          style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}
        >
          {article.source}
        </span>
        {article.published_at && (
          <span className="text-label shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
            {timeAgo(article.published_at)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        className="text-sm font-semibold leading-snug"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {article.title}
      </h3>

      {/* Summary */}
      {summary && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {summary}
        </p>
      )}

      {/* Expandable details */}
      {hasDetails && (
        <div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs font-medium mt-1 transition-colors"
            style={{ color: 'var(--color-brand-400)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
            {expanded ? 'Less' : 'Why it matters'}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              {article.why_it_matters && (
                <div>
                  <p className="text-label font-semibold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                    Why it matters
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {article.why_it_matters}
                  </p>
                </div>
              )}
              {article.potential_action && (
                <div>
                  <p className="text-label font-semibold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                    What you can do
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {article.potential_action}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer link */}
      {article.url && (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium mt-auto pt-1 transition-colors"
          style={{ color: 'var(--color-brand-400)' }}
          aria-label={`Read full story: ${article.title}`}
        >
          <ExternalLink size={12} aria-hidden="true" />
          Read full story
        </a>
      )}
    </article>
  )
}
