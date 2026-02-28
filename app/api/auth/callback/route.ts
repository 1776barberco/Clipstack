import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    // Exchange the code server-side (works for email confirmations & password resets)
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('[auth/callback] Code exchange failed:', error.message)
  }

  // Fallback: redirect to login (implicit flow handles #access_token client-side)
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
