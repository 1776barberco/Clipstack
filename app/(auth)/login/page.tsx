'use client'

import { LoginForm } from '@/components/LoginForm'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string>('Signing you in...')

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/dashboard'

    if (errorParam) {
      setError(errorParam)
      setChecking(false)
      return
    }

    if (!supabase) {
      setChecking(false)
      return
    }

    // If there's a PKCE code, exchange it client-side (code_verifier is in localStorage)
    if (code) {
      setStatusMsg('Completing sign in...')
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error: exchError }: { data: { session: import('@supabase/supabase-js').Session | null; user: import('@supabase/supabase-js').User | null }, error: import('@supabase/supabase-js').AuthError | null }) => {
        if (exchError || !data.session) {
          setError(exchError?.message || 'Sign in failed. Please request a new magic link.')
          setChecking(false)
          return
        }
        // Exchange succeeded — check onboarding status
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.session.user.id)
          .maybeSingle()

        router.replace(profile?.full_name ? next : '/onboarding')
      })
      return
    }

    // No code — check if already logged in
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .maybeSingle()

        router.replace(profile?.full_name ? '/dashboard' : '/onboarding')
        return
      }
      setChecking(false)
    })
  }, [router, searchParams])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 p-4 dark:from-zinc-900 dark:to-zinc-800">
        <p className="text-muted-foreground">{statusMsg}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 p-4 dark:from-zinc-900 dark:to-zinc-800">
      {error && (
        <div className="absolute top-4 mx-auto rounded bg-red-100 px-4 py-2 text-sm text-red-700">
          {decodeURIComponent(error)}
        </div>
      )}
      <LoginForm />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 p-4 dark:from-zinc-900 dark:to-zinc-800">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
