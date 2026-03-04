'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, ArrowLeft, DollarSign, Loader2, PiggyBank, TrendingUp } from 'lucide-react'

type FixedJar = {
  id: string
  name: string
  color: string
  target_amount: number
}

type PercentageJar = {
  id: string
  name: string
  color: string
  percentage: number
}

interface IncomeSplitStepProps {
  amount: number
  fixedJars: FixedJar[]
  percentageJars: PercentageJar[]
  onConfirm: (fixedAllocations: Record<string, number>) => void
  onBack: () => void
  loading: boolean
}

export function IncomeSplitStep({
  amount,
  fixedJars,
  percentageJars,
  onConfirm,
  onBack,
  loading,
}: IncomeSplitStepProps) {
  const [fixedAllocations, setFixedAllocations] = useState<Record<string, string>>(
    Object.fromEntries(fixedJars.map((j) => [j.id, '']))
  )

  const totalFixed = Object.values(fixedAllocations).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  )
  const remaining = amount - totalFixed
  const isOverBudget = remaining < 0

  // Calculate what each percentage jar will get from the remainder
  const totalPct = percentageJars.reduce((sum, j) => sum + j.percentage, 0)

  const handleFixedChange = (jarId: string, value: string) => {
    setFixedAllocations((prev) => ({ ...prev, [jarId]: value }))
  }

  const handleConfirm = () => {
    const allocations: Record<string, number> = {}
    for (const [id, val] of Object.entries(fixedAllocations)) {
      const num = parseFloat(val) || 0
      if (num > 0) allocations[id] = num
    }
    onConfirm(allocations)
  }

  return (
    <div className="space-y-4">
      {/* Header showing total */}
      <div className="text-center py-2">
        <p className="text-sm text-muted-foreground">Splitting</p>
        <p className="text-3xl font-bold">${amount.toFixed(2)}</p>
      </div>

      {/* Fixed Jars — Manual Input */}
      {fixedJars.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              Fixed Jars — Choose How Much
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fixedJars.map((jar) => (
              <div key={jar.id} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: jar.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{jar.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Target: ${jar.target_amount.toFixed(2)}
                  </p>
                </div>
                <div className="relative w-28 shrink-0">
                  <DollarSign className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={amount}
                    placeholder="0.00"
                    value={fixedAllocations[jar.id]}
                    onChange={(e) => handleFixedChange(jar.id, e.target.value)}
                    className="pl-7 h-9 text-sm"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Percentage Jars — Auto Preview */}
      {percentageJars.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Percentage Jars — Auto-Split
              {remaining > 0 && (
                <span className="text-xs text-muted-foreground font-normal ml-auto">
                  ${remaining.toFixed(2)} remaining
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {percentageJars.map((jar) => {
              const jarAmount =
                remaining > 0 && totalPct > 0
                  ? (remaining * jar.percentage) / totalPct
                  : 0
              return (
                <div key={jar.id} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: jar.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{jar.name}</p>
                    <p className="text-xs text-muted-foreground">{jar.percentage}%</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    ${jarAmount.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Over budget warning */}
      {isOverBudget && (
        <p className="text-sm text-red-500 text-center font-medium">
          You've allocated ${Math.abs(remaining).toFixed(2)} more than your income!
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={loading}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={handleConfirm}
          className="flex-1"
          disabled={isOverBudget || loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Confirm Split
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
