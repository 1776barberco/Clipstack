'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { REFRESH_EVENTS, dispatchRefreshEvents } from '@/lib/refresh-events'
import { supabase } from '@/lib/supabase/client'
import type { PlaidTransaction } from '@/hooks/usePlaidConnections'

type Bucket = {
  id: string
  name: string
  percentage?: number
  current_balance?: number
}

type Props = {
  userId: string
  transactions: PlaidTransaction[]
  buckets: Bucket[]
  onAssigned?: () => Promise<void> | void
}

const money = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(amount || 0))

export function PlaidTransactionReview({ userId, transactions, buckets, onAssigned }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expenseBuckets, setExpenseBuckets] = useState<Record<string, string>>({})
  const [incomeSplits, setIncomeSplits] = useState<Record<string, Record<string, string>>>({})

  const needsReview = useMemo(
    () => transactions.filter((transaction) => transaction.review_status === 'needs_review' || transaction.review_status === 'pending'),
    [transactions]
  )

  const updateSplit = (transactionId: string, bucketId: string, value: string) => {
    setIncomeSplits((current) => ({
      ...current,
      [transactionId]: {
        ...(current[transactionId] ?? {}),
        [bucketId]: value,
      },
    }))
  }

  const applyDefaultSplit = (transaction: PlaidTransaction) => {
    const amount = Math.abs(transaction.amount)
    const next: Record<string, string> = {}
    buckets.forEach((bucket) => {
      const percentage = Number(bucket.percentage ?? 0)
      if (percentage > 0) next[bucket.id] = ((amount * percentage) / 100).toFixed(2)
    })
    setIncomeSplits((current) => ({ ...current, [transaction.id]: next }))
  }

  const assignIncome = async (transaction: PlaidTransaction) => {
    if (busyId) return

    const allocations: Record<string, number> = {}
    Object.entries(incomeSplits[transaction.id] ?? {}).forEach(([bucketId, value]) => {
      const amount = Number(value)
      if (Number.isFinite(amount) && amount > 0) allocations[bucketId] = amount
    })

    if (!Object.keys(allocations).length) {
      toast.error('Add at least one jar split for this income transaction')
      return
    }

    try {
      setBusyId(transaction.id)
      const { error } = await supabase.rpc('assign_plaid_income_to_buckets', {
        p_user_id: userId,
        p_transaction_id: transaction.id,
        p_allocations: allocations,
        p_note: 'Assigned from transaction review',
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Income split into jars')
      dispatchRefreshEvents([REFRESH_EVENTS.incomeUpdated, REFRESH_EVENTS.expensesUpdated])
      await onAssigned?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not assign income')
    } finally {
      setBusyId(null)
    }
  }

  const assignExpense = async (transaction: PlaidTransaction) => {
    if (busyId) return

    const bucketId = expenseBuckets[transaction.id]
    if (!bucketId) {
      toast.error('Choose the jar that paid for this expense')
      return
    }

    const amount = Math.abs(Number(transaction.amount))
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Transaction amount is not valid')
      return
    }

    try {
      setBusyId(transaction.id)
      const response = await fetch('/api/plaid/assign-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.id,
          bucketId,
          amount,
          note: `Synced expense: ${transaction.merchant_name ?? transaction.name}`,
        }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: 'Could not assign expense' }))
        toast.error(result.error ?? 'Could not assign expense')
        return
      }

      toast.success('Expense subtracted from jar')
      dispatchRefreshEvents([REFRESH_EVENTS.expensesUpdated, REFRESH_EVENTS.incomeUpdated])
      await onAssigned?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not assign expense')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Transaction review
            </CardTitle>
            <CardDescription>
              Synced transactions become jar actions here. Income can be split into jars, expenses can be pulled from the jar that paid for them.
            </CardDescription>
          </div>
          <Badge variant={needsReview.length ? 'default' : 'secondary'}>{needsReview.length} needs review</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsReview.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            No synced transactions need review right now. New income and expenses will land here first.
          </div>
        ) : (
          needsReview.slice(0, 10).map((transaction) => {
            const isIncome = transaction.transaction_type === 'income'
            const isExpense = transaction.transaction_type === 'expense' || transaction.primary_category === 'TRANSFER_OUT'
            const split = incomeSplits[transaction.id] ?? {}
            const splitTotal = Object.values(split).reduce((sum, value) => sum + (Number(value) || 0), 0)

            return (
              <div key={transaction.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isIncome ? <ArrowDownCircle className="h-4 w-4 text-emerald-600" /> : <ArrowUpCircle className="h-4 w-4 text-red-600" />}
                      <p className="truncate font-semibold">{transaction.merchant_name ?? transaction.name}</p>
                      <Badge variant="outline">{isIncome ? 'Income' : isExpense ? 'Expense' : 'Transfer'}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {transaction.date} · {transaction.primary_category ?? transaction.detailed_category ?? 'Uncategorized'}
                    </p>
                  </div>
                  <p className={isIncome ? 'font-bold text-emerald-700' : 'font-bold text-red-600'}>{money(transaction.amount)}</p>
                </div>

                {isIncome ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Split income into jars</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDefaultSplit(transaction)}>
                        Use jar percentages
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {buckets.map((bucket) => (
                        <div key={bucket.id} className="flex items-center gap-2">
                          <Label className="w-28 truncate text-xs text-muted-foreground">{bucket.name}</Label>
                          <Input
                            inputMode="decimal"
                            placeholder="0.00"
                            value={split[bucket.id] ?? ''}
                            onChange={(event) => updateSplit(transaction.id, bucket.id, event.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>Allocated: {money(splitTotal)} / {money(transaction.amount)}</span>
                      <Button size="sm" onClick={() => assignIncome(transaction)} disabled={busyId === transaction.id}>
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Assign income
                      </Button>
                    </div>
                  </div>
                ) : isExpense ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Paid from jar</Label>
                      <Select value={expenseBuckets[transaction.id] ?? ''} onValueChange={(value) => setExpenseBuckets((current) => ({ ...current, [transaction.id]: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose jar" />
                        </SelectTrigger>
                        <SelectContent>
                          {buckets.map((bucket) => (
                            <SelectItem key={bucket.id} value={bucket.id}>{bucket.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => assignExpense(transaction)} disabled={busyId === transaction.id}>
                      Subtract from jar
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
                    This transfer is informational and does not need a jar action.
                  </div>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
