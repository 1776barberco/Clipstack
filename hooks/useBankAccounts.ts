import { useEffect, useState, useCallback } from 'react'
import { supabase, DEMO_MODE, DEMO_USER } from '@/lib/supabase/client'

export type BankAccount = {
  id: string
  user_id: string
  name: string
  type: 'checking' | 'savings' | 'cash' | 'cashapp' | 'venmo' | 'other'
  starting_balance: number
  current_balance: number
  is_primary: boolean
  created_at: string
  updated_at: string
}

const DEMO_ACCOUNTS: BankAccount[] = [
  {
    id: 'acct-1',
    user_id: DEMO_USER.id,
    name: 'Primary Checking',
    type: 'checking',
    starting_balance: 2500,
    current_balance: 2500,
    is_primary: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function useBankAccounts(userId: string | undefined) {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAccounts = useCallback(async () => {
    if (!userId) return

    if (DEMO_MODE) {
      setAccounts(DEMO_ACCOUNTS)
      setLoading(false)
      return
    }

    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      setAccounts((data as BankAccount[]) || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    fetchAccounts()

    if (DEMO_MODE || !supabase) return

    const subscription = supabase
      .channel(`bank_accounts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_accounts',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchAccounts()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, fetchAccounts])

  const createAccount = async (account: {
    name: string
    type: string
    starting_balance: number
    is_primary?: boolean
  }) => {
    if (!userId) return { data: null, error: new Error('No user ID') }

    if (DEMO_MODE) {
      const newAccount: BankAccount = {
        id: `acct-${Date.now()}`,
        user_id: userId,
        name: account.name,
        type: account.type as BankAccount['type'],
        starting_balance: account.starting_balance,
        current_balance: account.starting_balance,
        is_primary: account.is_primary ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setAccounts(prev => [...prev, newAccount])
      return { data: newAccount, error: null }
    }

    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }

    // If this is going to be primary, unset other primaries first
    if (account.is_primary) {
      await supabase
        .from('bank_accounts')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .eq('is_primary', true)
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        user_id: userId,
        name: account.name,
        type: account.type,
        starting_balance: account.starting_balance,
        current_balance: account.starting_balance,
        is_primary: account.is_primary ?? (accounts.length === 0),
      })
      .select()
      .single()

    if (data && !error) {
      setAccounts(prev => [...prev, data as BankAccount])
    }

    return { data: data as BankAccount, error }
  }

  const updateAccount = async (id: string, updates: Partial<Pick<BankAccount, 'name' | 'type' | 'starting_balance' | 'is_primary'>>) => {
    if (!userId) return { data: null, error: new Error('No user ID') }

    if (DEMO_MODE) {
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a))
      return { data: null, error: null }
    }

    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }

    // If setting as primary, unset other primaries first
    if (updates.is_primary) {
      await supabase
        .from('bank_accounts')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .eq('is_primary', true)
    }

    // If starting_balance changed, also update current_balance by the delta
    const existingAccount = accounts.find(a => a.id === id)
    const dbUpdates: Record<string, unknown> = { ...updates }
    if (updates.starting_balance !== undefined && existingAccount) {
      const delta = updates.starting_balance - existingAccount.starting_balance
      dbUpdates.current_balance = existingAccount.current_balance + delta
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (data && !error) {
      setAccounts(prev => prev.map(a => a.id === id ? (data as BankAccount) : a))
    }

    return { data: data as BankAccount, error }
  }

  const deleteAccount = async (id: string) => {
    if (!userId) return { error: new Error('No user ID') }

    if (DEMO_MODE) {
      setAccounts(prev => prev.filter(a => a.id !== id))
      return { error: null }
    }

    if (!supabase) return { error: new Error('Supabase not initialized') }

    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (!error) {
      setAccounts(prev => prev.filter(a => a.id !== id))
    }

    return { error }
  }

  const getTotalBalance = () => {
    return accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0)
  }

  const getTotalStartingBalance = () => {
    return accounts.reduce((sum, a) => sum + Number(a.starting_balance || 0), 0)
  }

  return {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    getTotalBalance,
    getTotalStartingBalance,
    refetch: fetchAccounts,
  }
}
