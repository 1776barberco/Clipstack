'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function getServerSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return { session: null }
  }

  return {
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    },
  }
}

export async function signInWithOtp(email: string) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function signUpWithPassword(email: string, password: string) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function signInWithPasswordAction(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function signOutAction() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function resetPassword(email: string) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function completeOnboarding(data: {
  fullName: string
  boothRent: number | null
  dueDay: number | null
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error: profileError } = await (supabase as any).from('profiles').upsert({
    id: user.id,
    email: user.email!,
    full_name: data.fullName,
    booth_rent_amount: data.boothRent,
    booth_rent_due_day: data.dueDay,
  }, { onConflict: 'id' })

  if (profileError) {
    return { error: profileError.message }
  }

  const { data: existingBuckets } = await supabase
    .from('bucket_configs')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (!existingBuckets || existingBuckets.length === 0) {
    const bucketTemplates = [
      { user_id: user.id, name: 'Essentials', percentage: 50, color: '#3b82f6', priority: 1, is_tax_bucket: false },
      { user_id: user.id, name: 'Taxes', percentage: 25, color: '#ef4444', priority: 2, is_tax_bucket: true },
      { user_id: user.id, name: 'Savings', percentage: 15, color: '#22c55e', priority: 3, is_tax_bucket: false },
      { user_id: user.id, name: 'Fun', percentage: 10, color: '#f59e0b', priority: 4, is_tax_bucket: false },
    ]

    const { error: bucketsError } = await (supabase as any)
      .from('bucket_configs')
      .insert(bucketTemplates)

    if (bucketsError) {
      return { error: bucketsError.message }
    }
  }

  return { error: null }
}

export async function updateProfileAction(updates: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function createBucketAction(bucket: {
  name: string
  percentage: number
  color: string
  priority: number
  is_tax_bucket: boolean
  target_amount: number | null
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await (supabase as any)
    .from('bucket_configs')
    .insert({ ...bucket, user_id: user.id })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function updateBucketAction(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await (supabase as any)
    .from('bucket_configs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function deleteBucketAction(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await (supabase as any)
    .from('bucket_configs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function fetchBucketsAction() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { buckets: [], balances: [], error: 'Not authenticated' }
  }

  const [configsRes, balancesRes] = await Promise.all([
    (supabase as any)
      .from('bucket_configs')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false }),
    (supabase as any)
      .from('bucket_balances')
      .select('*')
      .eq('user_id', user.id),
  ])

  return {
    buckets: configsRes.data || [],
    balances: balancesRes.data || [],
    error: configsRes.error?.message || balancesRes.error?.message || null,
  }
}

export async function checkOnboardingStatus() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { needsOnboarding: false, authenticated: false }
  }

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  return {
    needsOnboarding: !profile?.full_name,
    authenticated: true,
  }
}

export async function ensureProfileExists() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  await (supabase as any)
    .from('profiles')
    .upsert(
      { id: user.id, email: user.email ?? '' },
      { onConflict: 'id', ignoreDuplicates: true }
    )

  return { error: null }
}
