'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Layers3,
  PiggyBank,
  RefreshCw,
  Settings,
  Target,
  Wallet,
} from 'lucide-react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useBuckets } from '@/hooks/useBuckets'
import { formatCurrency } from '@/lib/utils'
import { BankTotalCard } from '@/components/BankTotalCard'
import { BoothRentCard } from '@/components/BoothRentCard'
import { TaxEstimateCard } from '@/components/TaxEstimateCard'
import { UserMenu } from '@/components/UserMenu'
import { WithdrawButton } from '@/components/WithdrawButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return null
  try {
    return format(parseISO(dueDate), 'MMM d')
  } catch {
    return null
  }
}

export function JarsOverview() {
  const { user } = useAuthContext()
  const { buckets, loading, getBucketBalance, getTotalBalance } = useBuckets(user?.id)

  const totalBalance = getTotalBalance()
  const totalAllocation = buckets.reduce((sum, bucket) => sum + Number(bucket.percentage || 0), 0)
  const targetJars = buckets.filter((bucket) => Number(bucket.target_amount || 0) > 0)
  const upcomingJars = useMemo(
    () =>
      buckets
        .filter((bucket) => bucket.due_date)
        .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
        .slice(0, 3),
    [buckets]
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Manage Money</p>
            <h1 className="text-xl font-bold">Jars</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label="Jar settings">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <div className="hidden sm:block">
              <WithdrawButton />
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-4 p-4 md:space-y-6">
        <BankTotalCard />

        <section className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">In jars</p>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
              <p className="text-xs text-muted-foreground">{buckets.length} active jar{buckets.length === 1 ? '' : 's'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Split set</p>
                <Layers3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{Math.round(totalAllocation)}%</p>
              <p className="text-xs text-muted-foreground">Percentage jars on new income</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Goals</p>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{targetJars.length}</p>
              <p className="text-xs text-muted-foreground">Fixed or target jars</p>
            </CardContent>
          </Card>
        </section>

        <div className="sm:hidden">
          <WithdrawButton />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Jar Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground">Tap a jar to see balance, schedule, and recent movement.</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-36 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : buckets.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <PiggyBank className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-semibold">No jars yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Create jars in Settings so every tip, cut, and service dollar has a job.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/settings">Set up jars</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {buckets.map((bucket) => {
                  const balance = getBucketBalance(bucket.id)
                  const target = Number(bucket.target_amount || 0)
                  const progressValue = target > 0 ? clampProgress((balance / target) * 100) : clampProgress(bucket.percentage)
                  const dueDate = formatDueDate(bucket.due_date)

                  return (
                    <Link
                      key={bucket.id}
                      href={`/jars/${bucket.id}`}
                      aria-label={`Open ${bucket.name} jar details`}
                      className="rounded-lg border bg-card p-4 text-card-foreground transition hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-1 flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: bucket.color }} />
                            <p className="truncate font-semibold">{bucket.name}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {bucket.group_name && <Badge variant="secondary">{bucket.group_name}</Badge>}
                            {bucket.is_tax_bucket && <Badge variant="outline">Tax</Badge>}
                            {bucket.is_recurring && <Badge variant="outline">Recurring</Badge>}
                          </div>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
                          <p className="text-xs text-muted-foreground">
                            {target > 0 ? `${formatCurrency(target)} target` : `${bucket.percentage}% of new income`}
                          </p>
                        </div>
                        <Progress value={progressValue} />
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {dueDate && (
                            <span className="flex items-center gap-1">
                              <CalendarClock className="h-3 w-3" />
                              Due {dueDate}
                            </span>
                          )}
                          {bucket.is_recurring && bucket.recurring_interval && (
                            <span className="flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" />
                              {bucket.recurring_interval}
                            </span>
                          )}
                          {balance <= 0 && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Empty
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {upcomingJars.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Coming Up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingJars.map((bucket) => (
                <Link
                  key={bucket.id}
                  href={`/jars/${bucket.id}`}
                  aria-label={`Open ${bucket.name} jar details`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: bucket.color }} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{bucket.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {bucket.is_recurring && bucket.recurring_interval ? `${bucket.recurring_interval} jar` : 'Due date set'}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-right text-sm font-semibold">{formatDueDate(bucket.due_date)}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <BoothRentCard />
          <TaxEstimateCard />
        </section>
      </main>
    </div>
  )
}
