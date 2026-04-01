'use client'

import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronRight, TrendingUp, TrendingDown, AlertTriangle, Minus } from 'lucide-react'

// Full canonical funder registry with Pakistan intelligence
const FUNDERS = [
  // ── Bilateral ─────────────────────────────────────────────────────────────
  { name: 'FCDO (UK)', type: 'Bilateral', status: 'active', trend: 'stable', sectors: ['Education', 'Governance', 'Health', 'Gender'], budget: '$200M+/yr', signal: 'CDPS Phase II design starting. UK spending review may constrain envelope. Girls education Balochistan pilot under discussion.', procurement: 'https://www.gov.uk/contracts-finder', country: 'https://www.gov.uk/world/pakistan' },
  { name: 'GIZ (Germany)', type: 'Bilateral', status: 'active', trend: 'growing', sectors: ['Energy', 'Governance', 'Rural Development', 'Agriculture'], budget: '€60M+/yr', signal: 'PGCEP Phase II (~€45M) biggest bilateral opportunity in 2026. German BMZ Pakistan budget growing.', procurement: 'https://www.giz.de/en/medien/ausschreibungen.html', country: 'https://www.giz.de/en/worldwide/322.html' },
  { name: 'USAID', type: 'Bilateral', status: 'partial_freeze', trend: 'shrinking', sectors: ['Health', 'Education', 'Governance', 'Agriculture'], budget: '$200M+/yr', signal: 'Stop-work orders in effect on multiple programmes. Portfolio review ongoing. Substitution signals emerging for EU, GIZ, FCDO.', procurement: 'https://www.usaid.gov/pakistan', country: 'https://www.usaid.gov/pakistan' },
  { name: 'JICA (Japan)', type: 'Bilateral', status: 'active', trend: 'stable', sectors: ['Infrastructure', 'Water/Sanitation', 'Agriculture', 'Transport'], budget: '$150M+/yr', signal: 'Strong infrastructure pipeline. Karachi water and transport focus. New rural development window under preparation.', procurement: 'https://www.jica.go.jp/pakistan/', country: 'https://www.jica.go.jp/pakistan/' },
  { name: 'KfW (Germany)', type: 'Bilateral', status: 'active', trend: 'stable', sectors: ['Water/Sanitation', 'Energy', 'Financial Inclusion'], budget: '€40M+/yr', signal: 'Financial sector and WASH focus. Works closely with GIZ on energy transition.', procurement: 'https://www.kfw-entwicklungsbank.de', country: '' },
  { name: 'AFD (France)', type: 'Bilateral', status: 'active', trend: 'stable', sectors: ['Climate', 'Agriculture', 'Urban'], budget: '€30M+/yr', signal: 'Climate and urban development focus. Exploring agri-food value chains.', procurement: 'https://www.afd.fr', country: '' },
  { name: 'EU Delegation Pakistan', type: 'Bilateral', status: 'active', trend: 'growing', sectors: ['Governance', 'Rule of Law', 'Trade', 'Climate'], budget: '€150M+/yr', signal: 'Multi-Annual Indicative Programme 2027-2030 finalisation in progress. Pre-positioning now is strategic.', procurement: 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/', country: 'https://www.eeas.europa.eu/delegations/pakistan' },
  { name: 'SDC (Switzerland)', type: 'Bilateral', status: 'active', trend: 'stable', sectors: ['Governance', 'WASH', 'Rural Development', 'Education'], budget: 'CHF 50M+/yr', signal: 'Rural development and local governance strong focus. Deepening Balochistan and GB engagement.', procurement: 'https://www.eda.admin.ch/sdc', country: '' },
  { name: 'KOICA (South Korea)', type: 'Bilateral', status: 'active', trend: 'stable', sectors: ['Health', 'Education', 'ICT', 'Agriculture'], budget: '$20M+/yr', signal: 'Health infrastructure and ICT emerging. Bilateral relations strengthening.', procurement: 'https://www.koica.go.kr', country: '' },
  { name: 'TIKA (Turkey)', type: 'Bilateral', status: 'active', trend: 'stable', sectors: ['Education', 'Humanitarian', 'Health'], budget: '$10M+/yr', signal: 'Education and humanitarian focus. Active in AJK and Balochistan.', procurement: 'https://www.tika.gov.tr', country: '' },
  { name: 'USDA (US Agriculture)', type: 'Bilateral', status: 'active', trend: 'stable', sectors: ['Agriculture', 'Food Security'], budget: '$20M+/yr', signal: 'Food security and agricultural development. McGovern-Dole programme active.', procurement: 'https://www.fas.usda.gov', country: '' },
  { name: 'DFAT (Australia)', type: 'Bilateral', status: 'limited', trend: 'stable', sectors: ['Education', 'Governance'], budget: 'AUD 10M+/yr', signal: 'Limited but consistent bilateral. Girls education and governance focus.', procurement: 'https://www.dfat.gov.au/geo/pakistan', country: '' },
  { name: 'Enabel (Belgium)', type: 'Bilateral', status: 'active', trend: 'stable', sectors: ['Health', 'Agriculture'], budget: '€15M+/yr', signal: 'Health systems and agricultural development in rural areas.', procurement: 'https://www.enabel.be', country: '' },
  { name: 'Expertise France', type: 'Bilateral', status: 'active', trend: 'growing', sectors: ['Governance', 'Education', 'Health'], budget: '€10M+/yr', signal: 'Technical assistance arm of AFD. EU-funded TA often implemented through Expertise France.', procurement: 'https://www.expertisefrance.fr', country: '' },

  // ── Multilateral / IFI ────────────────────────────────────────────────────
  { name: 'World Bank', type: 'Multilateral', status: 'active', trend: 'growing', sectors: ['Governance', 'Education', 'Health', 'Infrastructure', 'Energy'], budget: '$1.2B+/yr', signal: 'RISE Programme DLI 3 on track. FY27 pipeline includes urban resilience and secondary education. Stable country envelope.', procurement: 'https://projects.worldbank.org/en/projects-operations/procurement', country: 'https://www.worldbank.org/en/country/pakistan' },
  { name: 'ADB', type: 'Multilateral', status: 'active', trend: 'growing', sectors: ['Energy', 'Transport', 'Agriculture', 'Finance'], budget: '$1.5B+/yr', signal: 'Energy transition facility under design. Punjab agriculture executing well. Q2 2026 country partnership strategy update expected.', procurement: 'https://www.adb.org/business/opportunities', country: 'https://www.adb.org/countries/pakistan/main' },
  { name: 'IMF', type: 'Multilateral', status: 'active', trend: 'stable', sectors: ['Fiscal Reform', 'Monetary Policy', 'Financial Sector'], budget: 'Programme-based', signal: 'EFF programme ongoing. 9th review expected Q2 2026. Prior actions on FBR and energy tariff critical.', procurement: 'N/A', country: 'https://www.imf.org/en/countries/PAK' },
  { name: 'Islamic Development Bank (IsDB)', type: 'Multilateral', status: 'active', trend: 'growing', sectors: ['Infrastructure', 'Education', 'Health', 'Agriculture'], budget: '$300M+/yr', signal: 'Strong pipeline in transport, education, and agriculture. IsDB-ITFC trade finance active.', procurement: 'https://www.isdb.org/what-we-do/procurement', country: 'https://www.isdb.org' },
  { name: 'AIIB', type: 'Multilateral', status: 'active', trend: 'growing', sectors: ['Infrastructure', 'Energy', 'Water'], budget: '$200M+/yr', signal: 'Infrastructure and climate focus. Co-financing with World Bank and ADB increasingly common.', procurement: 'https://www.aiib.org/en/opportunities/business/procurement/', country: '' },
  { name: 'OPEC Fund', type: 'Multilateral', status: 'active', trend: 'stable', sectors: ['Infrastructure', 'Agriculture', 'Energy'], budget: '$100M+/yr', signal: 'Infrastructure loans and co-financing. Works with bilateral and multilateral partners.', procurement: 'https://opecfund.org', country: '' },
  { name: 'IFAD', type: 'Multilateral', status: 'active', trend: 'stable', sectors: ['Agriculture', 'Rural Development', 'Food Security'], budget: '$80M+/yr', signal: 'Rural livelihoods and smallholder agriculture focus. Strong rural ADP complementarity.', procurement: 'https://www.ifad.org/en/business-opportunities', country: '' },

  // ── UN Agencies ───────────────────────────────────────────────────────────
  { name: 'UNDP Pakistan', type: 'UN', status: 'active', trend: 'stable', sectors: ['Governance', 'Environment', 'DRR', 'Gender'], budget: '$50M+/yr', signal: 'Governance and DRR strong. Transitional justice and rule of law expanding. SDG acceleration focus.', procurement: 'https://procurement-notices.undp.org/', country: 'https://www.undp.org/pakistan' },
  { name: 'UNICEF Pakistan', type: 'UN', status: 'active', trend: 'stable', sectors: ['Education', 'Health', 'WASH', 'Nutrition'], budget: '$80M+/yr', signal: 'Polio eradication, nutrition, and out-of-school children. WASH programme expanding.', procurement: 'https://www.ungm.org', country: 'https://www.unicef.org/pakistan' },
  { name: 'WHO Pakistan', type: 'UN', status: 'active', trend: 'stable', sectors: ['Health', 'Nutrition', 'Emergency Response'], budget: '$30M+/yr', signal: 'Health systems strengthening and disease surveillance. Climate-health nexus emerging.', procurement: 'https://www.ungm.org', country: 'https://www.emro.who.int/pak/' },
  { name: 'WFP Pakistan', type: 'UN', status: 'active', trend: 'stable', sectors: ['Food Security', 'Nutrition', 'Humanitarian'], budget: '$100M+/yr', signal: 'Flood recovery and food assistance. Resilience livelihoods programme expanding in KP and Balochistan.', procurement: 'https://www.wfp.org/procurement', country: 'https://www.wfp.org/countries/pakistan' },
  { name: 'UNFPA Pakistan', type: 'UN', status: 'active', trend: 'stable', sectors: ['Health', 'Gender', 'Population'], budget: '$20M+/yr', signal: 'Reproductive health and population data. Gender-based violence response expanding.', procurement: 'https://www.ungm.org', country: 'https://pakistan.unfpa.org' },
  { name: 'FAO Pakistan', type: 'UN', status: 'active', trend: 'stable', sectors: ['Agriculture', 'Food Security', 'Climate'], budget: '$30M+/yr', signal: 'Locust response winding down. Climate-smart agriculture and water management expanding.', procurement: 'https://www.ungm.org', country: 'https://www.fao.org/pakistan/en/' },
  { name: 'ILO Pakistan', type: 'UN', status: 'active', trend: 'stable', sectors: ['Labour', 'TVET', 'Social Protection', 'Gender'], budget: '$15M+/yr', signal: 'Decent work and skills development. Worker rights in supply chains emerging donor interest.', procurement: 'https://www.ilo.org', country: 'https://www.ilo.org/islamabad' },
  { name: 'UN Women Pakistan', type: 'UN', status: 'active', trend: 'growing', sectors: ['Gender', 'Governance', 'Economic Empowerment'], budget: '$15M+/yr', signal: 'Women economic empowerment and political participation. Increasing bilateral co-funding.', procurement: 'https://www.ungm.org', country: 'https://www.unwomen.org/en/where-we-are/asia-and-the-pacific/pakistan' },
  { name: 'UNHCR Pakistan', type: 'UN', status: 'active', trend: 'stable', sectors: ['Humanitarian', 'Rule of Law', 'Education'], budget: '$100M+/yr', signal: 'Afghan refugee response dominant. Repatriation support and host community integration expanding.', procurement: 'https://www.unhcr.org/procurementnotices.html', country: 'https://www.unhcr.org/pk/' },
  { name: 'UNOPS', type: 'UN', status: 'active', trend: 'growing', sectors: ['Infrastructure', 'Procurement', 'Humanitarian'], budget: '$50M+/yr', signal: 'Flood recovery infrastructure delivery. Procurement services for UN and bilateral donors.', procurement: 'https://www.ungm.org', country: '' },

  // ── Philanthropic / Climate / Pooled ──────────────────────────────────────
  { name: 'Gates Foundation', type: 'Philanthropy', status: 'active', trend: 'stable', sectors: ['Health', 'Nutrition', 'Agriculture', 'Financial Inclusion'], budget: '$100M+/yr', signal: 'Polio eradication, family planning, and smallholder agriculture. Digital financial inclusion growing.', procurement: 'https://www.gatesfoundation.org', country: '' },
  { name: 'Aga Khan Development Network', type: 'Philanthropy', status: 'active', trend: 'stable', sectors: ['Education', 'Health', 'Rural Development', 'Financial Inclusion'], budget: '$100M+/yr', signal: 'Massive Pakistan footprint across KP, GB, AJK. AKDN entities include AKF, AKHS, AKDN, FOCUS, AKRSP.', procurement: 'https://www.akdn.org', country: '' },
  { name: 'Green Climate Fund (GCF)', type: 'Climate', status: 'active', trend: 'growing', sectors: ['Climate', 'Water', 'Agriculture', 'Energy'], budget: '$200M+', signal: 'Pakistan Loss & Damage fund access ongoing. National Adaptation Plan funding cycle expected 2026.', procurement: 'https://www.greenclimate.fund/tenders', country: '' },
  { name: 'Adaptation Fund', type: 'Climate', status: 'active', trend: 'growing', sectors: ['Climate', 'Agriculture', 'DRR'], budget: '$30M+', signal: 'Direct access through NDMA and ERRA. Climate adaptation in flood-prone districts.', procurement: 'https://www.adaptation-fund.org', country: '' },
  { name: 'Global Fund', type: 'Philanthropy', status: 'active', trend: 'stable', sectors: ['Health'], budget: '$200M+/cycle', signal: 'HIV, TB, Malaria 3-year grants. Sub-recipient market strong for health implementers.', procurement: 'https://www.theglobalfund.org', country: '' },
  { name: 'Gavi', type: 'Philanthropy', status: 'active', trend: 'stable', sectors: ['Health', 'Nutrition'], budget: '$100M+/cycle', signal: 'Immunization systems strengthening. Cold chain and EPI delivery focus.', procurement: 'https://www.gavi.org', country: '' },
  { name: 'PPAF', type: 'Pakistan', status: 'active', trend: 'stable', sectors: ['Financial Inclusion', 'Rural Development', 'Gender'], budget: 'PKR billion-scale', signal: 'Pakistan Poverty Alleviation Fund. Works through partner organizations. Social protection nexus.', procurement: 'https://www.ppaf.org.pk', country: '' },
  { name: 'Karandaaz', type: 'Pakistan', status: 'active', trend: 'growing', sectors: ['Financial Inclusion', 'SME', 'Digital'], budget: 'PKR billion-scale', signal: 'UKAID and Gates-backed. Digital finance, SME lending, and agricultural finance strong.', procurement: 'https://www.karandaaz.com.pk', country: '' },
]

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  Bilateral:    { color: '#055C45', bg: 'var(--color-brand-100)' },
  Multilateral: { color: '#1d4ed8', bg: '#dbeafe' },
  UN:           { color: '#7c3aed', bg: '#ede9fe' },
  Philanthropy: { color: '#b45309', bg: '#fef3c7' },
  Climate:      { color: '#15803d', bg: '#dcfce7' },
  Pakistan:     { color: '#b91c1c', bg: '#fee2e2' },
}

const TREND_ICONS = {
  growing:  { Icon: TrendingUp,   color: '#15803d', label: 'Growing' },
  stable:   { Icon: Minus,        color: '#1d4ed8', label: 'Stable' },
  shrinking:{ Icon: TrendingDown, color: '#b91c1c', label: 'Shrinking' },
}

const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  active:         { label: 'Active',         color: '#15803d', bg: '#dcfce7' },
  partial_freeze: { label: 'Partial Freeze', color: '#b91c1c', bg: '#fee2e2' },
  limited:        { label: 'Limited',        color: '#b45309', bg: '#fef3c7' },
}

export function FunderCoverage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterTrend, setFilterTrend] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const filtered = FUNDERS.filter(f => {
    if (filterType && f.type !== filterType) return false
    if (filterTrend && f.trend !== filterTrend) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) &&
        !f.sectors.join(' ').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const types = [...new Set(FUNDERS.map(f => f.type))]
  const displayedFunders = showAll ? filtered : filtered.slice(0, 15)

  const growing = FUNDERS.filter(f => f.trend === 'growing').length
  const shrinking = FUNDERS.filter(f => f.trend === 'shrinking').length
  const freezes = FUNDERS.filter(f => f.status === 'partial_freeze').length

  return (
    <div className="space-y-5 mt-4">
      <div className="rounded-xl border p-4"
        style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Funder Intelligence — Full Registry ({FUNDERS.length} funders)
        </h2>

        {/* Coverage KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total Funders', value: FUNDERS.length, color: '#055C45' },
            { label: 'Growing', value: growing, color: '#15803d' },
            { label: 'Shrinking / Frozen', value: shrinking + freezes, color: '#b91c1c' },
            { label: 'Types Covered', value: types.length, color: '#1d4ed8' },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3 border" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <input
            placeholder="Search funders or sectors…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm flex-1 min-w-[200px]"
            style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }}
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
            <option value="">All types</option>
            {types.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterTrend} onChange={e => setFilterTrend(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)' }}>
            <option value="">All trends</option>
            <option value="growing">Growing</option>
            <option value="stable">Stable</option>
            <option value="shrinking">Shrinking</option>
          </select>
        </div>
      </div>

      {/* Funder list */}
      <div className="space-y-2">
        {displayedFunders.map(funder => {
          const tc = TYPE_CONFIG[funder.type] ?? TYPE_CONFIG.Bilateral
          const trend = TREND_ICONS[funder.trend as keyof typeof TREND_ICONS] ?? TREND_ICONS.stable
          const status = STATUS_COLORS[funder.status] ?? STATUS_COLORS.active
          const isOpen = expanded === funder.name

          return (
            <div key={funder.name} className="rounded-xl border overflow-hidden"
              style={{ borderColor: 'var(--color-border-subtle)', background: '#fff' }}>
              <button
                onClick={() => setExpanded(isOpen ? null : funder.name)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{ background: isOpen ? 'var(--color-brand-100)' : '#fff' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{funder.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: tc.bg, color: tc.color }}>{funder.type}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: status.bg, color: status.color }}>{status.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {funder.sectors.slice(0, 4).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' }}>{s}</span>
                    ))}
                    {funder.sectors.length > 4 && <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>+{funder.sectors.length - 4}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-xs">
                    <trend.Icon size={12} style={{ color: trend.color }} />
                    <span style={{ color: trend.color }}>{trend.label}</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{funder.budget}</span>
                  {isOpen ? <ChevronDown size={14} style={{ color: '#055C45' }} /> : <ChevronRight size={14} style={{ color: 'var(--color-text-disabled)' }} />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div className="rounded-lg p-3 mt-3" style={{ background: 'var(--color-brand-100)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#055C45' }}>Intelligence Signal</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{funder.signal}</p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {funder.country && (
                      <a href={funder.country} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: '#055C45' }}>
                        <ExternalLink size={11} /> Country Page
                      </a>
                    )}
                    {funder.procurement !== 'N/A' && (
                      <a href={funder.procurement} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: '#055C45' }}>
                        <ExternalLink size={11} /> Procurement Portal
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {funder.sectors.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: tc.bg, color: tc.color }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length > 15 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full rounded-xl border py-3 text-sm font-medium transition-colors"
          style={{ borderColor: '#055C45', color: '#055C45', background: '#fff' }}
        >
          {showAll ? `Show less` : `Show all ${filtered.length} funders`}
        </button>
      )}
    </div>
  )
}
