'use client'

import { LoginForm } from '@/components/LoginForm'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')
    
    if (errorParam) {
      setError(errorParam)
      setChecking(false)
      return
    }

    if (!supabase) {
      setChecking(false)
      return
    }

    // If there's a code param or hash fragment, Supabase's detectSessionInUrl
    // will auto-exchange it. We just listen for the auth state change.
    if (code || (typeof window !== 'undefined' && window.location.hash.includes('access_token'))) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()
          // Check if user needs onboarding
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single()

          if (!profile?.full_name) {
            router.push('/onboarding')
          } else {
            router.push('/dashboard')
          }
        }
      })

      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        subscription.unsubscribe()
        setError('Authentication timed out. Please try again.')
        setChecking(false)
      }, 10000)

      return () => {
        subscription.unsubscribe()
        clearTimeout(timeout)
      }
    }

    // No auth params, check if already logged in
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single()

        if (!profile?.full_name) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
        return
      }
      setChecking(false)
    })
  }, [router, searchParams])

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
