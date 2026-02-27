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

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email!,
    full_name: data.fullName,
    booth_rent_amount: data.boothRent,
    booth_rent_due_day: data.dueDay,
  } as any, { onConflict: 'id' })

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

    const { error: bucketsError } = await supabase
      .from('bucket_configs')
      .insert(bucketTemplates as any)

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}
