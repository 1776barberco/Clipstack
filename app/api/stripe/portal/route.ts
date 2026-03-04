import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
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

    // Get subscription to find stripe_customer_id
    const adminSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: subscription } = await adminSupabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    const origin = request.nextUrl.origin
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
