'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ComplianceCategory } from '@/lib/types/database'

export async function createComplianceItem(data: {
  title: string
  category: ComplianceCategory
  authority?: string
  reference?: string
  issued_date?: string
  expiry_date?: string
  renewal_url?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase.from('compliance_items').insert({
    ...data,
    user_id: user.id,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/firms/compliance')
  return { ok: true }
}

export async function deleteComplianceItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('compliance_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/firms/compliance')
  return { ok: true }
}
