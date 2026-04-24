'use client'

import { useEffect, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { toast } from 'sonner'
import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { useStreak } from '@/hooks/useStreak'

export function StreakProtectedToast() {
  const { user } = useAuthContext()
  const { entries } = useIncome(user?.id)
  const { currentStreak } = useStreak(user?.id)

  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  const hasToday = useMemo(
    () => entries.some((entry) => entry.entry_date === today && Number(entry.amount) > 0),
    [entries, today]
  )
  const hadYesterday = useMemo(
    () => entries.some((entry) => entry.entry_date === yesterday && Number(entry.amount) > 0),
    [entries, yesterday]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hasToday || !hadYesterday || currentStreak <= 0) return

    const key = `tipjars-streak-protected-${today}`
    if (window.localStorage.getItem(key) === 'true') return

    window.localStorage.setItem(key, 'true')
    toast.success(`✅ You protected your streak. ${currentStreak}-day run still alive.`)
  }, [currentStreak, hadYesterday, hasToday, today])

  return null
}
