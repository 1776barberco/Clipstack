'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useBuckets } from '@/hooks/useBuckets'
import { useIncome } from '@/hooks/useIncome'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { Sliders, TrendingUp, ArrowRight } from 'lucide-react'
import { useState, useMemo } from 'react'

export function WhatIfCard() {
  const { user } = useAuthContext()
  const { buckets, balances, loading: bucketsLoading } = useBuckets(user?.id)
  const { weeklyIncome, loading: incomeLoading } = useIncome(user?.id)

  const [selectedBucketId, setSelectedBucketId] = useState<string>('')
  const [sliderPercentage, setSliderPercentage] = useState<number>(0)

  const loading = bucketsLoading || incomeLoading

  // Calculate average weekly income from the weeklyIncome array
  const avgWeeklyIncome = useMemo(() => {
    if (!weeklyIncome || weeklyIncome.length === 0) return 0
    const weeksWithIncome = weeklyIncome.filter((w) => w.total > 0)
    if (weeksWithIncome.length === 0) return 0
    return weeksWithIncome.reduce((sum, w) => sum + w.total, 0) / weeksWithIncome.length
  }, [weeklyIncome])

  // When a bucket is selected, sync slider to current percentage
  const handleBucketChange = (bucketId: string) => {
    setSelectedBucketId(bucketId)
    const bucket = buckets.find((b) => b.id === bucketId)
    if (bucket) {
      setSliderPercentage(bucket.percentage)
    }
  }

  // Get selected bucket data
  const selectedBucket = useMemo(
    () => buckets.find((b) => b.id === selectedBucketId),
    [buckets, selectedBucketId]
  )

  const currentBalance = useMemo(() => {
    if (!selectedBucketId) return 0
    return balances.find((b) => b.bucket_id === selectedBucketId)?.current_balance || 0
  }, [balances, selectedBucketId])

  // Projection calculations
  const projections = useMemo(() => {
    if (!selectedBucket) return null

    const currentPercentage = selectedBucket.percentage
    const currentWeeklyAllocation = avgWeeklyIncome * (currentPercentage / 100)
    const newWeeklyAllocation = avgWeeklyIncome * (sliderPercentage / 100)
    const delta = newWeeklyAllocation - currentWeeklyAllocation

    const projected3mo = currentBalance + newWeeklyAllocation * 13
    const projected6mo = currentBalance + newWeeklyAllocation * 26
    const projected12mo = currentBalance + newWeeklyAllocation * 52

    // Current projections for delta display
    const current3mo = currentBalance + currentWeeklyAllocation * 13
    const current6mo = currentBalance + currentWeeklyAllocation * 26
    const current12mo = currentBalance + currentWeeklyAllocation * 52

    return {
      currentPercentage,
      currentWeeklyAllocation,
      newWeeklyAllocation,
      delta,
      projected3mo,
      projected6mo,
      projected12mo,
      delta3mo: projected3mo - current3mo,
      delta6mo: projected6mo - current6mo,
      delta12mo: projected12mo - current12mo,
    }
  }, [selectedBucket, sliderPercentage, avgWeeklyIncome, currentBalance])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            What If...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-6 animate-pulse rounded-lg bg-muted" />
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (buckets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            What If...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 mb-3">
              <Sliders className="h-7 w-7 text-purple-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              Set up your jars to explore scenarios!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 via-white/5 to-transparent border-purple-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sliders className="h-5 w-5" />
          What If...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Bucket selector */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Pick a Jar
            </label>
            <Select value={selectedBucketId} onValueChange={handleBucketChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a jar to explore..." />
              </SelectTrigger>
              <SelectContent>
                {buckets.map((bucket) => (
                  <SelectItem key={bucket.id} value={bucket.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: bucket.color }}
                      />
                      <span>{bucket.name}</span>
                      <span className="text-muted-foreground ml-1">
                        ({bucket.percentage}%)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Slider and projections — only show when a bucket is selected */}
          {selectedBucket && projections && (
            <>
              {/* Percentage slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Allocation
                  </label>
                  <span className="text-sm font-bold tabular-nums">
                    {sliderPercentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={sliderPercentage}
                  onChange={(e) => setSliderPercentage(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background
                    [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>
                    Current: {projections.currentPercentage}%
                  </span>
                  <span>100%</span>
                </div>
              </div>

              {/* Scenario description */}
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">If you allocated </span>
                  <span className="font-bold">{sliderPercentage}%</span>
                  <span className="text-muted-foreground"> to </span>
                  <span className="font-bold" style={{ color: selectedBucket.color }}>
                    {selectedBucket.name}
                  </span>
                  <span className="text-muted-foreground">...</span>
                </p>

                {/* Weekly delta */}
                {projections.delta !== 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span
                      className={`text-sm font-medium ${
                        projections.delta > 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {projections.delta > 0 ? '+' : ''}
                      {formatCurrency(projections.delta)}/week
                    </span>
                    <span className="text-xs text-muted-foreground">
                      vs current
                    </span>
                  </div>
                )}
              </div>

              {/* Projection cards */}
              <div className="grid grid-cols-3 gap-3">
                <ProjectionBlock
                  label="3 months"
                  value={projections.projected3mo}
                  delta={projections.delta3mo}
                />
                <ProjectionBlock
                  label="6 months"
                  value={projections.projected6mo}
                  delta={projections.delta6mo}
                />
                <ProjectionBlock
                  label="12 months"
                  value={projections.projected12mo}
                  delta={projections.delta12mo}
                />
              </div>

              {/* Current balance context */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>
                  Current balance: {formatCurrency(currentBalance)} · Avg income:{' '}
                  {formatCurrency(avgWeeklyIncome)}/week
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectionBlock({
  label,
  value,
  delta,
}: {
  label: string
  value: number
  delta: number
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
        In {label}
      </p>
      <p className="text-sm font-bold tabular-nums">{formatCurrency(value)}</p>
      {delta !== 0 && (
        <p
          className={`text-[10px] font-medium mt-0.5 ${
            delta > 0 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {delta > 0 ? '+' : ''}
          {formatCurrency(delta)}
        </p>
      )}
    </div>
  )
}
