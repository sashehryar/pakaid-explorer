'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface MaintenanceClientProps {
  missingFirms:   string[]
  missingDonors:  string[]
  missingFeeds:   { name: string; url: string }[]
  missingSectors: string[]
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
      style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' }}
      title="Copy INSERT SQL"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy SQL'}
    </button>
  )
}

function MissingTable({
  title, items, toSql,
}: {
  title: string
  items: string[]
  toSql: (item: string) => string
}) {
  if (items.length === 0) {
    return (
      <div className="card-default rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
        <p className="text-xs" style={{ color: 'var(--color-success)' }}>✓ All canonical entries present in database</p>
      </div>
    )
  }

  return (
    <div className="card-default rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning-600)' }}>
          {items.length} missing
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
        {items.map(item => (
          <div key={item} className="flex items-center justify-between py-2">
            <span className="text-sm font-mono" style={{ color: 'var(--color-text-primary)' }}>{item}</span>
            <CopyButton text={toSql(item)} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MaintenanceClient({ missingFirms, missingDonors, missingFeeds, missingSectors }: MaintenanceClientProps) {
  return (
    <div className="space-y-4">
      <MissingTable
        title="Missing Firms"
        items={missingFirms}
        toSql={name => `INSERT INTO consulting_firms (name, type, trend, active_contracts) VALUES ('${name.replace(/'/g, "''")}', 'Consulting', 'Stable', 0) ON CONFLICT (name) DO NOTHING;`}
      />
      <MissingTable
        title="Missing Donors"
        items={missingDonors}
        toSql={name => `INSERT INTO donors (name, type, active_projects) VALUES ('${name.replace(/'/g, "''")}', 'Private', 0) ON CONFLICT (name) DO NOTHING;`}
      />
      <MissingTable
        title="Missing Sectors"
        items={missingSectors}
        toSql={name => {
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          return `INSERT INTO sectors (name, slug, sdg_aligned) VALUES ('${name.replace(/'/g, "''")}', '${slug}', true) ON CONFLICT (name) DO NOTHING;`
        }}
      />

      {/* RSS feeds */}
      {missingFeeds.length === 0 ? (
        <div className="card-default rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Missing RSS Feeds</h3>
          <p className="text-xs" style={{ color: 'var(--color-success)' }}>✓ All canonical feeds present in database</p>
        </div>
      ) : (
        <div className="card-default rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Missing RSS Feeds</h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning-600)' }}>
              {missingFeeds.length} missing
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
            {missingFeeds.map(feed => (
              <div key={feed.url} className="flex items-center justify-between py-2 gap-2">
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{feed.name}</span>
                  <span className="ml-2 text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{feed.url}</span>
                </div>
                <CopyButton text={`INSERT INTO news_feeds (feed_name, feed_url, is_active) VALUES ('${feed.name.replace(/'/g, "''")}', '${feed.url}', true) ON CONFLICT (feed_url) DO NOTHING;`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
