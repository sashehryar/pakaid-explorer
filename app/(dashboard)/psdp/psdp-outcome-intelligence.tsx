'use client'

import { useState } from 'react'
import { ExternalLink, Target, BookOpen, ChevronDown, ChevronRight, Sparkles, Loader2 } from 'lucide-react'

interface SectorRow {
  sector: string
  scheme_count: number
  total_allocation_bn: number
  avg_execution_pct: number
  total_throwforward_bn: number
  avg_opportunity_score: number
  avg_stress_score: number
}

// Sector × Indicator cross-reference
const SECTOR_INDICATORS = [
  {
    sector: 'Education',
    pslm: 'School attendance (5–16), enrolment, literacy, attainment by sex and geography',
    lfs: 'Youth unemployment (15–24), LFPR, vocational training %, skills transition',
    economicSurvey: 'Education GDP share, spend/student, learning outcome trends',
    derivedGap: 'Low execution + low attendance districts; high spend + weak youth absorption',
    pslmUrl: 'https://www.pbs.gov.pk/pslm',
    lfsUrl: 'https://www.pbs.gov.pk/content/labour-force-survey-2022-23',
  },
  {
    sector: 'Health',
    pslm: 'Illness/injury, consultation %, maternal/child health proxies, immunization, water/sanitation context',
    lfs: 'Inactivity due to health/care, health sector employment',
    economicSurvey: 'Health GDP share, doctor-population ratio, beds, fiscal trajectory',
    derivedGap: 'High health spend + low household access; infrastructure vs deprivation clusters',
    pslmUrl: 'https://www.pbs.gov.pk/pslm',
    lfsUrl: 'https://www.pbs.gov.pk/content/labour-force-survey-2022-23',
  },
  {
    sector: 'Water / Sanitation',
    pslm: 'Drinking water source, toilet facility, drainage, housing quality composite',
    lfs: 'Rural labour dependence, female time burden proxies',
    economicSurvey: 'Water availability, irrigation coverage, climate/infrastructure context',
    derivedGap: 'Low water execution in high deprivation districts; urban vs rural sanitation gap',
    pslmUrl: 'https://pslm-sdgs.data.gov.pk',
    lfsUrl: 'https://www.pbs.gov.pk/content/labour-force-survey-2022-23',
  },
  {
    sector: 'Agriculture',
    pslm: 'Rural consumption, land ownership, housing quality in agricultural districts',
    lfs: 'Agriculture employment share, rural unemployment, underemployment, female rural work',
    economicSurvey: 'Crop yields, irrigation efficiency, value chain priorities, agriculture GDP',
    derivedGap: 'Irrigation spend vs rural vulnerability; high ag employment + low PSDP allocation',
    pslmUrl: 'https://www.pbs.gov.pk/pslm',
    lfsUrl: 'https://www.pbs.gov.pk/content/labour-force-survey-2022-23',
  },
  {
    sector: 'Energy',
    pslm: 'Electricity access, household appliances as living standard proxy',
    lfs: 'Industrial/services employment concentration by geography',
    economicSurvey: 'Power capacity, load-shedding, circular debt, industry bottleneck narrative',
    derivedGap: 'Energy bottlenecks in employment-dense zones; electrification gaps vs development spend',
    pslmUrl: 'https://pslm-sdgs.data.gov.pk',
    lfsUrl: 'https://www.pbs.gov.pk/content/labour-force-survey-2022-23',
  },
  {
    sector: 'Transport',
    pslm: 'Distance to services, isolation proxies, access to markets',
    lfs: 'Regional employment structure, sector concentration',
    economicSurvey: 'Road density, logistics costs, trade corridor priorities',
    derivedGap: 'Transport spend vs labour market concentration; low execution on strategic corridors',
    pslmUrl: 'https://www.pbs.gov.pk/pslm',
    lfsUrl: 'https://www.pbs.gov.pk/content/labour-force-survey-2022-23',
  },
  {
    sector: 'Skills / TVET',
    pslm: 'Educational attainment (secondary+), youth profile, skills gap proxies',
    lfs: 'Youth inactivity, vocational/technical training %, sector employment patterns',
    economicSurvey: 'TVET enrolment, skills gaps, industrial workforce priorities',
    derivedGap: 'TVET need hotspots; female inactivity vs skills spending gaps by district',
    pslmUrl: 'https://www.pbs.gov.pk/pslm',
    lfsUrl: 'https://www.pbs.gov.pk/content/labour-force-survey-2022-23',
  },
  {
    sector: 'Social Protection',
    pslm: 'Multidimensional poverty, housing quality, layered deprivation composite',
    lfs: 'Informal employment, vulnerable groups, inactivity',
    economicSurvey: 'BISP/Ehsaas metrics, poverty headcount, social sector trajectory',
    derivedGap: 'Districts with layered deprivation and weak execution; social protection + service delivery convergence',
    pslmUrl: 'https://pslm-sdgs.data.gov.pk',
    lfsUrl: 'https://www.pbs.gov.pk/content/labour-force-survey-2022-23',
  },
]

// Key data sources
const DATA_SOURCES = [
  {
    name: 'Federal PSDP 2025-26',
    type: 'PSDP',
    url: 'https://pc.gov.pk/uploads/archives/PSDP_2025-26_Final.pdf',
    desc: 'Planning Commission. Ministry, sector, cost, throwforward, allocation.',
  },
  {
    name: 'PSDP Archive (2000–2024)',
    type: 'PSDP',
    url: 'https://pc.gov.pk/web/psdparchive',
    desc: 'Historical PSDP documents for longitudinal scheme tracking.',
  },
  {
    name: 'Punjab ADP 2025-26',
    type: 'ADP',
    url: 'https://pnd.punjab.gov.pk',
    desc: 'Punjab P&D. ADP book, scheme details, utilization reports.',
  },
  {
    name: 'Sindh ADP',
    type: 'ADP',
    url: 'https://pnd.sindh.gov.pk',
    desc: 'Sindh P&D. ADP 2025-26 highlights and district plans.',
  },
  {
    name: 'KP ADP 2025-26',
    type: 'ADP',
    url: 'https://kp.gov.pk/page/adp_schemes',
    desc: 'KP Planning & Development. Scheme-level ADP data.',
  },
  {
    name: 'Balochistan PSDP 2025-26',
    type: 'ADP',
    url: 'https://sit.balochistan.gov.pk/wp-content/uploads/2025/11/PSDP-2025-26.pdf',
    desc: 'Balochistan P&D. Provincial development programme.',
  },
  {
    name: 'PBS PSLM Microdata',
    type: 'Outcome',
    url: 'https://www.pbs.gov.pk/pslm',
    desc: 'Pakistan Social and Living Standards Measurement. Welfare outcomes by district.',
  },
  {
    name: 'PBS Labour Force Survey',
    type: 'Outcome',
    url: 'https://www.pbs.gov.pk/content/labour-force-survey-2022-23',
    desc: 'LFS 2022-23. LFPR, unemployment, sector employment, vocational training.',
  },
  {
    name: 'Pakistan Economic Survey 2024-25',
    type: 'Macro',
    url: 'https://finance.gov.pk/survey_2025.html',
    desc: 'GDP structure, sector narratives, fiscal data, social indicators.',
  },
  {
    name: 'SBP EasyData',
    type: 'Macro',
    url: 'https://easydata.sbp.org.pk',
    desc: '23,988 time series — CPI, credit, GDP, remittances, deposits by province.',
  },
  {
    name: 'PPRA Procurement Notices',
    type: 'Procurement',
    url: 'https://www.ppra.org.pk',
    desc: 'Public Procurement Regulatory Authority. Federal procurement notices.',
  },
  {
    name: 'Annual Plan 2024-25',
    type: 'PSDP',
    url: 'https://pc.gov.pk/uploads/annualplan/annual_plan_24.pdf',
    desc: 'Planning Commission annual plan with macro-fiscal context.',
  },
]

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  PSDP: { bg: 'var(--color-brand-100)', color: '#055C45' },
  ADP: { bg: '#dbeafe', color: '#1d4ed8' },
  Outcome: { bg: '#fef3c7', color: '#b45309' },
  Macro: { bg: '#ede9fe', color: '#7c3aed' },
  Procurement: { bg: '#fee2e2', color: '#b91c1c' },
}

// Opportunity scoring framework
const OPP_SCORE_FACTORS = [
  { label: 'Low execution or stalled utilization in PSDP/ADP', weight: 25, color: '#b91c1c' },
  { label: 'Weak social outcomes from PSLM (attendance, water, health access)', weight: 25, color: '#b45309' },
  { label: 'Labour distress from LFS (unemployment, inactivity, skills gap)', weight: 25, color: '#1d4ed8' },
  { label: 'Macro/sector priority fit from Economic Survey', weight: 25, color: '#7c3aed' },
]

interface Props {
  sectorData?: SectorRow[]
}

export function PsdpOutcomeIntelligence({ sectorData = [] }: Props) {
  const [openSector, setOpenSector]   = useState<string | null>(null)
  const [showSources, setShowSources] = useState(false)
  const [narratives, setNarratives]   = useState<Record<string, string>>({})
  const [generating, setGenerating]   = useState<Record<string, boolean>>({})

  async function generateNarrative(s: typeof SECTOR_INDICATORS[number]) {
    setGenerating(prev => ({ ...prev, [s.sector]: true }))
    const dbRow = sectorData.find(r => r.sector.toLowerCase().includes(s.sector.toLowerCase().split('/')[0].trim()))
    try {
      const res = await fetch('/api/psdp-sector-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector:            s.sector,
          execution_pct:     dbRow?.avg_execution_pct     ?? 0,
          opportunity_score: dbRow?.avg_opportunity_score ?? 0,
          stress_score:      dbRow?.avg_stress_score      ?? 0,
          allocation_bn:     dbRow?.total_allocation_bn   ?? 0,
          scheme_count:      dbRow?.scheme_count          ?? 0,
          throwforward_bn:   dbRow?.total_throwforward_bn ?? 0,
          derived_gap:       s.derivedGap,
        }),
      })
      const d = await res.json() as { narrative?: string; error?: string }
      if (d.narrative) setNarratives(prev => ({ ...prev, [s.sector]: d.narrative! }))
    } catch { /* silent */ }
    setGenerating(prev => ({ ...prev, [s.sector]: false }))
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Opportunity Scoring Framework */}
      <div className="rounded-xl border p-5 space-y-4"
        style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Target size={16} style={{ color: '#055C45' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Opportunity Scoring Framework</h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Each scheme/district is scored across four dimensions to identify where donor support, TA, co-financing, or redesign would create highest marginal value.
          The most actionable cases are where execution is weak <em>and</em> outcome need is severe simultaneously.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {OPP_SCORE_FACTORS.map(f => (
            <div key={f.label} className="rounded-lg p-3 space-y-2" style={{ border: '1px solid var(--color-border-subtle)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: f.color }}>{f.weight}%</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{f.label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg p-3 text-xs" style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Methodology note:</strong> Cross-referencing PSLM, LFS, and Economic Survey with PSDP/ADP identifies mismatch, concentration, and gaps —
          not causal proof. Geography and time alignment is explicitly labelled as &quot;aligned indicator view&quot; or &quot;proxy comparison.&quot;
          PBS methodology breaks (19th ICLS transition) are marked to prevent false trend conclusions.
        </div>
      </div>

      {/* Sector × Outcome Indicator Table */}
      <div className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="px-5 py-3 flex items-center gap-2 border-b"
          style={{ background: 'var(--color-surface-subtle)', borderColor: 'var(--color-border-subtle)' }}>
          <BookOpen size={15} style={{ color: '#055C45' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Sector × Outcome Indicator Cross-Reference</h2>
        </div>
        <div className="divide-y" style={{ '--divide-color': 'var(--color-border-subtle)' } as React.CSSProperties}>
          {SECTOR_INDICATORS.map(s => (
            <div key={s.sector}>
              <button
                onClick={() => setOpenSector(openSector === s.sector ? null : s.sector)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm text-left transition-colors"
                style={{ background: openSector === s.sector ? 'var(--color-brand-100)' : '#fff' }}
              >
                <span className="font-semibold" style={{ color: '#055C45' }}>{s.sector}</span>
                {openSector === s.sector
                  ? <ChevronDown size={15} style={{ color: '#055C45' }} />
                  : <ChevronRight size={15} style={{ color: 'var(--color-text-secondary)' }} />}
              </button>
              {openSector === s.sector && (
                <div className="px-5 pb-4 space-y-3 bg-white border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    {[
                      { label: 'PSLM Indicators', value: s.pslm, url: s.pslmUrl, color: '#b45309', bg: '#fef3c7' },
                      { label: 'Labour Force Survey', value: s.lfs, url: s.lfsUrl, color: '#1d4ed8', bg: '#dbeafe' },
                      { label: 'Economic Survey Context', value: s.economicSurvey, url: 'https://finance.gov.pk/survey_2025.html', color: '#7c3aed', bg: '#ede9fe' },
                    ].map(col => (
                      <div key={col.label} className="rounded-lg p-3 space-y-2" style={{ background: col.bg }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: col.color }}>{col.label}</span>
                          <a href={col.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={11} style={{ color: col.color }} />
                          </a>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{col.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--color-brand-100)' }}>
                    <span className="text-xs font-bold" style={{ color: '#055C45' }}>Derived Gap Intelligence: </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{s.derivedGap}</span>
                  </div>

                  {/* Groq AI narrative */}
                  <div className="rounded-lg p-3 border" style={{ borderColor: 'var(--color-border-subtle)', background: '#fafafa' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#7c3aed' }}>
                        <Sparkles size={11} /> AI Sector Gap Narrative
                      </span>
                      <button
                        onClick={() => generateNarrative(s)}
                        disabled={generating[s.sector]}
                        className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded transition-colors"
                        style={{
                          background: '#7c3aed', color: '#fff',
                          opacity: generating[s.sector] ? 0.6 : 1,
                          cursor: generating[s.sector] ? 'not-allowed' : 'pointer',
                        }}>
                        {generating[s.sector]
                          ? <><Loader2 size={10} className="animate-spin" /> Generating…</>
                          : <><Sparkles size={10} /> Generate</>}
                      </button>
                    </div>
                    {narratives[s.sector] ? (
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                        {narratives[s.sector]}
                      </p>
                    ) : (
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Click Generate to get a live Groq-powered gap narrative for this sector using real PSDP data.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <button
          onClick={() => setShowSources(!showSources)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm text-left"
          style={{ background: 'var(--color-surface-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <ExternalLink size={15} style={{ color: '#055C45' }} />
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Data Sources & Reference Links ({DATA_SOURCES.length})</span>
          </div>
          {showSources ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        {showSources && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white">
            {DATA_SOURCES.map(src => {
              const tc = TYPE_COLORS[src.type] ?? TYPE_COLORS.Macro
              return (
                <a key={src.name} href={src.url} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg border p-3 flex items-start gap-3 hover:shadow-sm transition-shadow"
                  style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                    style={{ background: tc.bg, color: tc.color }}>{src.type}</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#055C45' }}>{src.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{src.desc}</div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
