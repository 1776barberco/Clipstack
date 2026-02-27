'use client'

import { LoginForm } from '@/components/LoginForm'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const code = searchParams.get('code')
    
    // Handle PKCE flow: code in query params
    if (code && supabase) {
      const exchangeCode = async () => {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', data.session.user.id)
            .single()

          if (!profile?.full_name) {
            router.push('/onboarding')
          } else {
            router.push('/dashboard')
          }
          return
        }
        console.error('Code exchange error:', error)
        setChecking(false)
      }
      exchangeCode()
      return
    }

    // Handle implicit flow: access_token in hash fragment
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      if (supabase) {
        const checkSession = async () => {
          await new Promise(resolve => setTimeout(resolve, 500))
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            window.history.replaceState(null, '', window.location.pathname)
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
        }
        checkSession()
        return
      }
    }

    setChecking(false)
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
