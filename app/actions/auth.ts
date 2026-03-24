'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { z } from 'zod'

// ── Zod Schemas ──────────────────────────────────────────────

const emailSchema = z.string().email('Invalid email address')
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters')

const onboardingSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  boothRent: z.number().positive('Booth rent must be positive').nullable(),
  dueDay: z.number().int().min(1).max(31).nullable(),
})

const profileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().nullable().optional(),
  booth_rent_amount: z.number().positive().nullable().optional(),
  booth_rent_due_day: z.number().int().min(1).max(31).nullable().optional(),
  tax_rate: z.number().min(0).max(1).optional(),
  starting_balance: z.number().min(0).optional(),
}).strict()

const bucketSchema = z.object({
  name: z.string().min(1, 'Bucket name required').max(50),
  percentage: z.number().min(0).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
  priority: z.number().int().min(0),
  is_tax_bucket: z.boolean(),
  target_amount: z.number().positive().nullable(),
})

const bucketUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  percentage: z.number().min(0).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  priority: z.number().int().min(0).optional(),
  is_tax_bucket: z.boolean().optional(),
  target_amount: z.number().positive().nullable().optional(),
  due_date: z.string().nullable().optional(),
  is_recurring: z.boolean().optional(),
  recurring_interval: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly']).nullable().optional(),
}).strict()

const uuidSchema = z.string().uuid()

// ── Actions ──────────────────────────────────────────────────

export async function getServerUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {

    return { user: null, session: null }
  }

  // User is validated — now get session tokens
  const { data: { session } } = await supabase.auth.getSession()

  return {
    user,
    session: session
      ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }
      : null,
  }
}

export async function signInWithOtp(email: string) {
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
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
  const parsedEmail = emailSchema.safeParse(email)
  if (!parsedEmail.success) return { error: parsedEmail.error.issues[0].message }
  const parsedPassword = passwordSchema.safeParse(password)
  if (!parsedPassword.success) return { error: parsedPassword.error.issues[0].message }

  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  const { error } = await supabase.auth.signUp({
    email: parsedEmail.data,
    password: parsedPassword.data,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
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
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/reset-password`,
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
  const parsed = onboardingSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated. Please sign out and sign back in.' }
  }

  // Step 1: Upsert profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email!,
    full_name: parsed.data.fullName,
    booth_rent_amount: parsed.data.boothRent,
    booth_rent_due_day: parsed.data.dueDay,
  }, { onConflict: 'id' })

  if (profileError) {
    return { error: `Profile save failed: ${profileError.message}` }
  }

  // Step 2: Create default buckets if none exist
  const { data: existingBuckets, error: fetchError } = await supabase
    .from('bucket_configs')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (fetchError) {
    // Non-fatal — profile was saved, continue
  }

  if (!existingBuckets || existingBuckets.length === 0) {
    const bucketTemplates = [
      { user_id: user.id, name: 'Essentials', percentage: 50, color: '#3b82f6', priority: 1, is_tax_bucket: false },
      { user_id: user.id, name: 'Taxes', percentage: 25, color: '#ef4444', priority: 2, is_tax_bucket: true },
      { user_id: user.id, name: 'Savings', percentage: 15, color: '#22c55e', priority: 3, is_tax_bucket: false },
      { user_id: user.id, name: 'Fun', percentage: 10, color: '#f59e0b', priority: 4, is_tax_bucket: false },
    ]

    const { error: bucketsError } = await supabase
      .from('bucket_configs')
      .insert(bucketTemplates)

    if (bucketsError) {
      return { error: `Jar setup failed: ${bucketsError.message}` }
    }
  }

  return { error: null }
}

export async function updateProfileAction(updates: Record<string, unknown>) {
  const parsed = profileUpdateSchema.safeParse(updates)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update(parsed.data)
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
  const parsed = bucketSchema.safeParse(bucket)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('bucket_configs')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function updateBucketAction(id: string, updates: Record<string, unknown>) {
  const parsedId = uuidSchema.safeParse(id)
  if (!parsedId.success) return { data: null, error: 'Invalid bucket ID' }
  const parsed = bucketUpdateSchema.safeParse(updates)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('bucket_configs')
    .update(parsed.data)
    .eq('id', parsedId.data)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function deleteBucketAction(id: string) {
  const parsedId = uuidSchema.safeParse(id)
  if (!parsedId.success) return { error: 'Invalid bucket ID' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Fetch the bucket being deleted to check its type
  const { data: bucketToDelete } = await supabase
    .from('bucket_configs')
    .select('*')
    .eq('id', parsedId.data)
    .eq('user_id', user.id)
    .single()

  // Delete the bucket
  const { error: deleteError } = await supabase
    .from('bucket_configs')
    .delete()
    .eq('id', parsedId.data)
    .eq('user_id', user.id)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // Auto-rebalance: if the deleted bucket had a percentage, rebalance remaining buckets
  if (bucketToDelete?.percentage !== null && bucketToDelete?.percentage !== undefined) {
    // Fetch all remaining buckets for this user that have percentages
    const { data: remainingBuckets, error: fetchError } = await supabase
      .from('bucket_configs')
      .select('*')
      .eq('user_id', user.id)
      .not('percentage', 'is', null)

    if (fetchError) {
      console.error('Error fetching remaining buckets:', fetchError)
      return { error: null } // Deletion succeeded, rebalance non-critical
    }

    if (remainingBuckets && remainingBuckets.length > 0) {
      // Calculate sum of remaining percentages
      const totalPercentage = remainingBuckets.reduce((sum: number, b: any) => sum + (b.percentage || 0), 0)

      // Only rebalance if we have remaining percentage-based buckets
      if (totalPercentage > 0 && totalPercentage !== 100) {
        // Rebalance: scale each bucket proportionally
        const updates = remainingBuckets.map((bucket: any, index: number) => {
          let newPercentage = (bucket.percentage / totalPercentage) * 100

          // Ensure we don't exceed 100% due to rounding
          if (index === remainingBuckets.length - 1) {
            // Last bucket: adjust to ensure total = 100%
            const sumOfOthers = remainingBuckets
              .slice(0, -1)
              .reduce((sum: number, b: any) => sum + Math.round((b.percentage / totalPercentage) * 100 * 100) / 100, 0)
            newPercentage = Math.round((100 - sumOfOthers) * 100) / 100
          } else {
            newPercentage = Math.round(newPercentage * 100) / 100
          }

          return {
            id: bucket.id,
            percentage: Math.max(0, Math.min(100, newPercentage)), // Clamp to 0-100
          }
        })

        // Update all remaining buckets in parallel
        for (const update of updates) {
          await supabase
            .from('bucket_configs')
            .update({ percentage: update.percentage })
            .eq('id', update.id)
            .eq('user_id', user.id)
        }
      }
    }
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
    supabase
      .from('bucket_configs')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false }),
    supabase
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

  const { data: profile } = await supabase
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

  await supabase
    .from('profiles')
    .upsert(
      { id: user.id, email: user.email ?? '' },
      { onConflict: 'id', ignoreDuplicates: true }
    )

  return { error: null }
}
