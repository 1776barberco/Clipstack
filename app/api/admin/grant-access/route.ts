import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    const { user_id } = await request.json()
    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    const adminSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Grant access — upsert subscription with active status
    const { data: existing } = await adminSupabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle()

    if (existing) {
      await adminSupabase
        .from('subscriptions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('user_id', user_id)
    } else {
      await adminSupabase
        .from('subscriptions')
        .insert({ user_id, status: 'active' })
    }

    return NextResponse.json({ granted: true })
  } catch (error) {
    console.error('Grant access error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { user_id } = await request.json()
    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    const adminSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    await adminSupabase
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('user_id', user_id)

    return NextResponse.json({ revoked: true })
  } catch (error) {
    console.error('Revoke access error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
