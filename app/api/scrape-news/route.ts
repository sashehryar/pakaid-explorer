import { NextResponse } from 'next/server'
import { runNewsScraperCore } from '@/lib/news-scraper'

export const runtime     = 'nodejs'
export const maxDuration = 300

// GET — called by Vercel cron every 6 hours
export async function GET() {
  const result = await runNewsScraperCore()
  if ('error' in result) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result)
}

// POST — called manually from admin panel
export async function POST() {
  const result = await runNewsScraperCore()
  if ('error' in result) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result)
}
