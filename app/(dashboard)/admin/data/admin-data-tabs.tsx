'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, RefreshCw, CheckCircle, XCircle, Rss, Briefcase } from 'lucide-react'

type Feed = {
  id: string; feed_name: string; feed_url: string; category: string
  is_active: boolean; is_pakistan_priority: boolean; last_fetched_at: string | null; last_item_count: number | null
}

type CareerLink = {
  id: string; name: string; url: string; category: string
  is_active: boolean; notes: string | null; last_scraped_at: string | null
}

interface Props {
  initialFeeds: Feed[]
  initialCareerLinks: CareerLink[]
  serviceKey: string
}

export function AdminDataTabs({ initialFeeds, initialCareerLinks, serviceKey }: Props) {
  const [tab, setTab] = useState<'feeds' | 'careers' | 'scrape'>('feeds')
  const [feeds, setFeeds] = useState<Feed[]>(initialFeeds)
  const [careers, setCareers] = useState<CareerLink[]>(initialCareerLinks)
  const supabase = createClient()

  // ── New feed form state ──
  const [newFeedName, setNewFeedName] = useState('')
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [newFeedCat, setNewFeedCat] = useState('pakistan')
  const [newFeedPriority, setNewFeedPriority] = useState(false)
  const [feedAdding, setFeedAdding] = useState(false)

  // ── New career link form state ──
  const [newCareerName, setNewCareerName] = useState('')
  const [newCareerUrl, setNewCareerUrl] = useState('')
  const [newCareerCat, setNewCareerCat] = useState('general')
  const [newCareerNotes, setNewCareerNotes] = useState('')
  const [careerAdding, setCareerAdding] = useState(false)

  // ── Scrape state ──
  const [scraping, setScraping] = useState(false)
  const [scrapeResult, setScrapeResult] = useState<{ articles_inserted: number; articles_summarized: number; feeds_processed: number; errors: string[] } | null>(null)
  const [scrapeError, setScrapeError] = useState('')

  async function addFeed() {
    if (!newFeedName.trim() || !newFeedUrl.trim()) return
    setFeedAdding(true)
    const { data, error } = await supabase.from('news_feeds').insert({
      feed_name: newFeedName.trim(),
      feed_url: newFeedUrl.trim(),
      category: newFeedCat,
      is_active: true,
      is_pakistan_priority: newFeedPriority,
    }).select().single()
    if (!error && data) {
      setFeeds(f => [...f, data as Feed])
      setNewFeedName(''); setNewFeedUrl(''); setNewFeedCat('pakistan'); setNewFeedPriority(false)
    }
    setFeedAdding(false)
  }

  async function deleteFeed(id: string) {
    const { error } = await supabase.from('news_feeds').delete().eq('id', id)
    if (!error) setFeeds(f => f.filter(x => x.id !== id))
  }

  async function toggleFeed(id: string, current: boolean) {
    const { error } = await supabase.from('news_feeds').update({ is_active: !current }).eq('id', id)
    if (!error) setFeeds(f => f.map(x => x.id === id ? { ...x, is_active: !current } : x))
  }

  async function addCareer() {
    if (!newCareerName.trim() || !newCareerUrl.trim()) return
    setCareerAdding(true)
    const { data, error } = await supabase.from('career_scraping_links').insert({
      name: newCareerName.trim(),
      url: newCareerUrl.trim(),
      category: newCareerCat,
      notes: newCareerNotes.trim() || null,
      is_active: true,
    }).select().single()
    if (!error && data) {
      setCareers(c => [...c, data as CareerLink])
      setNewCareerName(''); setNewCareerUrl(''); setNewCareerCat('general'); setNewCareerNotes('')
    }
    setCareerAdding(false)
  }

  async function deleteCareer(id: string) {
    const { error } = await supabase.from('career_scraping_links').delete().eq('id', id)
    if (!error) setCareers(c => c.filter(x => x.id !== id))
  }

  async function triggerScrape() {
    setScraping(true)
    setScrapeResult(null)
    setScrapeError('')
    try {
      const resp = await fetch('/api/scrape-news', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${serviceKey}` },
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error ?? 'Scrape failed')
      setScrapeResult(data)
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : 'Unknown error')
    }
    setScraping(false)
  }

  const inputCls = "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-offset-1"
  const inputStyle = { borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }
  const focusStyle = { '--tw-ring-color': '#055C45' } as React.CSSProperties

  const TABS = [
    { id: 'feeds' as const, label: `RSS Feeds (${feeds.length})`, Icon: Rss },
    { id: 'careers' as const, label: `Career Links (${careers.length})`, Icon: Briefcase },
    { id: 'scrape' as const, label: 'Trigger Scrape', Icon: RefreshCw },
  ]

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
      {/* Tab bar */}
      <div className="flex border-b" style={{ background: 'var(--color-surface-subtle)', borderColor: 'var(--color-border-subtle)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2"
            style={{
              color: tab === t.id ? '#055C45' : 'var(--color-text-secondary)',
              borderBottomColor: tab === t.id ? '#055C45' : 'transparent',
              background: tab === t.id ? '#fff' : 'transparent',
            }}
          >
            <t.Icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 bg-white">

        {/* ── RSS Feeds tab ─────────────────────────────────────── */}
        {tab === 'feeds' && (
          <div className="space-y-4">
            {/* Add new feed */}
            <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface-subtle)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Add RSS Feed</p>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Feed name (e.g. Dawn News)" value={newFeedName} onChange={e => setNewFeedName(e.target.value)}
                  className={inputCls} style={inputStyle} />
                <input placeholder="Feed URL (https://...)" value={newFeedUrl} onChange={e => setNewFeedUrl(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </div>
              <div className="flex items-center gap-3">
                <select value={newFeedCat} onChange={e => setNewFeedCat(e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm" style={inputStyle}>
                  <option value="pakistan">Pakistan Media</option>
                  <option value="donor">Donor</option>
                  <option value="multilateral">Multilateral</option>
                  <option value="un">UN Agency</option>
                  <option value="fiscal">Fiscal / Economic</option>
                  <option value="general">General</option>
                </select>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  <input type="checkbox" checked={newFeedPriority} onChange={e => setNewFeedPriority(e.target.checked)} />
                  Pakistan priority
                </label>
                <button onClick={addFeed} disabled={feedAdding || !newFeedName || !newFeedUrl}
                  className="ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: '#055C45' }}>
                  <Plus size={14} />
                  {feedAdding ? 'Adding…' : 'Add Feed'}
                </button>
              </div>
            </div>

            {/* Feed list */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Feed Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Category</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Last Fetched</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Active</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Priority</th>
                    <th className="px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {feeds.map((f, i) => (
                    <tr key={f.id} style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{f.feed_name}</div>
                        <div className="text-xs truncate max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>{f.feed_url}</div>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-brand-100)', color: '#055C45' }}>{f.category}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>
                        {f.last_fetched_at ? new Date(f.last_fetched_at).toLocaleDateString('en-GB') : '—'}
                        {f.last_item_count != null ? ` (${f.last_item_count})` : ''}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button onClick={() => toggleFeed(f.id, f.is_active)}>
                          {f.is_active
                            ? <CheckCircle size={16} style={{ color: '#055C45' }} />
                            : <XCircle size={16} style={{ color: 'var(--color-text-disabled)' }} />}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs">
                        {f.is_pakistan_priority ? '★' : '—'}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <button onClick={() => deleteFeed(f.id)} className="p-1 rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Career Links tab ───────────────────────────────────── */}
        {tab === 'careers' && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface-subtle)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Add Career Scraping Link</p>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Site name" value={newCareerName} onChange={e => setNewCareerName(e.target.value)}
                  className={inputCls} style={inputStyle} />
                <input placeholder="URL (https://...)" value={newCareerUrl} onChange={e => setNewCareerUrl(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </div>
              <div className="flex items-center gap-3">
                <select value={newCareerCat} onChange={e => setNewCareerCat(e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm" style={inputStyle}>
                  <option value="general">General</option>
                  <option value="reliefweb">ReliefWeb</option>
                  <option value="impactpool">Impactpool</option>
                  <option value="devex">Devex</option>
                  <option value="un">UN Agency</option>
                  <option value="bilateral">Bilateral</option>
                  <option value="multilateral">Multilateral</option>
                  <option value="ngo">NGO</option>
                </select>
                <input placeholder="Notes (optional)" value={newCareerNotes} onChange={e => setNewCareerNotes(e.target.value)}
                  className={`${inputCls} flex-1`} style={inputStyle} />
                <button onClick={addCareer} disabled={careerAdding || !newCareerName || !newCareerUrl}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: '#055C45' }}>
                  <Plus size={14} />
                  {careerAdding ? 'Adding…' : 'Add Link'}
                </button>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Category</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Notes</th>
                    <th className="px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {careers.map((c, i) => (
                    <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}>
                      <td className="px-4 py-2.5">
                        <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{c.name}</div>
                        <a href={c.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs hover:underline" style={{ color: '#055C45' }}>
                          {c.url.slice(0, 60)}{c.url.length > 60 ? '…' : ''}
                        </a>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-brand-100)', color: '#055C45' }}>{c.category}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{c.notes ?? '—'}</td>
                      <td className="px-2 py-2.5 text-center">
                        <button onClick={() => deleteCareer(c.id)} className="p-1 rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Scrape trigger tab ─────────────────────────────────── */}
        {tab === 'scrape' && (
          <div className="space-y-5 max-w-lg mx-auto py-4">
            <div className="text-center space-y-2">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: 'var(--color-brand-100)' }}>
                <Rss size={24} style={{ color: '#055C45' }} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Trigger News Scrape</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Fetches all active RSS feeds, scores articles by Pakistan relevance and recency,
                then sends high-scoring articles to Groq for AI summarization (what happened / why it matters / potential action).
              </p>
            </div>

            <button
              onClick={triggerScrape}
              disabled={scraping}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: '#055C45' }}
            >
              <RefreshCw size={16} className={scraping ? 'animate-spin' : ''} />
              {scraping ? 'Scraping all feeds… (may take 2–5 minutes)' : 'Run News Scrape Now'}
            </button>

            {scrapeResult && (
              <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: 'var(--color-success-border)', background: 'var(--color-success-bg)' }}>
                <p className="font-semibold text-sm" style={{ color: 'var(--color-success-600)' }}>Scrape complete</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Feeds', value: scrapeResult.feeds_processed },
                    { label: 'Articles saved', value: scrapeResult.articles_inserted },
                    { label: 'AI summaries', value: scrapeResult.articles_summarized },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.6)' }}>
                      <div className="text-xl font-bold" style={{ color: 'var(--color-success-600)' }}>{s.value}</div>
                      <div className="text-xs" style={{ color: 'var(--color-success-600)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {scrapeResult.errors.length > 0 && (
                  <div className="text-xs space-y-0.5 mt-2" style={{ color: 'var(--color-danger)' }}>
                    {scrapeResult.errors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
                    {scrapeResult.errors.length > 5 && <p>+{scrapeResult.errors.length - 5} more errors</p>}
                  </div>
                )}
              </div>
            )}

            {scrapeError && (
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-danger-border)', background: 'var(--color-danger-bg)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-danger-600)' }}>Error: {scrapeError}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
