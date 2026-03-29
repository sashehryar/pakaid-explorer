import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'PakAid Explorer', template: '%s · PakAid Explorer' },
  description: "Pakistan's development intelligence platform — funding, procurement, donor intelligence, and sector analysis in one place.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://pakaid.vercel.app'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
