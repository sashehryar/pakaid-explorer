'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, RefreshCw, CheckCircle, XCircle, Rss, Briefcase, Users, Layers } from 'lucide-react'

type Feed = {
  id: string; feed_name: string; feed_url: string; category: string
  is_active: boolean; is_pakistan_priority: boolean
  last_fetched_at: string | null; last_item_count: number | null
}
type CareerLink = {
  id: string; name: string; url: string; category: string
  is_active: boolean; notes: string | null; last_scraped_at: string | null
}
type Donor = {
  id: string; name: string; type: string; country: string | null
  active_projects: number; website: string | null
}
type Sector = {
  id: string; name: string; slug: string; parent_id: string | null; sdg_aligned: boolean
}

interface Props {
  initialFeeds: Feed[]
  initialCareerLinks: CareerLink[]
  initialDonors: Donor[]
  initialSectors: Sector[]
  serviceKey: string
}

export function AdminDataTabs({
  initialFeeds, initialCareerLinks, initialDonors, initialSectors, serviceKey
}: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<'feeds' | 'careers' | 'donors' | 'sectors' | 'scrape'>('feeds')

  // ── Feeds state ──
  const [feeds, setFeeds]           = useState<Feed[]>(initialFeeds)
  const [newFeedName, setNewFeedName]     = useState('')
  const [newFeedUrl, setNewFeedUrl]       = useState('')
  const [newFeedCat, setNewFeedCat]       = useState('pakistan')
  const [newFeedPriority, setNewFeedPriority] = useState(false)
  const [feedAdding, setFeedAdding]       = useState(false)

  // ── Career links state ──
  const [careers, setCareers]       = useState<CareerLink[]>(initialCareerLinks)
  const [newCareerName, setNewCareerName] = useState('')
  const [newCareerUrl, setNewCareerUrl]   = useState('')
  const [newCareerCat, setNewCareerCat]   = useState('general')
  const [newCareerNotes, setNewCareerNotes] = useState('')
  const [careerAdding, setCareerAdding]   = useState(false)

  // ── Donors state ──
  const [donors, setDonors]         = useState<Donor[]>(initialDonors)
  const [newDonorName, setNewDonorName]   = useState('')
  const [newDonorType, setNewDonorType]   = useState('Bilateral')
  const [newDonorCountry, setNewDonorCountry] = useState('')
  const [newDonorWebsite, setNewDonorWebsite] = useState('')
  const [donorAdding, setDonorAdding]     = useState(false)
  const [donorSearch, setDonorSearch]     = useState('')

  // ── Sectors state ──
  const [sectors, setSectors]       = useState<Sector[]>(initialSectors)
  const [newSectorName, setNewSectorName] = useState('')
  const [newSectorSlug, setNewSectorSlug] = useState('')
  const [newSectorParent, setNewSectorParent] = useState('')
  const [newSectorSdg, setNewSectorSdg]   = useState(true)
  const [sectorAdding, setSectorAdding]   = useState(false)
  const [sectorSearch, setSectorSearch]   = useState('')

  // ── Scrape state ──
  const [scraping, setScraping]     = useState(false)
  const [scrapeResult, setScrapeResult] = useState<{
    articles_inserted: number; articles_summarized: number
    feeds_processed: number; apify_used: boolean; errors: string[]
  } | null>(null)
  const [scrapeError, setScrapeError]   = useState('')

  // ── Shared styles ──
  const inp = "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
  const inpStyle = { borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }

  // ── Feed actions ──
  async function addFeed() {
    if (!newFeedName.trim() || !newFeedUrl.trim()) return
    setFeedAdding(true)
    const { data, error } = await supabase.from('news_feeds').insert({
      feed_name: newFeedName.trim(), feed_url: newFeedUrl.trim(),
      category: newFeedCat, is_active: true, is_pakistan_priority: newFeedPriority,
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

  // ── Career actions ──
  async function addCareer() {
    if (!newCareerName.trim() || !newCareerUrl.trim()) return
    setCareerAdding(true)
    const { data, error } = await supabase.from('career_scraping_links').insert({
      name: newCareerName.trim(), url: newCareerUrl.trim(),
      category: newCareerCat, notes: newCareerNotes.trim() || null, is_active: true,
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

  // ── Donor actions ──
  async function addDonor() {
    if (!newDonorName.trim()) return
    setDonorAdding(true)
    const { data, error } = await supabase.from('donors').insert({
      name: newDonorName.trim(), type: newDonorType,
      country: newDonorCountry.trim() || null,
      website: newDonorWebsite.trim() || null,
      active_projects: 0,
    }).select().single()
    if (!error && data) {
      setDonors(d => [...d, data as Donor])
      setNewDonorName(''); setNewDonorType('Bilateral'); setNewDonorCountry(''); setNewDonorWebsite('')
    }
    setDonorAdding(false)
  }
  async function deleteDonor(id: string) {
    const { error } = await supabase.from('donors').delete().eq('id', id)
    if (!error) setDonors(d => d.filter(x => x.id !== id))
  }
  const filteredDonors = donors.filter(d =>
    d.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
    d.type.toLowerCase().includes(donorSearch.toLowerCase())
  )

  // ── Sector actions ──
  async function addSector() {
    if (!newSectorName.trim() || !newSectorSlug.trim()) return
    setSectorAdding(true)
    const payload: Record<string, unknown> = {
      name: newSectorName.trim(),
      slug: newSectorSlug.trim().toLowerCase().replace(/\s+/g, '-'),
      sdg_aligned: newSectorSdg,
    }
    if (newSectorParent) payload.parent_id = newSectorParent
    const { data, error } = await supabase.from('sectors').insert(payload).select().single()
    if (!error && data) {
      setSectors(s => [...s, data as Sector])
      setNewSectorName(''); setNewSectorSlug(''); setNewSectorParent(''); setNewSectorSdg(true)
    }
    setSectorAdding(false)
  }
  async function deleteSector(id: string) {
    const { error } = await supabase.from('sectors').delete().eq('id', id)
    if (!error) setSectors(s => s.filter(x => x.id !== id))
  }
  const parentSectors   = sectors.filter(s => !s.parent_id)
  const filteredSectors = sectors.filter(s =>
    s.name.toLowerCase().includes(sectorSearch.toLowerCase())
  )

  // ── Scrape action ──
  async function triggerScrape() {
    setScraping(true); setScrapeResult(null); setScrapeError('')
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

  const TABS = [
    { id: 'feeds'   as const, label: `RSS Feeds (${feeds.length})`,        Icon: Rss },
    { id: 'careers' as const, label: `Career Links (${careers.length})`,   Icon: Briefcase },
    { id: 'donors'  as const, label: `Donors (${donors.length})`,          Icon: Users },
    { id: 'sectors' as const, label: `Sectors (${sectors.length})`,        Icon: Layers },
    { id: 'scrape'  as const, label: 'Trigger Scrape',                     Icon: RefreshCw },
  ]

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
      {/* Tab bar */}
      <div className="flex border-b overflow-x-auto" style={{ background: 'var(--color-surface-subtle)', borderColor: 'var(--color-border-subtle)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 shrink-0"
            style={{
              color:            tab === t.id ? '#055C45' : 'var(--color-text-secondary)',
              borderBottomColor:tab === t.id ? '#055C45' : 'transparent',
              background:       tab === t.id ? '#fff'    : 'transparent',
            }}>
            <t.Icon size={14} />{t.label}
          </button>
        ))}
      </div>

      <div className="p-5 bg-white">

        {/* ─────────────── RSS FEEDS ─────────────── */}
        {tab === 'feeds' && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface-subtle)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Add RSS Feed</p>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Feed name" value={newFeedName} onChange={e => setNewFeedName(e.target.value)} className={inp} style={inpStyle} />
                <input placeholder="Feed URL (https://...)" value={newFeedUrl} onChange={e => setNewFeedUrl(e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <select value={newFeedCat} onChange={e => setNewFeedCat(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={inpStyle}>
                  <option value="pakistan">Pakistan Media</option>
                  <option value="donor">Donor</option>
                  <option value="multilateral">Multilateral</option>
                  <option value="un">UN Agency</option>
                  <option value="fiscal">Fiscal / Economic</option>
                  <option value="climate">Climate</option>
                  <option value="health">Health</option>
                  <option value="education">Education</option>
                  <option value="general">General</option>
                </select>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  <input type="checkbox" checked={newFeedPriority} onChange={e => setNewFeedPriority(e.target.checked)} />
                  Pakistan priority
                </label>
                <button onClick={addFeed} disabled={feedAdding || !newFeedName || !newFeedUrl}
                  className="ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: '#055C45' }}>
                  <Plus size={14} />{feedAdding ? 'Adding…' : 'Add Feed'}
                </button>
              </div>
            </div>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Name / URL</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Category</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Last Fetched</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Active</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>★ Priority</th>
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
                          {f.is_active ? <CheckCircle size={16} style={{ color: '#055C45' }} /> : <XCircle size={16} style={{ color: 'var(--color-text-disabled)' }} />}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs">{f.is_pakistan_priority ? '★' : '—'}</td>
                      <td className="px-2 py-2.5 text-center">
                        <button onClick={() => deleteFeed(f.id)} className="p-1 rounded hover:bg-red-50">
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

        {/* ─────────────── CAREER LINKS ─────────────── */}
        {tab === 'careers' && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface-subtle)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Add Career Scraping Link</p>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Site name" value={newCareerName} onChange={e => setNewCareerName(e.target.value)} className={inp} style={inpStyle} />
                <input placeholder="URL (https://...)" value={newCareerUrl} onChange={e => setNewCareerUrl(e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <select value={newCareerCat} onChange={e => setNewCareerCat(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={inpStyle}>
                  <option value="general">General</option>
                  <option value="reliefweb">ReliefWeb</option>
                  <option value="impactpool">Impactpool</option>
                  <option value="devex">Devex</option>
                  <option value="un">UN Agency</option>
                  <option value="bilateral">Bilateral</option>
                  <option value="multilateral">Multilateral</option>
                  <option value="ngo">NGO</option>
                </select>
                <input placeholder="Notes (optional)" value={newCareerNotes} onChange={e => setNewCareerNotes(e.target.value)} className={`${inp} flex-1`} style={inpStyle} />
                <button onClick={addCareer} disabled={careerAdding || !newCareerName || !newCareerUrl}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: '#055C45' }}>
                  <Plus size={14} />{careerAdding ? 'Adding…' : 'Add Link'}
                </button>
              </div>
            </div>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Name / URL</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Category</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Notes</th>
                    <th className="px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {careers.map((c, i) => (
                    <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}>
                      <td className="px-4 py-2.5">
                        <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{c.name}</div>
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: '#055C45' }}>
                          {c.url.slice(0, 60)}{c.url.length > 60 ? '…' : ''}
                        </a>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-brand-100)', color: '#055C45' }}>{c.category}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{c.notes ?? '—'}</td>
                      <td className="px-2 py-2.5 text-center">
                        <button onClick={() => deleteCareer(c.id)} className="p-1 rounded hover:bg-red-50">
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

        {/* ─────────────── DONORS ─────────────── */}
        {tab === 'donors' && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface-subtle)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Add Donor / Funder</p>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Donor name" value={newDonorName} onChange={e => setNewDonorName(e.target.value)} className={inp} style={inpStyle} />
                <input placeholder="Country (e.g. United Kingdom)" value={newDonorCountry} onChange={e => setNewDonorCountry(e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Website (https://...)" value={newDonorWebsite} onChange={e => setNewDonorWebsite(e.target.value)} className={inp} style={inpStyle} />
                <select value={newDonorType} onChange={e => setNewDonorType(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={inpStyle}>
                  <option value="Bilateral">Bilateral</option>
                  <option value="MDB">Multilateral Development Bank</option>
                  <option value="UN">UN Agency</option>
                  <option value="Climate">Climate Fund</option>
                  <option value="Private">Private Foundation</option>
                  <option value="Pooled">Pooled Fund</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button onClick={addDonor} disabled={donorAdding || !newDonorName}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: '#055C45' }}>
                  <Plus size={14} />{donorAdding ? 'Adding…' : 'Add Donor'}
                </button>
              </div>
            </div>
            <input placeholder="Search donors…" value={donorSearch} onChange={e => setDonorSearch(e.target.value)}
              className={inp} style={inpStyle} />
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Type</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Country</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Website</th>
                    <th className="px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filteredDonors.map((d, i) => (
                    <tr key={d.id} style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}>
                      <td className="px-4 py-2.5 font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{d.name}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-brand-100)', color: '#055C45' }}>{d.type}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{d.country ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs hidden lg:table-cell">
                        {d.website ? <a href={d.website} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#055C45' }}>link</a> : '—'}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <button onClick={() => deleteDonor(d.id)} className="p-1 rounded hover:bg-red-50">
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

        {/* ─────────────── SECTORS ─────────────── */}
        {tab === 'sectors' && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface-subtle)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Add Sector / Sub-sector</p>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Sector name" value={newSectorName} onChange={e => {
                  setNewSectorName(e.target.value)
                  setNewSectorSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
                }} className={inp} style={inpStyle} />
                <input placeholder="Slug (auto-filled)" value={newSectorSlug} onChange={e => setNewSectorSlug(e.target.value)} className={inp} style={inpStyle} />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <select value={newSectorParent} onChange={e => setNewSectorParent(e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm flex-1" style={inpStyle}>
                  <option value="">— Parent sector (leave blank for top-level) —</option>
                  {parentSectors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  <input type="checkbox" checked={newSectorSdg} onChange={e => setNewSectorSdg(e.target.checked)} />
                  SDG-aligned
                </label>
                <button onClick={addSector} disabled={sectorAdding || !newSectorName || !newSectorSlug}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: '#055C45' }}>
                  <Plus size={14} />{sectorAdding ? 'Adding…' : 'Add Sector'}
                </button>
              </div>
            </div>
            <input placeholder="Search sectors…" value={sectorSearch} onChange={e => setSectorSearch(e.target.value)}
              className={inp} style={inpStyle} />

            {/* Parent sectors with sub-sector grouping */}
            {parentSectors.filter(p => p.name.toLowerCase().includes(sectorSearch.toLowerCase())).map(parent => {
              const subs = filteredSectors.filter(s => s.parent_id === parent.id)
              return (
                <div key={parent.id} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div className="px-4 py-2.5 flex items-center justify-between"
                    style={{ background: 'var(--color-brand-100)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: '#055C45' }}>{parent.name}</span>
                      {parent.sdg_aligned && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#dcfce7', color: '#15803d' }}>SDG</span>}
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{subs.length} sub-sectors</span>
                    </div>
                    <button onClick={() => deleteSector(parent.id)} className="p-1 rounded hover:bg-red-50">
                      <Trash2 size={13} style={{ color: 'var(--color-danger)' }} />
                    </button>
                  </div>
                  {subs.length > 0 && (
                    <div className="divide-y" style={{ '--divide-color': 'var(--color-border-subtle)' } as React.CSSProperties}>
                      {subs.map(s => (
                        <div key={s.id} className="px-6 py-2 flex items-center justify-between">
                          <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{s.name}</span>
                          <button onClick={() => deleteSector(s.id)} className="p-1 rounded hover:bg-red-50">
                            <Trash2 size={12} style={{ color: 'var(--color-danger)' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Unparented sectors shown separately */}
            {filteredSectors.filter(s => !s.parent_id && s.name.toLowerCase().includes(sectorSearch.toLowerCase())).length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Top-level sectors</p>
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  {filteredSectors.filter(s => !s.parent_id).map((s, i) => (
                    <div key={s.id} className="px-4 py-2.5 flex items-center justify-between"
                      style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{s.name}</span>
                      <button onClick={() => deleteSector(s.id)} className="p-1 rounded hover:bg-red-50">
                        <Trash2 size={13} style={{ color: 'var(--color-danger)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────── SCRAPE TRIGGER ─────────────── */}
        {tab === 'scrape' && (
          <div className="space-y-5 max-w-lg mx-auto py-4">
            <div className="text-center space-y-2">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--color-brand-100)' }}>
                <Rss size={24} style={{ color: '#055C45' }} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Trigger News Scrape</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Fetches all active RSS feeds via <strong>Apify</strong> (with direct HTTP fallback),
                scores articles by Pakistan relevance and recency,
                then sends high-scoring articles to <strong>Groq llama-3.1-8b-instant</strong> for AI summarization.
              </p>
            </div>
            <button onClick={triggerScrape} disabled={scraping}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: '#055C45' }}>
              <RefreshCw size={16} className={scraping ? 'animate-spin' : ''} />
              {scraping ? 'Running scrape via Apify + Groq… (2–5 min)' : 'Run News Scrape Now'}
            </button>
            {scrapeResult && (
              <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: 'var(--color-success-border)', background: 'var(--color-success-bg)' }}>
                <p className="font-semibold text-sm" style={{ color: '#15803d' }}>Scrape complete</p>
                <p className="text-xs" style={{ color: '#15803d' }}>Fetched via: {scrapeResult.apify_used ? 'Apify + direct fallback' : 'Direct HTTP'}</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Feeds processed', value: scrapeResult.feeds_processed },
                    { label: 'Articles saved',   value: scrapeResult.articles_inserted },
                    { label: 'AI summaries',     value: scrapeResult.articles_summarized },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.6)' }}>
                      <div className="text-xl font-bold" style={{ color: '#15803d' }}>{s.value}</div>
                      <div className="text-xs" style={{ color: '#15803d' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {scrapeResult.errors.length > 0 && (
                  <div className="text-xs space-y-0.5 mt-2" style={{ color: 'var(--color-danger)' }}>
                    <p className="font-semibold">Feed errors ({scrapeResult.errors.length}):</p>
                    {scrapeResult.errors.slice(0, 8).map((e, i) => <p key={i}>• {e}</p>)}
                    {scrapeResult.errors.length > 8 && <p>+{scrapeResult.errors.length - 8} more</p>}
                  </div>
                )}
              </div>
            )}
            {scrapeError && (
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-danger-border)', background: 'var(--color-danger-bg)' }}>
                <p className="text-sm font-semibold" style={{ color: '#b91c1c' }}>Error: {scrapeError}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
