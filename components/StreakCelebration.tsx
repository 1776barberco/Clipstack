'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { useAuthContext } from '@/providers/AuthProvider'
import { useStreak } from '@/hooks/useStreak'

const STREAK_MILESTONES = [3, 7, 14, 30]

export function StreakCelebration() {
  const { user } = useAuthContext()
  const { currentStreak, loading } = useStreak(user?.id)
  const previousStreak = useRef(0)

  useEffect(() => {
    if (loading || typeof window === 'undefined') return

    const justHitMilestone =
      currentStreak > previousStreak.current && STREAK_MILESTONES.includes(currentStreak)

    if (justHitMilestone) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      })

      toast.success(`🔥 ${currentStreak}-day streak! You are building a real daily money habit.`)
    }

    previousStreak.current = currentStreak
  }, [currentStreak, loading])

  return null
}
