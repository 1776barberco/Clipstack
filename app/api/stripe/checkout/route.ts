import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getStripe, isTestMode } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

const PRICE_LOOKUP_KEY = 'ai_coach_pro_monthly'

async function getOrCreatePrice(): Promise<string> {
  if (process.env.STRIPE_PRICE_ID) {
    console.log('[Checkout] Using STRIPE_PRICE_ID from env:', process.env.STRIPE_PRICE_ID)
    return process.env.STRIPE_PRICE_ID
  }

  const stripe = await getStripe()
  if (!stripe) throw new Error('Stripe not initialized')

  // Check if price already exists
  const prices = await stripe.prices.list({ lookup_keys: [PRICE_LOOKUP_KEY], limit: 1 })
  if (prices.data.length > 0) return prices.data[0].id

  // Create product and price
  const product = await stripe.products.create({
    name: 'AI Coach Pro',
    description: 'Personal AI financial coach for barbers, stylists, and independent contractors',
    metadata: { app: 'tipjars' },
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 999, // $9.99
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: PRICE_LOOKUP_KEY,
    metadata: { app: 'tipjars' },
  })

  return price.id
}

export async function POST(request: NextRequest) {
  try {
    const stripe = await getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set() {},
        remove() {},
      },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const priceId = await getOrCreatePrice()
    const origin = request.nextUrl.origin

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { user_id: user.id },
      },
      customer_email: user.email,
      metadata: { user_id: user.id },
      success_url: `${origin}/coach?success=true`,
      cancel_url: `${origin}/coach`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const testMode = await isTestMode()
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('[Checkout] ERROR — mode:', testMode ? 'TEST' : 'LIVE', '| priceIdEnv:', process.env.STRIPE_PRICE_ID || 'NOT SET', '| error:', errMsg)
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errMsg}` },
      { status: 500 }
    )
  }
}
