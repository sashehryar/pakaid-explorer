'use client'

import { useState } from 'react'
import { DisclaimerModal } from './disclaimer-modal'

export function AppFooter() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const year = new Date().getFullYear()

  return (
    <>
      <footer
        className="hidden md:flex items-center justify-between border-t px-6 py-2.5"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border-subtle)',
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>© {year} PakAid Explorer. All rights reserved.</span>
        <div className="flex items-center gap-3">
          <span style={{ color: 'var(--color-border-strong)' }}>·</span>
          <button
            onClick={() => setShowDisclaimer(true)}
            className="underline-offset-2 hover:underline transition-colors"
            style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
          >
            Disclaimer
          </button>
          <span style={{ color: 'var(--color-border-strong)' }}>·</span>
          <span>Data sourced from public donor repositories. Not for redistribution.</span>
        </div>
      </footer>

      <DisclaimerModal open={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </>
  )
}
