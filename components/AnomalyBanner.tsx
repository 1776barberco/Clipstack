'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface AnomalyBannerProps {
  anomalyCount: number
}

export function AnomalyBanner({ anomalyCount }: AnomalyBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (anomalyCount === 0 || dismissed) return null

  return (
    <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          ⚡ {anomalyCount} unusual transaction{anomalyCount !== 1 ? 's' : ''} this period
        </span>
        <span className="text-xs text-muted-foreground">
          Spending that differs significantly from your averages
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
