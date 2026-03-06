import { useEffect, useMemo, useState } from 'react'
import { supabase, DEMO_MODE } from '@/lib/supabase/client'
import { useIncome } from '@/hooks/useIncome'
import { startOfWeek, subWeeks } from 'date-fns'

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

  // Client-side fallback: calculate streak from income entries
  const clientStreak = useMemo(() => {
    if (!entries || entries.length === 0) return { current: 0, longest: 0 }

    const now = new Date()
    // Use Sunday as week start to match the DB function
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 0 })

    // Group entries by week (Sunday start)
    const weekSet = new Set<string>()
    for (const entry of entries) {
      const entryDate = new Date(entry.entry_date)
      const ws = startOfWeek(entryDate, { weekStartsOn: 0 })
      weekSet.add(ws.toISOString())
    }

    // Walk backwards from current week, count consecutive weeks with income
    let current = 0
    let longest = 0
    let streak = 0

    for (let i = 0; i < 52; i++) {
      const weekStart = subWeeks(currentWeekStart, i)
      if (weekSet.has(weekStart.toISOString())) {
        streak++
        if (streak > longest) longest = streak
      } else {
        if (i === 0) {
          // Current week has no income yet — don't break, just skip
          continue
        }
        if (current === 0) current = streak
        streak = 0
      }
    }

    if (current === 0) current = streak

    return { current, longest }
  }, [entries])

  const loading = dbLoading || incomeLoading

  // Prefer DB values if available and non-zero, otherwise use client-side
  const currentStreak = dbStreak && dbStreak.current_streak > 0
    ? dbStreak.current_streak
    : clientStreak.current
  const longestStreak = dbStreak && dbStreak.longest_streak > 0
    ? dbStreak.longest_streak
    : clientStreak.longest

  return { currentStreak, longestStreak, loading }
}
