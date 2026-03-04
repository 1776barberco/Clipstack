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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const search = request.nextUrl.searchParams.get('q') || ''

    // Get ALL profiles
    const { data: profiles } = await adminSupabase
      .from('profiles')
      .select('id, full_name')
      .order('created_at', { ascending: false })

    // Get all subscriptions
    const { data: subs } = await adminSupabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        status,
        stripe_customer_id,
        stripe_subscription_id,
        trial_end,
        cancel_at_period_end,
        created_at
      `)

    // Get emails from auth.users
    const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })

    const subMap = new Map((subs || []).map(s => [s.user_id, s]))
    const emailMap = new Map((authUsers || []).map(u => [u.id, u.email]))
    const createdMap = new Map((authUsers || []).map(u => [u.id, u.created_at]))

    // Build combined user list
    const allUsers = (profiles || []).map(profile => {
      const sub = subMap.get(profile.id)
      const email = emailMap.get(profile.id) || 'Unknown'
      return {
        id: sub?.id || null,
        user_id: profile.id,
        full_name: profile.full_name || 'Unknown',
        email,
        status: sub?.status || 'free',
        stripe_customer_id: sub?.stripe_customer_id || null,
        trial_end: sub?.trial_end || null,
        cancel_at_period_end: sub?.cancel_at_period_end || false,
        created_at: createdMap.get(profile.id) || new Date().toISOString(),
        is_admin: isAdminEmail(email),
      }
    })

    // Filter by search
    const filtered = search
      ? allUsers.filter(u =>
          u.full_name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.user_id.toLowerCase().includes(search.toLowerCase())
        )
      : allUsers

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Admin subscribers error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
