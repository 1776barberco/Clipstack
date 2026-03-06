'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useStreak } from '@/hooks/useStreak'

export function StreakBadge() {
  const { user } = useAuthContext()
  const { currentStreak, longestStreak, loading } = useStreak(user?.id)

  if (loading) return null

  // No streak yet
  if (currentStreak === 0) {
    return (
      <p className="text-xs text-muted-foreground mt-2">
        Start your streak — log this week&apos;s income!
      </p>
    )
  }

  const isHot = currentStreak >= 4
  const isOnFire = currentStreak >= 8
  const isPersonalBest = currentStreak === longestStreak && longestStreak > 1

  return (
    <div className={`flex items-center gap-1.5 mt-2 ${isHot ? 'text-amber-400' : 'text-muted-foreground'}`}>
      <span className="text-sm">
        🔥{' '}
        <span className={`font-bold ${isHot ? 'text-amber-400' : ''}`}>
          {currentStreak}
        </span>
        -week streak
      </span>
      {isOnFire && isPersonalBest && (
        <span className="text-xs font-medium text-green-400 ml-1">
          Personal best!
        </span>
      )}
    </div>
  )
}
