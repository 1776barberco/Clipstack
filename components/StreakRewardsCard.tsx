'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Lock, Flame } from 'lucide-react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useStreak } from '@/hooks/useStreak'

const REWARDS = [
  { days: 3, title: 'Getting Warm', emoji: '🟡' },
  { days: 7, title: 'Weekly Locked In', emoji: '🔥' },
  { days: 14, title: 'Habit Builder', emoji: '⚡' },
  { days: 30, title: 'Money Discipline', emoji: '🏆' },
]

export function StreakRewardsCard() {
  const { user } = useAuthContext()
  const { currentStreak } = useStreak(user?.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Streak Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Unlock rewards by checking in daily. Every day you log income strengthens the habit.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {REWARDS.map((reward) => {
            const unlocked = currentStreak >= reward.days
            return (
              <div
                key={reward.days}
                className={`rounded-2xl border p-4 transition-all ${
                  unlocked
                    ? 'border-primary/25 bg-primary/5'
                    : 'border-white/10 bg-muted/20 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg">{reward.emoji}</p>
                    <p className="mt-1 font-semibold">{reward.title}</p>
                    <p className="text-xs text-muted-foreground">Unlock at {reward.days} days</p>
                  </div>
                  <Badge variant={unlocked ? 'default' : 'outline'} className={unlocked ? '' : 'text-muted-foreground'}>
                    {unlocked ? (
                      <>
                        <Flame className="h-3 w-3" />
                        Unlocked
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" />
                        Locked
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
