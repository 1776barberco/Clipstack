'use client'

import { useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { useStreak } from '@/hooks/useStreak'

export function EveningStreakReminder() {
  const { user } = useAuthContext()
  const { entries, loading } = useIncome(user?.id)
  const { currentStreak } = useStreak(user?.id)

  const shouldShow = useMemo(() => {
    if (loading || currentStreak <= 0) return false

    const now = new Date()
    const hour = now.getHours()
    if (hour < 18) return false

    const today = format(now, 'yyyy-MM-dd')
    const yesterday = format(subDays(now, 1), 'yyyy-MM-dd')

    const hasToday = entries.some((entry) => entry.entry_date === today && Number(entry.amount) > 0)
    const hadYesterday = entries.some((entry) => entry.entry_date === yesterday && Number(entry.amount) > 0)

    return !hasToday && hadYesterday
  }, [entries, loading, currentStreak])

  if (!shouldShow) return null

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="mt-0.5 rounded-xl bg-amber-500/10 p-2 text-amber-400">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">Do not lose your streak tonight</p>
          <p className="text-sm text-muted-foreground">
            You already built a {currentStreak}-day streak. Log today&apos;s income before the day ends to keep the momentum going.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
