import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'

// Demo mode disabled - use real Supabase auth
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// Demo user for demo mode - satisfies User type
export const DEMO_USER: User = {
  id: 'demo-user-123',
  email: 'demo@tipjars.app',
  user_metadata: { full_name: 'Demo User' },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  aud: 'authenticated',
} as User

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (DEMO_MODE) {
    return null as unknown as ReturnType<typeof createBrowserClient>
  }

  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.error('Missing Supabase credentials')
    }
    return null as unknown as ReturnType<typeof createBrowserClient>
  }

  // Use createBrowserClient from @supabase/ssr — stores auth in cookies
  // so middleware and server actions can read the session
  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return supabaseInstance
}

export const supabase = getSupabaseClient()
