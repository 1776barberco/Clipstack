'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useCoach } from '@/hooks/useCoach'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Sparkles, TrendingUp, Calendar, Lightbulb, RefreshCw, ChevronRight, Lock } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { LockedInsightCard } from './LockedInsightCard'
import { useSubscription } from '@/hooks/useSubscription'
import Link from 'next/link'

type SuggestedChange = { jar: string; current: string; suggested: string; reason: string }

const insightIcons: Record<string, React.ReactNode> = {
  weekly_recap: <TrendingUp className="h-4 w-4" />,
  jar_recommendation: <Sparkles className="h-4 w-4" />,
  seasonal_forecast: <Calendar className="h-4 w-4" />,
  money_tip: <Lightbulb className="h-4 w-4" />,
}

const insightColors: Record<string, string> = {
  weekly_recap: 'bg-blue-500/10 text-blue-600 border-blue-200',
  jar_recommendation: 'bg-purple-500/10 text-purple-600 border-purple-200',
  seasonal_forecast: 'bg-amber-500/10 text-amber-600 border-amber-200',
  money_tip: 'bg-green-500/10 text-green-600 border-green-200',
}

// The locked cards always show these two types as teasers
const LOCKED_INSIGHTS = [
  {
    title: 'Seasonal Income Forecast',
    type: 'seasonal_forecast',
  },
  {
    title: 'Smart Savings Tip',
    type: 'money_tip',
  },
]

function SuggestedChanges({ data }: { data: Record<string, unknown> }) {
  const changes = data?.suggested_changes as SuggestedChange[] | undefined
  if (!changes?.length) return null
  return (
    <div className="mt-2 space-y-1">
      {changes.map((change, i) => (
        <div key={i} className="flex items-center gap-2 text-xs bg-background/50 rounded px-2 py-1">
          <span className="font-medium">{change.jar}:</span>
          <span>{change.current} → {change.suggested}</span>
          <span className="text-muted-foreground">({change.reason})</span>
        </div>
      ))}
    </div>
  )
}

export function CoachCard() {
  const { user } = useAuthContext()
  const { insights, loading, generating, error, generateInsights, markRead, unreadCount } = useCoach(user?.id)
  const { isSubscribed } = useSubscription(user?.id)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Free users see only 2 insights; subscribers see all
  const FREE_LIMIT = 2
  const visibleInsights = isSubscribed ? insights.slice(0, 4) : insights.slice(0, FREE_LIMIT)
  const hasMoreInsights = !isSubscribed && insights.length > FREE_LIMIT
  const extraCount = insights.length - FREE_LIMIT

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Coach
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateInsights}
            disabled={generating}
          >
            {generating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1" />
                Get My Insights
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 mb-4">
              <Brain className="h-8 w-8 text-purple-400" />
            </div>
            <p className="font-medium mb-1">Meet Your AI Coach</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Get personalized tips, seasonal forecasts, and jar recommendations based on your income patterns.
            </p>
            <Button onClick={generateInsights} disabled={generating}>
              {generating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate My First Insights
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Visible (free) insights */}
            {visibleInsights.map((insight) => (
              <div
                key={insight.id}
                className={`rounded-lg border p-3 cursor-pointer transition-all hover:shadow-sm ${
                  insightColors[insight.insight_type] || 'bg-muted'
                } ${!insight.read ? 'ring-2 ring-offset-1 ring-primary/20' : ''}`}
                onClick={() => {
                  if (expanded === insight.id) {
                    setExpanded(null)
                  } else {
                    setExpanded(insight.id)
                    if (!insight.read) markRead(insight.id)
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {insightIcons[insight.insight_type]}
                    <span className="font-medium text-sm">{insight.title}</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${expanded === insight.id ? 'rotate-90' : ''}`} />
                </div>
                {expanded === insight.id && (
                  <div className="mt-2 text-sm opacity-90">
                    <p>{insight.body}</p>
                    <SuggestedChanges data={insight.data} />
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Locked insights for free users */}
            {!isSubscribed && (
              <>
                {LOCKED_INSIGHTS.map((locked) => (
                  <LockedInsightCard
                    key={locked.type}
                    title={locked.title}
                    colorClass={insightColors[locked.type] || 'bg-muted'}
                    icon={insightIcons[locked.type]}
                  />
                ))}

                {/* FOMO CTA */}
                <Link href="/coach" className="block">
                  <div className="rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border border-primary/20 p-4 text-center transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Lock className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">
                        {hasMoreInsights
                          ? `Your coach has ${extraCount} more insight${extraCount > 1 ? 's' : ''}`
                          : 'Unlock your full AI Coach'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Personalized chat, unlimited insights, and smarter money moves
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-xs font-medium">
                      <Sparkles className="h-3 w-3" />
                      Start 7-Day Free Trial
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
