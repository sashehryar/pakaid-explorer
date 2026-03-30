'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createWin(data: {
  title: string
  donor: string
  sector?: string
  province?: string
  value_usd?: number
  award_date?: string
  start_date?: string
  end_date?: string
  client?: string
  lead_firm?: string
  our_role?: string
  bid_id?: string
  lessons_learned?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase.from('contract_wins').insert({
    ...data,
    user_id: user.id,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/firms/wins')
  return { ok: true }
}

export async function deleteWin(winId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('contract_wins')
    .delete()
    .eq('id', winId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/firms/wins')
  return { ok: true }
}
