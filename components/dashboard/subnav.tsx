'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export interface SubnavItem {
  label: string
  href: string
  query?: Record<string, string>
  count?: number
}

interface SubnavProps {
  items: SubnavItem[]
  'aria-label'?: string
}

export function Subnav({ items, 'aria-label': ariaLabel = 'Section navigation' }: SubnavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function isActive(item: SubnavItem): boolean {
    if (item.query) {
      // Match both path and all query params
      if (pathname !== item.href) return false
      return Object.entries(item.query).every(
        ([k, v]) => searchParams.get(k) === v
      )
    }
    // No query — active if path matches exactly (or for base path, no relevant query param)
    return pathname === item.href && !searchParams.get('filter')
  }

  function buildHref(item: SubnavItem): string {
    if (!item.query) return item.href
    const params = new URLSearchParams(item.query)
    return `${item.href}?${params.toString()}`
  }

  return (
    <nav
      aria-label={ariaLabel}
      className="flex items-center gap-1 border-b px-4 md:px-6 overflow-x-auto"
      style={{
        background: 'var(--color-canvas)',
        borderColor: 'var(--color-border-subtle)',
        minHeight: '40px',
        paddingTop: '4px',
        paddingBottom: '4px',
      }}
    >
      {items.map(item => {
        const active = isActive(item)
        return (
          <Link
            key={item.href + JSON.stringify(item.query)}
            href={buildHref(item)}
            className={`subnav-tab${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className="ml-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                style={{
                  background: active ? 'var(--color-brand-200)' : 'var(--color-surface-subtle)',
                  color: active ? 'var(--color-brand-700)' : 'var(--color-text-secondary)',
                }}
              >
                {item.count}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
