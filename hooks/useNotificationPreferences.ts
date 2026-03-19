import { useEffect, useState, useCallback } from 'react'
import { supabase, DEMO_MODE } from '@/lib/supabase/client'

export type NotificationPreferences = {
  id: string
  user_id: string
  daily_tracking_reminder: boolean
  reminder_time: string
  timezone: string
  push_enabled: boolean
  push_subscription: unknown | null
  created_at: string
  updated_at: string
}

const DEFAULT_PREFS: Partial<NotificationPreferences> = {
  daily_tracking_reminder: false,
  reminder_time: '18:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
  push_enabled: false,
  push_subscription: null,
}

export function useNotificationPreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId || DEMO_MODE || !supabase) {
      setLoading(false)
      return
    }

    const fetchPrefs = async () => {
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (error) throw error
        setPreferences(data as NotificationPreferences | null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrefs()
  }, [userId])

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!userId || !supabase) return { error: new Error('Not initialized') }

    if (preferences) {
      // Update existing
      const { data, error } = await supabase
        .from('notification_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single()

      if (!error && data) {
        setPreferences(data as NotificationPreferences)
      }
      return { data, error }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          ...DEFAULT_PREFS,
          ...updates,
        })
        .select()
        .single()

      if (!error && data) {
        setPreferences(data as NotificationPreferences)
      }
      return { data, error }
    }
  }, [userId, preferences])

  return {
    preferences,
    loading,
    error,
    updatePreferences,
  }
}
