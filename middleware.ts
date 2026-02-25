import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // DEMO MODE: Skip all auth checks and let the app handle everything
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)'],
}