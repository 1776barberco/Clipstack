import { useMemo } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { DEMO_MODE } from '@/lib/supabase/client'

interface AnomalyInfo {
  reason: string
  avgAmount: number
  thisAmount: number
}

interface CategoryStats {
  mean: number
  stddev: number
  count: number
}

function calculateStats(amounts: number[]): CategoryStats {
  const count = amounts.length
  if (count === 0) return { mean: 0, stddev: 0, count: 0 }

  const mean = amounts.reduce((sum, a) => sum + a, 0) / count
  const variance = amounts.reduce((sum, a) => sum + (a - mean) ** 2, 0) / count
  const stddev = Math.sqrt(variance)

  return { mean, stddev, count }
}

export function useAnomalies(userId: string | undefined) {
  const { expenses, loading } = useExpenses(userId)

  const { anomalyMap, anomalyCount } = useMemo(() => {
    const map = new Map<string, AnomalyInfo>()

    if (!expenses.length) {
      return { anomalyMap: map, anomalyCount: 0 }
    }

    // DEMO_MODE: flag the most expensive demo expense as anomalous
    if (DEMO_MODE) {
      let maxExpense = expenses[0]
      for (const expense of expenses) {
        if (expense.amount > maxExpense.amount) {
          maxExpense = expense
        }
      }

      if (maxExpense) {
        const category = maxExpense.category || 'Uncategorized'
        const otherAmounts = expenses
          .filter((e) => e.id !== maxExpense.id)
          .map((e) => Number(e.amount))
        const avg = otherAmounts.length > 0
          ? otherAmounts.reduce((s, a) => s + a, 0) / otherAmounts.length
          : 0
        const ratio = avg > 0 ? (maxExpense.amount / avg).toFixed(1) : '∞'

        map.set(maxExpense.id, {
          reason: `This is ${ratio}x your usual ${category} spend (avg: $${avg.toFixed(0)})`,
          avgAmount: avg,
          thisAmount: maxExpense.amount,
        })
      }

      return { anomalyMap: map, anomalyCount: map.size }
    }

    // Group expenses by category
    const categoryGroups = new Map<string, typeof expenses>()
    for (const expense of expenses) {
      const category = expense.category || 'Uncategorized'
      const group = categoryGroups.get(category) || []
      group.push(expense)
      categoryGroups.set(category, group)
    }

    // Analyze each category
    for (const [category, categoryExpenses] of categoryGroups) {
      // Skip categories with < 3 expenses (not enough data)
      if (categoryExpenses.length < 3) continue

      const amounts = categoryExpenses.map((e) => Number(e.amount))
      const { mean, stddev } = calculateStats(amounts)

      for (const expense of categoryExpenses) {
        const amount = Number(expense.amount)
        const exceedsStddev = amount > mean + 2 * stddev
        const exceedsDouble = amount > 2 * mean

        if (exceedsStddev || exceedsDouble) {
          const ratio = mean > 0 ? (amount / mean).toFixed(1) : '∞'
          map.set(expense.id, {
            reason: `This is ${ratio}x your usual ${category} spend (avg: $${mean.toFixed(0)})`,
            avgAmount: mean,
            thisAmount: amount,
          })
        }
      }
    }

    return { anomalyMap: map, anomalyCount: map.size }
  }, [expenses])

  const isAnomalous = (expenseId: string): boolean => {
    return anomalyMap.has(expenseId)
  }

  const getAnomalyInfo = (expenseId: string): AnomalyInfo | null => {
    return anomalyMap.get(expenseId) || null
  }

  return {
    isAnomalous,
    getAnomalyInfo,
    anomalyCount,
    loading,
  }
}
