'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'

interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  trial_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubscription = useCallback(async () => {
    if (!userId || !supabase) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    setSubscription(data as Subscription | null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const isSubscribed = subscription?.status === 'active' || subscription?.status === 'trialing'
  const isTrialing = subscription?.status === 'trialing'
  const isPastDue = subscription?.status === 'past_due'
  const trialDaysLeft = subscription?.trial_end
    ? Math.max(0, Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return {
    subscription,
    loading,
    isSubscribed,
    isTrialing,
    isPastDue,
    trialDaysLeft,
    refetch: fetchSubscription,
  }
}
