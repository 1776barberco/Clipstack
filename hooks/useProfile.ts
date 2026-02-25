import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  booth_rent_amount: number | null
  booth_rent_due_day: number | null
  tax_rate: number
  created_at: string
  updated_at: string
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId || !supabase) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error
        setProfile(data as Profile)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()

    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload: { new: unknown }) => {
          setProfile(payload.new as Profile)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId || !supabase) return { error: new Error('No user ID or supabase not initialized') }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (!error) setProfile(data as Profile)
    return { data: data as Profile, error }
  }

  return { profile, loading, error, updateProfile }
}
