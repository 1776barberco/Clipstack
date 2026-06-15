'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { BellRing, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences'

const DISMISS_PREFIX = 'tipjars-reminder-dismissed-'

export function DailyReminderNudge() {
  const { user } = useAuthContext()
  const { entries, loading } = useIncome(user?.id)
  const { preferences } = useNotificationPreferences(user?.id)
  const today = format(new Date(), 'yyyy-MM-dd')
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(`${DISMISS_PREFIX}${today}`) === 'true'
  })

  const hasLoggedToday = useMemo(() => {
    return entries.some((entry) => entry.entry_date === today && Number(entry.amount) > 0)
  }, [entries, today])

  const reminderTimeReached = useMemo(() => {
    const reminderTime = preferences?.reminder_time || '18:00'
    const [hours, minutes] = reminderTime.split(':').map(Number)
    const now = new Date()
    const target = new Date()
    target.setHours(hours, minutes, 0, 0)
    return now >= target
  }, [preferences?.reminder_time])

  const reminderEnabled = preferences?.daily_tracking_reminder ?? true

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`${DISMISS_PREFIX}${today}`, 'true')
    }
    setDismissed(true)
  }

  if (loading || !reminderEnabled || hasLoggedToday || dismissed || !reminderTimeReached) {
    return null
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
            <BellRing className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Gentle reminder</p>
            <p className="text-sm text-muted-foreground">
              You have not logged today&apos;s income yet. Even a rough number helps TipJars guide your spending better.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={dismiss} aria-label="Dismiss reminder">
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
