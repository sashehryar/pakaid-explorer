'use client'

import { useMemo } from 'react'
import type { PsdpScheme } from '@/lib/types/database'
import {
  computePressureRankings,
  computeSpendMismatches,
  computePortfolioFlexibility,
  computePerCapitaLoad,
  computeActionSignals,
  computeKPIs,
  type ProvinceRow,
  type SectorRow,
  type PressureRanking,
  type SectorMismatchGroup,
  type PortfolioFlexibility,
  type PerCapitaLoad,
  type ActionSignal,
  type PopulationKPIs,
} from './population-utils'

// ── Public result shape ───────────────────────────────────────────────────────

export interface PopulationInsightsResult {
  /** Top-level KPIs for summary cards */
  kpis: PopulationKPIs
  /** Outcome 1: provinces ranked by population pressure */
  pressureRankings: PressureRanking[]
  /** Outcome 2: sector × province spend mismatches for focus sectors */
  spendMismatches: SectorMismatchGroup[]
  /** Outcome 3: portfolio composition + flexibility score */
  portfolio: PortfolioFlexibility
  /** Outcome 4: per-capita allocation, growth-adjusted, ranked low → high */
  perCapitaLoad: PerCapitaLoad[]
  /** Outcome 5: top-N action signals with intervention type */
  actionSignals: ActionSignal[]
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface PopulationInsightsFilters {
  /** Restrict to these provinces (empty = all) */
  provinces?: string[]
  /** Restrict to these sectors (empty = all) */
  sectors?: string[]
  /** Spend-mismatch gap threshold in percentage points (default 15) */
  gapThreshold?: number
  /** Top-N action signals to return (default 5) */
  topSignals?: number
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Computes population-aware PSDP intelligence from the existing data layer.
 *
 * All transforms are pure and memoised — reruns only when input arrays change.
 *
 * @param schemes        Full scheme list from psdp_schemes
 * @param provinces      Province summary rows from psdp_province_summary
 * @param sectors        Sector summary rows from psdp_sector_intelligence
 * @param _year          Fiscal year label (reserved for future filtering)
 * @param filters        Optional province/sector filters + threshold overrides
 */
export function usePopulationInsights(
  schemes:   PsdpScheme[],
  provinces: ProvinceRow[],
  sectors:   SectorRow[],
  _year      = '2024-25',
  filters:   PopulationInsightsFilters = {},
): PopulationInsightsResult {
  const {
    provinces: filterProvinces = [],
    sectors:   filterSectors   = [],
    gapThreshold               = 15,
    topSignals                 = 5,
  } = filters

  // Filtered scheme + province + sector slices
  const filteredSchemes = useMemo(() => {
    let s = schemes
    if (filterProvinces.length) s = s.filter(x => x.province && filterProvinces.includes(x.province))
    if (filterSectors.length)   s = s.filter(x => x.sector   && filterSectors.includes(x.sector))
    return s
  }, [schemes, filterProvinces, filterSectors])

  const filteredProvinces = useMemo(() => {
    if (!filterProvinces.length) return provinces
    return provinces.filter(p => filterProvinces.includes(p.province))
  }, [provinces, filterProvinces])

  // Outcome 1
  const pressureRankings = useMemo(
    () => computePressureRankings(filteredProvinces),
    [filteredProvinces],
  )

  // Outcome 2
  const spendMismatches = useMemo(
    () => computeSpendMismatches(filteredSchemes, gapThreshold),
    [filteredSchemes, gapThreshold],
  )

  // Outcome 3
  const portfolio = useMemo(
    () => computePortfolioFlexibility(filteredSchemes),
    [filteredSchemes],
  )

  // Outcome 4
  const perCapitaLoad = useMemo(
    () => computePerCapitaLoad(filteredProvinces),
    [filteredProvinces],
  )

  // Outcome 5
  const actionSignals = useMemo(
    () => computeActionSignals(spendMismatches, portfolio, perCapitaLoad, topSignals),
    [spendMismatches, portfolio, perCapitaLoad, topSignals],
  )

  // KPIs
  const kpis = useMemo(
    () => computeKPIs(pressureRankings, spendMismatches, portfolio, actionSignals, perCapitaLoad),
    [pressureRankings, spendMismatches, portfolio, actionSignals, perCapitaLoad],
  )

  return { kpis, pressureRankings, spendMismatches, portfolio, perCapitaLoad, actionSignals }
}
