import { useEffect, useMemo, useState } from 'react'
import { supabase, DEMO_MODE } from '@/lib/supabase/client'
import { useIncome } from '@/hooks/useIncome'
import { format, subDays } from 'date-fns'

interface StreakData {
  currentStreak: number
  longestStreak: number
  loading: boolean
}

export function useStreak(userId: string | undefined): StreakData {
  const [dbStreak, setDbStreak] = useState<{ current_streak: number; longest_streak: number } | null>(null)
  const [dbLoading, setDbLoading] = useState(true)
  const { entries, loading: incomeLoading } = useIncome(userId)

  // Fetch streak from profile (DB)
  useEffect(() => {
    if (!userId) {
      setDbLoading(false)
      return
    }

    if (DEMO_MODE) {
      setDbStreak({ current_streak: 6, longest_streak: 12 })
      setDbLoading(false)
      return
    }

    if (!supabase) {
      setDbLoading(false)
      return
    }

    const fetchStreak = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('current_streak, longest_streak')
          .eq('id', userId)
          .maybeSingle()

        if (error) throw error
        if (data) {
          setDbStreak(data as { current_streak: number; longest_streak: number })
        }
      } catch {
        // Fall through to client-side calculation
      } finally {
        setDbLoading(false)
      }
    }

    fetchStreak()
  }, [userId])

  // Client-side fallback: calculate streak from daily income check-ins
  const clientStreak = useMemo(() => {
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

  const loading = dbLoading || incomeLoading

  const currentStreak = clientStreak.current
  const longestStreak = Math.max(clientStreak.longest, dbStreak?.longest_streak || 0)

  return { currentStreak, longestStreak, loading }
}
