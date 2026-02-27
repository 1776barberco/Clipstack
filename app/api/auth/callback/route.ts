import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    // Pass code to login page for client-side exchange
    // PKCE code_verifier is stored in the browser, so the exchange
    // must happen client-side where the verifier is accessible
    return NextResponse.redirect(`${origin}/login?code=${code}`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
