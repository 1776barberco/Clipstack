'use client'

import { LoginForm } from '@/components/LoginForm'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if we have a hash fragment with access_token (magic link redirect)
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      if (supabase) {
        // Supabase client with detectSessionInUrl will automatically pick up the token
        // Just wait a moment for it to process, then check session
        const checkSession = async () => {
          // Give supabase a moment to process the hash
          await new Promise(resolve => setTimeout(resolve, 500))
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
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
            return
          }
          setChecking(false)
        }
        checkSession()
        return
      }
    }
    setChecking(false)
  }, [router])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm />
    </div>
  )
}
