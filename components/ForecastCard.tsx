'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useForecast } from '@/hooks/useForecast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressRing } from '@/components/ProgressRing'
import { TrendingUp, Target, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { useMemo } from 'react'

export function ForecastCard() {
  const { user } = useAuthContext()
  const {
    projectedMonthlyIncome,
    projectedMonthlySavings,
    projectedQuarterlyTax,
    bucketProjections,
    weeksOfData,
    loading,
  } = useForecast(user?.id)

  const savingsTrend = useMemo(() => {
    if (projectedMonthlySavings > 0) return 'positive'
    if (projectedMonthlySavings < 0) return 'negative'
    return 'neutral'
  }, [projectedMonthlySavings])

  if (loading) {
    return <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
  }

  // Empty state — not enough data
  if (weeksOfData < 2) {
    return (
      <Card className="border-white/10">
        <CardContent className="p-5">
          <div className="text-center py-4">
            <p className="text-2xl mb-1">🔮</p>
            <p className="text-sm text-muted-foreground">
              Log a few weeks of income to see your forecast!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-primary" />
          Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Projected Monthly Income */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Projected Monthly Income
            </p>
            <p className="text-2xl font-bold">{formatCurrency(projectedMonthlyIncome)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Net Savings</p>
            <p
              className={`text-lg font-semibold ${
                savingsTrend === 'positive'
                  ? 'text-green-400'
                  : savingsTrend === 'negative'
                    ? 'text-red-400'
                    : 'text-muted-foreground'
              }`}
            >
              {formatCurrency(projectedMonthlySavings)}
            </p>
            <p className="text-xs text-muted-foreground">/month</p>
          </div>
        </div>

        {/* Bucket Projections */}
        {bucketProjections.length > 0 && (
          <div className="space-y-3">
            {bucketProjections.map((bp) => {
              const progress = bp.targetAmount > 0
                ? Math.min((bp.currentBalance / bp.targetAmount) * 100, 100)
                : 0
              const isReached = bp.currentBalance >= bp.targetAmount

              return (
                <div key={bp.bucketName} className="flex items-center gap-3">
                  <ProgressRing value={progress} size={48} strokeWidth={3} color={bp.color}>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </ProgressRing>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{bp.bucketName}</p>
                    <p className="text-xs text-muted-foreground">
                      {isReached ? (
                        <span className="text-green-400">Target reached! 🎉</span>
                      ) : bp.projectedDate ? (
                        <>
                          On track to reach{' '}
                          <span className="font-medium">{formatCurrency(bp.targetAmount)}</span>
                          {' by '}
                          <span className="font-medium">
                            {format(bp.projectedDate, 'MMMM yyyy')}
                          </span>
                        </>
                      ) : (
                        'Increase allocation to reach target'
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatCurrency(bp.currentBalance)} / {formatCurrency(bp.targetAmount)}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Quarterly Tax Estimate */}
        <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Projected Quarterly Tax</p>
            <p className="text-base font-semibold">{formatCurrency(projectedQuarterlyTax)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
