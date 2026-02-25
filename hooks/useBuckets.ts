import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

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

export function useBuckets(userId: string | undefined) {
  const [buckets, setBuckets] = useState<BucketConfig[]>([])
  const [balances, setBalances] = useState<BucketBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId || !supabase) {
      setLoading(false)
      return
    }

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

        setBuckets((configsRes.data as BucketConfig[]) || [])
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
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') }
    const { data, error } = await supabase
      .from('bucket_configs')
      .insert(bucket)
      .select()
      .single()

    return { data: data as BucketConfig, error }
  }

  const updateBucket = async (id: string, updates: Partial<BucketConfig>) => {
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
