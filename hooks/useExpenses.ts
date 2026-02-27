import { useEffect, useState } from 'react'
import { supabase, DEMO_MODE, DEMO_USER } from '@/lib/supabase/client'
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

// Sample demo expenses
const DEMO_EXPENSES: Expense[] = [
  {
    id: 'expense-1',
    user_id: DEMO_USER.id,
    bucket_id: 'bucket-4',
    amount: 45.50,
    description: 'Grocery shopping',
    category: 'Food',
    entry_date: format(new Date(), 'yyyy-MM-dd'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    bucket_name: 'Spending',
  },
  {
    id: 'expense-2',
    user_id: DEMO_USER.id,
    bucket_id: 'bucket-4',
    amount: 120.00,
    description: 'Office supplies',
    category: 'Business',
    entry_date: format(new Date(), 'yyyy-MM-dd'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    bucket_name: 'Spending',
  },
  {
    id: 'expense-3',
    user_id: DEMO_USER.id,
    bucket_id: 'bucket-4',
    amount: 85.00,
    description: 'Team lunch',
    category: 'Food',
    entry_date: format(subWeeks(new Date(), 1), 'yyyy-MM-dd'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    bucket_name: 'Spending',
  },
]

export function useExpenses(userId: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [weeklyExpenses, setWeeklyExpenses] = useState<WeeklyExpenses[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Calculate weekly expenses helper function
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

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // DEMO MODE: Use sample data
    if (DEMO_MODE) {
      setExpenses(DEMO_EXPENSES)
      calculateWeeklyExpenses(DEMO_EXPENSES)
      setLoading(false)
      return
    }

    if (!supabase) {
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
          bucket_name: expense.bucket_configs?.name || 'Unknown Jar'
        }))
        
        setExpenses(formattedData)
        calculateWeeklyExpenses(formattedData)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
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
    if (DEMO_MODE) {
      const newExpense: Expense = {
        ...expense,
        id: `expense-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const updatedExpenses = [newExpense, ...expenses]
      setExpenses(updatedExpenses)
      calculateWeeklyExpenses(updatedExpenses)
      return { data: newExpense, error: null }
    }

    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }

    // Ensure profile exists to satisfy FK constraint
    await supabase
      .from('profiles')
      .upsert(
        { id: expense.user_id, email: '' },
        { onConflict: 'id', ignoreDuplicates: true }
      )

    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()

    return { data: data as Expense, error }
  }

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (DEMO_MODE) {
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e))
      return { data: expenses.find(e => e.id === id) || null, error: null }
    }

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
    if (DEMO_MODE) {
      const updatedExpenses = expenses.filter(e => e.id !== id)
      setExpenses(updatedExpenses)
      calculateWeeklyExpenses(updatedExpenses)
      return { error: null }
    }

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