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

interface CoachContext {
  weeklyIncome: { week_start: string; total_income: number; entry_count: number }[]
  weeklyExpenses: { week_start: string; total_expenses: number }[]
  buckets: { name: string; percentage: number; target_amount: number | null }[]
  bucketBalances: { bucket_name: string; current_balance: number }[]
  currentWeekIncome: number
  fourWeekAvgIncome: number
  userName: string
}

const COACH_API_URL = process.env.NEXT_PUBLIC_COACH_API_URL || '/api/coach/generate'

export function useCoach(userId: string | undefined) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!userId) return
    setGenerating(true)
    setError(null)

    try {
      // Gather context client-side using Supabase directly
      const twelveWeeksAgo = new Date()
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

      const [incomeRes, expenseRes, bucketsRes, balancesRes, profileRes] = await Promise.all([
        supabase.from('income_entries').select('amount, entry_date').eq('user_id', userId).gte('entry_date', twelveWeeksAgo.toISOString()),
        supabase.from('expenses').select('amount, entry_date').eq('user_id', userId).gte('entry_date', twelveWeeksAgo.toISOString()),
        supabase.from('bucket_configs').select('name, percentage, target_amount').eq('user_id', userId),
        supabase.from('bucket_balances').select('bucket_name, current_balance').eq('user_id', userId),
        supabase.from('profiles').select('full_name').eq('id', userId).single(),
      ])

      // Aggregate income by week
      const incomeByWeek: Record<string, { total: number; count: number }> = {}
      for (const entry of (incomeRes.data || [])) {
        const d = new Date(entry.entry_date)
        const ws = new Date(d); ws.setDate(ws.getDate() - ws.getDay())
        const key = ws.toISOString().split('T')[0]
        if (!incomeByWeek[key]) incomeByWeek[key] = { total: 0, count: 0 }
        incomeByWeek[key].total += Number(entry.amount)
        incomeByWeek[key].count++
      }
      const weeklyIncome = Object.entries(incomeByWeek)
        .map(([k, v]) => ({ week_start: k, total_income: v.total, entry_count: v.count }))
        .sort((a, b) => b.week_start.localeCompare(a.week_start))

      // Aggregate expenses by week
      const expenseByWeek: Record<string, number> = {}
      for (const entry of (expenseRes.data || [])) {
        const d = new Date(entry.entry_date)
        const ws = new Date(d); ws.setDate(ws.getDate() - ws.getDay())
        const key = ws.toISOString().split('T')[0]
        expenseByWeek[key] = (expenseByWeek[key] || 0) + Number(entry.amount)
      }
      const weeklyExpenses = Object.entries(expenseByWeek)
        .map(([k, v]) => ({ week_start: k, total_expenses: v }))
        .sort((a, b) => b.week_start.localeCompare(a.week_start))

      // Current week
      const now = new Date()
      const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0)
      const currentWeekIncome = (incomeRes.data || [])
        .filter((e: { entry_date: string; amount: number }) => new Date(e.entry_date) >= weekStart)
        .reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0)
      const recentWeeks = weeklyIncome.slice(0, 4)
      const fourWeekAvgIncome = recentWeeks.length > 0
        ? recentWeeks.reduce((s, w) => s + w.total_income, 0) / recentWeeks.length : 0

      const userName = profileRes.data?.full_name?.split(' ')[0] || 'there'
      const currentMonth = now.toLocaleString('en-US', { month: 'long' })
      const buckets = (bucketsRes.data || []) as CoachContext['buckets']
      const balances = (balancesRes.data || []) as CoachContext['bucketBalances']

      // Build prompt
      const prompt = `You are TipJars Coach, a personal finance advisor for barbers, stylists, and beauty professionals. User's name: ${userName}.

PERSONALITY: Mix of casual/motivational and straight numbers. Use emojis sparingly. Be encouraging but honest.

JAR SETUP:
${buckets.map(b => b.target_amount && b.target_amount > 0 ? `- ${b.name}: $${b.target_amount} fixed` : `- ${b.name}: ${b.percentage}%`).join('\n')}

JAR BALANCES:
${balances.map(b => `- ${b.bucket_name}: $${b.current_balance.toFixed(2)}`).join('\n')}

INCOME (last 12 weeks):
${weeklyIncome.length > 0 ? weeklyIncome.map(w => `- Week of ${w.week_start}: $${w.total_income.toFixed(2)} (${w.entry_count} entries)`).join('\n') : 'No income data yet.'}

EXPENSES (last 12 weeks):
${weeklyExpenses.length > 0 ? weeklyExpenses.map(w => `- Week of ${w.week_start}: $${w.total_expenses.toFixed(2)}`).join('\n') : 'No expense data yet.'}

THIS WEEK: $${currentWeekIncome.toFixed(2)} | 4-WEEK AVG: $${fourWeekAvgIncome.toFixed(2)}/week | MONTH: ${currentMonth}

SEASONAL CONTEXT: Busy season Aug-Dec (peak Nov-Dec). Slow season Jan-Mar/early Apr. Current: ${currentMonth}.

Generate coaching insights as JSON with keys: weekly_recap (title, body), jar_recommendation (title, body, suggested_changes array), seasonal_forecast (title, body), money_tip (title, body). Return ONLY valid JSON.`

      // Call AI API via server route (passes prompt directly)
      const res = await fetch('/api/coach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt, userId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to generate insights')
        return
      }

      const result = await res.json()
      
      // Store insights client-side
      if (result.insights) {
        const insightsToStore = [
          { type: 'weekly_recap', ...(result.insights.weekly_recap || {}) },
          { type: 'jar_recommendation', ...(result.insights.jar_recommendation || {}), data: { suggested_changes: result.insights.jar_recommendation?.suggested_changes } },
          { type: 'seasonal_forecast', ...(result.insights.seasonal_forecast || {}) },
          { type: 'money_tip', ...(result.insights.money_tip || {}) },
        ].filter(i => i.title && i.body)

        for (const insight of insightsToStore) {
          await supabase.from('coaching_insights' as any).insert({
            user_id: userId,
            insight_type: insight.type,
            title: insight.title,
            body: insight.body,
            data: insight.data || {},
          })
        }
        await fetchInsights()
      }
    } catch (err) {
      console.error('Coach error:', err)
      setError('Something went wrong generating insights')
    } finally {
      setGenerating(false)
    }
  }, [userId, fetchInsights])

  const markRead = useCallback(async (insightId: string) => {
    await supabase
      .from('coaching_insights' as any)
      .update({ read: true })
      .eq('id', insightId)
    setInsights(prev => prev.map(i => i.id === insightId ? { ...i, read: true } : i))
  }, [])

  const unreadCount = insights.filter(i => !i.read).length

  return {
    insights,
    loading,
    generating,
    error,
    generateInsights,
    markRead,
    unreadCount,
    refetch: fetchInsights,
  }
}
