'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  ArrowDownLeft,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Loader2,
  MinusCircle,
  Pencil,
  PlusCircle,
  Receipt,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthContext } from '@/providers/AuthProvider'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { useBuckets } from '@/hooks/useBuckets'
import { useExpenses } from '@/hooks/useExpenses'
import { useRulesEngine } from '@/hooks/useRulesEngine'
import { REFRESH_EVENTS, dispatchRefreshEvent, dispatchRefreshEvents } from '@/lib/refresh-events'
import { DEMO_MODE, supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type JarActivityItem = {
  id: string
  kind: 'deposit' | 'withdrawal' | 'transfer' | 'expense'
  amount: number
  description: string
  date: string
}

type BucketTransactionRow = {
  id: string
  amount: number
  type: 'deposit' | 'withdrawal' | 'transfer'
  description: string | null
  created_at: string
}

type JarExpenseRow = {
  id: string
  amount: number
  description: string | null
  category: string | null
  entry_date: string
  created_at: string
}

const quickAmounts = [10, 25, 50, 100]

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function formatDate(date: string | null | undefined, pattern = 'MMM d, yyyy') {
  if (!date) return null
  try {
    return format(parseISO(date), pattern)
  } catch {
    return null
  }
}

function activityTone(kind: JarActivityItem['kind']) {
  if (kind === 'deposit') return 'text-green-600'
  return 'text-red-600'
}

function activityIcon(kind: JarActivityItem['kind']) {
  if (kind === 'deposit') return <TrendingUp className="h-4 w-4" />
  if (kind === 'expense') return <Receipt className="h-4 w-4" />
  return <TrendingDown className="h-4 w-4" />
}

function parsePositiveAmount(value: string) {
  const amount = Math.abs(Number(value))
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export function JarDetail({ jarId }: { jarId: string }) {
  const router = useRouter()
  const { user } = useAuthContext()
  const { buckets, balances, loading, getBucketBalance, updateBucket } = useBuckets(user?.id)
  const { accounts } = useBankAccounts(user?.id)
  const { addExpense } = useExpenses(user?.id)
  const { checkAffordability } = useRulesEngine(user?.id)
  const [activity, setActivity] = useState<JarActivityItem[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseAccountId, setExpenseAccountId] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawDescription, setWithdrawDescription] = useState('')
  const [editName, setEditName] = useState('')
  const [editGroupName, setEditGroupName] = useState('')
  const [editColor, setEditColor] = useState('#22c55e')
  const [editPercentage, setEditPercentage] = useState('')
  const [editTargetAmount, setEditTargetAmount] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editRecurring, setEditRecurring] = useState(false)
  const [editRecurringInterval, setEditRecurringInterval] = useState<'weekly' | 'biweekly' | 'monthly' | 'quarterly'>('monthly')
  const [editPriority, setEditPriority] = useState('')
  const [editTaxBucket, setEditTaxBucket] = useState(false)
  const [submittingExpense, setSubmittingExpense] = useState(false)
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false)
  const [savingJar, setSavingJar] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)

  const bucket = buckets.find((item) => item.id === jarId)
  const balance = getBucketBalance(jarId)
  const balanceRow = balances.find((item) => item.bucket_id === jarId)
  const target = Number(bucket?.target_amount || 0)
  const progress = target > 0 ? clampProgress((balance / target) * 100) : clampProgress(bucket?.percentage || 0)
  const dueDate = formatDate(bucket?.due_date, 'MMM d')
  const fullDueDate = formatDate(bucket?.due_date)
  const parsedWithdrawAmount = parsePositiveAmount(withdrawAmount)
  const affordability = parsedWithdrawAmount
    ? checkAffordability({ fromBucketId: jarId, amount: parsedWithdrawAmount })
    : null

  const defaultAccountId = useMemo(() => {
    const primary = accounts.find((account) => account.is_primary)
    return primary?.id ?? accounts[0]?.id ?? ''
  }, [accounts])

  useEffect(() => {
    if (!expenseAccountId && defaultAccountId) {
      setExpenseAccountId(defaultAccountId)
    }
  }, [defaultAccountId, expenseAccountId])

  useEffect(() => {
    if (!bucket) return
    setEditName(bucket.name)
    setEditGroupName(bucket.group_name || '')
    setEditColor(bucket.color || '#22c55e')
    setEditPercentage(String(bucket.percentage ?? 0))
    setEditTargetAmount(bucket.target_amount ? String(bucket.target_amount) : '')
    setEditDueDate(bucket.due_date || '')
    setEditRecurring(Boolean(bucket.is_recurring))
    setEditRecurringInterval(bucket.recurring_interval || 'monthly')
    setEditPriority(String(bucket.priority ?? 0))
    setEditTaxBucket(Boolean(bucket.is_tax_bucket))
  }, [bucket])

  useEffect(() => {
    if (!user || !jarId) {
      setActivityLoading(false)
      return
    }

    if (DEMO_MODE) {
      setActivity([
        {
          id: 'demo-deposit',
          kind: 'deposit',
          amount: 125,
          description: 'Income split',
          date: new Date().toISOString(),
        },
        {
          id: 'demo-expense',
          kind: 'expense',
          amount: 35,
          description: 'Supply run',
          date: new Date().toISOString(),
        },
      ])
      setActivityLoading(false)
      return
    }

    if (!supabase) {
      setActivityLoading(false)
      return
    }

    const fetchActivity = async () => {
      setActivityLoading(true)
      const [transactionRes, expenseRes] = await Promise.all([
        supabase
          .from('bucket_transactions')
          .select('id, amount, type, description, created_at')
          .eq('user_id', user.id)
          .eq('bucket_id', jarId)
          .order('created_at', { ascending: false })
          .limit(25),
        supabase
          .from('expenses')
          .select('id, amount, description, category, entry_date, created_at')
          .eq('user_id', user.id)
          .eq('bucket_id', jarId)
          .order('entry_date', { ascending: false })
          .limit(25),
      ])

      if (transactionRes.error || expenseRes.error) {
        toast.error('Could not load jar activity')
        setActivityLoading(false)
        return
      }

      const transactions = ((transactionRes.data || []) as BucketTransactionRow[]).map((item) => ({
        id: `transaction-${item.id}`,
        kind: item.type as JarActivityItem['kind'],
        amount: Number(item.amount || 0),
        description: item.description || (item.type === 'deposit' ? 'Income split' : 'Jar withdrawal'),
        date: item.created_at,
      }))

      const expenses = ((expenseRes.data || []) as JarExpenseRow[]).map((item) => ({
        id: `expense-${item.id}`,
        kind: 'expense' as const,
        amount: Number(item.amount || 0),
        description: item.description || item.category || 'Expense',
        date: item.entry_date || item.created_at,
      }))

      setActivity(
        [...transactions, ...expenses]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 20)
      )
      setActivityLoading(false)
    }

    fetchActivity()

    const handleRefresh = () => fetchActivity()
    window.addEventListener(REFRESH_EVENTS.incomeUpdated, handleRefresh)
    window.addEventListener(REFRESH_EVENTS.expensesUpdated, handleRefresh)

    return () => {
      window.removeEventListener(REFRESH_EVENTS.incomeUpdated, handleRefresh)
      window.removeEventListener(REFRESH_EVENTS.expensesUpdated, handleRefresh)
    }
  }, [jarId, user])

  const resetExpenseForm = () => {
    setExpenseAmount('')
    setExpenseDescription('')
  }

  const resetWithdrawForm = () => {
    setWithdrawAmount('')
    setWithdrawDescription('')
  }

  const handleExpenseSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !bucket || submittingExpense) return

    const amount = parsePositiveAmount(expenseAmount)
    if (!amount) {
      toast.error('Enter an amount greater than $0')
      return
    }

    setSubmittingExpense(true)
    const { error } = await addExpense({
      user_id: user.id,
      bucket_id: bucket.id,
      account_id: expenseAccountId || null,
      amount,
      description: expenseDescription || null,
      category: null,
      entry_date: format(new Date(), 'yyyy-MM-dd'),
    })
    setSubmittingExpense(false)

    if (error) {
      toast.error('Failed to subtract from jar')
      return
    }

    toast.success(`Subtracted from ${bucket.name}`)
    resetExpenseForm()
    setExpenseOpen(false)
    dispatchRefreshEvents([REFRESH_EVENTS.expensesUpdated, REFRESH_EVENTS.incomeUpdated])
  }

  const handleWithdrawSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !bucket || !supabase || submittingWithdrawal) return

    const amount = parsePositiveAmount(withdrawAmount)
    if (!amount) {
      toast.error('Enter an amount greater than $0')
      return
    }

    setSubmittingWithdrawal(true)
    const { error } = await supabase.from('bucket_transactions').insert({
      user_id: user.id,
      bucket_id: bucket.id,
      amount,
      type: 'withdrawal',
      description: withdrawDescription || 'Withdrawal',
    })
    setSubmittingWithdrawal(false)

    if (error) {
      toast.error('Failed to record withdrawal')
      return
    }

    toast.success(`Withdrawal recorded from ${bucket.name}`)
    resetWithdrawForm()
    setWithdrawOpen(false)
    dispatchRefreshEvent(REFRESH_EVENTS.incomeUpdated)
  }

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!bucket || savingJar) return

    const name = editName.trim()
    if (!name) {
      toast.error('Enter a jar name')
      return
    }

    const percentage = Number(editPercentage || 0)
    const targetAmount = editTargetAmount.trim() ? Number(editTargetAmount) : null
    const priority = Number(editPriority || 0)

    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Percentage must be between 0 and 100')
      return
    }
    if (targetAmount !== null && (!Number.isFinite(targetAmount) || targetAmount < 0)) {
      toast.error('Target amount must be $0 or more')
      return
    }
    if (!Number.isFinite(priority)) {
      toast.error('Priority must be a number')
      return
    }

    setSavingJar(true)
    const { error } = await updateBucket(bucket.id, {
      name,
      group_name: editGroupName.trim() || null,
      color: editColor,
      percentage,
      target_amount: targetAmount && targetAmount > 0 ? targetAmount : null,
      due_date: editDueDate || null,
      is_recurring: editRecurring,
      recurring_interval: editRecurring ? editRecurringInterval : null,
      priority,
      is_tax_bucket: editTaxBucket,
    })
    setSavingJar(false)

    if (error) {
      toast.error(error.message || 'Failed to update jar')
      return
    }

    toast.success(`${name} updated`)
    setEditOpen(false)
    dispatchRefreshEvent(REFRESH_EVENTS.incomeUpdated)
  }

  const handleMarkPaid = async () => {
    if (!bucket) return

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
        return
      }

      toast.success(`${bucket.name} marked paid`)
      dispatchRefreshEvent(REFRESH_EVENTS.incomeUpdated)
    } catch {
      toast.error('Network error. Could not mark jar paid')
    } finally {
      setMarkingPaid(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl space-y-4 p-4">
          <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-56 animate-pulse rounded-lg bg-muted" />
          <div className="h-80 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  if (!bucket) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-3xl p-4">
          <Button type="button" variant="ghost" className="mb-4" onClick={() => router.push('/jars')}>
            <ArrowLeft className="h-4 w-4" />
            Back to jars
          </Button>
          <Card>
            <CardContent className="p-8 text-center">
              <PiggyBankMissing />
              <p className="mt-4 text-lg font-semibold">Jar not found</p>
              <p className="mt-1 text-sm text-muted-foreground">It may have been deleted or belongs to another account.</p>
              <Button asChild className="mt-4">
                <Link href="/jars">View jars</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
          <Button type="button" variant="ghost" size="icon" aria-label="Back to jars" onClick={() => router.push('/jars')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-muted-foreground">Jar Detail</p>
            <h1 className="truncate text-xl font-bold">{bucket.name}</h1>
          </div>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit {bucket.name}</DialogTitle>
                <DialogDescription>Update this jar without digging through Settings.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-2">
                    <Label htmlFor="jar-name">Name</Label>
                    <Input id="jar-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jar-color">Color</Label>
                    <Input
                      id="jar-color"
                      type="color"
                      value={editColor}
                      onChange={(event) => setEditColor(event.target.value)}
                      className="h-10 w-full min-w-20 p-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jar-group">Group</Label>
                  <Input id="jar-group" value={editGroupName} onChange={(event) => setEditGroupName(event.target.value)} placeholder="Personal, Business, Taxes..." />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="jar-percentage">Income split %</Label>
                    <Input
                      id="jar-percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editPercentage}
                      onChange={(event) => setEditPercentage(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jar-target">Fixed target</Label>
                    <Input
                      id="jar-target"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editTargetAmount}
                      onChange={(event) => setEditTargetAmount(event.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="jar-due-date">Due date</Label>
                    <Input id="jar-due-date" type="date" value={editDueDate} onChange={(event) => setEditDueDate(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jar-priority">Priority</Label>
                    <Input id="jar-priority" type="number" step="1" value={editPriority} onChange={(event) => setEditPriority(event.target.value)} />
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <label className="flex min-h-11 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editRecurring}
                      onChange={(event) => setEditRecurring(event.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium">Recurring jar</span>
                  </label>
                  {editRecurring && (
                    <div className="mt-3 space-y-2">
                      <Label htmlFor="jar-recurring-interval">Interval</Label>
                      <Select value={editRecurringInterval} onValueChange={(value) => setEditRecurringInterval(value as typeof editRecurringInterval)}>
                        <SelectTrigger id="jar-recurring-interval">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Biweekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <label className="flex min-h-11 items-center gap-3 rounded-lg border p-3">
                  <input
                    type="checkbox"
                    checked={editTaxBucket}
                    onChange={(event) => setEditTaxBucket(event.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">Tax jar</span>
                </label>

                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Button type="submit" disabled={savingJar || !editName.trim()}>
                    {savingJar ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Save jar
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/settings">
                      <Pencil className="h-4 w-4" />
                      Advanced
                    </Link>
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl space-y-4 p-4 md:space-y-6">
        <Card>
          <CardContent className="p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: bucket.color }} />
                  {bucket.group_name && <Badge variant="secondary">{bucket.group_name}</Badge>}
                  {bucket.is_tax_bucket && <Badge variant="outline">Tax</Badge>}
                  {bucket.is_recurring && <Badge variant="outline">Recurring</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">Current balance</p>
                <p className="break-words text-3xl font-bold tracking-normal sm:text-4xl">{formatCurrency(balance)}</p>
              </div>
              <Wallet className="mt-1 h-6 w-6 shrink-0 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{target > 0 ? 'Target progress' : 'Income allocation'}</span>
                <span className="font-semibold">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {target > 0
                  ? `${formatCurrency(balance)} saved of ${formatCurrency(target)}`
                  : `${bucket.percentage}% of each income entry goes here`}
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Deposited</p>
              <p className="break-words text-2xl font-bold">{formatCurrency(Number(balanceRow?.total_deposits || 0))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Withdrawn</p>
              <p className="break-words text-2xl font-bold">{formatCurrency(Number(balanceRow?.total_withdrawals || 0))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Spent</p>
              <p className="break-words text-2xl font-bold">{formatCurrency(Number(balanceRow?.total_expenses || 0))}</p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Allocation</p>
              <p className="font-semibold">{target > 0 ? `${formatCurrency(target)} fixed amount` : `${bucket.percentage}% of income`}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Due date</p>
              <p className="flex items-center gap-2 font-semibold">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                {fullDueDate || 'No due date'}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Recurring</p>
              <p className="flex items-center gap-2 font-semibold">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                {bucket.is_recurring && bucket.recurring_interval ? bucket.recurring_interval : 'Not recurring'}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Priority</p>
              <p className="font-semibold">{bucket.priority}</p>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-3 sm:grid-cols-3">
          <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="min-h-11 w-full" variant="outline">
                <MinusCircle className="h-4 w-4" />
                Subtract
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Subtract from {bucket.name}</DialogTitle>
                <DialogDescription>Use this when a bill, supply run, or personal spend came from this jar.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {quickAmounts.map((amount) => (
                    <Button key={amount} type="button" variant="outline" size="sm" className="min-h-11" onClick={() => setExpenseAmount(String(amount))}>
                      ${amount}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(event) => setExpenseAmount(event.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-account">Bank account</Label>
                  <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
                    <SelectTrigger id="expense-account">
                      <SelectValue placeholder="Choose account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-description">Note</Label>
                  <Input
                    id="expense-description"
                    value={expenseDescription}
                    onChange={(event) => setExpenseDescription(event.target.value)}
                    placeholder="Booth rent, color bowls, lunch..."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!expenseAmount || submittingExpense}>
                  {submittingExpense && <Loader2 className="h-4 w-4 animate-spin" />}
                  Subtract from jar
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="min-h-11 w-full" variant="outline">
                <ArrowDownLeft className="h-4 w-4" />
                Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Withdraw from {bucket.name}</DialogTitle>
                <DialogDescription>Record money moved out of this jar.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdraw-description">Note</Label>
                  <Input
                    id="withdraw-description"
                    value={withdrawDescription}
                    onChange={(event) => setWithdrawDescription(event.target.value)}
                    placeholder="Moved to checking"
                  />
                </div>
                {affordability && (
                  <div className={`rounded-lg p-3 text-sm ${affordability.canAfford ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <p className="font-medium">{affordability.canAfford ? 'Looks okay' : 'Not enough available'}</p>
                    <p>{affordability.reason}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={!withdrawAmount || !affordability?.canAfford || submittingWithdrawal}>
                  {submittingWithdrawal && <Loader2 className="h-4 w-4 animate-spin" />}
                  Record withdrawal
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            type="button"
            className="min-h-11 w-full"
            variant="outline"
            disabled={!bucket.is_recurring || !bucket.due_date || balance <= 0 || markingPaid}
            onClick={handleMarkPaid}
          >
            {markingPaid ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Mark paid
          </Button>
        </section>

        {bucket.is_recurring && dueDate && (
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-sm text-blue-700">
            Next due {dueDate}. Mark paid withdraws the jar balance and advances the due date.
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-14 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <PlusCircle className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="font-medium">No movement yet</p>
                <p className="text-sm text-muted-foreground">Income splits, expenses, and withdrawals will show here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={activityTone(item.kind)}>{activityIcon(item.kind)}</span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(item.date) || item.date}</p>
                      </div>
                    </div>
                    <p className={`shrink-0 text-right font-bold ${activityTone(item.kind)}`}>
                      {item.kind === 'deposit' ? '+' : '-'}
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function PiggyBankMissing() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <Wallet className="h-6 w-6 text-muted-foreground" />
    </div>
  )
}
