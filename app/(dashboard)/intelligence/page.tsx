import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { IMFAction } from '@/lib/types/database'
import { AlertTriangle, TrendingDown, Globe, Building2, Zap, Scale, ShieldAlert, Clock } from 'lucide-react'

export const metadata: Metadata = { title: 'Political and Fiscal Risk' }

// ── Risk register (static + live IMF data) ─────────────────────────
const RISK_FAMILIES = [
  {
    id: 'imf',
    icon: TrendingDown,
    label: 'IMF Programme & Conditionality',
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fde68a',
    description: 'Prior actions, structural benchmarks, review delays',
  },
  {
    id: 'fiscal',
    icon: TrendingDown,
    label: 'Federal Fiscal Stress',
    color: '#b91c1c',
    bg: '#fee2e2',
    border: '#fecaca',
    description: 'Tax shortfall, NFC constraints, PSDP release pressure',
  },
  {
    id: 'provincial',
    icon: Building2,
    label: 'Provincial Cash & Release Stress',
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fde68a',
    description: 'ADP release freeze, counterpart funding risk, PFC delays',
  },
  {
    id: 'soe',
    icon: Zap,
    label: 'SOE & Power Sector',
    color: '#b91c1c',
    bg: '#fee2e2',
    border: '#fecaca',
    description: 'Circular debt, tariff decisions, energy subsidy pressure',
  },
  {
    id: 'political',
    icon: Globe,
    label: 'Political & Coalition Instability',
    color: '#1d4ed8',
    bg: '#dbeafe',
    border: '#bfdbfe',
    description: 'Election cycles, coalition shifts, PTI legal proceedings',
  },
  {
    id: 'legal',
    icon: Scale,
    label: 'Court, Regulatory & Legislative Shocks',
    color: '#1d4ed8',
    bg: '#dbeafe',
    border: '#bfdbfe',
    description: 'Supreme Court orders, SECP rule changes, NAB activity',
  },
  {
    id: 'donor',
    icon: Globe,
    label: 'Donor Freeze, Reprioritization & Suspension',
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fde68a',
    description: 'USAID stop-work orders, EU budget reallocation, bilateral reviews',
  },
  {
    id: 'security',
    icon: ShieldAlert,
    label: 'Security & Geopolitical Disruption',
    color: '#b91c1c',
    bg: '#fee2e2',
    border: '#fecaca',
    description: 'KP / Balochistan instability, cross-border tensions, Kabul dynamics',
  },
]

// Transmission chains: Shock → channel → programme effect → market effect
const TRANSMISSION_CHAINS = [
  {
    shock: 'IMF prior action missed / tranche delayed',
    channel: 'Tighter federal fiscal headroom',
    programmeEffect: 'Slower PSDP release and ADP utilization; counterpart funding freeze',
    marketEffect: 'Implementation support contracts delayed; PMU supervision demand rises',
    affectedSectors: ['Governance', 'Infrastructure', 'Social Protection'],
    affectedProvinces: ['Federal', 'Punjab', 'Sindh'],
    severity: 'high',
    horizon: '30d',
  },
  {
    shock: 'FBR tax shortfall (revenue target missed)',
    channel: 'Reduced federal transfers to provinces',
    programmeEffect: 'Provincial ADP cuts; counterpart fund non-release on donor programmes',
    marketEffect: 'Blended finance and co-financing proposals weakened; TA demand increases',
    affectedSectors: ['Education', 'Health', 'WASH'],
    affectedProvinces: ['Sindh', 'Balochistan', 'KP'],
    severity: 'medium',
    horizon: '60d',
  },
  {
    shock: 'USAID freeze / stop-work order expansion',
    channel: 'Portfolio-level funding gap',
    programmeEffect: 'INGOs and implementers lose direct delivery capacity; beneficiary gaps',
    marketEffect: 'EU, GIZ, FCDO substitution opportunities open; redesign / TA demand rises',
    affectedSectors: ['Health', 'Gender & Inclusion', 'Food Security'],
    affectedProvinces: ['KP', 'Balochistan', 'Federal'],
    severity: 'high',
    horizon: '30d',
  },
  {
    shock: 'Power circular debt / tariff decision delayed',
    channel: 'Load-shedding escalation, SME cost pressure',
    programmeEffect: 'Energy efficiency and renewable programmes face implementation risk',
    marketEffect: 'Off-grid and DRE technical assistance demand rises; ESCOs in demand',
    affectedSectors: ['Energy', 'Industry / SME', 'Agriculture'],
    affectedProvinces: ['Punjab', 'Sindh', 'Federal'],
    severity: 'medium',
    horizon: '90d',
  },
  {
    shock: 'Coalition shift or early election risk',
    channel: 'Policy uncertainty, cabinet reshuffle',
    programmeEffect: 'MoU renewals stall; counterpart ministry engagement weakens',
    marketEffect: 'Pipeline decisions deferred; pre-positioning and stakeholder mapping more valuable',
    affectedSectors: ['Governance', 'Rule of Law', 'Economic Growth'],
    affectedProvinces: ['Federal', 'Punjab'],
    severity: 'low',
    horizon: '90d',
  },
  {
    shock: 'Security deterioration in KP / Balochistan',
    channel: 'Access restrictions, staff evacuation, disbursement pause',
    programmeEffect: 'Field activities suspended; beneficiary access broken',
    marketEffect: 'Remote programming, digital delivery, and security-adaptive design in demand',
    affectedSectors: ['DRR / Humanitarian', 'Health', 'Education'],
    affectedProvinces: ['KP', 'Balochistan', 'AJK'],
    severity: 'medium',
    horizon: '60d',
  },
]

// Forward watchlist
const WATCHLIST = [
  { label: 'IMF 9th EFF Review Board Date', deadline: '2026-05-15', type: 'IMF', urgency: 'high', note: 'Prior actions on FBR broadening and energy tariff must be met. Delay risks tranche pause.' },
  { label: 'FY2026-27 Federal Budget Announcement', deadline: '2026-06-12', type: 'Fiscal', urgency: 'medium', note: 'PSDP allocation size and ADP provincial transfer ratios will reshape pipeline visibility.' },
  { label: 'Punjab ADP Mid-Year Review', deadline: '2026-04-30', type: 'Provincial', urgency: 'medium', note: 'Expect ADP cuts in low-utilization sectors. Watch education and WASH schemes.' },
  { label: 'USAID Pakistan Portfolio Review (internal)', deadline: '2026-04-15', type: 'Donor', urgency: 'high', note: 'Determines which programmes continue, get transferred, or close. Substitute pipeline forming.' },
  { label: 'Supreme Court PTI Leadership Ruling', deadline: '2026-05-01', type: 'Political', urgency: 'low', note: 'Coalition arithmetic could shift if outcome is contested. Governance reform programmes most exposed.' },
  { label: 'NEPRA Tariff Determination (Quarterly)', deadline: '2026-04-20', type: 'SOE', urgency: 'medium', note: 'Circular debt growth trajectory affects energy programme co-financing logic.' },
  { label: 'KP Counter-Terrorism Operational Review', deadline: '2026-05-10', type: 'Security', urgency: 'medium', note: 'Programme access decisions for KP-based humanitarian and development work may be revised.' },
  { label: 'EU Multi-Annual Indicative Programme Pakistan', deadline: '2026-06-30', type: 'Donor', urgency: 'low', note: 'MIP finalisation will lock EU sector focus for 2027-2030. Pre-positioning now is strategic.' },
]

// Province exposure matrix
const PROVINCE_EXPOSURE: Record<string, { fiscal: number; security: number; political: number; donor: number }> = {
  'Federal': { fiscal: 4, security: 2, political: 5, donor: 3 },
  'Punjab':  { fiscal: 3, security: 2, political: 4, donor: 3 },
  'Sindh':   { fiscal: 4, security: 3, political: 3, donor: 3 },
  'KP':      { fiscal: 3, security: 5, political: 3, donor: 4 },
  'Balochistan': { fiscal: 4, security: 5, political: 3, donor: 4 },
}

function RiskDot({ level }: { level: number }) {
  const colors = ['', '#dcfce7', '#fef9c3', '#fde68a', '#fca5a5', '#b91c1c']
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="w-2.5 h-2.5 rounded-full"
          style={{ background: i <= level ? colors[level] : 'var(--color-border-subtle)' }} />
      ))}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    high: { label: 'HIGH', color: '#b91c1c', bg: '#fee2e2' },
    medium: { label: 'MEDIUM', color: '#b45309', bg: '#fef3c7' },
    low: { label: 'LOW', color: '#1d4ed8', bg: '#dbeafe' },
  }
  const s = map[severity] ?? map.low
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded"
      style={{ background: s.bg, color: s.color }}>{s.label}</span>
  )
}

function HorizonBadge({ horizon }: { horizon: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded"
      style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' }}>
      <Clock size={9} />
      {horizon}
    </span>
  )
}

const STATUS_STYLES = {
  green: { dot: '#15803d', label: 'ON TRACK', bg: '#dcfce7', border: '#86efac', text: '#166534' },
  amber: { dot: '#ca8a04', label: 'AT RISK',  bg: '#fef9c3', border: '#fde68a', text: '#a16207' },
  red:   { dot: '#dc2626', label: 'DELAYED',  bg: '#fee2e2', border: '#fecaca', text: '#b91c1c' },
}

export default async function IntelligencePage() {
  const supabase = await createClient()
  const actionsRes = await supabase.from('imf_actions').select('*').order('deadline', { ascending: true })
  const actions: IMFAction[] = actionsRes.data ?? []

  const critical = actions.filter(a => a.status === 'red').length
  const atRisk = actions.filter(a => a.status === 'amber').length
  const onTrack = actions.filter(a => a.status === 'green').length

  const today = new Date()
  const watchlist30 = WATCHLIST.filter(w => {
    const d = new Date(w.deadline)
    return (d.getTime() - today.getTime()) / 86400000 <= 30
  })
  const watchlist60 = WATCHLIST.filter(w => {
    const d = new Date(w.deadline)
    const days = (d.getTime() - today.getTime()) / 86400000
    return days > 30 && days <= 60
  })
  const watchlist90 = WATCHLIST.filter(w => {
    const d = new Date(w.deadline)
    const days = (d.getTime() - today.getTime()) / 86400000
    return days > 60 && days <= 90
  })

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Political and Fiscal Risk</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Forward intelligence on shocks that delay programmes, shift procurement, and reshape implementation demand
        </p>
      </div>

      {/* KPI cards — all 8 risk families */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'IMF Actions Delayed', value: critical, color: '#b91c1c', bg: '#fee2e2' },
          { label: 'IMF Actions At Risk', value: atRisk, color: '#b45309', bg: '#fef3c7' },
          { label: 'IMF Actions On Track', value: onTrack, color: '#15803d', bg: '#dcfce7' },
          { label: 'Active Watchlist Items', value: WATCHLIST.length, color: '#055C45', bg: 'var(--color-brand-100)' },
          { label: 'Next 30-day Events', value: watchlist30.length, color: '#b91c1c', bg: '#fee2e2' },
          { label: 'Next 60-day Events', value: watchlist60.length, color: '#b45309', bg: '#fef3c7' },
          { label: 'Next 90-day Events', value: watchlist90.length, color: '#1d4ed8', bg: '#dbeafe' },
          { label: 'Risk Families Monitored', value: RISK_FAMILIES.length, color: '#055C45', bg: 'var(--color-brand-100)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4" style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Forward Watchlist */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Forward Watchlist
        </h2>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                {['Event / Milestone', 'Type', 'Deadline', 'Urgency', 'Intelligence Note'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WATCHLIST.map((item, i) => (
                <tr key={i} style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}>
                  <td className="px-4 py-3 font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{item.label}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-brand-100)', color: '#055C45' }}>{item.type}</span>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(item.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3"><SeverityBadge severity={item.urgency} /></td>
                  <td className="px-4 py-3 text-xs max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transmission chains */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Shock → Programme Transmission Logic
        </h2>
        <div className="space-y-3">
          {TRANSMISSION_CHAINS.map((chain, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3"
              style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: '#b45309' }} />
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{chain.shock}</span>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={chain.severity} />
                  <HorizonBadge horizon={chain.horizon} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg p-3 space-y-1" style={{ background: '#fef3c7' }}>
                  <div className="font-semibold" style={{ color: '#b45309' }}>Fiscal / Policy Channel</div>
                  <div style={{ color: 'var(--color-text-primary)' }}>{chain.channel}</div>
                </div>
                <div className="rounded-lg p-3 space-y-1" style={{ background: '#fee2e2' }}>
                  <div className="font-semibold" style={{ color: '#b91c1c' }}>Programme Effect</div>
                  <div style={{ color: 'var(--color-text-primary)' }}>{chain.programmeEffect}</div>
                </div>
                <div className="rounded-lg p-3 space-y-1" style={{ background: 'var(--color-brand-100)' }}>
                  <div className="font-semibold" style={{ color: '#055C45' }}>Market / Opportunity Effect</div>
                  <div style={{ color: 'var(--color-text-primary)' }}>{chain.marketEffect}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span style={{ color: 'var(--color-text-secondary)' }}>Sectors:</span>
                {chain.affectedSectors.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--color-brand-100)', color: '#055C45' }}>{s}</span>
                ))}
                <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>Provinces:</span>
                {chain.affectedProvinces.map(p => (
                  <span key={p} className="px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' }}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Province Exposure Map */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Province Risk Exposure (1 = low, 5 = high)
        </h2>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                {['Province', 'Fiscal Stress', 'Security', 'Political', 'Donor Exposure'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(PROVINCE_EXPOSURE).map(([province, scores], i) => (
                <tr key={province} style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}>
                  <td className="px-4 py-3 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{province}</td>
                  <td className="px-4 py-3"><RiskDot level={scores.fiscal} /></td>
                  <td className="px-4 py-3"><RiskDot level={scores.security} /></td>
                  <td className="px-4 py-3"><RiskDot level={scores.political} /></td>
                  <td className="px-4 py-3"><RiskDot level={scores.donor} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* IMF Prior Actions register */}
      {actions.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            IMF Prior Actions Register
          </h2>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  {['Region', 'Prior Action', 'Deadline', 'Status', 'Intelligence Note'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actions.map((action, i) => {
                  const style = STATUS_STYLES[action.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.amber
                  return (
                    <tr key={action.id} style={{ borderTop: i > 0 ? '1px solid var(--color-border-subtle)' : undefined }}>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{action.region}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>{action.action}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                        {action.deadline ? formatDate(action.deadline) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded border"
                          style={{ background: style.bg, borderColor: style.border, color: style.text }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {action.intelligence_note ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Organisation-type implications */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Implication Layer — By Organisation Type
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              type: 'Multilaterals & IFIs',
              color: '#055C45',
              bg: 'var(--color-brand-100)',
              points: [
                'Fiscal stress increases demand for PFM and DRM support',
                'IMF programme alignment strengthens budget support rationale',
                'SOE exposure creates co-financing and reform-linked opportunity',
              ],
            },
            {
              type: 'Bilateral Agencies',
              color: '#1d4ed8',
              bg: '#dbeafe',
              points: [
                'Provincial fiscal fragility opens TA and budget support entry',
                'USAID withdrawal creates substitution signals in key sectors',
                'Girls education and health most substitutable in Balochistan / KP',
              ],
            },
            {
              type: 'Implementers & INGOs',
              color: '#b45309',
              bg: '#fef3c7',
              points: [
                'PMU and supervision demand rises as PSDP execution slows',
                'USAID-adjacent programmes need continuity design or redesign',
                'Security disruption in KP opens adaptive / remote programming',
              ],
            },
            {
              type: 'Consulting Firms',
              color: '#7c3aed',
              bg: '#ede9fe',
              points: [
                'Fiscal reform TA is a growth area — tax, PFM, PEFA',
                'Energy sector policy and regulation has sustained demand',
                'Pre-positioning for EU MIP 2027-30 is strategically timed now',
              ],
            },
          ].map(icp => (
            <div key={icp.type} className="rounded-xl border p-4 space-y-3"
              style={{ background: '#fff', borderColor: 'var(--color-border-subtle)' }}>
              <div className="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: icp.bg, color: icp.color }}>{icp.type}</div>
              <ul className="space-y-1.5">
                {icp.points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-primary)' }}>
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: icp.color }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
