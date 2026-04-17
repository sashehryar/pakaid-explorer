"""
Population Security Pipeline
============================
Sources:
  - World Bank API: national Pakistan time-series (SP.POP.GROW, fertility, dependency, etc.)
  - Pakistan Census 2017 & 2023 (PBS): provincial population + growth rates
  - PDHS 2017-18: provincial fertility rates
  - NIPS 2020 Projections: provincial population to 2030
  - Pakistan Economic Survey 2023-24 Ch.25: youth unemployment proxy
  - UNFPA Pakistan@2050 scenario (high/medium/low fertility)

Output:
  public/data/population-security.json  — loaded by frontend card

Run:  python scripts/population-pipeline/generate.py
"""

import json, os, urllib.request, math
from datetime import datetime

OUT_PATH = os.path.join(
    os.path.dirname(__file__), '..', '..', 'public', 'data', 'population-security.json'
)

# ── 1. World Bank national time-series ───────────────────────────────────────

WB_INDICATORS = {
    'SP.POP.GROW':       'pop_growth_pct',
    'SP.DYN.TFRT.IN':    'fertility_rate',
    'SP.POP.DPND':       'dependency_ratio',
    'SP.POP.1564.TO.ZS': 'working_age_pct',
    'SL.UEM.1524.ZS':    'youth_unemployment_pct',
    'SP.POP.TOTL':       'total_population',
    'SP.POP.0014.TO.ZS': 'pop_under14_pct',
    'SP.POP.65UP.TO.ZS': 'pop_over65_pct',
}

def fetch_wb():
    national = {}
    for ind, label in WB_INDICATORS.items():
        url = (f'https://api.worldbank.org/v2/country/PAK/indicator/{ind}'
               f'?format=json&mrv=40&per_page=40')
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=20) as r:
            rows = json.loads(r.read())[1]
        national[label] = {
            str(d['date']): round(d['value'], 4)
            for d in rows if d['value'] is not None
        }
    return national

# ── 2. Provincial static data ─────────────────────────────────────────────────
# Source: PBS Census 2017 & 2023, PDHS 2017-18, NIPS Provincial Projections 2020

PROVINCIAL = {
    'Punjab': {
        'pop_2017_m':    110.01,
        'pop_2023_m':    127.68,
        'growth_rate':    2.56,      # % p.a. 2017-23 (PBS 2023)
        'fertility_rate': 3.4,       # PDHS 2017-18
        'youth_15_29_pct': 26.8,     # % aged 15-29 (PSLM proxy)
        'literacy_pct':   62.5,      # PBS 2021-22
        'urban_pct':      37.5,
        # NIPS 2030 projection (medium fertility)
        'pop_2030_m':    146.0,
        'pop_2050_m':    185.0,      # UNFPA medium scenario
        # Security proxy: incidents per 100k pop (PIPS 2023 proxy)
        'instability_index': 18,
        # Dependency ratio (dependents per 100 working-age)
        'dependency_ratio': 72,
    },
    'Sindh': {
        'pop_2017_m':    47.89,
        'pop_2023_m':    55.69,
        'growth_rate':    2.41,
        'fertility_rate': 3.7,
        'youth_15_29_pct': 27.1,
        'literacy_pct':   58.3,
        'urban_pct':      47.0,
        'pop_2030_m':    63.0,
        'pop_2050_m':    80.0,
        'instability_index': 28,
        'dependency_ratio': 76,
    },
    'KP': {
        'pop_2017_m':    30.52,
        'pop_2023_m':    40.86,      # includes merged FATA
        'growth_rate':    3.31,
        'fertility_rate': 4.3,       # PDHS 2017-18 (highest)
        'youth_15_29_pct': 28.4,
        'literacy_pct':   53.7,
        'urban_pct':      19.0,
        'pop_2030_m':    50.0,
        'pop_2050_m':    72.0,
        'instability_index': 62,     # PIPS 2023: highest incidents
        'dependency_ratio': 83,
    },
    'Balochistan': {
        'pop_2017_m':    12.34,
        'pop_2023_m':    20.31,
        'growth_rate':    3.37,      # Highest growth rate
        'fertility_rate': 4.8,       # PDHS 2017-18 (highest fertility)
        'youth_15_29_pct': 29.2,
        'literacy_pct':   43.0,      # Lowest literacy
        'urban_pct':      27.5,
        'pop_2030_m':    25.0,
        'pop_2050_m':    38.0,
        'instability_index': 58,
        'dependency_ratio': 88,      # Highest dependency ratio
    },
    'Federal': {
        'pop_2017_m':    2.00,
        'pop_2023_m':    2.36,
        'growth_rate':    4.91,      # ICT fastest growth (urbanisation)
        'fertility_rate': 2.8,
        'youth_15_29_pct': 23.5,
        'literacy_pct':   88.0,
        'urban_pct':      99.0,
        'pop_2030_m':    2.8,
        'pop_2050_m':    3.5,
        'instability_index': 12,
        'dependency_ratio': 60,
    },
    'AJK': {
        'pop_2017_m':    3.45,
        'pop_2023_m':    4.05,
        'growth_rate':    2.32,
        'fertility_rate': 3.2,
        'youth_15_29_pct': 26.0,
        'literacy_pct':   74.0,
        'urban_pct':      25.0,
        'pop_2030_m':    4.6,
        'pop_2050_m':    5.8,
        'instability_index': 20,
        'dependency_ratio': 68,
    },
    'GB': {
        'pop_2017_m':    1.25,
        'pop_2023_m':    1.50,
        'growth_rate':    2.09,      # Lowest growth
        'fertility_rate': 3.5,
        'youth_15_29_pct': 25.5,
        'literacy_pct':   72.0,
        'urban_pct':      18.0,
        'pop_2030_m':    1.7,
        'pop_2050_m':    2.1,
        'instability_index': 15,
        'dependency_ratio': 70,
    },
}

# ── 3. PSDP per-capita dilution model ────────────────────────────────────────
# Using real FY2024-25 PSDP allocations from our migration 0013 data

PSDP_ALLOC_BN = {   # PKR billion, FY2024-25 (migration 0013 + seed 0012)
    'Punjab':      842.0,   # Full Punjab ADP
    'Sindh':       217.2,   # From psdp_province_summary (seed data)
    'KP':           85.0,   # KP ADP estimate
    'Balochistan':  45.0,   # Balochistan ADP estimate
    'Federal':    1096.0,   # Federal PSDP total
    'AJK':         18.0,
    'GB':          12.0,
}

def compute_dilution(province: str, pdata: dict, years: int = 10) -> list:
    """
    Project per-capita PSDP spend decline over `years` assuming constant
    allocation (no real increase) vs population growing at current rate.
    Returns list of {year, per_capita_pkr} dicts.
    """
    alloc_bn    = PSDP_ALLOC_BN.get(province, 50.0)
    pop_m       = pdata['pop_2023_m']
    growth_rate = pdata['growth_rate'] / 100
    base_year   = 2023

    result = []
    for y in range(years + 1):
        year     = base_year + y
        pop_proj = pop_m * ((1 + growth_rate) ** y)
        per_cap  = (alloc_bn * 1e9) / (pop_proj * 1e6)   # PKR per person
        result.append({'year': year, 'per_capita_pkr': round(per_cap, 0)})
    return result

# ── 4. Security risk index ────────────────────────────────────────────────────

def compute_security_index(pdata: dict) -> dict:
    """
    Composite security risk score (0–100).
    Components:
      - Youth bulge weight (15-29 % normalised)         25%
      - Population growth rate (normalised 0–5%)        25%
      - Instability index (normalised 0–100)            30%
      - Inverse literacy (100 - literacy_pct, norm)     10%
      - Dependency ratio (normalised 50–100)            10%
    """
    def norm(val, lo, hi): return max(0, min(1, (val - lo) / (hi - lo)))

    youth    = norm(pdata['youth_15_29_pct'],  22, 32)   # 22–32%
    growth   = norm(pdata['growth_rate'],       1.5, 5.0)
    instab   = norm(pdata['instability_index'], 0, 80)
    illiter  = norm(100 - pdata['literacy_pct'], 10, 60)
    deprat   = norm(pdata['dependency_ratio'],   55, 92)

    score = (
        youth   * 0.25 +
        growth  * 0.25 +
        instab  * 0.30 +
        illiter * 0.10 +
        deprat  * 0.10
    ) * 100

    # Classify
    level = 'Critical' if score >= 70 else 'High' if score >= 50 else 'Medium' if score >= 30 else 'Low'

    return {'score': round(score, 1), 'level': level}

# ── 5. Scenario projections 2023–2050 ────────────────────────────────────────

def project_population(pop_2023: float, growth_rate: float, years: int = 27) -> dict:
    """
    Three fertility scenarios:
      High:   current growth + 0.5%
      Medium: current growth
      Low:    current growth - 0.8% (gradual fertility transition)
    """
    scenarios = {
        'high':   growth_rate + 0.5,
        'medium': growth_rate,
        'low':    max(0.5, growth_rate - 0.8),
    }
    result = {}
    for label, rate in scenarios.items():
        series = []
        for y in range(years + 1):
            year = 2023 + y
            pop  = pop_2023 * ((1 + rate / 100) ** y)
            series.append({'year': year, 'pop_m': round(pop, 2)})
        result[label] = series
    return result

# ── 6. Assemble & write JSON ──────────────────────────────────────────────────

def build_output(national: dict) -> dict:
    provinces_out = []

    for province, pdata in PROVINCIAL.items():
        security    = compute_security_index(pdata)
        dilution    = compute_dilution(province, pdata)
        projections = project_population(pdata['pop_2023_m'], pdata['growth_rate'])

        # Youth bulge as % of working-age (15-64)
        youth_of_working = (pdata['youth_15_29_pct'] / max(pdata.get('working_age_pct', 59), 1)) * 100

        provinces_out.append({
            'province':           province,
            'pop_2017_m':         pdata['pop_2017_m'],
            'pop_2023_m':         pdata['pop_2023_m'],
            'pop_2030_m':         pdata['pop_2030_m'],
            'pop_2050_m':         pdata['pop_2050_m'],
            'growth_rate':        pdata['growth_rate'],
            'fertility_rate':     pdata['fertility_rate'],
            'youth_15_29_pct':    pdata['youth_15_29_pct'],
            'youth_of_working_pct': round(youth_of_working, 1),
            'literacy_pct':       pdata['literacy_pct'],
            'urban_pct':          pdata['urban_pct'],
            'dependency_ratio':   pdata['dependency_ratio'],
            'instability_index':  pdata['instability_index'],
            'security':           security,
            'psdp_alloc_bn':      PSDP_ALLOC_BN.get(province, 0),
            'psdp_per_capita_pkr': round(
                (PSDP_ALLOC_BN.get(province, 0) * 1e9) / (pdata['pop_2023_m'] * 1e6), 0
            ),
            'dilution_curve':     dilution,
            'projections':        projections,
        })

    # National trendlines (World Bank)
    trends = {}
    for label, series in national.items():
        sorted_series = sorted(series.items())
        trends[label] = [{'year': int(y), 'value': v} for y, v in sorted_series]

    # National summary
    total_pop_2023 = sum(p['pop_2023_m'] for p in PROVINCIAL.values())
    pakistan_2050_medium = sum(
        PROVINCIAL[p]['pop_2023_m'] * ((1 + PROVINCIAL[p]['growth_rate'] / 100) ** 27)
        for p in PROVINCIAL
    )

    # Youth unemployment vs instability for security scatter
    security_scatter = [
        {
            'province':              p['province'],
            'youth_bulge_pct':       p['youth_15_29_pct'],
            'instability_index':     p['instability_index'],
            'security_score':        p['security']['score'],
            'security_level':        p['security']['level'],
            'growth_rate':           p['growth_rate'],
            'psdp_per_capita_pkr':   p['psdp_per_capita_pkr'],
        }
        for p in provinces_out
    ]

    return {
        'meta': {
            'generated_at':   datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'fiscal_year':    '2024-25',
            'census_year':    2023,
            'sources': [
                'World Bank Open Data API (2025)',
                'Pakistan Bureau of Statistics Census 2023',
                'PDHS 2017-18 (DHS Program)',
                'NIPS Population Projections 2020',
                'Pakistan Economic Survey 2023-24 Ch.25',
                'PIPS Annual Security Report 2023',
                'UNFPA Pakistan@2050 Scenario Analysis',
            ],
        },
        'national_summary': {
            'total_pop_2023_m':         round(total_pop_2023, 1),
            'pakistan_2050_medium_m':   round(pakistan_2050_medium, 0),
            'national_growth_rate_2023': national.get('pop_growth_pct', {}).get('2023', 1.55),
            'national_fertility_2023':   national.get('fertility_rate', {}).get('2023', 3.61),
            'national_youth_unemp_2023': national.get('youth_unemployment_pct', {}).get('2023', 9.4),
            'national_dependency_2023':  national.get('dependency_ratio', {}).get('2023', 70.2),
        },
        'national_trends': trends,
        'provinces':       provinces_out,
        'security_scatter': security_scatter,
    }


if __name__ == '__main__':
    print('Fetching World Bank data...')
    national = fetch_wb()
    print(f'  {len(national)} indicators fetched')

    print('Building provincial security model...')
    output = build_output(national)

    out_path = os.path.normpath(OUT_PATH)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2)

    print(f'Written to {out_path}')
    print(f'  Provinces: {len(output["provinces"])}')
    print(f'  National trends: {list(output["national_trends"].keys())}')
    print(f'  Pakistan 2050 (medium): {output["national_summary"]["pakistan_2050_medium_m"]:.0f}M')
