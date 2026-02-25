import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns'

type Expense = {
  id: string
  user_id: string
  bucket_id: string
  amount: number
  description: string | null
  category: string | null
  entry_date: string
  created_at: string
  updated_at: string
  bucket_name?: string
}

interface WeeklyExpenses {
  weekStart: string
  weekEnd: string
  total: number
}

export function useExpenses(userId: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [weeklyExpenses, setWeeklyExpenses] = useState<WeeklyExpenses[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId || !supabase) {
      setLoading(false)
      return
    }

    const fetchExpenses = async () => {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select(`
            *,
            bucket_configs(name)
          `)
          .eq('user_id', userId)
          .order('entry_date', { ascending: false })
          .limit(100)

        if (error) throw error
        
        const formattedData = (data || []).map((expense: any) => ({
          ...expense,
          bucket_name: expense.bucket_configs?.name || 'Unknown Bucket'
        }))
        
        setExpenses(formattedData)
        calculateWeeklyExpenses(formattedData)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    const calculateWeeklyExpenses = (expenseData: Expense[]) => {
      const weeklyMap = new Map<string, number>()

      expenseData.forEach((expense) => {
        const date = new Date(expense.entry_date)
        const weekStart = startOfWeek(date, { weekStartsOn: 1 })
        const weekKey = format(weekStart, 'yyyy-MM-dd')

        weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + Number(expense.amount))
      })

      const weekly: WeeklyExpenses[] = []
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

      setWeeklyExpenses(weekly.reverse())
    }

    fetchExpenses()

    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`expenses:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchExpenses()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()

    return { data: data as Expense, error }
  }

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data: data as Expense, error }
  }

  const deleteExpense = async (id: string) => {
    if (!supabase) return { error: new Error('Supabase not initialized') }
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    return { error }
  }

  const getTodayExpenses = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return expenses
      .filter((e) => e.entry_date === today)
      .reduce((sum, e) => sum + Number(e.amount), 0)
  }

  const getWeekExpenses = () => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    return expenses
      .filter((e) => e.entry_date >= weekStart)
      .reduce((sum, e) => sum + Number(e.amount), 0)
  }

  const getExpensesByBucket = (bucketId: string) => {
    return expenses
      .filter((e) => e.bucket_id === bucketId)
      .reduce((sum, e) => sum + Number(e.amount), 0)
  }

  return {
    expenses,
    weeklyExpenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    getTodayExpenses,
    getWeekExpenses,
    getExpensesByBucket,
  }
}
