'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'pakaid_disclaimer_accepted'

interface DisclaimerModalProps {
  open: boolean
  onClose: () => void
}

export function DisclaimerModal({ open, onClose }: DisclaimerModalProps) {
  const year = new Date().getFullYear()

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch {}
    onClose()
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg rounded-xl p-6"
        style={{
          background: 'var(--color-surface)',
          boxShadow: '0 4px 8px rgba(15,23,42,0.08)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <h2
            id="disclaimer-title"
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Disclaimer
          </h2>
          <button
            onClick={onClose}
            aria-label="Close disclaimer"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--color-hover-surface)')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
          <p>
            <strong style={{ color: 'var(--color-text-primary)' }}>PakAid Explorer</strong> aggregates publicly
            available development data for informational and research purposes only. The platform does not
            represent any donor, government body, or implementing agency.
          </p>
          <p>
            Data accuracy is not guaranteed. Users are responsible for verifying information independently
            before making business or operational decisions. All trademarks and brand names belong to their
            respective owners.
          </p>
          <p>
            The content on this platform — including project descriptions, donor intelligence, firm profiles,
            and procurement data — is synthesized from public sources such as donor portals, IATI registry,
            government databases, and open news feeds. PakAid Explorer does not claim ownership of any
            underlying data.
          </p>
          <p className="pt-1 font-medium" style={{ color: 'var(--color-text-primary)' }}>
            © {year} PakAid Explorer. Unauthorized reproduction or redistribution of platform content is prohibited.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary text-sm px-4 py-2"
          >
            Close
          </button>
          <button
            onClick={accept}
            className="btn-primary text-sm px-4 py-2"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Auto-show on first visit (use this in the layout) ──────────────────────────
export function FirstVisitDisclaimer() {
  'use client'
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch {}
  }, [])

  return <DisclaimerModal open={open} onClose={() => { try { localStorage.setItem(STORAGE_KEY, 'true') } catch {} setOpen(false) }} />
}

