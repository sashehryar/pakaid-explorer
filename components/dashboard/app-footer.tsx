'use client'

import { useState } from 'react'
import { DisclaimerModal } from './disclaimer-modal'

export function AppFooter() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const year = new Date().getFullYear()

  return (
    <>
      <footer
        className="hidden md:flex items-center justify-between px-6 py-3"
        style={{
          background: '#055C45',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.75)',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.90)' }}>
          © {year} Syed Ali Shehryar. All rights reserved.
        </span>
        <div className="flex items-center gap-3">
          <span style={{ color: 'rgba(255,255,255,0.30)' }}>·</span>
          <button
            onClick={() => setShowDisclaimer(true)}
            className="underline-offset-2 hover:underline transition-opacity hover:opacity-100"
            style={{ color: 'rgba(255,255,255,0.75)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
          >
            Disclaimer
          </button>
          <span style={{ color: 'rgba(255,255,255,0.30)' }}>·</span>
          <span>Data sourced from public donor repositories. Not for redistribution.</span>
        </div>
      </footer>

      <DisclaimerModal open={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </>
  )
}
