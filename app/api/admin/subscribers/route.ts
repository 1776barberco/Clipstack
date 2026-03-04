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

    // Get all subscribers with profile info
    let query = adminSupabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        status,
        stripe_customer_id,
        stripe_subscription_id,
        current_period_start,
        current_period_end,
        trial_end,
        cancel_at_period_end,
        created_at
      `)
      .order('created_at', { ascending: false })

    const { data: subs } = await query

    // Get profiles for all subscriber user_ids
    const userIds = (subs || []).map(s => s.user_id)
    const { data: profiles } = await adminSupabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds.length > 0 ? userIds : ['none'])

    // Get emails from auth.users via admin API
    const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })

    const profileMap = new Map((profiles || []).map(p => [p.id, p]))
    const emailMap = new Map((authUsers || []).map(u => [u.id, u.email]))

    const subscribers = (subs || []).map(sub => ({
      ...sub,
      full_name: profileMap.get(sub.user_id)?.full_name || 'Unknown',
      email: emailMap.get(sub.user_id) || 'Unknown',
    }))

    // Filter by search
    const filtered = search
      ? subscribers.filter(s =>
          s.full_name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase())
        )
      : subscribers

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Admin subscribers error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
