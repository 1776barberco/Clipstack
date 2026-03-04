import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set() {},
        remove() {},
      },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Admin stats auth:', { userId: user?.id, email: user?.email, authError: authError?.message })
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden', debug: { hasUser: !!user, email: user?.email } }, { status: 403 })
    }

    const adminSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get total users
    const { count: totalUsers } = await adminSupabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    // Get subscription stats
    const { data: subs } = await adminSupabase
      .from('subscriptions')
      .select('status')

    const stats = {
      totalUsers: totalUsers || 0,
      active: 0,
      trialing: 0,
      pastDue: 0,
      canceled: 0,
      mrr: 0,
      conversionRate: 0,
      isTestMode: !!process.env.STRIPE_SECRET_KEY_TEST,
    }

    for (const sub of (subs || [])) {
      switch (sub.status) {
        case 'active': stats.active++; break
        case 'trialing': stats.trialing++; break
        case 'past_due': stats.pastDue++; break
        case 'canceled': stats.canceled++; break
      }
    }

    stats.mrr = stats.active * 9.99
    stats.conversionRate = stats.totalUsers > 0
      ? ((stats.active + stats.trialing) / stats.totalUsers) * 100
      : 0

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
