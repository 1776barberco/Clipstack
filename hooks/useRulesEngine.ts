import { useEffect, useState } from 'react'
import { useBuckets } from '@/hooks/useBuckets'
import { useIncome } from '@/hooks/useIncome'

export interface AffordabilityCheck {
  canAfford: boolean
  reason: string
  suggestedMaxAmount: number
  currentBalance: number
  projectedBalance: number
}

export interface AffordabilityOptions {
  fromBucketId: string
  amount: number
  considerUpcomingExpenses?: boolean
  safetyBuffer?: number
}

export function useRulesEngine(userId: string | undefined) {
  const { buckets, getBucketBalance, getTotalBalance } = useBuckets(userId)
  const { weeklyIncome } = useIncome(userId)

  const checkAffordability = (options: AffordabilityOptions): AffordabilityCheck => {
    const { fromBucketId, amount, safetyBuffer = 0.1 } = options

    const currentBalance = getBucketBalance(fromBucketId)
    const bucket = buckets.find((b) => b.id === fromBucketId)

    if (!bucket) {
      return {
        canAfford: false,
        reason: 'Jar not found',
        suggestedMaxAmount: 0,
        currentBalance: 0,
        projectedBalance: 0,
      }
    }

    // Calculate safety buffer amount
    const bufferAmount = currentBalance * safetyBuffer
    const availableAfterBuffer = currentBalance - bufferAmount

    // Check if amount exceeds available balance
    if (amount > availableAfterBuffer) {
      return {
        canAfford: false,
        reason: `Amount exceeds available balance (keeping ${(safetyBuffer * 100).toFixed(0)}% safety buffer)`,
        suggestedMaxAmount: Math.max(0, availableAfterBuffer),
        currentBalance,
        projectedBalance: currentBalance,
      }
    }

    // Check if this is a tax bucket - warn if withdrawing
    if (bucket.is_tax_bucket) {
      const projectedBalance = currentBalance - amount
      return {
        canAfford: true,
        reason: 'Warning: Withdrawing from tax jar may affect quarterly tax payments',
        suggestedMaxAmount: availableAfterBuffer,
        currentBalance,
        projectedBalance,
      }
    }

    // Calculate average weekly income for context
    const avgWeeklyIncome = weeklyIncome.length > 0
      ? weeklyIncome.reduce((sum, w) => sum + w.total, 0) / weeklyIncome.length
      : 0

    // Warn if withdrawal is more than 50% of average weekly income
    if (amount > avgWeeklyIncome * 0.5) {
      return {
        canAfford: true,
        reason: 'Large withdrawal - exceeds 50% of average weekly income',
        suggestedMaxAmount: availableAfterBuffer,
        currentBalance,
        projectedBalance: currentBalance - amount,
      }
    }

    return {
      canAfford: true,
      reason: 'Withdrawal approved',
      suggestedMaxAmount: availableAfterBuffer,
      currentBalance,
      projectedBalance: currentBalance - amount,
    }
  }

  const checkStability = (): { score: number; status: 'low' | 'medium' | 'high' } => {
    const totalBalance = getTotalBalance()
    const avgWeeklyIncome = weeklyIncome.length > 0
      ? weeklyIncome.reduce((sum, w) => sum + w.total, 0) / weeklyIncome.length
      : 0

    // Stability score based on weeks of expenses covered
    // Assuming booth rent is the main fixed expense
    const weeksCovered = avgWeeklyIncome > 0 ? totalBalance / avgWeeklyIncome : 0

    let score: number
    let status: 'low' | 'medium' | 'high'

    if (weeksCovered >= 4) {
      score = 90 + Math.min(10, (weeksCovered - 4) * 2)
      status = 'high'
    } else if (weeksCovered >= 2) {
      score = 60 + (weeksCovered - 2) * 15
      status = 'medium'
    } else {
      score = Math.max(0, weeksCovered * 30)
      status = 'low'
    }

    return { score: Math.round(score), status }
  }

  const suggestBucketAllocation = (amount: number): { bucketId: string; amount: number; reason: string }[] => {
    const suggestions: { bucketId: string; amount: number; reason: string }[] = []
    let remainingAmount = amount

    // Sort buckets by priority (highest first)
    const sortedBuckets = [...buckets].sort((a, b) => b.priority - a.priority)

    for (const bucket of sortedBuckets) {
      if (remainingAmount <= 0) break

      const allocation = Math.min(
        remainingAmount,
        Math.round(amount * (bucket.percentage / 100))
      )

      if (allocation > 0) {
        suggestions.push({
          bucketId: bucket.id,
          amount: allocation,
          reason: `${bucket.percentage}% allocation to ${bucket.name}`,
        })
        remainingAmount -= allocation
      }
    }

    // If there's remaining amount, add to highest priority non-tax bucket
    if (remainingAmount > 0) {
      const nonTaxBucket = sortedBuckets.find((b) => !b.is_tax_bucket)
      if (nonTaxBucket) {
        const lastSuggestion = suggestions.find((s) => s.bucketId === nonTaxBucket.id)
        if (lastSuggestion) {
          lastSuggestion.amount += remainingAmount
          lastSuggestion.reason += ' (plus remainder)'
        } else {
          suggestions.push({
            bucketId: nonTaxBucket.id,
            amount: remainingAmount,
            reason: 'Remaining amount allocation',
          })
        }
      }
    }

    return suggestions
  }

  return {
    checkAffordability,
    checkStability,
    suggestBucketAllocation,
  }
}
