'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, DEMO_MODE, DEMO_USER } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import {
  signInWithOtp,
  signUpWithPassword,
  signOutAction,
  resetPassword as resetPasswordAction,
  getServerUser,
  checkOnboardingStatus,
  ensureProfileExists,
} from '@/app/actions/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_SESSION: Session = {
  access_token: 'demo-token',
  refresh_token: 'demo-refresh',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: DEMO_USER,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (DEMO_MODE) {
      setUser(DEMO_USER as User)
      setSession(DEMO_SESSION)
      setLoading(false)
      return
    }

    if (!supabase) {
      setLoading(false)
      return
    }

    const handleOnboardingCheck = async () => {
      const publicPaths = ['/login', '/api/auth', '/onboarding', '/reset-password']
      if (publicPaths.some((p) => window.location.pathname.startsWith(p))) return

      const status = await checkOnboardingStatus()
      if (status.authenticated && status.needsOnboarding) {
        router.push('/onboarding')
      }
    }

    const initSession = async () => {
      // Validate the user server-side first
      const serverResult = await getServerUser()

      if (serverResult.user) {
        // Server validated the user — get client session for tokens
        const { data: { session: browserSession } } = await supabase.auth.getSession()
        if (browserSession) {
          setSession(browserSession)
          setUser(browserSession.user)
          setLoading(false)
          await handleOnboardingCheck()
        } else {
          // Browser has no session (e.g. localStorage cleared) — treat as unauthenticated
          setLoading(false)
        }
        return
      }

      setLoading(false)
    }
    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, newSession: Session | null) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN') {
          if (newSession?.user && !window.location.pathname.startsWith('/reset-password')) {
            await ensureProfileExists()

            const status = await checkOnboardingStatus()
            if (status.needsOnboarding) {
              router.push('/onboarding')
            } else {
              router.push('/dashboard')
            }
          }
        } else if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    if (!loading && !user) {
      const publicPaths = ['/login', '/api/auth']
      if (!publicPaths.some((path) => pathname?.startsWith(path))) {
        router.push('/login')
      }
    }
  }, [user, loading, pathname, router])

  const signUp = async (email: string, password: string) => {
    if (DEMO_MODE) {
      router.push('/dashboard')
      return { error: null }
    }

    const result = await signUpWithPassword(email, password)
    if (result.error) {
      return { error: new Error(result.error) }
    }
    return { error: null }
  }

  const signInWithPassword = async (email: string, password: string) => {
    if (DEMO_MODE) {
      router.push('/dashboard')
      return { error: null }
    }

    if (!supabase) return { error: new Error('Supabase not initialized') }

    const { data, error: clientError } = await supabase.auth.signInWithPassword({ email, password })
    if (clientError) {
      return { error: clientError }
    }

    if (data.session) {
      setSession(data.session)
      setUser(data.session.user)
    }

    // Check onboarding status before deciding where to redirect
    await ensureProfileExists()
    const status = await checkOnboardingStatus()
    if (status.needsOnboarding) {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }

    return { error: null }
  }

  const signInWithMagicLink = async (email: string) => {
    if (DEMO_MODE) {
      router.push('/dashboard')
      return { error: null }
    }

    if (!supabase) return { error: new Error('Supabase not initialized') }
    const origin = window.location.origin
    // Redirect to /login — implicit flow adds #access_token to the URL hash
    // which supabase.auth.onAuthStateChange detects automatically
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/login` },
    })
    return { error: error ?? null }
  }

  const signInWithGoogle = async () => {
    if (DEMO_MODE) {
      router.push('/dashboard')
      return { error: null }
    }

    if (!supabase) return { error: new Error('Supabase not initialized') }
    const origin = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/api/auth/callback`,
      },
    })
    return { error: error ?? null }
  }

  const resetPassword = async (email: string) => {
    if (DEMO_MODE) {
      return { error: null }
    }

    const result = await resetPasswordAction(email)
    if (result.error) {
      return { error: new Error(result.error) }
    }
    return { error: null }
  }

  const signOut = async () => {
    if (DEMO_MODE) {
      setUser(null)
      setSession(null)
      router.push('/login')
      return { error: null }
    }

    if (supabase) {
      await supabase.auth.signOut()
    }
    const result = await signOutAction()
    if (result.error) {
      return { error: new Error(result.error) }
    }
    setUser(null)
    setSession(null)
    router.push('/login')
    return { error: null }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signInWithPassword,
        signInWithMagicLink,
        signInWithGoogle,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
