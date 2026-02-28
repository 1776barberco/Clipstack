import { useEffect, useState } from 'react'
import { supabase, DEMO_MODE, DEMO_USER } from '@/lib/supabase/client'
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

// Sample demo income entries
const DEMO_INCOME: IncomeEntry[] = [
  {
    id: 'income-1',
    user_id: DEMO_USER.id,
    amount: 3500,
    source: 'Client Project',
    notes: 'Website redesign',
    entry_date: format(new Date(), 'yyyy-MM-dd'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'income-2',
    user_id: DEMO_USER.id,
    amount: 2800,
    source: 'Consulting',
    notes: 'Monthly retainer',
    entry_date: format(subWeeks(new Date(), 1), 'yyyy-MM-dd'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'income-3',
    user_id: DEMO_USER.id,
    amount: 4200,
    source: 'Freelance Work',
    notes: 'Mobile app development',
    entry_date: format(subWeeks(new Date(), 1), 'yyyy-MM-dd'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function useIncome(userId: string | undefined) {
  const [entries, setEntries] = useState<IncomeEntry[]>([])
  const [weeklyIncome, setWeeklyIncome] = useState<WeeklyIncome[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Calculate weekly income helper function
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

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // DEMO MODE: Use sample data
    if (DEMO_MODE) {
      setEntries(DEMO_INCOME)
      calculateWeeklyIncome(DEMO_INCOME)
      setLoading(false)
      return
    }

    if (!supabase) {
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
        calculateWeeklyIncome((data as IncomeEntry[]) || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
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
    if (DEMO_MODE) {
      const newIncome: IncomeEntry = {
        ...income,
        id: `income-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const updatedEntries = [newIncome, ...entries]
      setEntries(updatedEntries)
      calculateWeeklyIncome(updatedEntries)
      return { data: newIncome, error: null }
    }

    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }

    const { data, error } = await supabase
      .from('income_entries')
      .insert(income)
      .select()
      .single()

    return { data: data as IncomeEntry, error }
  }

  const updateIncome = async (id: string, updates: Partial<IncomeEntry>) => {
    if (DEMO_MODE) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e))
      return { data: entries.find(e => e.id === id) || null, error: null }
    }

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
    if (DEMO_MODE) {
      const updatedEntries = entries.filter(e => e.id !== id)
      setEntries(updatedEntries)
      calculateWeeklyIncome(updatedEntries)
      return { error: null }
    }

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