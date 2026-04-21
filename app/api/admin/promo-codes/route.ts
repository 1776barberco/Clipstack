import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import Stripe from 'stripe'
import { isAdminEmail } from '@/lib/admin'
import { getStripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

async function requireAdmin(request: NextRequest) {
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
  if (!user || !isAdminEmail(user.email)) {
    return null
  }

  return user
}

const PRICE_LOOKUP_KEY = 'ai_coach_pro_monthly'

async function getOrCreatePriceId() {
  const stripe = await getStripe()
  if (!stripe) throw new Error('Stripe not configured')

  if (process.env.STRIPE_PRICE_ID) return process.env.STRIPE_PRICE_ID

  const prices = await stripe.prices.list({ lookup_keys: [PRICE_LOOKUP_KEY], limit: 1 })
  if (prices.data.length > 0) return prices.data[0].id

  const product = await stripe.products.create({
    name: 'AI Coach Pro',
    description: 'Personal AI financial coach for barbers, stylists, and independent contractors',
    metadata: { app: 'tipjars' },
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 999,
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: PRICE_LOOKUP_KEY,
    metadata: { app: 'tipjars' },
  })

  return price.id
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stripe = await getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const promotionCodes = await stripe.promotionCodes.list({ limit: 25 })

    const data = await Promise.all(
      promotionCodes.data.map(async (promoRaw) => {
        const promo = promoRaw as Stripe.PromotionCode & { coupon: string | Stripe.Coupon }
        const couponId = typeof promo.coupon === 'string' ? promo.coupon : promo.coupon.id
        const coupon = await stripe.coupons.retrieve(couponId) as Stripe.Coupon

        return {
          id: promo.id,
          code: promo.code,
          active: promo.active,
          timesRedeemed: promo.times_redeemed ?? 0,
          maxRedemptions: promo.max_redemptions ?? null,
          expiresAt: promo.expires_at ? new Date(promo.expires_at * 1000).toISOString() : null,
          createdAt: promo.created ? new Date(promo.created * 1000).toISOString() : null,
          coupon: {
            id: coupon.id,
            percentOff: coupon.percent_off,
            amountOff: coupon.amount_off,
            currency: coupon.currency,
            duration: coupon.duration,
            durationInMonths: coupon.duration_in_months,
            name: coupon.name,
          },
        }
      })
    )

    return NextResponse.json(data)
  } catch (error) {
    console.error('Promo codes GET error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stripe = await getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const body = await request.json() as {
      code?: string
      percentOff?: number
      months?: number
      maxRedemptions?: number
    }

    const code = body.code?.trim().toUpperCase()
    const percentOff = Number(body.percentOff ?? 100)
    const months = Number(body.months ?? 2)
    const maxRedemptions = Number(body.maxRedemptions ?? 15)

    if (!code || !/^[A-Z0-9_-]{3,40}$/.test(code)) {
      return NextResponse.json({ error: 'Invalid promo code format' }, { status: 400 })
    }

    if (!Number.isFinite(percentOff) || percentOff <= 0 || percentOff > 100) {
      return NextResponse.json({ error: 'Percent off must be between 1 and 100' }, { status: 400 })
    }

    if (!Number.isFinite(months) || months < 1 || months > 24) {
      return NextResponse.json({ error: 'Months must be between 1 and 24' }, { status: 400 })
    }

    if (!Number.isFinite(maxRedemptions) || maxRedemptions < 1 || maxRedemptions > 10000) {
      return NextResponse.json({ error: 'Max redemptions must be at least 1' }, { status: 400 })
    }

    const existing = await stripe.promotionCodes.list({ code, limit: 1 })
    if (existing.data.length > 0) {
      return NextResponse.json({ error: 'Promo code already exists' }, { status: 400 })
    }

    const priceId = await getOrCreatePriceId()
    const price = await stripe.prices.retrieve(priceId)
    const productId = typeof price.product === 'string' ? price.product : price.product.id

    const coupon = await stripe.coupons.create({
      name: `${code} - ${percentOff}% off for ${months} month${months === 1 ? '' : 's'}`,
      percent_off: percentOff,
      duration: 'repeating',
      duration_in_months: months,
      applies_to: { products: [productId] },
      metadata: {
        app: 'tipjars',
        created_by: user.email || user.id,
        target_price_id: priceId,
      },
    })

    const promotionCode = await stripe.promotionCodes.create({
      code,
      coupon: coupon.id,
      max_redemptions: maxRedemptions,
      metadata: {
        app: 'tipjars',
        created_by: user.email || user.id,
      },
    } as unknown as Stripe.PromotionCodeCreateParams)

    return NextResponse.json({
      ok: true,
      promoCode: {
        id: promotionCode.id,
        code: promotionCode.code,
        maxRedemptions: promotionCode.max_redemptions,
        timesRedeemed: promotionCode.times_redeemed,
      },
      coupon: {
        id: coupon.id,
        percentOff: coupon.percent_off,
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months,
      },
    })
  } catch (error) {
    console.error('Promo codes POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
