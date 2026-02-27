'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, DEMO_MODE, DEMO_USER } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import { signInWithOtp, signUpWithPassword, signInWithPasswordAction, signOutAction, resetPassword as resetPasswordAction } from '@/app/actions/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
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

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN') {
          if (session?.user) {
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
        } else if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  // Redirect unauthenticated users
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

    const result = await signInWithPasswordAction(email, password)
    if (result.error) {
      return { error: new Error(result.error) }
    }
    router.push('/dashboard')
    return { error: null }
  }

  const signInWithMagicLink = async (email: string) => {
    if (DEMO_MODE) {
      router.push('/dashboard')
      return { error: null }
    }

    const result = await signInWithOtp(email)
    if (result.error) {
      return { error: new Error(result.error) }
    }
    return { error: null }
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
