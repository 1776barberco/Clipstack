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

  useEffect(() => {
    const errorParam = searchParams.get('error')

    if (errorParam) {
      queueMicrotask(() => setError(errorParam === 'auth_failed'
        ? 'Sign in failed. Please request a new magic link.'
        : decodeURIComponent(errorParam)))
      queueMicrotask(() => setChecking(false))
      return
    }

    if (!supabase) {
      queueMicrotask(() => setChecking(false))
      return
    }

    // The implicit flow puts #access_token in the URL hash.
    // supabase.auth.onAuthStateChange will detect it automatically.
    // Just check if we're already logged in.
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

  // Listen for auth state changes (handles implicit flow hash detection)
  useEffect(() => {
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: import("@supabase/supabase-js").Session | null) => {
        if (event === 'SIGNED_IN' && session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .maybeSingle()

          router.replace(profile?.full_name ? '/dashboard' : '/onboarding')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 p-4 dark:from-zinc-900 dark:to-zinc-800">
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 p-4 dark:from-zinc-900 dark:to-zinc-800">
      {error && (
        <div className="absolute top-4 mx-auto rounded bg-red-100 px-4 py-2 text-sm text-red-700">
          {error}
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
