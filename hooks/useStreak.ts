import { useMemo } from 'react'
import { DEMO_MODE } from '@/lib/supabase/client'
import { useIncome } from '@/hooks/useIncome'
import { format, subDays } from 'date-fns'

interface StreakData {
  currentStreak: number
  longestStreak: number
  loading: boolean
}

export function useStreak(userId: string | undefined): StreakData {
  const { entries, loading: incomeLoading } = useIncome(userId)

  // Client-side fallback: calculate streak from daily income check-ins
  const clientStreak = useMemo(() => {
    if (DEMO_MODE) return { current: 6, longest: 12 }
    if (!entries || entries.length === 0) return { current: 0, longest: 0 }

    const daySet = new Set(entries.map((entry) => entry.entry_date))

    let current = 0
    let cursor = new Date()

    // If they have not logged today, allow the streak to continue from yesterday.
    if (!daySet.has(format(cursor, 'yyyy-MM-dd'))) {
      cursor = subDays(cursor, 1)
    }

    while (daySet.has(format(cursor, 'yyyy-MM-dd'))) {
      current += 1
      cursor = subDays(cursor, 1)
    }

    const sortedDays = Array.from(daySet).sort()
    let longest = 0
    let running = 0
    let prev: Date | null = null

    for (const day of sortedDays) {
      const [y, m, d] = day.split('-').map(Number)
      const currentDate = new Date(y, m - 1, d)

      if (!prev) {
        running = 1
      } else {
        const diffDays = Math.round((currentDate.getTime() - prev.getTime()) / 86400000)
        running = diffDays === 1 ? running + 1 : 1
      }

      if (running > longest) longest = running
      prev = currentDate
    }

    return { current, longest }
  }, [entries])

  const loading = incomeLoading

  const currentStreak = clientStreak.current
  const longestStreak = clientStreak.longest

  return { currentStreak, longestStreak, loading }
}
