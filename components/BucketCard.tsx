'use client'

import { useState } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useExpenses } from '@/hooks/useExpenses'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'
import { MinusCircle, Loader2, Receipt, CalendarClock, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format, differenceInDays, parseISO } from 'date-fns'

interface BucketCardProps {
  bucket: {
    id: string
    name: string
    group_name?: string | null
    color: string
    percentage: number
    is_tax_bucket?: boolean
    target_amount?: number | null
    due_date?: string | null
    is_recurring?: boolean
    recurring_interval?: string | null
  }
  balance: number
  totalBalance: number
  onExpenseAdded?: () => void
}

/** Returns null when there's no target+due_date, otherwise 'green' | 'yellow' | 'red' */
function getRiskLevel(
  balance: number,
  targetAmount: number | null | undefined,
  dueDate: string | null | undefined
): 'green' | 'yellow' | 'red' | null {
  if (!targetAmount || targetAmount <= 0 || !dueDate) return null

  const today = new Date()
  const due = parseISO(dueDate)
  const daysLeft = differenceInDays(due, today)
  const pct = balance / targetAmount // 0–1+

  // Already met the goal
  if (pct >= 1) return 'green'

  // Past due and still not met
  if (daysLeft < 0) return 'red'

  // Critical: due very soon and significantly short
  if (daysLeft <= 3 && pct < 0.9) return 'red'

  // At risk: due within a week and less than halfway there,
  // or due within 2 weeks and less than 25% funded
  if ((daysLeft <= 7 && pct < 0.5) || (daysLeft <= 14 && pct < 0.25)) return 'yellow'

  return 'green'
}

const RISK_ICON: Record<'green' | 'yellow' | 'red', string> = {
  green: '🟢',
  yellow: '🟡',
  red: '🔴',
}

const RISK_LABEL: Record<'green' | 'yellow' | 'red', string> = {
  green: 'On track',
  yellow: 'Heads up',
  red: 'Needs attention',
}

export function BucketCard({ bucket, balance, totalBalance, onExpenseAdded }: BucketCardProps) {
  const { user } = useAuthContext()
  const { addExpense } = useExpenses(user?.id)
  const { accounts } = useBankAccounts(user?.id)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseAccountId, setExpenseAccountId] = useState('')
  const [loading, setLoading] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!expenseAccountId && accounts.length > 0) {
    const primary = accounts.find((account) => account.is_primary)
    setExpenseAccountId(primary?.id ?? accounts[0].id)
  }

  const percentage = totalBalance > 0 ? (balance / totalBalance) * 100 : 0
  const riskLevel = getRiskLevel(balance, bucket.target_amount, bucket.due_date)

  const handleMarkPaid = async (e: React.MouseEvent) => {
    e.stopPropagation() // prevent opening the expense dialog
    if (!user) return

    setMarkingPaid(true)
    try {
      const res = await fetch('/api/jars/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketId: bucket.id }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to mark jar as paid')
      } else {
        toast.success(`${bucket.name} marked as paid! Next due: ${data.newDueDate}`)
        // Trigger a data refresh
        window.dispatchEvent(new Event('income-updated'))
        onExpenseAdded?.()
      }
    } catch {
      toast.error('Network error — could not mark jar as paid')
    } finally {
      setMarkingPaid(false)
    }
  }

  const handleQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseAmount || !user) return

    setLoading(true)
    const expenseData: Record<string, unknown> = {
      user_id: user.id,
      bucket_id: bucket.id,
      amount: parseFloat(expenseAmount),
      description: expenseDescription || null,
      category: null,
      entry_date: format(new Date(), 'yyyy-MM-dd'),
    }
    if (expenseAccountId && accounts.some((account) => account.id === expenseAccountId)) {
      expenseData.account_id = expenseAccountId
    }

    const { error } = await addExpense(expenseData as Parameters<typeof addExpense>[0])
    setLoading(false)

    if (error) {
      toast.error('Failed to add expense')
    } else {
      toast.success(`Expense added to ${bucket.name}!`)
      setExpenseAmount('')
      setExpenseDescription('')
      setDialogOpen(false)
      onExpenseAdded?.()
    }
  }

  const quickAmounts = [10, 20, 50, 100]

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98] group">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <ProgressRing
                value={
                  bucket.target_amount && bucket.target_amount > 0
                    ? totalBalance > 0
                      ? Math.min(100, (balance / bucket.target_amount) * 100)
                      : 0
                    : percentage
                }
                size={56}
                strokeWidth={4}
                color={bucket.color}
              >
                <span className="text-xs font-bold">
                  {bucket.target_amount && bucket.target_amount > 0
                    ? `${totalBalance > 0 ? Math.min(100, Math.round((balance / bucket.target_amount) * 100)) : 0}%`
                    : `${bucket.percentage}%`}
                </span>
              </ProgressRing>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: bucket.color }} />
                  <span className="font-semibold truncate">{bucket.name}</span>
                  {bucket.is_tax_bucket && (
                    <span className="text-[10px] text-muted-foreground">(Tax)</span>
                  )}
                  {bucket.group_name && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {bucket.group_name}
                    </span>
                  )}
                  {riskLevel && (
                    <span
                      className="text-sm leading-none"
                      title={RISK_LABEL[riskLevel]}
                    >
                      {RISK_ICON[riskLevel]}
                    </span>
                  )}
                </div>

                <p className="text-xl font-bold">{formatCurrency(balance)}</p>

                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-xs text-muted-foreground">
                    {bucket.target_amount && bucket.target_amount > 0
                      ? `$${bucket.target_amount} fixed`
                      : `${bucket.percentage}% allocation`}
                  </p>
                  {bucket.due_date && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3 shrink-0" />
                      Due {format(parseISO(bucket.due_date), 'MMM d')}
                    </span>
                  )}
                  {bucket.is_recurring && (
                    <span className="flex items-center gap-0.5 text-xs text-blue-400">
                      <RefreshCw className="h-3 w-3 shrink-0" />
                      {bucket.recurring_interval}
                    </span>
                  )}
                </div>
                {bucket.is_recurring && bucket.due_date && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs gap-1.5"
                    onClick={handleMarkPaid}
                    disabled={markingPaid || balance <= 0}
                  >
                    {markingPaid ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Mark as Paid ✅
                  </Button>
                )}
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <MinusCircle className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Add Expense to {bucket.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleQuickExpense} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={balance}
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="pl-8 text-lg"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Available: {formatCurrency(balance)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpenseAmount(amt.toString())}
                disabled={amt > balance}
              >
                ${amt}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bucket-expense-account">Paying from account</Label>
            <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
              <SelectTrigger id="bucket-expense-account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}{account.is_primary ? ' ★' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-description">Description (optional)</Label>
            <Input
              id="expense-description"
              placeholder="e.g., Supplies, Tools..."
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!expenseAmount || parseFloat(expenseAmount) > balance || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <MinusCircle className="mr-2 h-4 w-4" />
                Add Expense
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
