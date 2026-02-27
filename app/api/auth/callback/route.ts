import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      console.error('Code exchange error:', error.message)
      // If server-side exchange fails, try client-side via login page
      return NextResponse.redirect(`${origin}/login?code=${code}`)
    } catch (e) {
      console.error('Callback route error:', e)
      // Fallback to client-side code exchange
      return NextResponse.redirect(`${origin}/login?code=${code}`)
    }
  }

  // No code at all
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
