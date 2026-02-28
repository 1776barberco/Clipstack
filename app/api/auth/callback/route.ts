import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    // Pass the code to the login page for client-side PKCE exchange.
    // Server-side exchange won't work because the code_verifier lives
    // in the browser (localStorage), not in server cookies.
    return NextResponse.redirect(`${origin}/login?code=${code}&next=${encodeURIComponent(next)}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
