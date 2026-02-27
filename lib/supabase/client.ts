import { createClient, User } from '@supabase/supabase-js'

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

let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (DEMO_MODE) {
    console.log('DEMO_MODE is active, returning null client')
    return null as any
  }

  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials')
    return null as any
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })

  return supabaseInstance
}

export const supabase = getSupabaseClient()
