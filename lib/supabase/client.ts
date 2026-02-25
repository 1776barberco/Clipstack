import { createClient, User } from '@supabase/supabase-js'

// Check both env var and explicit false check
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || false

// Demo user for demo mode - satisfies User type
export const DEMO_USER: User = {
  id: 'demo-user-123',
  email: 'demo@clipstack.app',
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

  console.log('Supabase URL exists:', !!supabaseUrl)
  console.log('Supabase Anon Key exists:', !!supabaseAnonKey)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials')
    return null as any
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseInstance
}

export const supabase = getSupabaseClient()
