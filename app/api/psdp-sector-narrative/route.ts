import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const GROQ_KEY   = process.env.GROQ_API_KEY
const GROQ_MODEL = 'llama-3.1-8b-instant'

export async function POST(request: Request) {
  const body = await request.json() as {
    sector: string
    execution_pct?: number
    opportunity_score?: number
    stress_score?: number
    allocation_bn?: number
    scheme_count?: number
    throwforward_bn?: number
    derived_gap?: string
  }

  const {
    sector,
    execution_pct      = 0,
    opportunity_score  = 0,
    stress_score       = 0,
    allocation_bn      = 0,
    scheme_count       = 0,
    throwforward_bn    = 0,
    derived_gap        = '',
  } = body

  if (!GROQ_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  const prompt = `You are a Pakistan development sector analyst. Generate a concise, actionable gap narrative for the following PSDP sector data. Be specific, data-grounded, and avoid generic filler.

Sector: ${sector}
PSDP Schemes: ${scheme_count}
Total Allocation: PKR ${allocation_bn.toFixed(1)}B
Average Execution: ${execution_pct.toFixed(0)}%
Throwforward (Uncommitted): PKR ${throwforward_bn.toFixed(1)}B
Opportunity Score: ${opportunity_score.toFixed(0)}/100 (higher = more intervention opportunity)
Execution Stress Score: ${stress_score.toFixed(0)}/100 (higher = more stalled/overrun projects)
Known Contextual Gap: ${derived_gap || 'Not specified'}

Write a 2-3 sentence gap narrative that:
1. States the core problem (execution gap, social outcome mismatch, or resource allocation issue)
2. Identifies what type of donor intervention would add highest marginal value (TA, co-financing, supervision, M&E)
3. Names the most strategic action (province, instrument, or programme type)

Be direct and specific. No preamble. No bullet points. Plain prose only.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(25_000),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Groq error: ${err.slice(0, 200)}` }, { status: 502 })
    }

    const json = await res.json() as {
      choices: Array<{ message: { content: string } }>
    }

    const narrative = json.choices?.[0]?.message?.content?.trim() ?? ''
    return NextResponse.json({ narrative })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
