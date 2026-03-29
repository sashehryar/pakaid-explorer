'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OverlapRecord } from '@/lib/types/database'
import { Search, AlertTriangle, Info } from 'lucide-react'

interface MatchResult {
  record: OverlapRecord
  score: number
  reasons: string[]
}

const SECTORS = ['Education', 'Health', 'Governance', 'Agriculture', 'Climate Resilience',
  'WASH / Infrastructure', 'Finance / Private Sector', 'Economic Growth', 'Rule of Law', 'Energy', 'Trade']

const PROVINCES = ['Federal', 'Punjab', 'Sindh', 'KP', 'Balochistan', 'AJK', 'GB']

function keywordSimilarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const aSet = new Set(a.map(s => s.toLowerCase()))
  const matches = b.filter(w => aSet.has(w.toLowerCase())).length
  return Math.round((matches / Math.max(a.length, b.length)) * 30)
}

function dateOverlap(s1: string | null, e1: string | null, s2: string | null, e2: string | null): boolean {
  if (!s1 || !e1 || !s2 || !e2) return false
  return new Date(s1) <= new Date(e2) && new Date(s2) <= new Date(e1)
}

function detectOverlaps(
  title: string, sector: string, province: string, startDate: string, endDate: string,
  records: OverlapRecord[]
): MatchResult[] {
  const keywords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3)

  return records
    .map(rec => {
      let score = 0
      const reasons: string[] = []

      if (sector && rec.sector === sector) { score += 35; reasons.push(`Same sector: ${sector}`) }
      if (province && rec.province?.includes(province)) { score += 20; reasons.push(`Same geography: ${province}`) }
      if (dateOverlap(startDate, endDate, rec.start_date, rec.end_date)) {
        score += 15; reasons.push('Overlapping implementation period')
      }
      const kwScore = keywordSimilarity(keywords, rec.keywords ?? [])
      if (kwScore > 0) { score += kwScore; reasons.push(`Keyword similarity (${kwScore}pts)`) }

      return { record: rec, score, reasons }
    })
    .filter(r => r.score >= 40)
    .sort((a, b) => b.score - a.score)
}

function getRiskLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 75) return { label: 'HIGH OVERLAP', color: 'text-red-700', bg: 'bg-red-50 border-red-200' }
  if (score >= 55) return { label: 'MEDIUM OVERLAP', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' }
  return { label: 'LOW OVERLAP', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' }
}

export default function DuplicatesPage() {
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [sector, setSector] = useState('')
  const [province, setProvince] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [results, setResults] = useState<MatchResult[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCheck() {
    setLoading(true)
    const recordsRes = await supabase.from('overlap_records').select('*')
    const records: OverlapRecord[] = recordsRes.data ?? []
    const matches = detectOverlaps(title, sector, province, startDate, endDate, records)
    setResults(matches)
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Duplicate Checker</h1>
        <p className="text-sm text-ash mt-0.5">Check your proposal for overlap against the active portfolio</p>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-silver bg-card p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate uppercase tracking-wide">Programme Title</label>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Strengthening TVET in Rural Punjab"
            className="w-full rounded-lg border border-silver bg-fog px-3 py-2 text-sm outline-none focus:border-pine focus:ring-1 focus:ring-pine"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate uppercase tracking-wide">Sector</label>
            <select value={sector} onChange={e => setSector(e.target.value)}
              className="w-full rounded-lg border border-silver bg-fog px-3 py-2 text-sm outline-none focus:border-pine">
              <option value="">Select sector</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate uppercase tracking-wide">Province / Region</label>
            <select value={province} onChange={e => setProvince(e.target.value)}
              className="w-full rounded-lg border border-silver bg-fog px-3 py-2 text-sm outline-none focus:border-pine">
              <option value="">Select province</option>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate uppercase tracking-wide">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-silver bg-fog px-3 py-2 text-sm outline-none focus:border-pine" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate uppercase tracking-wide">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-silver bg-fog px-3 py-2 text-sm outline-none focus:border-pine" />
          </div>
        </div>

        <button
          onClick={handleCheck} disabled={!title || loading}
          className="w-full rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Search size={14} />
          {loading ? 'Checking…' : 'Check for Overlaps'}
        </button>
      </div>

      {/* How it works */}
      <div className="rounded-xl bg-fog border border-silver p-4 flex gap-3">
        <Info size={14} className="text-ash shrink-0 mt-0.5" />
        <p className="text-xs text-ash leading-relaxed">
          Detection uses 3 layers: <strong>exact sector + geography match</strong> (55pts),
          <strong> date range overlap</strong> (+15pts), and <strong>keyword similarity</strong> (+up to 30pts).
          Scores ≥40 are flagged. Reference database includes IATI, WB, and ADB active projects in Pakistan.
        </p>
      </div>

      {/* Results */}
      {results !== null && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {results.length === 0 ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3 w-full">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-green-800">No significant overlaps detected</p>
                  <p className="text-xs text-green-700 mt-0.5">Your proposal is differentiated from the active portfolio based on sector, geography, and dates.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <AlertTriangle size={16} className="text-amber-600" />
                <span className="font-semibold text-ink">{results.length} potential overlap{results.length !== 1 ? 's' : ''} found</span>
              </div>
            )}
          </div>

          {results.map(({ record, score, reasons }) => {
            const risk = getRiskLevel(score)
            return (
              <div key={record.id} className={`rounded-xl border p-4 ${risk.bg}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-xs font-bold text-ash bg-white/60 px-1.5 py-0.5 rounded mr-2">{record.donor}</span>
                    <span className="text-xs text-ash">{record.sector} · {record.province}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded border ${risk.bg} ${risk.color} whitespace-nowrap`}>
                    {risk.label} · {score}pts
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-ink">{record.title}</h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {reasons.map(r => (
                    <span key={r} className="text-[10px] bg-white/60 border border-white/80 px-2 py-0.5 rounded">{r}</span>
                  ))}
                </div>
                {record.implementer && (
                  <p className="text-xs text-ash mt-1.5">Implementer: {record.implementer}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
