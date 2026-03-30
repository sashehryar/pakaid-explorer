'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { triggerScraper } from '@/app/actions/admin'
import type { ScraperLog, ScraperStatus } from '@/lib/types/database'
import { Play, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface ScraperPanelProps {
  scrapers: ScraperLog[]
}

const STATUS_STYLE: Record<ScraperStatus, { dot: string; badge: string; label: string }> = {
  healthy:  { dot: 'bg-fern',      badge: 'bg-green-50 text-green-700',  label: 'HEALTHY'  },
  failing:  { dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700',      label: 'FAILING'  },
  running:  { dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700',  label: 'RUNNING'  },
  disabled: { dot: 'bg-ash',       badge: 'bg-fog text-ash',             label: 'DISABLED' },
}

type TriggerResult = { ok: boolean; message: string }

export function ScraperPanel({ scrapers }: ScraperPanelProps) {
  const [results, setResults] = useState<Record<string, TriggerResult>>({})
  const [triggering, setTriggering] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  function handleTrigger(scraperName: string) {
    setTriggering(prev => ({ ...prev, [scraperName]: true }))
    setResults(prev => {
      const next = { ...prev }
      delete next[scraperName]
      return next
    })

    startTransition(async () => {
      try {
        const result = await triggerScraper(scraperName)
        setResults(prev => ({ ...prev, [scraperName]: result }))
      } catch (err) {
        setResults(prev => ({
          ...prev,
          [scraperName]: { ok: false, message: err instanceof Error ? err.message : 'Unknown error' },
        }))
      } finally {
        setTriggering(prev => ({ ...prev, [scraperName]: false }))
      }
    })
  }

  if (scrapers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-silver bg-card p-12 text-center">
        <p className="font-semibold text-ink">No scrapers configured</p>
        <p className="text-sm text-ash mt-1">Add entries to the scraper_logs table to see them here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {scrapers.map(scraper => {
        const style = STATUS_STYLE[scraper.status]
        const isTriggering = triggering[scraper.name] ?? false
        const result = results[scraper.name]

        return (
          <div
            key={scraper.id}
            className="rounded-xl border border-silver bg-card p-4 flex items-start gap-4"
          >
            {/* Status dot */}
            <div className="mt-1 shrink-0">
              <span className={`block h-2.5 w-2.5 rounded-full ${style.dot}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-sm text-ink">{scraper.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.badge}`}>
                  {style.label}
                </span>
              </div>

              {scraper.apify_actor_id && (
                <div className="text-xs text-ash font-mono mb-1">{scraper.apify_actor_id}</div>
              )}

              <div className="flex items-center gap-4 text-xs text-ash flex-wrap">
                <span>
                  Last run:{' '}
                  {scraper.last_run
                    ? new Date(scraper.last_run).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
                    : 'Never'}
                </span>
                <span className="text-pine font-semibold">
                  {scraper.records_last_run ?? 0} records
                </span>
                {scraper.next_run && (
                  <span>
                    Next:{' '}
                    {new Date(scraper.next_run).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                )}
              </div>

              {scraper.error_message && (
                <div className="mt-1 text-xs text-red-600 flex items-start gap-1">
                  <AlertCircle size={11} className="shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{scraper.error_message}</span>
                </div>
              )}

              {result && (
                <div className={`mt-2 text-xs flex items-center gap-1.5 ${result.ok ? 'text-fern' : 'text-red-600'}`}>
                  {result.ok
                    ? <CheckCircle2 size={12} className="shrink-0" />
                    : <AlertCircle size={12} className="shrink-0" />
                  }
                  {result.message}
                </div>
              )}
            </div>

            {/* Trigger button */}
            <div className="shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-silver text-ink hover:border-pine hover:text-pine"
                onClick={() => handleTrigger(scraper.name)}
                disabled={isTriggering || isPending || scraper.status === 'disabled'}
              >
                {isTriggering ? (
                  <>
                    <Loader2 size={12} className="animate-spin mr-1.5" />
                    Running
                  </>
                ) : (
                  <>
                    <Play size={12} className="mr-1.5" />
                    Trigger
                  </>
                )}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
