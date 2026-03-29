import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-pine">
            <span className="text-lg font-black text-white">P</span>
          </div>
          <h1 className="text-2xl font-bold text-ink">PakAid Explorer</h1>
          <p className="mt-1 text-sm text-ash">Pakistan&apos;s development intelligence platform</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
