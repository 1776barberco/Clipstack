import { createClient } from '@supabase/supabase-js'

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// Demo user for demo mode
export const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@clipstack.app',
  user_metadata: { full_name: 'Demo User' },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (DEMO_MODE) {
    // Return a mock client that does nothing in demo mode
    return null as any
  }

  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client during build time
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
