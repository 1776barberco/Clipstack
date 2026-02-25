import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns'

type IncomeEntry = {
  id: string
  user_id: string
  amount: number
  source: string | null
  notes: string | null
  entry_date: string
  created_at: string
  updated_at: string
}

interface WeeklyIncome {
  weekStart: string
  weekEnd: string
  total: number
}

export function useIncome(userId: string | undefined) {
  const [entries, setEntries] = useState<IncomeEntry[]>([])
  const [weeklyIncome, setWeeklyIncome] = useState<WeeklyIncome[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId || !supabase) {
      setLoading(false)
      return
    }

    const fetchIncome = async () => {
      try {
        const { data, error } = await supabase
          .from('income_entries')
          .select('*')
          .eq('user_id', userId)
          .order('entry_date', { ascending: false })
          .limit(100)

        if (error) throw error
        setEntries((data as IncomeEntry[]) || [])

        // Calculate weekly income
        calculateWeeklyIncome((data as IncomeEntry[]) || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    const calculateWeeklyIncome = (incomeData: IncomeEntry[]) => {
      const weeklyMap = new Map<string, number>()

      incomeData.forEach((entry) => {
        const date = new Date(entry.entry_date)
        const weekStart = startOfWeek(date, { weekStartsOn: 1 })
        const weekKey = format(weekStart, 'yyyy-MM-dd')

        weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + Number(entry.amount))
      })

      const weekly: WeeklyIncome[] = []
      for (let i = 0; i < 8; i++) {
        const weekStart = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), i)
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
        const weekKey = format(weekStart, 'yyyy-MM-dd')

        weekly.push({
          weekStart: weekKey,
          weekEnd: format(weekEnd, 'yyyy-MM-dd'),
          total: weeklyMap.get(weekKey) || 0,
        })
      }

      setWeeklyIncome(weekly.reverse())
    }

    fetchIncome()

    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`income_entries:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'income_entries',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchIncome()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const addIncome = async (income: Omit<IncomeEntry, 'id' | 'created_at' | 'updated_at'>) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase
      .from('income_entries')
      .insert(income)
      .select()
      .single()

    return { data: data as IncomeEntry, error }
  }

  const updateIncome = async (id: string, updates: Partial<IncomeEntry>) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase
      .from('income_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data: data as IncomeEntry, error }
  }

  const deleteIncome = async (id: string) => {
    if (!supabase) return { error: new Error('Supabase not initialized') }
    const { error } = await supabase
      .from('income_entries')
      .delete()
      .eq('id', id)

    return { error }
  }

  const getTodayIncome = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return entries
      .filter((e) => e.entry_date === today)
      .reduce((sum, e) => sum + Number(e.amount), 0)
  }

  const getWeekIncome = () => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    return entries
      .filter((e) => e.entry_date >= weekStart)
      .reduce((sum, e) => sum + Number(e.amount), 0)
  }

  return {
    entries,
    weeklyIncome,
    loading,
    error,
    addIncome,
    updateIncome,
    deleteIncome,
    getTodayIncome,
    getWeekIncome,
  }
}
