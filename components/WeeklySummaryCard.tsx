'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useMemo } from 'react'
import { StreakBadge } from '@/components/StreakBadge'

export function WeeklySummaryCard() {
  const { user } = useAuthContext()
  const { entries: incomes, loading } = useIncome(user?.id)

  const { thisWeek, fourWeekAvg, trend } = useMemo(() => {
    if (!incomes || incomes.length === 0) return { thisWeek: 0, fourWeekAvg: 0, trend: 0 }

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    // Parse date-only strings as local time (not UTC)
    const parseLocal = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number)
      return new Date(y, m - 1, d)
    }

    const thisWeekTotal = incomes
      .filter((i: { entry_date: string }) => parseLocal(i.entry_date) >= weekStart)
      .reduce((sum: number, i: { amount: number }) => sum + Number(i.amount), 0)

    // Group by week for 4-week avg
    const fourWeeksAgo = new Date(now)
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    const recentIncomes = incomes.filter((i: { entry_date: string }) => parseLocal(i.entry_date) >= fourWeeksAgo)
    const weekTotals: Record<string, number> = {}
    for (const i of recentIncomes) {
      const d = parseLocal(i.entry_date)
      const ws = new Date(d); ws.setDate(ws.getDate() - ws.getDay())
      const key = ws.toISOString().split('T')[0]
      weekTotals[key] = (weekTotals[key] || 0) + Number(i.amount)
    }
    const weeks = Object.values(weekTotals)
    const avg = weeks.length > 0 ? weeks.reduce((s, w) => s + w, 0) / weeks.length : 0
    const trendPct = avg > 0 ? ((thisWeekTotal - avg) / avg) * 100 : 0

    return { thisWeek: thisWeekTotal, fourWeekAvg: avg, trend: trendPct }
  }, [incomes])

  if (loading) {
    return <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
  }

  const TrendIcon = trend > 5 ? TrendingUp : trend < -5 ? TrendingDown : Minus
  const trendColor = trend > 5 ? 'text-green-400' : trend < -5 ? 'text-red-400' : 'text-yellow-400'
  const trendContext = trend > 5
    ? 'Crushing it this week! 🔥'
    : trend < -5
      ? 'Slower week — totally normal with irregular income 💪'
      : 'Staying consistent — that\'s the key 👊'

  return (
    <Card className="bg-gradient-to-br from-primary/20 via-white/5 to-transparent border-primary/20">
      <CardContent className="p-5">
        {thisWeek === 0 && fourWeekAvg === 0 ? (
          <div className="text-center py-2">
            <p className="text-2xl mb-1">💸</p>
            <p className="text-sm text-muted-foreground">Log your first income to see your weekly summary!</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">This Week</p>
              <p className="text-3xl font-bold">{formatCurrency(thisWeek)}</p>
              <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">
                  {Math.abs(trend).toFixed(0)}% vs 4-week avg
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{trendContext}</p>
              <StreakBadge />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">4-Week Avg</p>
              <p className="text-lg font-semibold text-muted-foreground">{formatCurrency(fourWeekAvg)}</p>
              <p className="text-xs text-muted-foreground mt-1">/week</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
