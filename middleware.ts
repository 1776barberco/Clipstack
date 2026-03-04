import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, return 503 Service Unavailable
  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse(
      '<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5"><div style="text-align:center"><h1>🔧 Maintenance</h1><p>TipJars is temporarily unavailable. Please try again shortly.</p></div></body></html>',
      {
        status: 503,
        headers: {
          'Content-Type': 'text/html',
          'Retry-After': '60',
        },
      }
    )
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const publicPaths = ['/', '/login', '/api/auth', '/api/coach', '/api/stripe/webhook', '/onboarding', '/reset-password', '/privacy', '/terms', '/blog']
  const isPublicPath = publicPaths.some((path) => {
    if (path === '/') return request.nextUrl.pathname === '/'
    return request.nextUrl.pathname.startsWith(path)
  })

  // Gate /admin routes behind admin email allowlist
  const ADMIN_EMAILS = ['apeltekci@gmail.com', 'vhugo9021@icloud.com']
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Gate /coach and /api/coach/chat behind active subscription (server-side enforcement)
  const coachProtectedPaths = ['/coach', '/api/coach/chat']
  const isCoachPath = coachProtectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))

  if (user && isCoachPath) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    const activeStatuses = ['active', 'trialing']
    const hasAccess = subscription && activeStatuses.includes(subscription.status)

    if (!hasAccess) {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'AI Coach Pro subscription required', code: 'SUBSCRIPTION_REQUIRED' },
          { status: 403 }
        )
      }
    }
  }

  // If not authenticated and not on a public path, redirect to login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If authenticated and on login page, check onboarding before redirecting
  if (user && request.nextUrl.pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    const url = request.nextUrl.clone()
    url.pathname = profile?.full_name ? '/dashboard' : '/onboarding'
    return NextResponse.redirect(url)
  }

  // If authenticated but no profile, redirect to onboarding (except if already there)
  if (user && !isPublicPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.full_name && request.nextUrl.pathname !== '/onboarding') {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|sitemap.xml|robots.txt|.*\.jpg|.*\.jpeg|.*\.png|.*\.gif|.*\.svg|.*\.ico|.*\.webp).*)'],
}
