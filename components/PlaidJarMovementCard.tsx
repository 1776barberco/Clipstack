'use client'

import { useMemo } from 'react'
import { ArrowDownLeft, ArrowUpRight, Landmark, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuthContext } from '@/providers/AuthProvider'
import { useBuckets } from '@/hooks/useBuckets'
import { usePlaidConnections } from '@/hooks/usePlaidConnections'
import { PlaidTransactionReview } from '@/components/PlaidTransactionReview'

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
  const { accounts, transactions, loading, syncing, sync, reload } = usePlaidConnections(user?.id)

  const summary = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.transaction_type === 'income')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)

    const spending = transactions
      .filter((transaction) => transaction.transaction_type === 'expense')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)

    const needsReview = transactions.filter((transaction) => transaction.review_status === 'needs_review' || transaction.review_status === 'pending').length
    const assigned = transactions.filter((transaction) => transaction.review_status === 'assigned' || transaction.review_status === 'reviewed').length
    const connectedBalance = accounts.reduce((sum, account) => sum + (account.current_balance ?? 0), 0)
    const jarTarget = buckets.reduce((sum, bucket) => sum + Number(bucket.target_amount ?? 0), 0)
    const jarBalance = buckets.reduce((sum, bucket) => sum + Number(getBucketBalance(bucket.id) ?? 0), 0)
    const allocationProgress = jarTarget > 0 ? Math.min(100, Math.round((jarBalance / jarTarget) * 100)) : 0

    return { income, spending, net: income - spending, connectedBalance, jarTarget, jarBalance, allocationProgress, needsReview, assigned }
  }, [accounts, buckets, getBucketBalance, transactions])

  if (!loading && accounts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Bank-fed jar movement
          </CardTitle>
          <CardDescription>
            Connect Plaid in Settings to automatically pull bank transactions into this breakdown. TipJars stays read-only.
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
              Bank-fed jar movement
            </CardTitle>
            <CardDescription>
              Clear view of imported bank activity against your TipJars plan. Visualize income, spending, and jar movement with read-only Plaid data. No money is moved.
            </CardDescription>
          </div>
          <Badge variant="secondary">Plaid read-only</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {user?.id && (
          <PlaidTransactionReview
            userId={user.id}
            transactions={transactions}
            buckets={buckets.map((bucket) => ({
              id: bucket.id,
              name: bucket.name,
              percentage: bucket.percentage,
              current_balance: getBucketBalance(bucket.id),
            }))}
            onAssigned={reload}
          />
        )}

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
            <span className="font-medium">Jar plan funded</span>
            <span className="text-muted-foreground">{currency.format(summary.jarBalance)} / {currency.format(summary.jarTarget)}</span>
          </div>
          <Progress value={summary.allocationProgress} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            Imported transactions show where money moved. Jar balances show how it should be allocated.
          </p>
        </div>

        {transactions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Latest imported movement</h3>
              <button
                type="button"
                onClick={() => sync().catch(() => undefined)}
                disabled={syncing}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : 'Sync now'}
              </button>
            </div>
            <div className="divide-y rounded-lg border">
              {transactions.slice(0, 6).map((transaction) => {
                const amount = transaction.transaction_type === 'income' ? Math.abs(transaction.amount) : -Math.abs(transaction.amount)
                return (
                  <div key={transaction.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <div>
                      <p className="font-medium">{transaction.merchant_name ?? transaction.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(`${transaction.date}T00:00:00`).toLocaleDateString()} • {transaction.primary_category ?? transaction.transaction_type}
                      </p>
                    </div>
                    <p className={`font-semibold ${amount >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {signedCurrency(amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
