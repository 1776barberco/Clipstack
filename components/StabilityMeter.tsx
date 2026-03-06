'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useRulesEngine } from '@/hooks/useRulesEngine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Activity, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'

export function StabilityMeter() {
  const { user } = useAuthContext()
  const { checkStability, loading } = useRulesEngine(user?.id)
  const { score, status } = checkStability()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Stability Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = () => {
    switch (status) {
      case 'high':
        return 'text-green-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'high':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'low':
        return <TrendingDown className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'high':
        return 'Rock solid! You\'ve built a real safety net. 🎯'
      case 'medium':
        return 'You\'re on a roll — your cushion is growing! 📈'
      case 'low':
        return 'You\'re building momentum — every deposit counts! 💪'
      default:
        return 'Start tracking to see your stability score.'
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getProgressColor = () => {
    switch (status) {
      case 'high':
        return 'bg-green-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Stability Meter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-2xl font-bold">{score}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <span className={`font-medium capitalize ${getStatusColor()}`}>
              {status}
            </span>
          </div>

          <Progress
            value={score}
            className="h-3"
          />

          <p className="text-sm text-muted-foreground">
            {getStatusText()}
          </p>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">What this means:</p>
            <p className="text-muted-foreground">
              Your stability score shows how many weeks of average income you have saved. 
              You're working toward 4+ weeks of coverage — that's financial freedom territory.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
