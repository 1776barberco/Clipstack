import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface QueuedAction {
  id: string
  type: 'income' | 'withdrawal' | 'transfer'
  data: Record<string, unknown>
  timestamp: number
  retryCount: number
}

const QUEUE_KEY = 'clipstack_offline_queue'
const LAST_SYNC_KEY = 'clipstack_last_sync'

export function useOfflineSync(userId: string | undefined) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [queue, setQueue] = useState<QueuedAction[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<number | null>(null)

  // Load queue from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const savedQueue = localStorage.getItem(QUEUE_KEY)
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue))
      } catch {
        localStorage.removeItem(QUEUE_KEY)
      }
    }

    const savedLastSync = localStorage.getItem(LAST_SYNC_KEY)
    if (savedLastSync) {
      setLastSync(parseInt(savedLastSync, 10))
    }
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  }, [queue])

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      syncQueue()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queue, userId])

  const addToQueue = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) => {
    const newAction: QueuedAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    }

    setQueue((prev) => [...prev, newAction])

    // Try to sync immediately if online
    if (isOnline && userId) {
      syncQueue()
    }

    return newAction.id
  }, [isOnline, userId])

  const syncQueue = useCallback(async () => {
    if (!userId || isSyncing || queue.length === 0 || !supabase) return

    setIsSyncing(true)
    const failedActions: QueuedAction[] = []

    for (const action of queue) {
      try {
        let result

        switch (action.type) {
          case 'income':
            result = await supabase.from('income_entries').insert({
              ...action.data,
              user_id: userId,
            })
            break
          case 'withdrawal':
            result = await supabase.from('bucket_transactions').insert({
              ...action.data,
              user_id: userId,
              type: 'withdrawal',
            })
            break
          case 'transfer':
            result = await supabase.from('bucket_transactions').insert({
              ...action.data,
              user_id: userId,
              type: 'transfer',
            })
            break
        }

        if (result?.error) {
          throw result.error
        }
      } catch (error) {
        // If failed less than 3 times, add back to queue
        if (action.retryCount < 3) {
          failedActions.push({
            ...action,
            retryCount: action.retryCount + 1,
          })
        }
      }
    }

    setQueue(failedActions)
    const now = Date.now()
    setLastSync(now)
    localStorage.setItem(LAST_SYNC_KEY, now.toString())
    setIsSyncing(false)
  }, [userId, isSyncing, queue])

  const clearQueue = useCallback(() => {
    setQueue([])
    localStorage.removeItem(QUEUE_KEY)
  }, [])

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((action) => action.id !== id))
  }, [])

  return {
    isOnline,
    queue,
    isSyncing,
    lastSync,
    addToQueue,
    syncQueue,
    clearQueue,
    removeFromQueue,
    pendingCount: queue.length,
  }
}
