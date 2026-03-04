import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// GET — return current Stripe mode
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

    // Check what's stored in app_settings table
    const adminSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data } = await adminSupabase
      .from('app_settings')
      .select('value')
      .eq('key', 'stripe_mode')
      .maybeSingle()

    const mode = data?.value || (process.env.STRIPE_SECRET_KEY_TEST ? 'test' : 'live')
    const hasTestKeys = !!(process.env.STRIPE_SECRET_KEY_TEST && process.env.STRIPE_PUBLISHABLE_KEY_TEST)
    const hasLiveKeys = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY)

    return NextResponse.json({ mode, hasTestKeys, hasLiveKeys })
  } catch (error) {
    console.error('Stripe mode GET error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST — toggle Stripe mode
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

    const { mode } = await request.json()
    if (!['test', 'live'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }

    // Validate that the required keys exist
    if (mode === 'test' && !process.env.STRIPE_SECRET_KEY_TEST) {
      return NextResponse.json({ error: 'Test keys not configured in Vercel' }, { status: 400 })
    }
    if (mode === 'live' && !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Live keys not configured in Vercel' }, { status: 400 })
    }

    const adminSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Upsert the setting
    const { error } = await adminSupabase
      .from('app_settings')
      .upsert(
        { key: 'stripe_mode', value: mode, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('Failed to save stripe mode:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ mode, saved: true })
  } catch (error) {
    console.error('Stripe mode POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
