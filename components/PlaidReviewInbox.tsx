'use client'

import { useMemo } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Inbox, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlaidTransactionReview } from '@/components/PlaidTransactionReview'
import { useAuthContext } from '@/providers/AuthProvider'
import { useBuckets } from '@/hooks/useBuckets'
import { type PlaidTransaction, usePlaidConnections } from '@/hooks/usePlaidConnections'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function money(amount: number) {
  return currency.format(Math.abs(amount || 0))
}

function statusLabel(status: PlaidTransaction['review_status']) {
  if (status === 'needs_review' || status === 'pending') return 'Needs review'
  if (status === 'assigned' || status === 'reviewed') return 'Reviewed'
  return 'Ignored'
}

function TransactionRows({ transactions, empty }: { transactions: PlaidTransaction[]; empty: string }) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    )
  }

  return (
    <div className="divide-y rounded-lg border">
      {transactions.map((transaction) => {
        const isIncome = transaction.transaction_type === 'income'
        const amount = isIncome ? Math.abs(transaction.amount) : -Math.abs(transaction.amount)

        return (
          <div key={transaction.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {isIncome ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{transaction.merchant_name ?? transaction.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(`${transaction.date}T00:00:00`).toLocaleDateString()} · {transaction.primary_category ?? transaction.detailed_category ?? 'Uncategorized'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <Badge variant={transaction.review_status === 'ignored' ? 'outline' : 'secondary'}>{statusLabel(transaction.review_status)}</Badge>
              <p className={`min-w-20 text-right text-sm font-bold ${amount >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {amount >= 0 ? '+' : '-'}{money(amount)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function PlaidReviewInbox() {
  const { user } = useAuthContext()
  const { buckets, getBucketBalance } = useBuckets(user?.id)
  const { transactions, loading, syncing, reload, sync } = usePlaidConnections(user?.id)

  const reviewBuckets = useMemo(() => buckets.map((bucket) => ({
    id: bucket.id,
    name: bucket.name,
    percentage: bucket.percentage,
    current_balance: getBucketBalance(bucket.id),
  })), [buckets, getBucketBalance])

  const summary = useMemo(() => {
    const needsReview = transactions.filter((transaction) => transaction.review_status === 'needs_review' || transaction.review_status === 'pending')
    const reviewed = transactions.filter((transaction) => transaction.review_status === 'assigned' || transaction.review_status === 'reviewed')
    const ignored = transactions.filter((transaction) => transaction.review_status === 'ignored')
    const needsReviewTotal = needsReview.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)

    return { needsReview, reviewed, ignored, needsReviewTotal }
  }, [transactions])

  if (!user?.id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review inbox</CardTitle>
          <CardDescription>Sign in to review synced transactions.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary" />
                Review inbox
              </CardTitle>
              <CardDescription>
                Categorize Plaid imports here so the dashboard can stay focused on your budget.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => sync().catch(() => undefined)}
              disabled={syncing || loading}
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Needs review</p>
              <p className="text-2xl font-semibold">{summary.needsReview.length}</p>
              <p className="text-xs text-muted-foreground">{currency.format(summary.needsReviewTotal)} waiting</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Reviewed</p>
              <p className="text-2xl font-semibold">{summary.reviewed.length}</p>
              <p className="text-xs text-muted-foreground">Assigned to jars</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Imported</p>
              <p className="text-2xl font-semibold">{transactions.length}</p>
              <p className="text-xs text-muted-foreground">{summary.ignored.length} ignored</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="needs-review" className="space-y-3">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="needs-review">Needs review</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="needs-review">
          <PlaidTransactionReview
            userId={user.id}
            transactions={transactions}
            buckets={reviewBuckets}
            onAssigned={reload}
          />
        </TabsContent>
        <TabsContent value="reviewed">
          <TransactionRows transactions={summary.reviewed} empty="No reviewed Plaid transactions yet." />
        </TabsContent>
        <TabsContent value="all">
          <TransactionRows transactions={transactions} empty="No synced Plaid transactions yet." />
        </TabsContent>
      </Tabs>
    </div>
  )
}
