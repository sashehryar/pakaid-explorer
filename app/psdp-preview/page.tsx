import { createAdminClient } from '@/lib/supabase/server'
import { PsdpProvinceMap } from '@/app/(dashboard)/psdp/psdp-province-map'

// ── Types ──────────────────────────────────────────────────────────────────

interface SchemeRow {
  id: string
  title: string
  province: string | null
  sector: string | null
  ministry: string | null
  allocation_bn: number | null
  execution_pct: number | null
  opportunity_score: number | null
  risk_level: string | null
  donor_name: string | null
  is_donor_linked: boolean
  opportunity_type: string | null
}

interface ProvinceRow {
  province: string
  scheme_count: number
  total_allocation_bn: number
  total_utilized_bn: number
  avg_execution_pct: number
  total_throwforward_bn: number
  slow_moving_count: number
  high_risk_count: number
  donor_linked_count: number
  avg_opportunity_score: number
  avg_stress_score: number
}

interface MinistryRow {
  ministry: string
  scheme_count: number
  total_allocation_bn: number
  total_utilized_bn: number
  avg_execution_pct: number
  total_throwforward_bn: number
  slow_moving_count: number
  avg_opportunity_score: number
  backlog_pct: number
}

interface SectorRow {
  sector: string
  scheme_count: number
  total_allocation_bn: number
  total_utilized_bn: number
  avg_execution_pct: number
  total_throwforward_bn: number
  schemes_with_opportunities: number
  avg_opportunity_score: number
  avg_stress_score: number
  donor_linked_count: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function riskBadge(risk: string | null) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    critical: { bg: '#fee2e2', color: '#dc2626', label: 'Critical' },
    high:     { bg: '#fef3c7', color: '#b45309', label: 'High' },
    medium:   { bg: '#fefce8', color: '#a16207', label: 'Medium' },
    low:      { bg: '#dcfce7', color: '#15803d', label: 'Low' },
  }
  const cfg = risk ? (map[risk.toLowerCase()] ?? null) : null
  if (!cfg) return <span style={{ color: '#9ca3af', fontSize: '11px' }}>—</span>
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      fontSize: '11px',
      fontWeight: 700,
      padding: '2px 7px',
      borderRadius: '10px',
    }}>
      {cfg.label}
    </span>
  )
}

function oppBadge(score: number | null) {
  if (score === null) return <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
  const cfg =
    score >= 70 ? { bg: '#ede9fe', color: '#7c3aed' } :
    score >= 50 ? { bg: '#fef3c7', color: '#b45309' } :
                  { bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      fontSize: '11px',
      fontWeight: 700,
      padding: '2px 7px',
      borderRadius: '10px',
    }}>
      {score}
    </span>
  )
}

const TABLE_HEAD_STYLE: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 600,
  color: '#6b7280',
  whiteSpace: 'nowrap',
  background: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
}

const TABLE_CELL: React.CSSProperties = {
  padding: '9px 12px',
  fontSize: '13px',
  color: '#1F2937',
  verticalAlign: 'middle',
}

const CARD_STYLE: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  overflow: 'hidden',
}

const SECTION_HEADER: React.CSSProperties = {
  padding: '14px 20px',
  background: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function PsdpPreviewPage() {
  const supabase = createAdminClient()

  const [
    { data: schemesRaw },
    { data: provinceSummary },
    { data: ministrySummary },
    { data: sectorIntel },
  ] = await Promise.all([
    supabase
      .from('psdp_schemes')
      .select('*')
      .order('opportunity_score', { ascending: false, nullsFirst: false })
      .limit(200),
    supabase
      .from('psdp_province_summary')
      .select('*')
      .order('total_allocation_bn', { ascending: false }),
    supabase
      .from('psdp_ministry_efficiency')
      .select('*')
      .order('total_allocation_bn', { ascending: false })
      .limit(20),
    supabase
      .from('psdp_sector_intelligence')
      .select('*')
      .order('total_allocation_bn', { ascending: false }),
  ])

  // Cast to local types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows       = (schemesRaw     ?? []) as any[]
  const provinces  = (provinceSummary ?? []) as ProvinceRow[]
  const ministries = (ministrySummary ?? []) as MinistryRow[]
  const sectors    = (sectorIntel    ?? []) as SectorRow[]

  // ── KPI derivations ──────────────────────────────────────────
  const totalAlloc  = rows.reduce((s: number, r: any) => s + (r.allocation_bn  ?? 0), 0)
  const totalUtil   = rows.reduce((s: number, r: any) => s + (r.utilized_bn    ?? 0), 0)
  const totalThrow  = rows.reduce((s: number, r: any) => s + (r.throwforward_bn ?? ((r.allocation_bn ?? 0) - (r.utilized_bn ?? 0))), 0)
  const blendedExec = totalAlloc > 0 ? Math.round((totalUtil / totalAlloc) * 100) : 0
  const donorLinked = rows.filter((r: any) => r.is_donor_linked).length
  const slowMoving  = rows.filter((r: any) => r.is_slow_moving).length
  const withOpps    = rows.filter((r: any) => r.opportunity_type !== 'none').length
  const highOpps    = rows.filter((r: any) => (r.opportunity_score ?? 0) >= 70).length

  // Top 30 schemes for preview table
  const topSchemes: SchemeRow[] = rows.slice(0, 30).map((r: any) => ({
    id:                r.id,
    title:             r.title ?? '—',
    province:          r.province ?? null,
    sector:            r.sector   ?? null,
    ministry:          r.ministry ?? null,
    allocation_bn:     r.allocation_bn    ?? null,
    execution_pct:     r.execution_pct    ?? null,
    opportunity_score: r.opportunity_score ?? null,
    risk_level:        r.risk_level        ?? null,
    donor_name:        r.donor_name        ?? null,
    is_donor_linked:   r.is_donor_linked   ?? false,
    opportunity_type:  r.opportunity_type  ?? null,
  }))

  const kpis = [
    { label: 'Schemes',          value: rows.length,                               color: '#055C45' },
    { label: 'Total Allocation', value: `PKR ${totalAlloc.toFixed(1)}B`,           color: '#055C45' },
    { label: 'Total Utilized',   value: `PKR ${totalUtil.toFixed(1)}B`,            color: '#055C45' },
    { label: 'Throwforward',     value: `PKR ${Math.max(0, totalThrow).toFixed(1)}B`, color: '#b45309' },
    { label: 'Blended Exec.',    value: `${blendedExec}%`,                         color: blendedExec < 50 ? '#dc2626' : blendedExec < 70 ? '#b45309' : '#15803d' },
    { label: 'Donor-Linked',     value: donorLinked,                               color: '#2563eb' },
    { label: 'Slow-Moving',      value: slowMoving,                                color: '#dc2626' },
    { label: 'High Opp. Score',  value: highOpps,                                  color: '#7c3aed' },
  ]

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', margin: '0 0 6px 0' }}>
          PSDP &amp; ADP Spend Intelligence — Federal + 4 Provincial
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px 0', lineHeight: '1.5' }}>
          Where public development money is underperforming against social and economic need — and where execution support,
          co-financing, and TA create highest marginal value.
        </p>
        <p style={{ fontSize: '12px', color: '#82A290', margin: 0 }}>
          Federal PSDP · Provincial ADPs (Punjab, Sindh, KP, Balochistan) · PSLM outcomes · Economic Survey
        </p>
      </div>

      {/* ── Live data banner ─────────────────────────────────────── */}
      <div style={{
        background: '#ecfdf5',
        border: '1px solid #a7f3d0',
        borderRadius: '8px',
        padding: '10px 16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '16px' }}>📡</span>
        <p style={{ margin: 0, fontSize: '12px', color: '#065f46', fontWeight: 500 }}>
          Live data from Federal PSDP 2024-25 and Punjab, Sindh, KP, Balochistan ADPs. Updated quarterly.
        </p>
      </div>

      {/* ── KPI cards ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '12px',
        marginBottom: '28px',
      }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '14px',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: k.color, lineHeight: 1.2 }}>
              {k.value}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginTop: '4px' }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Province heatmap ─────────────────────────────────────── */}
      {provinces.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <PsdpProvinceMap provinces={provinces} />
        </div>
      )}

      {/* ── Province execution league table ──────────────────────── */}
      {provinces.length > 0 && (
        <div style={{ ...CARD_STYLE, marginBottom: '28px' }}>
          <div style={SECTION_HEADER}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', margin: '0 0 2px 0' }}>
              Province Execution League Table
            </h2>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
              Ranked by total allocation. Throwforward = uncommitted future liability.
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Province', 'Schemes', 'Allocation (B)', 'Utilized (B)', 'Exec %', 'Throwforward (B)', 'Slow-Moving', 'High Risk', 'Opp. Score', 'Stress Score'].map(h => (
                    <th key={h} style={TABLE_HEAD_STYLE}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {provinces.map((p, i) => {
                  const execColor = p.avg_execution_pct < 40 ? '#dc2626' : p.avg_execution_pct < 65 ? '#b45309' : '#15803d'
                  const oppHigh   = (p.avg_opportunity_score ?? 0) >= 60
                  const stressHigh = (p.avg_stress_score ?? 0) >= 60
                  return (
                    <tr key={p.province} style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : undefined }}>
                      <td style={{ ...TABLE_CELL, fontWeight: 600, color: '#055C45' }}>{p.province}</td>
                      <td style={TABLE_CELL}>{p.scheme_count}</td>
                      <td style={TABLE_CELL}>{p.total_allocation_bn?.toFixed(1) ?? '—'}</td>
                      <td style={TABLE_CELL}>{p.total_utilized_bn?.toFixed(1) ?? '—'}</td>
                      <td style={TABLE_CELL}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ height: '6px', width: '60px', borderRadius: '4px', background: '#e5e7eb', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '4px', width: `${Math.min(100, p.avg_execution_pct ?? 0)}%`, background: execColor }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: execColor }}>
                            {p.avg_execution_pct?.toFixed(0) ?? '—'}%
                          </span>
                        </div>
                      </td>
                      <td style={{ ...TABLE_CELL, fontWeight: 600, color: '#b45309' }}>{p.total_throwforward_bn?.toFixed(1) ?? '—'}</td>
                      <td style={{ ...TABLE_CELL, textAlign: 'center', color: p.slow_moving_count > 0 ? '#dc2626' : '#d1d5db' }}>{p.slow_moving_count}</td>
                      <td style={{ ...TABLE_CELL, textAlign: 'center', color: p.high_risk_count > 0 ? '#dc2626' : '#d1d5db' }}>{p.high_risk_count}</td>
                      <td style={TABLE_CELL}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                          background: oppHigh ? '#ede9fe' : '#f3f4f6',
                          color:      oppHigh ? '#7c3aed' : '#6b7280',
                        }}>
                          {p.avg_opportunity_score?.toFixed(0) ?? '—'}
                        </span>
                      </td>
                      <td style={TABLE_CELL}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                          background: stressHigh ? '#fee2e2' : '#f3f4f6',
                          color:      stressHigh ? '#dc2626' : '#6b7280',
                        }}>
                          {p.avg_stress_score?.toFixed(0) ?? '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sector intelligence table ─────────────────────────────── */}
      {sectors.length > 0 && (
        <div style={{ ...CARD_STYLE, marginBottom: '28px' }}>
          <div style={SECTION_HEADER}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', margin: '0 0 2px 0' }}>
              Sector Spend &amp; Opportunity Intelligence
            </h2>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
              Opportunity score = low execution + risk + slow-moving + TA fit (0–100). Higher = stronger case for intervention.
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Sector', 'Schemes', 'Alloc (B)', 'Util (B)', 'Exec %', 'Throwforward (B)', 'With Opps', 'Opp. Score', 'Stress', 'Donor-Linked'].map(h => (
                    <th key={h} style={TABLE_HEAD_STYLE}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectors.map((s, i) => {
                  const execColor = s.avg_execution_pct < 40 ? '#dc2626' : s.avg_execution_pct < 65 ? '#b45309' : '#15803d'
                  const oppHigh   = (s.avg_opportunity_score ?? 0) >= 60
                  const stressHigh = (s.avg_stress_score ?? 0) >= 60
                  return (
                    <tr key={s.sector} style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : undefined }}>
                      <td style={{ ...TABLE_CELL, fontWeight: 600, color: '#055C45' }}>{s.sector}</td>
                      <td style={TABLE_CELL}>{s.scheme_count}</td>
                      <td style={TABLE_CELL}>{s.total_allocation_bn?.toFixed(1) ?? '—'}</td>
                      <td style={TABLE_CELL}>{s.total_utilized_bn?.toFixed(1) ?? '—'}</td>
                      <td style={TABLE_CELL}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: execColor }}>
                          {s.avg_execution_pct?.toFixed(0) ?? '—'}%
                        </span>
                      </td>
                      <td style={{ ...TABLE_CELL, fontWeight: 600, color: '#b45309' }}>{s.total_throwforward_bn?.toFixed(1) ?? '—'}</td>
                      <td style={{ ...TABLE_CELL, textAlign: 'center', color: s.schemes_with_opportunities > 0 ? '#7c3aed' : '#d1d5db' }}>{s.schemes_with_opportunities}</td>
                      <td style={TABLE_CELL}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                          background: oppHigh ? '#ede9fe' : '#f3f4f6',
                          color:      oppHigh ? '#7c3aed' : '#6b7280',
                        }}>
                          {s.avg_opportunity_score?.toFixed(0) ?? '—'}
                        </span>
                      </td>
                      <td style={TABLE_CELL}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                          background: stressHigh ? '#fee2e2' : '#f3f4f6',
                          color:      stressHigh ? '#dc2626' : '#6b7280',
                        }}>
                          {s.avg_stress_score?.toFixed(0) ?? '—'}
                        </span>
                      </td>
                      <td style={{ ...TABLE_CELL, textAlign: 'center', color: s.donor_linked_count > 0 ? '#2563eb' : '#d1d5db' }}>{s.donor_linked_count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Ministry efficiency table ─────────────────────────────── */}
      {ministries.length > 0 && (
        <div style={{ ...CARD_STYLE, marginBottom: '28px' }}>
          <div style={SECTION_HEADER}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', margin: '0 0 2px 0' }}>
              Ministry / Department Efficiency
            </h2>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
              Backlog % = throwforward as share of total allocation. High backlog + low execution = delivery bottleneck.
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Ministry', 'Schemes', 'Alloc (B)', 'Exec %', 'Throwforward (B)', 'Backlog %', 'Slow-Moving', 'Opp. Score'].map(h => (
                    <th key={h} style={TABLE_HEAD_STYLE}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ministries.map((m, i) => {
                  const execColor  = m.avg_execution_pct < 40 ? '#dc2626' : m.avg_execution_pct < 65 ? '#b45309' : '#15803d'
                  const backlogHigh = (m.backlog_pct ?? 0) > 50
                  const oppHigh    = (m.avg_opportunity_score ?? 0) >= 60
                  return (
                    <tr key={m.ministry} style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : undefined }}>
                      <td style={{ ...TABLE_CELL, fontWeight: 500, maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.ministry}
                      </td>
                      <td style={TABLE_CELL}>{m.scheme_count}</td>
                      <td style={TABLE_CELL}>{m.total_allocation_bn?.toFixed(1) ?? '—'}</td>
                      <td style={TABLE_CELL}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: execColor }}>
                          {m.avg_execution_pct?.toFixed(0) ?? '—'}%
                        </span>
                      </td>
                      <td style={{ ...TABLE_CELL, fontWeight: 600, color: '#b45309' }}>{m.total_throwforward_bn?.toFixed(1) ?? '—'}</td>
                      <td style={TABLE_CELL}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                          background: backlogHigh ? '#fef3c7' : '#f3f4f6',
                          color:      backlogHigh ? '#b45309' : '#6b7280',
                        }}>
                          {m.backlog_pct?.toFixed(0) ?? '—'}%
                        </span>
                      </td>
                      <td style={{ ...TABLE_CELL, textAlign: 'center', color: m.slow_moving_count > 0 ? '#dc2626' : '#d1d5db' }}>{m.slow_moving_count}</td>
                      <td style={TABLE_CELL}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                          background: oppHigh ? '#ede9fe' : '#f3f4f6',
                          color:      oppHigh ? '#7c3aed' : '#6b7280',
                        }}>
                          {m.avg_opportunity_score?.toFixed(0) ?? '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Top 30 schemes by opportunity score ───────────────────── */}
      {topSchemes.length > 0 && (
        <div style={{ ...CARD_STYLE, marginBottom: '36px' }}>
          <div style={SECTION_HEADER}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', margin: '0 0 2px 0' }}>
              Top 30 Schemes by Opportunity Score
            </h2>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
              Schemes where underperformance is highest and intervention value is greatest. Full database available with access.
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Title', 'Province', 'Sector', 'Ministry', 'Alloc (B)', 'Exec %', 'Opp. Score', 'Risk', 'Donor'].map(h => (
                    <th key={h} style={TABLE_HEAD_STYLE}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topSchemes.map((s, i) => {
                  const execColor = s.execution_pct === null ? '#9ca3af'
                    : s.execution_pct < 40 ? '#dc2626'
                    : s.execution_pct < 65 ? '#b45309'
                    : '#15803d'
                  return (
                    <tr key={s.id} style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : undefined }}>
                      <td style={{
                        ...TABLE_CELL,
                        fontWeight: 500,
                        maxWidth: '280px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#055C45',
                      }}>
                        {s.title}
                      </td>
                      <td style={{ ...TABLE_CELL, color: '#6b7280', whiteSpace: 'nowrap' }}>{s.province ?? '—'}</td>
                      <td style={{ ...TABLE_CELL, color: '#6b7280', whiteSpace: 'nowrap' }}>{s.sector ?? '—'}</td>
                      <td style={{
                        ...TABLE_CELL,
                        color: '#6b7280',
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {s.ministry ?? '—'}
                      </td>
                      <td style={{ ...TABLE_CELL, whiteSpace: 'nowrap' }}>
                        {s.allocation_bn !== null ? s.allocation_bn.toFixed(2) : '—'}
                      </td>
                      <td style={{ ...TABLE_CELL, whiteSpace: 'nowrap' }}>
                        {s.execution_pct !== null
                          ? <span style={{ fontSize: '12px', fontWeight: 600, color: execColor }}>{s.execution_pct.toFixed(0)}%</span>
                          : <span style={{ color: '#d1d5db' }}>—</span>
                        }
                      </td>
                      <td style={TABLE_CELL}>{oppBadge(s.opportunity_score)}</td>
                      <td style={TABLE_CELL}>{riskBadge(s.risk_level)}</td>
                      <td style={{ ...TABLE_CELL, whiteSpace: 'nowrap' }}>
                        {s.is_donor_linked && s.donor_name
                          ? <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 7px', borderRadius: '10px', fontWeight: 600 }}>{s.donor_name}</span>
                          : s.is_donor_linked
                          ? <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 7px', borderRadius: '10px', fontWeight: 600 }}>Yes</span>
                          : <span style={{ color: '#d1d5db' }}>—</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Full-access CTA ───────────────────────────────────────── */}
      <div style={{
        background: '#055C45',
        borderRadius: '16px',
        padding: '32px 36px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '16px',
        marginBottom: '16px',
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0' }}>
            Want full access?
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0, maxWidth: '560px', lineHeight: '1.6' }}>
            Get full access to PakAid Explorer including AI-powered insights, alerts, and the full programme database.
          </p>
        </div>
        <a
          href="mailto:hello@pakaid.com?subject=PakAid%20Explorer%20Access%20Request&body=Hi%2C%20I%20would%20like%20to%20request%20access%20to%20PakAid%20Explorer."
          style={{
            display: 'inline-block',
            background: '#ffffff',
            color: '#055C45',
            fontWeight: 700,
            fontSize: '14px',
            padding: '12px 28px',
            borderRadius: '8px',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          Request Access — hello@pakaid.com
        </a>
      </div>

    </div>
  )
}
