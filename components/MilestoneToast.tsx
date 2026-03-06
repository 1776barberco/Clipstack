'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { useAuthContext } from '@/providers/AuthProvider'
import { useMilestones } from '@/hooks/useMilestones'
import { formatCurrency } from '@/lib/utils'

function getMilestoneMessage(bucketName: string, percentage: number, targetAmount: number): string {
  switch (percentage) {
    case 25:
      return `🎯 Quarter way to your ${bucketName} goal!`
    case 50:
      return `🔥 Halfway to your ${bucketName} target!`
    case 75:
      return `🚀 75% of the way to ${bucketName}! Almost there!`
    case 100:
      return `🎉 You hit your ${bucketName} goal of ${formatCurrency(targetAmount)}! Incredible!`
    default:
      return `${bucketName}: ${percentage}% milestone reached!`
  }
}

export function MilestoneToast() {
  const { user } = useAuthContext()
  const { newMilestones, markSeen, loading } = useMilestones(user?.id)
  const hasShown = useRef(false)

  useEffect(() => {
    if (loading || hasShown.current || newMilestones.length === 0) return

    hasShown.current = true

    // Fire confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })

    // Show toasts and mark seen
    for (const milestone of newMilestones) {
      toast.success(
        getMilestoneMessage(milestone.bucketName, milestone.percentage, milestone.targetAmount)
      )
      markSeen(milestone.bucketName, milestone.percentage)
    }
  }, [loading, newMilestones, markSeen])

  return null
}
