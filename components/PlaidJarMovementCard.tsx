'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Landmark, ListChecks, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuthContext } from '@/providers/AuthProvider'
import { useBuckets } from '@/hooks/useBuckets'
import { usePlaidConnections } from '@/hooks/usePlaidConnections'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function signedCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'always',
  }).format(amount)
}

export function PlaidJarMovementCard() {
  const { user } = useAuthContext()
  const { buckets, getBucketBalance } = useBuckets(user?.id)
  const { accounts, transactions, loading, syncing, sync } = usePlaidConnections(user?.id)

  const summary = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.transaction_type === 'income')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)

    const spending = transactions
      .filter((transaction) => transaction.transaction_type === 'expense')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)

    const reviewQueue = transactions.filter((transaction) => transaction.review_status === 'needs_review' || transaction.review_status === 'pending')
    const needsReview = reviewQueue.length
    const reviewTotal = reviewQueue.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
    const topReviewTransaction = [...reviewQueue].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0]
    const assigned = transactions.filter((transaction) => transaction.review_status === 'assigned' || transaction.review_status === 'reviewed').length
    const connectedBalance = accounts.reduce((sum, account) => {
      if (!account.is_active || account.type !== 'depository') return sum
      return sum + Number(account.current_balance ?? account.available_balance ?? 0)
    }, 0)
    const jarBalance = buckets.reduce((sum, bucket) => sum + Number(getBucketBalance(bucket.id) ?? 0), 0)
    const allocationProgress = connectedBalance > 0 ? Math.min(100, Math.round((jarBalance / connectedBalance) * 100)) : 0
    const jarDifference = jarBalance - connectedBalance

    return { income, spending, net: income - spending, connectedBalance, jarBalance, jarDifference, allocationProgress, needsReview, reviewTotal, topReviewTransaction, assigned }
  }, [accounts, buckets, getBucketBalance, transactions])

  if (!loading && accounts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Bank activity
          </CardTitle>
          <CardDescription>
            Connect your bank through Plaid in Settings to automatically pull transactions into this breakdown. TipJars stays read-only.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-emerald-600" />
              Bank activity
            </CardTitle>
            <CardDescription>
              Synced bank activity against your TipJars plan. Keep the dashboard clean, then review imported transactions in the inbox when they need a jar action.
            </CardDescription>
          </div>
          <Badge variant="secondary">Read-only bank sync</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${summary.needsReview ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {summary.needsReview ? <ListChecks className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-semibold">{summary.needsReview ? `${summary.needsReview} transactions need review` : 'Transaction review is clear'}</p>
                <p className="text-sm text-muted-foreground">
                  {summary.needsReview
                    ? `${currency.format(summary.reviewTotal)} waiting in the review inbox${summary.topReviewTransaction ? `, including ${summary.topReviewTransaction.merchant_name ?? summary.topReviewTransaction.name}` : ''}.`
                    : 'New Plaid imports will appear in the review inbox when they need a jar action.'}
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/review">Open review inbox</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowDownLeft className="h-3 w-3" /> Imported income</p>
            <p className="text-xl font-semibold text-emerald-600">{currency.format(summary.income)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowUpRight className="h-3 w-3" /> Imported spending</p>
            <p className="text-xl font-semibold">{currency.format(summary.spending)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Net movement</p>
            <p className={`text-xl font-semibold ${summary.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {signedCurrency(summary.net)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Bank balance seen</p>
            <p className="text-xl font-semibold">{currency.format(summary.connectedBalance)}</p>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Jar allocation check</span>
            <span className={summary.jarDifference > 0 ? 'text-amber-700' : summary.jarDifference < 0 ? 'text-red-600' : 'text-emerald-600'}>
              {signedCurrency(summary.jarDifference)}
            </span>
          </div>
          <Progress value={summary.allocationProgress} className="h-2" />
          <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <span>In jars: {currency.format(summary.jarBalance)}</span>
            <span>Bank seen: {currency.format(summary.connectedBalance)}</span>
            <span>{summary.jarDifference === 0 ? 'Jars match the connected account.' : 'Assign review items to reconcile jars with the bank.'}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => sync().catch(() => undefined)}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync bank activity'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
