import { NextResponse, type NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

// Use service_role to bypass RLS — only webhooks can write to subscriptions
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey)
}

async function upsertSubscription(
  userId: string,
  data: {
    stripe_customer_id?: string
    stripe_subscription_id?: string
    status: string
    current_period_start?: string
    current_period_end?: string
    trial_end?: string | null
    cancel_at_period_end?: boolean
  }
) {
  const supabase = getAdminSupabase()

  // Check if subscription exists
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('subscriptions')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
  } else {
    await supabase
      .from('subscriptions')
      .insert({ user_id: userId, ...data })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const stripe = await getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const sig = request.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not set')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.user_id
        console.log('[Webhook] checkout.session.completed — userId:', userId, 'subscription:', session.subscription)
        if (!userId) break

        if (session.subscription) {
          try {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string) as any
            console.log('[Webhook] Retrieved subscription:', sub.id, 'status:', sub.status)
            
            // Handle both old and new Stripe API shapes for period fields
            const periodStart = sub.current_period_start || sub.items?.data?.[0]?.current_period_start
            const periodEnd = sub.current_period_end || sub.items?.data?.[0]?.current_period_end
            
            await upsertSubscription(userId, {
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: sub.id,
              status: sub.status === 'trialing' ? 'trialing' : 'active',
              current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : new Date().toISOString(),
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
              cancel_at_period_end: sub.cancel_at_period_end ?? false,
            })
            console.log('[Webhook] Subscription upserted for user:', userId)
          } catch (subErr) {
            console.error('[Webhook] Error processing checkout subscription:', subErr)
            throw subErr
          }
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any
        const subId = invoice.subscription as string
        if (!subId) break

        const sub = await stripe.subscriptions.retrieve(subId) as any
        const userId = sub.metadata?.user_id
        if (!userId) break

        const periodStart = sub.current_period_start || sub.items?.data?.[0]?.current_period_start
        const periodEnd = sub.current_period_end || sub.items?.data?.[0]?.current_period_end

        await upsertSubscription(userId, {
          status: 'active',
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : new Date().toISOString(),
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subId = invoice.subscription as string
        if (!subId) break

        const sub = await stripe.subscriptions.retrieve(subId) as any
        const userId = sub.metadata?.user_id
        if (!userId) break

        await upsertSubscription(userId, { status: 'past_due' })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        const userId = sub.metadata?.user_id
        if (!userId) break

        await upsertSubscription(userId, { status: 'canceled' })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        const userId = sub.metadata?.user_id
        if (!userId) break

        let status: string = sub.status
        if (status === 'trialing') status = 'trialing'
        else if (status === 'active') status = 'active'
        else if (status === 'past_due') status = 'past_due'
        else if (status === 'canceled' || status === 'unpaid') status = 'canceled'
        else status = 'inactive'

        const periodStart = sub.current_period_start || sub.items?.data?.[0]?.current_period_start
        const periodEnd = sub.current_period_end || sub.items?.data?.[0]?.current_period_end

        await upsertSubscription(userId, {
          status,
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : new Date().toISOString(),
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('[Webhook] Handler error:', errMsg)
    return NextResponse.json({ error: `Webhook handler failed: ${errMsg}` }, { status: 500 })
  }
}
