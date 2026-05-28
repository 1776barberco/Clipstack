import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, DEMO_MODE, DEMO_USER } from '@/lib/supabase/client'

export type PlaidItem = {
  id: string
  user_id: string
  plaid_item_id: string
  institution_id: string | null
  institution_name: string | null
  status: string
  last_synced_at: string | null
  created_at: string
}

export type PlaidAccount = {
  id: string
  user_id: string
  plaid_item_id: string
  plaid_account_id: string
  name: string
  official_name: string | null
  type: string | null
  subtype: string | null
  mask: string | null
  current_balance: number | null
  available_balance: number | null
  iso_currency_code: string | null
  is_active: boolean
  updated_at: string
}

export type PlaidTransaction = {
  id: string
  user_id: string
  plaid_account_id: string
  plaid_transaction_id: string
  amount: number
  iso_currency_code: string | null
  date: string
  authorized_date: string | null
  name: string
  merchant_name: string | null
  primary_category: string | null
  detailed_category: string | null
  payment_channel: string | null
  pending: boolean
  transaction_type: 'income' | 'expense' | 'transfer'
  review_status: 'needs_review' | 'assigned' | 'ignored' | 'pending' | 'reviewed'
  matched_bucket_id: string | null
  income_entry_id?: string | null
  expense_id?: string | null
  assignment_note?: string | null
  assigned_at?: string | null
  created_at: string
  updated_at?: string
}

const effectiveUserId = (userId?: string) => (DEMO_MODE ? DEMO_USER.id : userId)

export function usePlaidConnections(userId?: string) {
  const [items, setItems] = useState<PlaidItem[]>([])
  const [accounts, setAccounts] = useState<PlaidAccount[]>([])
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uid = useMemo(() => effectiveUserId(userId), [userId])

  const load = useCallback(async () => {
    if (!uid) {
      setItems([])
      setAccounts([])
      setTransactions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const [itemsResult, accountsResult, transactionsResult] = await Promise.all([
      supabase
        .from('plaid_items')
        .select('id,user_id,plaid_item_id,institution_id,institution_name,status,last_synced_at,created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false }),
      supabase
        .from('plaid_accounts')
        .select('id,user_id,plaid_item_id,plaid_account_id,name,official_name,type,subtype,mask,current_balance,available_balance,iso_currency_code,is_active,updated_at')
        .eq('user_id', uid)
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('plaid_transactions')
        .select('id,user_id,plaid_account_id,plaid_transaction_id,amount,iso_currency_code,date,authorized_date,name,merchant_name,primary_category,detailed_category,payment_channel,pending,transaction_type,review_status,matched_bucket_id,income_entry_id,expense_id,assignment_note,assigned_at,created_at,updated_at')
        .eq('user_id', uid)
        .order('date', { ascending: false })
        .limit(25),
    ])

    if (itemsResult.error || accountsResult.error || transactionsResult.error) {
      const message = itemsResult.error?.message ?? accountsResult.error?.message ?? transactionsResult.error?.message ?? 'Failed to load Plaid data'
      setError(message)
    } else {
      setItems((itemsResult.data ?? []) as PlaidItem[])
      setAccounts((accountsResult.data ?? []) as PlaidAccount[])
      setTransactions((transactionsResult.data ?? []) as PlaidTransaction[])
    }

    setLoading(false)
  }, [uid])

  useEffect(() => {
    load()
  }, [load])

  const sync = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const response = await fetch('/api/plaid/sync', { method: 'POST' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? 'Plaid sync failed')
      await load()
      return payload
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Plaid sync failed'
      setError(message)
      throw err
    } finally {
      setSyncing(false)
    }
  }, [load])

  const disconnect = useCallback(async (itemId: string) => {
    setDisconnectingId(itemId)
    setError(null)
    try {
      const response = await fetch('/api/plaid/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? 'Failed to disconnect bank')
      await load()
      return payload
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect bank'
      setError(message)
      throw err
    } finally {
      setDisconnectingId(null)
    }
  }, [load])

  return { items, accounts, transactions, loading, syncing, disconnectingId, error, reload: load, sync, disconnect }
}

