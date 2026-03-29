'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/funding'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [sent, setSent]         = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push(next)
      router.refresh()
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) { setError(error.message); setLoading(false); return }
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-silver bg-card p-6 text-center">
        <p className="font-semibold text-ink">Check your email</p>
        <p className="mt-1 text-sm text-ash">We sent a confirmation link to <strong>{email}</strong></p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-silver bg-card p-6 space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate uppercase tracking-wide">Email</label>
        <input
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@organisation.org"
          className="w-full rounded-lg border border-silver bg-fog px-3 py-2 text-sm outline-none focus:border-pine focus:ring-1 focus:ring-pine transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate uppercase tracking-wide">Password</label>
        <input
          type="password" required value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border border-silver bg-fog px-3 py-2 text-sm outline-none focus:border-pine focus:ring-1 focus:ring-pine transition-colors"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </button>

      <p className="text-center text-xs text-ash">
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-pine font-semibold hover:underline"
        >
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </form>
  )
}
