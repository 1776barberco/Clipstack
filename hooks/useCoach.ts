'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Insight {
  id: string
  insight_type: string
  title: string
  body: string
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

export function useCoach(userId: string | undefined) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const fetchInsights = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('coaching_insights' as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setInsights((data || []) as Insight[])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const generateInsights = useCallback(async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/coach/generate', { method: 'POST', credentials: 'include' })
      if (res.ok) {
        await fetchInsights()
      } else {
        const data = await res.json().catch(() => ({}))
        console.error('Coach generate failed:', res.status, data)
      }
    } finally {
      setGenerating(false)
    }
  }, [fetchInsights])

  const markRead = useCallback(async (insightId: string) => {
    await supabase
      .from('coaching_insights' as any)
      .update({ read: true })
      .eq('id', insightId)
    setInsights(prev => prev.map(i => i.id === insightId ? { ...i, read: true } : i))
  }, [])

  const unreadCount = insights.filter(i => !i.read).length
  const latestByType = (type: string) => insights.find(i => i.insight_type === type)

  return {
    insights,
    loading,
    generating,
    generateInsights,
    markRead,
    unreadCount,
    latestByType,
    refetch: fetchInsights,
  }
}
