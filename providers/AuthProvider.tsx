'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, DEMO_MODE, DEMO_USER } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
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

    // Check for hash fragment tokens (implicit flow from magic link)
    // This handles the case where Supabase redirects with #access_token=...
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      // The supabase client with detectSessionInUrl will handle this automatically
      // Just need to make sure we wait for it
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession(session)
          setUser(session.user)
          setLoading(false)
          // Clean the URL
          window.history.replaceState(null, '', window.location.pathname)
        }
      })
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

  const signInWithMagicLink = async (email: string) => {
    if (DEMO_MODE) {
      router.push('/dashboard')
      return { error: null }
    }

    if (!supabase) return { error: new Error('Supabase not initialized') }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Redirect back to login page - the AuthProvider will detect the
        // hash fragment token and handle the session automatically
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    if (DEMO_MODE) {
      setUser(null)
      setSession(null)
      router.push('/login')
      return { error: null }
    }

    if (!supabase) return { error: new Error('Supabase not initialized') }
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithMagicLink,
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
