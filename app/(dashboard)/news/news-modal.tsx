'use client'

import { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import type { NewsArticle } from '@/lib/types/database'

export function NewsModal({ article }: { article: NewsArticle }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-pine hover:underline font-medium"
      >
        Read more →
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-card border border-silver shadow-xl">
            {article.source_color && (
              <div className="h-1.5 rounded-t-2xl" style={{ background: article.source_color }} />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-ash">{article.source}</span>
                    {article.topic && <span className="text-xs text-ash">· {article.topic}</span>}
                  </div>
                  <h2 className="font-bold text-ink leading-snug">{article.title}</h2>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-fog transition-colors shrink-0">
                  <X size={16} className="text-ash" />
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-slate leading-relaxed">
                {article.full_text ?? article.excerpt ?? 'Full text not available.'}
              </div>
              {article.url && (
                <a
                  href={article.url} target="_blank" rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-pine font-medium hover:underline"
                >
                  <ExternalLink size={13} /> Read on {article.source}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
