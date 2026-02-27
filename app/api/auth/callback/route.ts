import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore: { name: string; value: string; options: CookieOptions }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.push({ name, value, options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.push({ name, value: '', options })
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

      const destination = profile?.full_name ? next : '/onboarding'
      const response = NextResponse.redirect(`${origin}${destination}`)

      for (const cookie of cookieStore) {
        response.cookies.set({ name: cookie.name, value: cookie.value, ...cookie.options })
      }

      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
