'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, DEMO_MODE, DEMO_USER } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format, addDays, differenceInDays, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns'

/**
 * Parse a date-only string (YYYY-MM-DD) as local midnight instead of UTC.
 * new Date('2026-03-21') → UTC midnight → shows as Mar 20 in US timezones.
 * This helper appends T00:00:00 to force local timezone interpretation.
 */
export function parseLocalDate(dateStr: string): Date {
  // If already has time component, parse as-is
  if (dateStr.includes('T')) return new Date(dateStr)
  return new Date(dateStr + 'T00:00:00')
}

export type BillCategory = 'zip' | 'klarna' | 'credit_card' | 'personal' | 'other'

export type UpcomingBill = {
  id: string
  user_id: string
  name: string
  amount: number
  due_date: string
  category: BillCategory
  status: 'pending' | 'paid' | 'skipped'
  is_recurring: boolean
  recurring_interval: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | null
  linked_expense_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Demo bills
const DEMO_BILLS: UpcomingBill[] = [
  {
    id: 'bill-1',
    user_id: DEMO_USER.id,
    name: 'Zip - Hair Tools Order',
    amount: 47.50,
    due_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    category: 'zip',
    status: 'pending',
    is_recurring: false,
    recurring_interval: null,
    linked_expense_id: null,
    notes: '4th installment of 4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bill-2',
    user_id: DEMO_USER.id,
    name: 'Chase Sapphire',
    amount: 285.00,
    due_date: format(addDays(new Date(), 8), 'yyyy-MM-dd'),
    category: 'credit_card',
    status: 'pending',
    is_recurring: true,
    recurring_interval: 'monthly',
    linked_expense_id: null,
    notes: 'Minimum payment',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bill-3',
    user_id: DEMO_USER.id,
    name: 'Klarna - Andis Clippers',
    amount: 32.00,
    due_date: format(addDays(new Date(), 12), 'yyyy-MM-dd'),
    category: 'klarna',
    status: 'pending',
    is_recurring: false,
    recurring_interval: null,
    linked_expense_id: null,
    notes: '2nd of 4 payments',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bill-4',
    user_id: DEMO_USER.id,
    name: 'Car Insurance',
    amount: 165.00,
    due_date: format(addDays(new Date(), 20), 'yyyy-MM-dd'),
    category: 'personal',
    status: 'pending',
    is_recurring: true,
    recurring_interval: 'monthly',
    linked_expense_id: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const CATEGORY_COLORS: Record<BillCategory, string> = {
  zip: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  klarna: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  credit_card: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  personal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  other: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

const CATEGORY_LABELS: Record<BillCategory, string> = {
  zip: 'Zip',
  klarna: 'Klarna',
  credit_card: 'Credit Card',
  personal: 'Personal',
  other: 'Other',
}

export const billCategoryMeta = { CATEGORY_COLORS, CATEGORY_LABELS }

export function useUpcomingBills(userId: string | undefined) {
  const [bills, setBills] = useState<UpcomingBill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBills = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    if (DEMO_MODE) {
      setBills(DEMO_BILLS)
      setLoading(false)
      return
    }

    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('upcoming_bills')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true })

      if (error) throw error
      setBills((data as UpcomingBill[]) || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchBills()

    if (!supabase || !userId || DEMO_MODE) return

    const subscription = supabase
      .channel(`upcoming_bills:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'upcoming_bills',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchBills()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, fetchBills])

  const addBill = async (bill: Omit<UpcomingBill, 'id' | 'created_at' | 'updated_at' | 'status' | 'linked_expense_id'>) => {
    if (DEMO_MODE) {
      const newBill: UpcomingBill = {
        ...bill,
        id: `bill-${Date.now()}`,
        status: 'pending',
        linked_expense_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setBills(prev => [...prev, newBill].sort((a, b) => a.due_date.localeCompare(b.due_date)))
      return { data: newBill, error: null }
    }

    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }

    const { data, error } = await supabase
      .from('upcoming_bills')
      .insert({ ...bill, status: 'pending' })
      .select()
      .single()

    if (!error && data) {
      setBills(prev => [...prev, data as UpcomingBill].sort((a, b) => a.due_date.localeCompare(b.due_date)))
    }

    return { data: data as UpcomingBill, error }
  }

  const markAsPaid = async (billId: string, bucketId?: string, description?: string) => {
    if (DEMO_MODE) {
      setBills(prev =>
        prev.map(b =>
          b.id === billId
            ? { ...b, status: 'paid' as const, linked_expense_id: `expense-${Date.now()}`, updated_at: new Date().toISOString() }
            : b
        )
      )
      toast.success('Bill logged as expense!')
      return { error: null }
    }

    if (!supabase) return { error: new Error('Supabase not initialized') }

    const { data, error } = await supabase.rpc('mark_bill_paid', {
      bill_id: billId,
      bill_user_id: userId,
      expense_bucket_id: bucketId || null,
      expense_description: description || null,
    })

    if (error) {
      toast.error('Failed to mark bill as paid')
      return { error }
    }

    setBills(prev =>
      prev.map(b =>
        b.id === billId
          ? { ...b, status: 'paid' as const, linked_expense_id: (data as { expense_id?: string })?.expense_id || null, updated_at: new Date().toISOString() }
          : b
      )
    )
    toast.success('Bill logged as expense!')
    return { data, error: null }
  }

  const skipBill = async (billId: string) => {
    if (DEMO_MODE) {
      setBills(prev =>
        prev.map(b =>
          b.id === billId
            ? { ...b, status: 'skipped' as const, updated_at: new Date().toISOString() }
            : b
        )
      )
      toast.success('Bill skipped')
      return { error: null }
    }

    if (!supabase) return { error: new Error('Supabase not initialized') }

    const { error } = await supabase.rpc('skip_bill', {
      bill_id: billId,
      bill_user_id: userId,
    })

    if (error) {
      toast.error('Failed to skip bill')
      return { error }
    }

    setBills(prev =>
      prev.map(b =>
        b.id === billId
          ? { ...b, status: 'skipped' as const, updated_at: new Date().toISOString() }
          : b
      )
    )
    toast.success('Bill skipped')
    return { error: null }
  }

  const deleteBill = async (billId: string) => {
    if (DEMO_MODE) {
      setBills(prev => prev.filter(b => b.id !== billId))
      toast.success('Bill deleted')
      return { error: null }
    }

    if (!supabase) return { error: new Error('Supabase not initialized') }

    const { error } = await supabase
      .from('upcoming_bills')
      .delete()
      .eq('id', billId)

    if (error) {
      toast.error('Failed to delete bill')
      return { error }
    }

    setBills(prev => prev.filter(b => b.id !== billId))
    toast.success('Bill deleted')
    return { error: null }
  }

  // Filtered views
  const pendingBills = bills.filter(b => b.status === 'pending')
  const paidBills = bills.filter(b => b.status === 'paid')

  const getDueSoon = (days = 3) => {
    const now = new Date()
    return pendingBills.filter(b => {
      const due = parseLocalDate(b.due_date)
      const diff = differenceInDays(due, now)
      return diff >= 0 && diff <= days
    })
  }

  const getOverdue = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return pendingBills.filter(b => b.due_date < today)
  }

  const getBillsForMonth = (date: Date) => {
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    return bills.filter(b => {
      const due = parseLocalDate(b.due_date)
      return isWithinInterval(due, { start, end })
    })
  }

  const getMonthTotal = (date: Date) => {
    return getBillsForMonth(date)
      .filter(b => b.status === 'pending')
      .reduce((sum, b) => sum + Number(b.amount), 0)
  }

  const upcoming7DayTotal = getDueSoon(7).reduce((sum, b) => sum + Number(b.amount), 0)

  return {
    bills,
    pendingBills,
    paidBills,
    loading,
    error,
    addBill,
    markAsPaid,
    skipBill,
    deleteBill,
    getDueSoon,
    getOverdue,
    getBillsForMonth,
    getMonthTotal,
    upcoming7DayTotal,
  }
}
