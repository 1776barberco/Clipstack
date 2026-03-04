import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Get the stored stripe mode from app_settings (server-side only)
let cachedMode: 'test' | 'live' | null = null
let cacheTime = 0
const CACHE_TTL = 30_000 // 30 seconds

async function getStripeMode(): Promise<'test' | 'live'> {
  // Return cached value if fresh
  if (cachedMode && Date.now() - cacheTime < CACHE_TTL) {
    return cachedMode
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) {
      const supabase = createClient(url, key)
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'stripe_mode')
        .maybeSingle()

      if (data?.value === 'test' || data?.value === 'live') {
        cachedMode = data.value as 'test' | 'live'
        cacheTime = Date.now()
        return cachedMode
      }
    }
  } catch {
    // Fall through to default
  }

  // Default: test if test keys exist, otherwise live
  cachedMode = process.env.STRIPE_SECRET_KEY_TEST ? 'test' : 'live'
  cacheTime = Date.now()
  return cachedMode
}

// Invalidate cache (called after admin toggles mode)
export function invalidateStripeModeCache() {
  cachedMode = null
  cacheTime = 0
}

// Get a Stripe client for the current mode
export async function getStripe(): Promise<Stripe | null> {
  const mode = await getStripeMode()

  const secretKey = mode === 'test'
    ? (process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY)
    : (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_TEST)

  if (!secretKey) return null

  return new Stripe(secretKey, {
    apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion,
  })
}

export async function getPublishableKey(): Promise<string> {
  const mode = await getStripeMode()
  return mode === 'test'
    ? (process.env.STRIPE_PUBLISHABLE_KEY_TEST || process.env.STRIPE_PUBLISHABLE_KEY || '')
    : (process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY_TEST || '')
}

export async function isTestMode(): Promise<boolean> {
  const mode = await getStripeMode()
  return mode === 'test'
}

// Legacy sync export for non-async contexts (uses default fallback)
const defaultKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY
export const stripe = defaultKey
  ? new Stripe(defaultKey, { apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion })
  : null
