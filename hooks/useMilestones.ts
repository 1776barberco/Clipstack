'use client'

import { useEffect, useState, useCallback } from 'react'
import { useBuckets } from '@/hooks/useBuckets'
import { DEMO_MODE } from '@/lib/supabase/client'

export type Milestone = {
  bucketName: string
  percentage: number
  targetAmount: number
  currentBalance: number
}

const MILESTONE_PERCENTAGES = [25, 50, 75, 100] as const

const DEMO_MILESTONES: Milestone[] = [
  {
    bucketName: 'Savings',
    percentage: 50,
    targetAmount: 50000,
    currentBalance: 25500,
  },
]

function getStorageKey(userId: string) {
  return `tipjars_milestones_seen_${userId}`
}

function getSeenMilestones(userId: string): Record<string, number[]> {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveSeenMilestones(userId: string, seen: Record<string, number[]>) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(seen))
  } catch {
    // localStorage not available (SSR)
  }
}

export function useMilestones(userId: string | undefined) {
  const { buckets, balances, loading: bucketsLoading } = useBuckets(userId)
  const [newMilestones, setNewMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      const frame = requestAnimationFrame(() => setLoading(false))
      return () => cancelAnimationFrame(frame)
    }

    if (DEMO_MODE) {
      const frame = requestAnimationFrame(() => {
        setNewMilestones(DEMO_MILESTONES)
        setLoading(false)
      })
      return () => cancelAnimationFrame(frame)
    }

    if (bucketsLoading) {
      return
    }

    const seen = getSeenMilestones(userId)
    const milestones: Milestone[] = []

    for (const bucket of buckets) {
      if (!bucket.target_amount || bucket.target_amount <= 0) continue

      const balance = balances.find(b => b.bucket_id === bucket.id)
      if (!balance) continue

      const seenForBucket = seen[bucket.name] || []

      for (const pct of MILESTONE_PERCENTAGES) {
        const threshold = (bucket.target_amount * pct) / 100
        if (
          balance.current_balance >= threshold &&
          !seenForBucket.includes(pct)
        ) {
          milestones.push({
            bucketName: bucket.name,
            percentage: pct,
            targetAmount: bucket.target_amount,
            currentBalance: balance.current_balance,
          })
        }
      }
    }

    const frame = requestAnimationFrame(() => {
      setNewMilestones(milestones)
      setLoading(false)
    })

    return () => cancelAnimationFrame(frame)
  }, [userId, buckets, balances, bucketsLoading])

  const markSeen = useCallback(
    (bucketName: string, percentage: number) => {
      if (!userId) return

      setNewMilestones(prev =>
        prev.filter(
          m => !(m.bucketName === bucketName && m.percentage === percentage)
        )
      )

      const seen = getSeenMilestones(userId)
      const seenForBucket = seen[bucketName] || []
      if (!seenForBucket.includes(percentage)) {
        seen[bucketName] = [...seenForBucket, percentage]
        saveSeenMilestones(userId, seen)
      }
    },
    [userId]
  )

  return { newMilestones, markSeen, loading }
}
