'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { Sparkles, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { useStreak } from '@/hooks/useStreak'
import { useBuckets } from '@/hooks/useBuckets'
import { formatCurrency } from '@/lib/utils'

export function DailyMomentumCard() {
  const { user } = useAuthContext()
  const { entries } = useIncome(user?.id)
  const { currentStreak } = useStreak(user?.id)
  const { balances } = useBuckets(user?.id)

  const today = format(new Date(), 'yyyy-MM-dd')

  const todayIncome = useMemo(() => {
    return entries
      .filter((entry) => entry.entry_date === today)
      .reduce((sum, entry) => sum + Number(entry.amount), 0)
  }, [entries, today])

  const strongestJar = useMemo(() => {
    if (!balances.length) return null
    return [...balances].sort((a, b) => Number(b.current_balance) - Number(a.current_balance))[0]
  }, [balances])

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/15 via-purple-500/10 to-transparent">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/40 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Daily Momentum
            </div>
            <h3 className="text-2xl font-bold tracking-tight">
              {todayIncome > 0 ? `You logged ${formatCurrency(todayIncome)} today` : 'Log today\'s income to keep momentum high'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              TipJars gets better when you check in daily. Keep the streak alive and use your jars before you spend.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[360px]">
            <div className="rounded-2xl border border-white/10 bg-background/40 p-3 backdrop-blur">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                Streak
              </div>
              <p className="text-xl font-bold">{currentStreak} day{currentStreak === 1 ? '' : 's'}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background/40 p-3 backdrop-blur">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                Today
              </div>
              <p className="text-xl font-bold">{formatCurrency(todayIncome)}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background/40 p-3 backdrop-blur">
              <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Top Jar</div>
              <p className="truncate text-sm font-semibold">
                {strongestJar?.bucket_name || 'No jars yet'}
              </p>
              <p className="text-xs text-muted-foreground">
                {strongestJar ? formatCurrency(Number(strongestJar.current_balance)) : 'Set up your jars'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
