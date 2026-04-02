'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OverlapRecord } from '@/lib/types/database'
import { Search, AlertTriangle, Map as MapIcon, BarChart2, Zap, Info } from 'lucide-react'

const SECTORS = [
  'Education', 'Health', 'Governance', 'Agriculture', 'Climate Resilience',
  'WASH / Infrastructure', 'Finance / Private Sector', 'Economic Growth',
  'Rule of Law', 'Energy', 'Trade', 'Gender & Inclusion', 'Social Protection',
  'TVET / Skills', 'Nutrition', 'DRR / Humanitarian',
]

const PROVINCES = ['Federal', 'Punjab', 'Sindh', 'KP', 'Balochistan', 'AJK', 'GB', 'Multi-province']

const OVERLAP_TYPES = ['Duplicate funding', 'Parallel TA', 'Implementer crowding', 'Donor clustering', 'Benign complementarity']

function dateOverlap(s1: string | null, e1: string | null, s2: string | null, e2: string | null) {
  if (!s1 || !e1 || !s2 || !e2) return false
  return new Date(s1) <= new Date(e2) && new Date(s2) <= new Date(e1)
}

function textSimilarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 4))
  const wb = b.toLowerCase().split(/\W+/).filter(w => w.length > 4)
  const hits = wb.filter(w => wa.has(w)).length
  return wa.size + wb.length > 0 ? (hits * 2) / (wa.size + wb.length) : 0
}

function getOverlapType(score: number, sectorMatch: boolean, geoMatch: boolean): string {
  if (score >= 80 && sectorMatch && geoMatch) return 'Duplicate funding'
  if (score >= 65 && sectorMatch) return 'Parallel TA'
  if (score >= 55 && geoMatch) return 'Implementer crowding'
  if (score >= 45) return 'Donor clustering'
  return 'Benign complementarity'
}

interface MatchResult {
  record: OverlapRecord
  score: number
  reasons: string[]
  overlapType: string
  differentiationScore: number
}

function detectOverlaps(
  title: string, sector: string, province: string, startDate: string, endDate: string,
  records: OverlapRecord[]
): MatchResult[] {
  return records
    .map(rec => {
      let score = 0
      const reasons: string[] = []
      const sectorMatch = !!(sector && rec.sector === sector)
      const geoMatch = !!(province && rec.province?.includes(province))

      if (sectorMatch) { score += 35; reasons.push(`Same sector: ${sector}`) }
      if (geoMatch) { score += 20; reasons.push(`Same geography: ${province}`) }
      if (dateOverlap(startDate, endDate, rec.start_date, rec.end_date)) {
        score += 15; reasons.push('Overlapping implementation period')
      }
      const sim = Math.round(textSimilarity(title, (rec.title ?? '') + ' ' + (rec.keywords ?? []).join(' ')) * 30)
      if (sim > 0) { score += sim; reasons.push(`Objective similarity (${sim}pts)`) }

      const overlapType = getOverlapType(score, sectorMatch, geoMatch)
      const differentiationScore = Math.max(0, 100 - score)

      return { record: rec, score, reasons, overlapType, differentiationScore }
    })
    .filter(r => r.score >= 40)
    .sort((a, b) => b.score - a.score)
}

function getRiskColor(score: number) {
  if (score >= 75) return { label: 'HIGH OVERLAP', textColor: '#b91c1c', bg: '#fee2e2', border: '#fecaca' }
  if (score >= 55) return { label: 'MEDIUM OVERLAP', textColor: '#b45309', bg: '#fef3c7', border: '#fde68a' }
  return { label: 'LOW OVERLAP', textColor: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' }
}

interface SectorCount { sector: string; count: number; donors: Set<string>; totalBudget: number }

export default function DuplicatesPage() {
  const supabase = createClient()
  const [records, setRecords] = useState<OverlapRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Market map state
  const [viewMode, setViewMode] = useState<'map' | 'checker'>('map')

  // Sector filter
  const [filterSector, setFilterSector] = useState('')
  const [filterProvince, setFilterProvince] = useState('')

  // Checker form
  const [title, setTitle] = useState('')
  const [sector, setSector] = useState('')
  const [province, setProvince] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [results, setResults] = useState<MatchResult[] | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    supabase.from('overlap_records').select('*').then(({ data }) => {
      setRecords(data ?? [])
      setLoading(false)
    })
  }, [])

  // Compute sector aggregations for market map
  const sectorMap = new Map<string, SectorCount>()
  const provinceCounts = new Map<string, number>()
  const donorPairs = new Map<string, number>()

  for (const rec of records) {
    if (!rec.sector) continue
    if (filterProvince && !rec.province?.includes(filterProvince)) continue

    const existing = sectorMap.get(rec.sector) ?? { sector: rec.sector, count: 0, donors: new Set<string>(), totalBudget: 0 }
    existing.count++
    if (rec.donor) existing.donors.add(rec.donor)
    sectorMap.set(rec.sector, existing)

    if (rec.province) {
      for (const prov of rec.province.split(',').map(p => p.trim())) {
        provinceCounts.set(prov, (provinceCounts.get(prov) ?? 0) + 1)
      }
    }
  }

  // Compute donor pair co-presence from sector aggregations
  for (const { donors } of sectorMap.values()) {
    const donorList = [...donors]
    for (let i = 0; i < donorList.length; i++) {
      for (let j = i + 1; j < donorList.length; j++) {
        const pair = [donorList[i], donorList[j]].sort().join(' + ')
        donorPairs.set(pair, (donorPairs.get(pair) ?? 0) + 1)
      }
    }
  }

  // Top donor pairs by co-presence count
  const topDonorPairs = [...donorPairs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)

  const sectorRanked = [...sectorMap.values()].sort((a, b) => b.count - a.count)
  const filteredRecords = records.filter(r =>
    (!filterSector || r.sector === filterSector) &&
    (!filterProvince || r.province?.includes(filterProvince))
  )

  // "White space" = sectors with fewer than 2 programmes
  const crowdedSectors = sectorRanked.filter(s => s.count >= 3)
  const whitespace = SECTORS.filter(s => !sectorMap.has(s) || (sectorMap.get(s)?.count ?? 0) < 2)

  function handleCheck() {
    setChecking(true)
    const matches = detectOverlaps(title, sector, province, startDate, endDate, records)
    setResults(matches)
    setChecking(false)
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Funding Overlaps Monitor</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Portfolio duplication intelligence · Market crowding map · White space finder
          </p>
        </div>
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
          {[
            { id: 'map' as const, label: 'Market Map', Icon: MapIcon },
            { id: 'checker' as const, label: 'Overlap Checker', Icon: Search },
          ].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: viewMode === v.id ? '#055C45' : '#fff',
                color: viewMode === v.id ? '#fff' : 'var(--color-text-secondary)',
              }}>
              <v.Icon size={14} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Programmes', value: records.length, color: '#055C45', sub: 'in reference DB' },
          { label: 'Crowded Sectors', value: crowdedSectors.length, color: '#b45309', sub: '3+ programmes each' },
          { label: 'White Space Sectors', value: whitespace.length, color: '#1d4ed8', sub: 'under-programmed' },
          { label: 'Active Donors', value: new Set(records.map(r => r.donor).filter(Boolean)).size, color: '#055C45', sub: 'in portfolio' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4"
            style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{s.label}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Market Map view ─────────────────────────────────────────── */}
      {viewMode === 'map' && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
              <option value="">All sectors</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
              <option value="">All provinces</option>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
            <span className="text-sm self-center" style={{ color: 'var(--color-text-secondary)' }}>
              Showing {filteredRecords.length} of {records.length} programmes
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Sector crowding chart */}
            <div className="lg:col-span-2 rounded-xl border p-4 space-y-3"
              style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2">
                <BarChart2 size={15} style={{ color: '#055C45' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Sector Programme Density</span>
              </div>
              {loading ? (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>
              ) : sectorRanked.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No data yet. Seed the overlap_records table.</p>
              ) : (
                <div className="space-y-2">
                  {sectorRanked.slice(0, 12).map(s => {
                    const pct = Math.round((s.count / Math.max(sectorRanked[0].count, 1)) * 100)
                    const crowded = s.count >= 3
                    return (
                      <div key={s.sector} className="flex items-center gap-3">
                        <div className="w-36 text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{s.sector}</div>
                        <div className="flex-1 rounded-full h-2.5" style={{ background: 'var(--color-surface-subtle)' }}>
                          <div className="h-2.5 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: crowded ? '#b45309' : '#055C45' }} />
                        </div>
                        <div className="w-8 text-xs text-right font-semibold" style={{ color: crowded ? '#b45309' : '#055C45' }}>{s.count}</div>
                        <div className="w-6 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {[...s.donors].length}d
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex gap-4 text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-2 rounded-full" style={{ background: '#b45309' }} /> Crowded (≥3)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-2 rounded-full" style={{ background: '#055C45' }} /> Normal
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* White space panel */}
            <div className="rounded-xl border p-4 space-y-3"
              style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2">
                <Zap size={15} style={{ color: '#1d4ed8' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>White Space — Under-programmed Sectors</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                High-need sectors with low donor presence. Strong entry candidates.
              </p>
              <div className="space-y-1.5">
                {whitespace.slice(0, 10).map(s => (
                  <div key={s} className="flex items-center justify-between rounded-lg px-3 py-1.5"
                    style={{ background: '#dbeafe' }}>
                    <span className="text-xs font-medium" style={{ color: '#1d4ed8' }}>{s}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#bfdbfe', color: '#1d4ed8' }}>
                      {sectorMap.get(s)?.count ?? 0} prog
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Province congestion */}
          {provinceCounts.size > 0 && (
            <div className="rounded-xl border p-4 space-y-3"
              style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2">
                <MapIcon size={15} style={{ color: '#b45309' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Province Programme Congestion</span>
              </div>
              <div className="space-y-1.5">
                {[...provinceCounts.entries()].sort((a, b) => b[1] - a[1]).map(([prov, count]) => {
                  const max = Math.max(...provinceCounts.values())
                  const pct = Math.round((count / max) * 100)
                  const crowded = count >= 5
                  return (
                    <div key={prov} className="flex items-center gap-3">
                      <div className="w-28 text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{prov}</div>
                      <div className="flex-1 rounded-full h-1.5" style={{ background: '#e5e7eb' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: crowded ? '#b45309' : '#055C45' }} />
                      </div>
                      <span className="text-[10px] font-bold w-12 text-right"
                        style={{ color: crowded ? '#b45309' : '#055C45' }}>
                        {count} prog
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Donor pair co-presence */}
          {topDonorPairs.length > 0 && (
            <div className="rounded-xl border p-4 space-y-3"
              style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2">
                <Info size={15} style={{ color: '#7c3aed' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Donor Pair Co-Presence</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Donor pairs co-active in the most sectors — highest co-ordination risk and partnership potential.
              </p>
              <div className="space-y-1.5">
                {topDonorPairs.map(([pair, count]) => {
                  const maxCount = topDonorPairs[0]?.[1] ?? 1
                  const pct = Math.round((count / maxCount) * 100)
                  return (
                    <div key={pair} className="flex items-center gap-3">
                      <div className="flex-1 text-xs truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>{pair}</div>
                      <div className="w-20 rounded-full h-1.5" style={{ background: '#e5e7eb' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: '#7c3aed' }} />
                      </div>
                      <span className="text-[10px] font-bold w-12 text-right" style={{ color: '#7c3aed' }}>{count} sector{count > 1 ? 's' : ''}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Programme grid */}
          {filteredRecords.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="px-4 py-3 border-b flex items-center gap-2"
                style={{ background: 'var(--color-surface-subtle)', borderColor: 'var(--color-border-subtle)' }}>
                <AlertTriangle size={14} style={{ color: '#b45309' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Active Portfolio — {filteredRecords.length} programmes
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    {['Programme', 'Donor', 'Sector', 'Province', 'Period'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.slice(0, 50).map((rec, i) => (
                    <tr key={rec.id} style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{rec.title}</div>
                        {rec.implementer && <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{rec.implementer}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{rec.donor ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-brand-100)', color: '#055C45' }}>
                          {rec.sector ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{rec.province ?? '—'}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                        {rec.start_date ? rec.start_date.slice(0, 7) : '?'} — {rec.end_date ? rec.end_date.slice(0, 7) : '?'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Overlap Checker view ─────────────────────────────────────── */}
      {viewMode === 'checker' && (
        <div className="space-y-5 max-w-3xl">
          <div className="rounded-xl border p-5 space-y-4"
            style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Programme / Intervention Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Strengthening Primary Healthcare Delivery in Rural KP"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Sector</label>
                <select value={sector} onChange={e => setSector(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
                  <option value="">Select sector</option>
                  {SECTORS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Province</label>
                <select value={province} onChange={e => setProvince(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
                  <option value="">Select province</option>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>

            <button onClick={handleCheck} disabled={!title || checking}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: '#055C45' }}>
              <Search size={14} />
              {checking ? 'Checking…' : 'Check for Overlaps'}
            </button>
          </div>

          <div className="rounded-xl border p-4 flex gap-3"
            style={{ background: 'var(--color-surface-subtle)', borderColor: 'var(--color-border-subtle)' }}>
            <Info size={14} style={{ color: 'var(--color-text-secondary)' }} className="shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Detection scores sector match (35pts) + geography match (20pts) + date overlap (15pts) + objective text similarity (up to 30pts).
              Scores ≥ 40 are flagged. Overlap type is classified as duplicate funding, parallel TA, implementer crowding, donor clustering, or benign complementarity.
            </p>
          </div>

          {results !== null && (
            <div className="space-y-4">
              {results.length === 0 ? (
                <div className="rounded-xl border p-5 flex items-center gap-3"
                  style={{ borderColor: 'var(--color-success-border)', background: 'var(--color-success-bg)' }}>
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--color-success-600)' }}>No significant overlaps detected</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-success-600)' }}>
                      Your intervention is differentiated from the active portfolio on sector, geography, and objective language.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} style={{ color: '#b45309' }} />
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {results.length} potential overlap{results.length !== 1 ? 's' : ''} found
                  </span>
                </div>
              )}

              {results.map(({ record, score, reasons, overlapType, differentiationScore }) => {
                const risk = getRiskColor(score)
                return (
                  <div key={record.id} className="rounded-xl border p-4"
                    style={{ borderColor: risk.border, background: risk.bg }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded mr-2"
                          style={{ background: 'rgba(255,255,255,0.6)', color: 'var(--color-text-secondary)' }}>{record.donor}</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{record.sector} · {record.province}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-bold px-2 py-1 rounded border"
                          style={{ borderColor: risk.border, background: 'rgba(255,255,255,0.6)', color: risk.textColor }}>
                          {risk.label} · {score}pts
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                          Differentiation: {differentiationScore}pts
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{record.title}</h3>
                    <div className="mt-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.7)', color: risk.textColor }}>
                        {overlapType}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {reasons.map(r => (
                        <span key={r} className="text-[10px] px-2 py-0.5 rounded"
                          style={{ background: 'rgba(255,255,255,0.6)', color: 'var(--color-text-secondary)' }}>{r}</span>
                      ))}
                    </div>
                    {record.implementer && (
                      <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>Implementer: {record.implementer}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
