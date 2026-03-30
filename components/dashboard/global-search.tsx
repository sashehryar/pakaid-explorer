'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  label: string
  sublabel?: string
  href: string
  type: 'project' | 'tender' | 'donor' | 'job' | 'news'
}

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  project: 'Funding',
  tender:  'Tender',
  donor:   'Donor',
  job:     'Job',
  news:    'News',
}

const TYPE_COLORS: Record<SearchResult['type'], string> = {
  project: 'bg-pine/10 text-pine',
  tender:  'bg-amber-50 text-amber-700',
  donor:   'bg-blue-50 text-blue-700',
  job:     'bg-purple-50 text-purple-700',
  news:    'bg-fog text-ash',
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState(0)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50) }
    else { setQuery(''); setResults([]) }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    const supabase = createClient()
    const like = `%${q}%`

    const [projectsRes, tendersRes, donorsRes, jobsRes, newsRes] = await Promise.all([
      supabase.from('projects').select('id, title, donor, sector').ilike('title', like).limit(4),
      supabase.from('tenders').select('id, title, donor').ilike('title', like).limit(4),
      supabase.from('donors').select('id, name, type').ilike('name', like).limit(3),
      supabase.from('jobs').select('id, title, organisation').ilike('title', like).limit(3),
      supabase.from('news_articles').select('id, title, source').ilike('title', like).limit(3),
    ])

    const items: SearchResult[] = [
      ...(projectsRes.data ?? []).map(p => ({
        id: p.id, label: p.title, sublabel: `${p.donor} · ${p.sector}`,
        href: `/funding?search=${encodeURIComponent(p.title)}`, type: 'project' as const,
      })),
      ...(tendersRes.data ?? []).map(t => ({
        id: t.id, label: t.title, sublabel: t.donor,
        href: `/procurement?search=${encodeURIComponent(t.title)}`, type: 'tender' as const,
      })),
      ...(donorsRes.data ?? []).map(d => ({
        id: d.id, label: d.name, sublabel: d.type,
        href: `/donors`, type: 'donor' as const,
      })),
      ...(jobsRes.data ?? []).map(j => ({
        id: j.id, label: j.title, sublabel: j.organisation,
        href: `/careers`, type: 'job' as const,
      })),
      ...(newsRes.data ?? []).map(n => ({
        id: n.id, label: n.title, sublabel: n.source,
        href: `/news`, type: 'news' as const,
      })),
    ]
    setResults(items)
    setSelected(0)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => startTransition(() => search(query)), 250)
    return () => clearTimeout(t)
  }, [query, search])

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) navigate(results[selected].href)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-silver bg-fog hover:bg-silver/30 text-ash text-xs transition-colors"
      >
        <Search size={12} />
        <span>Search</span>
        <kbd className="ml-1 px-1 py-0.5 rounded bg-white border border-silver text-[9px] font-mono">⌘K</kbd>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-silver overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-silver">
              <Search size={16} className="text-ash shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search projects, tenders, donors, jobs..."
                className="flex-1 text-sm text-ink bg-transparent outline-none placeholder:text-ash"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-ash hover:text-ink">
                  <X size={14} />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 rounded border border-silver text-[10px] font-mono text-ash">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[360px] overflow-y-auto">
              {query.length >= 2 && results.length === 0 && !isPending && (
                <div className="px-4 py-8 text-center text-sm text-ash">
                  No results for &quot;{query}&quot;
                </div>
              )}
              {query.length < 2 && (
                <div className="px-4 py-6 text-center text-xs text-ash">
                  Type at least 2 characters to search across all modules
                </div>
              )}
              {results.length > 0 && (
                <div className="py-1">
                  {results.map((result, i) => (
                    <button
                      key={result.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-fog transition-colors',
                        selected === i && 'bg-fog'
                      )}
                      onClick={() => navigate(result.href)}
                      onMouseEnter={() => setSelected(i)}
                    >
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0', TYPE_COLORS[result.type])}>
                        {TYPE_LABELS[result.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{result.label}</div>
                        {result.sublabel && (
                          <div className="text-[11px] text-ash truncate">{result.sublabel}</div>
                        )}
                      </div>
                      <ArrowRight size={12} className="text-ash shrink-0 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
