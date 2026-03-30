'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { BidStage, BidPriority, TaskStatus } from '@/lib/types/database'

// ─────────────────────────────────────────
// Bid Pipeline Actions
// ─────────────────────────────────────────

export async function createBid(data: {
  title: string
  donor: string
  sector?: string
  province?: string
  value_usd?: number
  stage?: BidStage
  priority?: BidPriority
  deadline?: string
  go_no_go_date?: string
  lead_firm?: string
  win_probability?: number
  notes?: string
  source_url?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase.from('bid_pipeline').insert({
    ...data,
    user_id: user.id,
    stage: data.stage ?? 'opportunity_id',
    priority: data.priority ?? 'medium',
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/firms/pipeline')
  return { ok: true }
}

export async function updateBidStage(bidId: string, stage: BidStage) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('bid_pipeline')
    .update({ stage })
    .eq('id', bidId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/firms/pipeline')
  return { ok: true }
}

export async function updateBidProbability(bidId: string, win_probability: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('bid_pipeline')
    .update({ win_probability })
    .eq('id', bidId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/firms/pipeline')
  return { ok: true }
}

export async function deleteBid(bidId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('bid_pipeline')
    .delete()
    .eq('id', bidId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/firms/pipeline')
  return { ok: true }
}

// ─────────────────────────────────────────
// Bid Task Actions
// ─────────────────────────────────────────

export async function createTask(bidId: string, data: {
  title: string
  assignee?: string
  due_date?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase.from('bid_tasks').insert({
    bid_id: bidId,
    user_id: user.id,
    title: data.title,
    assignee: data.assignee ?? null,
    due_date: data.due_date ?? null,
    status: 'open',
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/firms/pipeline')
  return { ok: true }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('bid_tasks')
    .update({ status })
    .eq('id', taskId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/firms/pipeline')
  return { ok: true }
}
