import Image from 'next/image'
import type { ReactNode } from 'react'

export default function PsdpPreviewLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f9fafb' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <header
        style={{
          height: '56px',
          background: '#055C45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '20px',
          paddingRight: '20px',
          flexShrink: 0,
        }}
      >
        {/* Left: logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image
            src="/brand/Logo-Nav-Icon.png"
            alt="PakAid Explorer logo"
            width={40}
            height={40}
            style={{ objectFit: 'contain' }}
          />
          <span
            style={{
              color: '#ffffff',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '20px',
              lineHeight: '40px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            PakAid Explorer
          </span>
        </div>

        {/* Right: badge + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '20px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            PSDP Intelligence Preview
          </span>
          <a
            href="mailto:hello@pakaid.com"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '6px',
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
          >
            Request Access
          </a>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '20px',
          paddingBottom: '40px',
        }}
      >
        {children}
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer
        style={{
          height: '32px',
          background: '#055C45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <p
          style={{
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 400,
            margin: 0,
            opacity: 0.85,
            textAlign: 'center',
          }}
        >
          © 2025 Syed Ali Shehryar · PakAid Explorer · Data: Federal PSDP 2024-25, Provincial ADPs
        </p>
      </footer>

    </div>
  )
}
