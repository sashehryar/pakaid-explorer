/**
 * Pure transformation utilities for population pressure & spend intelligence.
 * No side effects, no API calls, no hardcoded display strings.
 * All inputs come from the existing PSDP data layer.
 */

import type { PsdpScheme } from '@/lib/types/database'
import {
  PAKISTAN_CENSUS_2023,
  PROVINCE_BURDENS,
  FOCUS_BURDEN_TYPES,
  getBurdenShare,
  resolveBurdenType,
  type BurdenType,
  type ProvinceBurdens,
} from './population-data'

// ── Shared types ─────────────────────────────────────────────────────────────

export interface ProvinceRow {
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

export interface SectorRow {
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

// ── Outcome 1: Pressure Mapping ───────────────────────────────────────────────

export interface PressureRanking {
  province: string
  population: number         // millions
  growthRate: number         // %
  /** Raw pressure = population × growthRate */
  rawPressure: number
  /** Normalised to 0–100 */
  pressureScore: number
  /** PKR billion allocated (from province summary) */
  allocationBn: number
  /** Execution % from province summary */
  executionPct: number
  rank: number
  isHotspot: boolean         // top 3
}

export function computePressureRankings(
  provinces: ProvinceRow[],
): PressureRanking[] {
  const provMap = new Map(provinces.map(p => [p.province, p]))

  const raw = PAKISTAN_CENSUS_2023.map(p => {
    const pd = provMap.get(p.province)
    return {
      province:     p.province,
      population:   p.population,
      growthRate:   p.growthRate,
      rawPressure:  p.population * p.growthRate,
      allocationBn: pd?.total_allocation_bn  ?? 0,
      executionPct: pd?.avg_execution_pct    ?? 0,
    }
  })

  const maxPressure = Math.max(...raw.map(r => r.rawPressure))

  const sorted = raw
    .map(r => ({ ...r, pressureScore: maxPressure > 0 ? (r.rawPressure / maxPressure) * 100 : 0 }))
    .sort((a, b) => b.pressureScore - a.pressureScore)
    .map((r, i) => ({ ...r, rank: i + 1, isHotspot: i < 3 }))

  return sorted
}

// ── Outcome 2: Spend Mismatch ─────────────────────────────────────────────────

export interface SpendMismatch {
  sector: string
  province: string
  burdenType: BurdenType
  /** Province's % of national allocation in this sector */
  allocationPct: number
  /** Province's % of national population burden for this sector type */
  populationBurdenPct: number
  /**
   * gap = populationBurdenPct − allocationPct
   * Positive → underfunded relative to population need
   * Negative → overfunded
   */
  gap: number
  /** Flagged when |gap| > threshold (default 15) */
  flagged: boolean
}

export interface SectorMismatchGroup {
  sector: string
  burdenType: BurdenType
  totalAllocationBn: number
  mismatches: SpendMismatch[]
  /** Max absolute gap in this sector across provinces */
  maxGap: number
}

export function computeSpendMismatches(
  schemes: PsdpScheme[],
  gapThreshold = 15,
): SectorMismatchGroup[] {
  // Group scheme allocations by sector × province
  const byKey = new Map<string, number>()  // `${sector}||${province}` → allocation_bn

  for (const s of schemes) {
    if (!s.sector || !s.province || (s.allocation_bn ?? 0) === 0) continue
    const burdenType = resolveBurdenType(s.sector)
    if (!FOCUS_BURDEN_TYPES.includes(burdenType)) continue
    const key = `${s.sector}||${s.province}`
    byKey.set(key, (byKey.get(key) ?? 0) + (s.allocation_bn ?? 0))
  }

  // Identify unique focus sectors present in the data
  const sectors = new Set<string>()
  for (const s of schemes) {
    if (!s.sector) continue
    if (FOCUS_BURDEN_TYPES.includes(resolveBurdenType(s.sector))) sectors.add(s.sector)
  }

  const groups: SectorMismatchGroup[] = []

  for (const sector of sectors) {
    const burdenType = resolveBurdenType(sector)

    // Total allocation in this sector across all provinces
    let totalAlloc = 0
    for (const [key, v] of byKey) {
      if (key.startsWith(`${sector}||`)) totalAlloc += v
    }
    if (totalAlloc === 0) continue

    const mismatches: SpendMismatch[] = PAKISTAN_CENSUS_2023.map(p => {
      const alloc    = byKey.get(`${sector}||${p.province}`) ?? 0
      const allocPct = (alloc / totalAlloc) * 100
      const burdenPct = getBurdenShare(p.province, burdenType)
      const gap       = burdenPct - allocPct
      return {
        sector,
        province:           p.province,
        burdenType,
        allocationPct:      round2(allocPct),
        populationBurdenPct: round2(burdenPct),
        gap:                round2(gap),
        flagged:            Math.abs(gap) > gapThreshold,
      }
    }).filter(m => m.allocationPct > 0 || m.populationBurdenPct > 0)
      .sort((a, b) => b.gap - a.gap)

    const maxGap = Math.max(...mismatches.map(m => Math.abs(m.gap)))

    groups.push({ sector, burdenType, totalAllocationBn: round2(totalAlloc), mismatches, maxGap })
  }

  return groups.sort((a, b) => b.maxGap - a.maxGap)
}

// ── Outcome 3: Portfolio Flexibility ─────────────────────────────────────────

export type PortfolioStageGroup = 'ongoing' | 'new' | 'completion' | 'stalled'

const STAGE_MAP: Record<string, PortfolioStageGroup> = {
  pre_award:           'new',
  mobilization:        'new',
  early_implementation:'ongoing',
  mid_implementation:  'ongoing',
  completion:          'completion',
  post_completion:     'completion',
  suspended:           'stalled',
  cancelled:           'stalled',
}

export interface PortfolioFlexibility {
  totalSchemes: number
  ongoingCount: number
  newCount: number
  completionCount: number
  stalledCount: number
  ongoingPct: number
  newPct: number
  /** Total allocation (PKR bn) */
  totalAllocationBn: number
  /** Total utilized (PKR bn) */
  totalUtilizedBn: number
  /** utilizationRate = utilized / allocation (0–1) */
  utilizationRate: number
  /** Throwforward as % of allocation — higher = portfolio locked */
  throwforwardRiskPct: number
  /** Slow-moving as % of total schemes */
  slowMovingPct: number
  /**
   * Composite portfolio flexibility score (0–100).
   * High = portfolio has room to absorb new schemes.
   * Low  = portfolio is locked in underperforming carry-overs.
   */
  flexibilityScore: number
}

export function computePortfolioFlexibility(schemes: PsdpScheme[]): PortfolioFlexibility {
  if (schemes.length === 0) {
    return {
      totalSchemes: 0, ongoingCount: 0, newCount: 0, completionCount: 0, stalledCount: 0,
      ongoingPct: 0, newPct: 0, totalAllocationBn: 0, totalUtilizedBn: 0,
      utilizationRate: 0, throwforwardRiskPct: 0, slowMovingPct: 0, flexibilityScore: 50,
    }
  }

  const counts: Record<PortfolioStageGroup, number> = { ongoing: 0, new: 0, completion: 0, stalled: 0 }
  let totalAlloc = 0, totalUtil = 0, totalThrow = 0, slowMoving = 0

  for (const s of schemes) {
    const group = STAGE_MAP[s.implementation_stage] ?? 'ongoing'
    counts[group]++
    totalAlloc += s.allocation_bn      ?? 0
    totalUtil  += s.utilized_bn        ?? 0
    totalThrow += s.throwforward_bn    ?? Math.max(0, (s.allocation_bn ?? 0) - (s.utilized_bn ?? 0))
    if (s.is_slow_moving) slowMoving++
  }

  const n = schemes.length
  const utilizationRate      = totalAlloc > 0 ? totalUtil  / totalAlloc : 0
  const throwforwardRiskPct  = totalAlloc > 0 ? (totalThrow / totalAlloc) * 100 : 0
  const slowMovingPct        = (slowMoving / n) * 100

  // Flexibility score: penalise high throwforward and high slow-moving
  const flexibilityScore = Math.max(0, Math.min(100,
    100
    - throwforwardRiskPct * 0.5   // up to -50 pts for full throwforward
    - slowMovingPct        * 0.3   // up to -30 pts for all slow-moving
    + utilizationRate      * 20    // up to +20 pts for high utilisation
  ))

  return {
    totalSchemes:      n,
    ongoingCount:      counts.ongoing,
    newCount:          counts.new,
    completionCount:   counts.completion,
    stalledCount:      counts.stalled,
    ongoingPct:        round2((counts.ongoing / n) * 100),
    newPct:            round2((counts.new     / n) * 100),
    totalAllocationBn: round2(totalAlloc),
    totalUtilizedBn:   round2(totalUtil),
    utilizationRate:   round2(utilizationRate * 100),   // stored as %
    throwforwardRiskPct: round2(throwforwardRiskPct),
    slowMovingPct:     round2(slowMovingPct),
    flexibilityScore:  round2(flexibilityScore),
  }
}

// ── Outcome 4: Per Capita Load ────────────────────────────────────────────────

export interface PerCapitaLoad {
  province: string
  population: number          // millions
  growthRate: number          // %
  allocationBn: number        // PKR billion
  /** PKR per person (allocation_bn × 1e9 / population_millions × 1e6) = allocation_bn × 1000 / population */
  allocationPerCapita: number
  /** Growth-adjusted: divides per-capita by (1 + growthRate/100) — accounts for fast-growing provinces needing more */
  growthAdjustedPerCapita: number
  rank: number                // 1 = lowest (most underfunded)
  /** Relative to national median */
  vsMedianPct: number
}

export function computePerCapitaLoad(provinces: ProvinceRow[]): PerCapitaLoad[] {
  const provMap = new Map(provinces.map(p => [p.province, p]))

  const raw = PAKISTAN_CENSUS_2023.map(p => {
    const pd = provMap.get(p.province)
    const allocationBn = pd?.total_allocation_bn ?? 0
    // PKR per capita = (allocationBn × 1e9) / (population × 1e6) = allocationBn × 1000 / population
    const perCapita        = p.population > 0 ? (allocationBn * 1000) / p.population : 0
    const growthAdjusted   = perCapita / (1 + p.growthRate / 100)
    return { province: p.province, population: p.population, growthRate: p.growthRate, allocationBn, allocationPerCapita: round2(perCapita), growthAdjustedPerCapita: round2(growthAdjusted) }
  }).filter(r => r.allocationBn > 0)
    .sort((a, b) => a.growthAdjustedPerCapita - b.growthAdjustedPerCapita)

  const medianVal = median(raw.map(r => r.growthAdjustedPerCapita))

  return raw.map((r, i) => ({
    ...r,
    rank: i + 1,
    vsMedianPct: medianVal > 0 ? round2(((r.growthAdjustedPerCapita - medianVal) / medianVal) * 100) : 0,
  }))
}

// ── Outcome 5: Action Signals ─────────────────────────────────────────────────

export type InterventionType =
  | 'new_scheme'              // gap > 25%
  | 'redirect'                // gap 15–25%
  | 'release_acceleration'    // utilisation < 50%
  | 'throwforward_clearance'  // throwforward > 60% of allocation

export interface ActionSignal {
  province: string
  sector: string
  gap: number                 // population burden − spend %
  interventionType: InterventionType
  /** 1 = highest priority */
  priority: number
  /** Human-readable rationale */
  rationale: string
}

export function computeActionSignals(
  mismatches: SectorMismatchGroup[],
  portfolio: PortfolioFlexibility,
  perCapita: PerCapitaLoad[],
  topN = 5,
): ActionSignal[] {
  const signals: ActionSignal[] = []

  // From spend mismatches — flagged province/sector pairs
  for (const group of mismatches) {
    for (const m of group.mismatches) {
      if (!m.flagged) continue
      const interventionType: InterventionType = m.gap > 25 ? 'new_scheme' : 'redirect'
      signals.push({
        province: m.province,
        sector:   m.sector,
        gap:      m.gap,
        interventionType,
        priority: 0, // set below
        rationale: m.gap > 0
          ? `${m.province} carries ${m.populationBurdenPct.toFixed(1)}% of national ${m.sector.toLowerCase()} burden but receives only ${m.allocationPct.toFixed(1)}% of sector allocation (gap: +${m.gap.toFixed(1)}%).`
          : `${m.province} receives ${m.allocationPct.toFixed(1)}% of ${m.sector.toLowerCase()} allocation vs ${m.populationBurdenPct.toFixed(1)}% burden share (over-allocated by ${Math.abs(m.gap).toFixed(1)}%).`,
      })
    }
  }

  // From portfolio — if throwforward high, flag release acceleration
  if (portfolio.throwforwardRiskPct > 60) {
    signals.push({
      province: 'All Provinces',
      sector:   'Cross-Sector',
      gap:      portfolio.throwforwardRiskPct,
      interventionType: 'throwforward_clearance',
      priority: 0,
      rationale: `Portfolio throwforward risk is ${portfolio.throwforwardRiskPct.toFixed(1)}% of total allocation — unspent carry-over is crowding out new allocations.`,
    })
  }

  // From per-capita — bottom 2 provinces with low utilisation also flag release
  for (const r of perCapita.slice(0, 2)) {
    if (r.vsMedianPct < -25) {
      signals.push({
        province: r.province,
        sector:   'All Sectors',
        gap:      Math.abs(r.vsMedianPct),
        interventionType: 'release_acceleration',
        priority: 0,
        rationale: `${r.province} receives PKR ${r.allocationPerCapita.toFixed(0)}/capita (${Math.abs(r.vsMedianPct).toFixed(1)}% below national median) — accelerating releases would improve coverage equity.`,
      })
    }
  }

  // Sort by |gap| desc and assign priority
  signals.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
  return signals.slice(0, topN).map((s, i) => ({ ...s, priority: i + 1 }))
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

export interface PopulationKPIs {
  totalPopulationCoveredM: number
  totalProvincesWithData: number
  avgPerCapitaPkr: number
  flaggedGapCount: number
  hotspotProvinces: string[]
  portfolioFlexibilityScore: number
  signalCount: number
}

export function computeKPIs(
  pressureRankings: ReturnType<typeof computePressureRankings>,
  mismatches:       SectorMismatchGroup[],
  portfolio:        PortfolioFlexibility,
  signals:          ActionSignal[],
  perCapita:        PerCapitaLoad[],
): PopulationKPIs {
  const totalPop      = pressureRankings.reduce((s, r) => s + r.population, 0)
  const flaggedGaps   = mismatches.flatMap(g => g.mismatches).filter(m => m.flagged).length
  const hotspots      = pressureRankings.filter(r => r.isHotspot).map(r => r.province)
  const avgPerCapita  = perCapita.length
    ? perCapita.reduce((s, r) => s + r.allocationPerCapita, 0) / perCapita.length
    : 0

  return {
    totalPopulationCoveredM:  round2(totalPop),
    totalProvincesWithData:   perCapita.length,
    avgPerCapitaPkr:          round2(avgPerCapita),
    flaggedGapCount:          flaggedGaps,
    hotspotProvinces:         hotspots,
    portfolioFlexibilityScore: portfolio.flexibilityScore,
    signalCount:              signals.length,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function median(arr: number[]): number {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
