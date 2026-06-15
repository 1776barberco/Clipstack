import { useMemo } from 'react'
import { useIncome } from '@/hooks/useIncome'
import { useExpenses } from '@/hooks/useExpenses'
import { useBuckets } from '@/hooks/useBuckets'
import { useProfile } from '@/hooks/useProfile'
import { addWeeks } from 'date-fns'

interface BucketProjection {
  bucketName: string
  currentBalance: number
  targetAmount: number
  projectedDate: Date | null
  color: string
  percentage: number
}

interface ForecastData {
  projectedMonthlyIncome: number
  projectedMonthlySavings: number
  projectedQuarterlyTax: number
  bucketProjections: BucketProjection[]
  weeklyIncomeAvg: number
  weeklyExpenseAvg: number
  weeksOfData: number
  loading: boolean
}

const DEFAULT_TAX_RATE = 0.25
const WEEKS_PER_MONTH = 4.33

export function useForecast(userId: string | undefined): ForecastData {
  const { weeklyIncome, loading: incomeLoading } = useIncome(userId)
  const { weeklyExpenses, loading: expensesLoading } = useExpenses(userId)
  const { buckets, balances, loading: bucketsLoading } = useBuckets(userId)
  const { profile, loading: profileLoading } = useProfile(userId)

  const loading = incomeLoading || expensesLoading || bucketsLoading || profileLoading

  const forecast = useMemo((): Omit<ForecastData, 'loading'> => {
    const empty: Omit<ForecastData, 'loading'> = {
      projectedMonthlyIncome: 0,
      projectedMonthlySavings: 0,
      projectedQuarterlyTax: 0,
      bucketProjections: [],
      weeklyIncomeAvg: 0,
      weeklyExpenseAvg: 0,
      weeksOfData: 0,
    }

    if (!weeklyIncome.length && !weeklyExpenses.length) return empty

    // Use up to 12 weeks of data (hooks provide 8, but handle any length)
    const incomeWeeks = weeklyIncome.filter((w) => w.total > 0)
    const expenseWeeks = weeklyExpenses.filter((w) => w.total > 0)

    const weeksOfData = Math.max(incomeWeeks.length, expenseWeeks.length)
    if (weeksOfData === 0) return empty

    // Rolling average of weekly income (only weeks with data)
    const weeklyIncomeAvg =
      incomeWeeks.length > 0
        ? incomeWeeks.reduce((sum, w) => sum + w.total, 0) / incomeWeeks.length
        : 0

    // Rolling average of weekly expenses
    const weeklyExpenseAvg =
      expenseWeeks.length > 0
        ? expenseWeeks.reduce((sum, w) => sum + w.total, 0) / expenseWeeks.length
        : 0

    // Monthly projections
    const projectedMonthlyIncome = weeklyIncomeAvg * WEEKS_PER_MONTH
    const projectedMonthlyExpenses = weeklyExpenseAvg * WEEKS_PER_MONTH
    const projectedMonthlySavings = projectedMonthlyIncome - projectedMonthlyExpenses

    // Tax projection — use profile tax_rate or default
    const taxRate = profile?.tax_rate ?? DEFAULT_TAX_RATE
    const projectedQuarterlyTax = projectedMonthlyIncome * 3 * taxRate

    // Bucket projections — only for buckets with a target_amount
    const bucketProjections: BucketProjection[] = buckets
      .filter((b) => b.target_amount !== null && b.target_amount > 0)
      .map((bucket) => {
        const balance = balances.find((bal) => bal.bucket_id === bucket.id)
        const currentBalance = balance?.current_balance ?? 0
        const targetAmount = bucket.target_amount!
        const allocationPct = bucket.percentage / 100

        // Weekly contribution to this bucket based on allocation % of average income
        const weeklyContribution = weeklyIncomeAvg * allocationPct
        const remaining = targetAmount - currentBalance

        let projectedDate: Date | null = null
        if (remaining <= 0) {
          // Already reached target
          projectedDate = new Date()
        } else if (weeklyContribution > 0) {
          const weeksToTarget = remaining / weeklyContribution
          projectedDate = addWeeks(new Date(), Math.ceil(weeksToTarget))
        }

        return {
          bucketName: bucket.name,
          currentBalance,
          targetAmount,
          projectedDate,
          color: bucket.color,
          percentage: bucket.percentage,
        }
      })

    return {
      projectedMonthlyIncome,
      projectedMonthlySavings,
      projectedQuarterlyTax,
      bucketProjections,
      weeklyIncomeAvg,
      weeklyExpenseAvg,
      weeksOfData,
    }
  }, [weeklyIncome, weeklyExpenses, buckets, balances, profile])

  return { ...forecast, loading }
}
