/**
 * Pakistan Population Data Layer
 * Source: Pakistan Population and Housing Census 2023 (PBS)
 * All population figures in millions.
 */

// ── Census 2023 province-level data ──────────────────────────────────────────

export interface ProvincePopulation {
  /** DB province key — matches psdp_schemes.province values */
  province: string
  /** Total population (millions), Census 2023 */
  population: number
  /** Annual population growth rate (%), 2017–2023 intercensal */
  growthRate: number
  /** Urban population share (%) */
  urbanPct: number
  /** School-age population share (%) — proxy for education burden */
  schoolAgePct: number
  /**
   * Population lacking adequate WASH access (%) — inverse coverage proxy.
   * Derived from PSLM/JMP 2022-23 estimates.
   */
  washGapPct: number
}

export const PAKISTAN_CENSUS_2023: ProvincePopulation[] = [
  { province: 'Punjab',      population: 127.68, growthRate: 2.56, urbanPct: 37.5, schoolAgePct: 39, washGapPct: 25 },
  { province: 'Sindh',       population: 55.69,  growthRate: 2.41, urbanPct: 47.0, schoolAgePct: 41, washGapPct: 40 },
  { province: 'KP',          population: 40.86,  growthRate: 3.31, urbanPct: 19.0, schoolAgePct: 43, washGapPct: 35 },
  { province: 'Balochistan', population: 20.31,  growthRate: 3.37, urbanPct: 27.5, schoolAgePct: 45, washGapPct: 55 },
  { province: 'Federal',     population: 2.36,   growthRate: 4.91, urbanPct: 99.0, schoolAgePct: 36, washGapPct: 10 },
  { province: 'AJK',         population: 4.05,   growthRate: 2.32, urbanPct: 25.0, schoolAgePct: 40, washGapPct: 30 },
  { province: 'GB',          population: 1.50,   growthRate: 2.09, urbanPct: 18.0, schoolAgePct: 38, washGapPct: 45 },
]

/** Total covered population (millions) */
export const TOTAL_POPULATION = PAKISTAN_CENSUS_2023.reduce((s, p) => s + p.population, 0)

// ── Sector → population burden type mapping ──────────────────────────────────

export type BurdenType = 'health' | 'education' | 'wash' | 'urban' | 'base'

/**
 * Maps sector strings (from psdp_schemes.sector) to the relevant
 * population burden denominator.
 * Matched case-insensitively at runtime.
 */
export const SECTOR_BURDEN_MAP: Record<string, BurdenType> = {
  health:             'health',
  'primary health':   'health',
  'secondary health': 'health',
  healthcare:         'health',
  'health services':  'health',
  nutrition:          'health',
  'population welfare': 'health',

  education:          'education',
  'school education': 'education',
  'higher education': 'education',
  literacy:           'education',
  'technical education': 'education',
  skills:             'education',

  water:              'wash',
  wash:               'wash',
  'water supply':     'wash',
  'water & sanitation': 'wash',
  sanitation:         'wash',
  irrigation:         'wash',

  urban:              'urban',
  housing:            'urban',
  'urban development': 'urban',
  'local government': 'urban',

  transport:          'base',
  energy:             'base',
  power:              'base',
  agriculture:        'base',
  industry:           'base',
  'social protection': 'health',
}

/**
 * Resolve the burden type for a given sector string.
 * Falls back to 'base' (raw population share).
 */
export function resolveBurdenType(sector: string | null | undefined): BurdenType {
  if (!sector) return 'base'
  const key = sector.toLowerCase().trim()
  for (const [k, v] of Object.entries(SECTOR_BURDEN_MAP)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  return 'base'
}

/**
 * Focus sectors for Spend Mismatch analysis (health, education, WASH, urban).
 * These are the sectors where population-to-spend alignment matters most.
 */
export const FOCUS_BURDEN_TYPES: BurdenType[] = ['health', 'education', 'wash', 'urban']

// ── Compute province-level population burden shares ──────────────────────────

export interface ProvinceBurdens {
  province: string
  /** Raw population share (%) */
  baseShare: number
  /** Health burden share — proportional to population */
  healthShare: number
  /** Education burden share — proportional to school-age population */
  educationShare: number
  /** WASH burden share — proportional to population × WASH gap */
  washShare: number
  /** Urban burden share — proportional to urban population */
  urbanShare: number
}

export function computeProvinceBurdens(): ProvinceBurdens[] {
  const totalBase      = PAKISTAN_CENSUS_2023.reduce((s, p) => s + p.population, 0)
  const totalHealth    = totalBase // health need ≈ total population
  const totalEducation = PAKISTAN_CENSUS_2023.reduce((s, p) => s + p.population * (p.schoolAgePct / 100), 0)
  const totalWash      = PAKISTAN_CENSUS_2023.reduce((s, p) => s + p.population * (p.washGapPct  / 100), 0)
  const totalUrban     = PAKISTAN_CENSUS_2023.reduce((s, p) => s + p.population * (p.urbanPct    / 100), 0)

  return PAKISTAN_CENSUS_2023.map(p => ({
    province:        p.province,
    baseShare:       (p.population                                  / totalBase)      * 100,
    healthShare:     (p.population                                  / totalHealth)    * 100,
    educationShare:  ((p.population * p.schoolAgePct / 100)         / totalEducation) * 100,
    washShare:       ((p.population * p.washGapPct   / 100)         / totalWash)      * 100,
    urbanShare:      ((p.population * p.urbanPct     / 100)         / totalUrban)     * 100,
  }))
}

/** Cached burden shares */
export const PROVINCE_BURDENS = computeProvinceBurdens()

/** Look up burden share for a province+burdenType */
export function getBurdenShare(province: string, type: BurdenType): number {
  const row = PROVINCE_BURDENS.find(p => p.province === province)
  if (!row) return 0
  const key: keyof ProvinceBurdens = type === 'health'     ? 'healthShare'
                                   : type === 'education'  ? 'educationShare'
                                   : type === 'wash'       ? 'washShare'
                                   : type === 'urban'      ? 'urbanShare'
                                   : 'baseShare'
  return row[key] as number
}
