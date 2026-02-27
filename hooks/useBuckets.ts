import { useEffect, useState } from 'react'
import { supabase, DEMO_MODE, DEMO_USER } from '@/lib/supabase/client'

type BucketConfig = {
  id: string
  user_id: string
  name: string
  percentage: number
  target_amount: number | null
  is_tax_bucket: boolean
  priority: number
  color: string
  created_at: string
  updated_at: string
}

type BucketBalance = {
  bucket_id: string
  user_id: string
  bucket_name: string
  color: string
  percentage: number
  total_deposits: number
  total_withdrawals: number
  total_expenses: number
  current_balance: number
}

// Sample demo buckets
const DEMO_BUCKETS: BucketConfig[] = [
  {
    id: 'bucket-1',
    user_id: DEMO_USER.id,
    name: 'Tax Reserve',
    percentage: 25,
    target_amount: 10000,
    is_tax_bucket: true,
    priority: 100,
    color: '#ef4444',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bucket-2',
    user_id: DEMO_USER.id,
    name: 'Savings',
    percentage: 30,
    target_amount: 50000,
    is_tax_bucket: false,
    priority: 90,
    color: '#22c55e',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bucket-3',
    user_id: DEMO_USER.id,
    name: 'Investments',
    percentage: 20,
    target_amount: 25000,
    is_tax_bucket: false,
    priority: 80,
    color: '#3b82f6',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bucket-4',
    user_id: DEMO_USER.id,
    name: 'Spending',
    percentage: 25,
    target_amount: null,
    is_tax_bucket: false,
    priority: 70,
    color: '#a855f7',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Sample demo balances
const DEMO_BALANCES: BucketBalance[] = [
  {
    bucket_id: 'bucket-1',
    user_id: DEMO_USER.id,
    bucket_name: 'Tax Reserve',
    color: '#ef4444',
    percentage: 25,
    total_deposits: 5000,
    total_withdrawals: 0,
    total_expenses: 0,
    current_balance: 5000,
  },
  {
    bucket_id: 'bucket-2',
    user_id: DEMO_USER.id,
    bucket_name: 'Savings',
    color: '#22c55e',
    percentage: 30,
    total_deposits: 8000,
    total_withdrawals: 1000,
    total_expenses: 0,
    current_balance: 7000,
  },
  {
    bucket_id: 'bucket-3',
    user_id: DEMO_USER.id,
    bucket_name: 'Investments',
    color: '#3b82f6',
    percentage: 20,
    total_deposits: 4000,
    total_withdrawals: 0,
    total_expenses: 0,
    current_balance: 4000,
  },
  {
    bucket_id: 'bucket-4',
    user_id: DEMO_USER.id,
    bucket_name: 'Spending',
    color: '#a855f7',
    percentage: 25,
    total_deposits: 5000,
    total_withdrawals: 0,
    total_expenses: 2500,
    current_balance: 2500,
  },
]

export function useBuckets(userId: string | undefined) {
  const [buckets, setBuckets] = useState<BucketConfig[]>([])
  const [balances, setBalances] = useState<BucketBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // DEMO MODE: Use sample data
    if (DEMO_MODE) {
      setBuckets(DEMO_BUCKETS)
      setBalances(DEMO_BALANCES)
      setLoading(false)
      return
    }

    if (!supabase) {
      setLoading(false)
      return
    }

    const DEFAULT_BUCKETS = [
      { name: 'Essentials', percentage: 50, color: '#3b82f6', priority: 1, is_tax_bucket: false },
      { name: 'Taxes', percentage: 25, color: '#ef4444', priority: 2, is_tax_bucket: true },
      { name: 'Savings', percentage: 15, color: '#22c55e', priority: 3, is_tax_bucket: false },
      { name: 'Fun', percentage: 10, color: '#f59e0b', priority: 4, is_tax_bucket: false },
    ]

    const fetchBuckets = async () => {
      try {
        const [configsRes, balancesRes] = await Promise.all([
          supabase
            .from('bucket_configs')
            .select('*')
            .eq('user_id', userId)
            .order('priority', { ascending: false }),
          supabase
            .from('bucket_balances')
            .select('*')
            .eq('user_id', userId),
        ])

        if (configsRes.error) throw configsRes.error
        if (balancesRes.error) throw balancesRes.error

        let configs = (configsRes.data as BucketConfig[]) || []

        // Auto-create default jars if none exist
        if (configs.length === 0) {
          const inserts = DEFAULT_BUCKETS.map((b) => ({ user_id: userId, ...b }))
          const { data: created, error: createErr } = await supabase
            .from('bucket_configs')
            .insert(inserts)
            .select()
          if (!createErr && created) {
            configs = created as BucketConfig[]
          }
        }

        setBuckets(configs)
        setBalances((balancesRes.data as BucketBalance[]) || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchBuckets()

    // Subscribe to realtime changes
    const configsSubscription = supabase
      .channel(`bucket_configs:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bucket_configs',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchBuckets()
        }
      )
      .subscribe()

    const transactionsSubscription = supabase
      .channel(`bucket_transactions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bucket_transactions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchBuckets()
        }
      )
      .subscribe()

    return () => {
      configsSubscription.unsubscribe()
      transactionsSubscription.unsubscribe()
    }
  }, [userId])

  const createBucket = async (bucket: Omit<BucketConfig, 'id' | 'created_at' | 'updated_at'>) => {
    if (DEMO_MODE) {
      const newBucket: BucketConfig = {
        ...bucket,
        id: `bucket-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setBuckets(prev => [...prev, newBucket])
      const newBalance: BucketBalance = {
        bucket_id: newBucket.id,
        user_id: bucket.user_id,
        bucket_name: bucket.name,
        color: bucket.color,
        percentage: bucket.percentage,
        total_deposits: 0,
        total_withdrawals: 0,
        total_expenses: 0,
        current_balance: 0,
      }
      setBalances(prev => [...prev, newBalance])
      return { data: newBucket, error: null }
    }

    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase
      .from('bucket_configs')
      .insert(bucket)
      .select()
      .single()

    return { data: data as BucketConfig, error }
  }

  const updateBucket = async (id: string, updates: Partial<BucketConfig>) => {
    if (DEMO_MODE) {
      setBuckets(prev => prev.map(b => b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b))
      setBalances(prev => prev.map(b => b.bucket_id === id ? { ...b, ...updates } : b))
      const updated = buckets.find(b => b.id === id)
      return { data: updated ? { ...updated, ...updates } : null, error: null }
    }

    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase
      .from('bucket_configs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data: data as BucketConfig, error }
  }

  const deleteBucket = async (id: string) => {
    if (DEMO_MODE) {
      setBuckets(prev => prev.filter(b => b.id !== id))
      setBalances(prev => prev.filter(b => b.bucket_id !== id))
      return { error: null }
    }

    if (!supabase) return { error: new Error('Supabase not initialized') }
    const { error } = await supabase
      .from('bucket_configs')
      .delete()
      .eq('id', id)

    return { error }
  }

  const getBucketBalance = (bucketId: string) => {
    return balances.find(b => b.bucket_id === bucketId)?.current_balance || 0
  }

  const getTotalBalance = () => {
    return balances.reduce((sum, b) => sum + (b.current_balance || 0), 0)
  }

  const getTaxBucketBalance = () => {
    const taxBucket = buckets.find(b => b.is_tax_bucket)
    if (!taxBucket) return 0
    return getBucketBalance(taxBucket.id)
  }

  return {
    buckets,
    balances,
    loading,
    error,
    createBucket,
    updateBucket,
    deleteBucket,
    getBucketBalance,
    getTotalBalance,
    getTaxBucketBalance,
  }
}
