'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  DollarSign,
  Landmark,
  Loader2,
  PlusCircle,
  Settings2,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useAuthContext } from '@/providers/AuthProvider'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { useBuckets } from '@/hooks/useBuckets'
import { useExpenses } from '@/hooks/useExpenses'
import { useIncome } from '@/hooks/useIncome'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { IncomeSplitStep } from '@/components/IncomeSplitStep'
import { REFRESH_EVENTS, dispatchRefreshEvent, dispatchRefreshEvents } from '@/lib/refresh-events'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const DEFAULT_QUICK_AMOUNTS = [20, 40, 60, 100]
const STORAGE_KEY = 'tipjars-quick-amounts'
const BANK_TOTAL_BUCKET = '__bank_total__'

type Mode = 'income' | 'expense'
type Step = 'entry' | 'split'

type IncomeEntrySheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: Mode
  defaultBucketId?: string
  title?: string
  description?: string
  onSuccess?: () => void
}

function getQuickAmounts(): number[] {
  if (typeof window === 'undefined') return DEFAULT_QUICK_AMOUNTS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_QUICK_AMOUNTS
}

function saveQuickAmounts(amounts: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(amounts))
  } catch {}
}

function getErrorMessage(error: unknown) {
  return typeof error === 'object' && error && 'message' in error
    ? String((error as { message?: unknown }).message || 'Unknown error')
    : 'Unknown error'
}

function parsePositiveAmount(value: string) {
  const amount = Math.abs(Number(value))
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export function IncomeEntrySheet({
  open,
  onOpenChange,
  defaultMode = 'income',
  defaultBucketId,
  title = 'Quick Log',
  description = 'Log income or expenses and keep your jars up to date.',
  onSuccess,
}: IncomeEntrySheetProps) {
  const { user, loading: authLoading } = useAuthContext()
  const { addIncome } = useIncome(user?.id)
  const { addExpense } = useExpenses(user?.id)
  const { buckets } = useBuckets(user?.id)
  const { accounts, createAccount } = useBankAccounts(user?.id)
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [step, setStep] = useState<Step>('entry')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [selectedBucket, setSelectedBucket] = useState(defaultBucketId ?? BANK_TOTAL_BUCKET)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [quickAmounts, setQuickAmounts] = useState(DEFAULT_QUICK_AMOUNTS)
  const [editingAmounts, setEditingAmounts] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState('checking')
  const [newAccountBalance, setNewAccountBalance] = useState('')
  const [addingAccount, setAddingAccount] = useState(false)

  useEffect(() => {
    setQuickAmounts(getQuickAmounts())
  }, [])

  useEffect(() => {
    if (open) {
      setMode(defaultMode)
      setSelectedBucket(defaultBucketId ?? BANK_TOTAL_BUCKET)
    }
  }, [defaultBucketId, defaultMode, open])

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      const primary = accounts.find((account) => account.is_primary)
      setSelectedAccountId(primary?.id ?? accounts[0].id)
    }
  }, [accounts, selectedAccountId])

  useEffect(() => {
    if (mode === 'expense' && !selectedBucket) {
      setSelectedBucket(BANK_TOTAL_BUCKET)
    }
  }, [mode, selectedBucket])

  const fixedJars = buckets
    .filter((bucket) => bucket.target_amount && bucket.target_amount > 0)
    .map((bucket) => ({
      id: bucket.id,
      name: bucket.name,
      color: bucket.color,
      target_amount: bucket.target_amount!,
    }))

  const percentageJars = buckets
    .filter((bucket) => !bucket.target_amount || bucket.target_amount === 0)
    .filter((bucket) => bucket.percentage > 0)
    .map((bucket) => ({
      id: bucket.id,
      name: bucket.name,
      color: bucket.color,
      percentage: bucket.percentage,
    }))

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  )
  const selectedExpenseTarget =
    selectedBucket === BANK_TOTAL_BUCKET
      ? 'Bank Total'
      : buckets.find((bucket) => bucket.id === selectedBucket)?.name
  const parsedAmount = parseFloat(amount)
  const amountLabel = Number.isFinite(parsedAmount) && parsedAmount > 0
    ? `$${parsedAmount.toFixed(2)}`
    : 'this amount'
  const actionPreview = mode === 'expense'
    ? `Log ${amountLabel} expense${selectedAccount ? ` from ${selectedAccount.name}` : ''}${selectedExpenseTarget ? ` to ${selectedExpenseTarget}` : ''}`
    : `Log ${amountLabel} income${selectedAccount ? ` to ${selectedAccount.name}` : ''}`
  const hasValidAccount = selectedAccountId && accounts.some((account) => account.id === selectedAccountId)

  const reset = () => {
    setAmount('')
    setNote('')
    setStep('entry')
    setSelectedBucket(defaultBucketId ?? BANK_TOTAL_BUCKET)
    setSelectedAccountId(null)
    setEditingAmounts(false)
    setAmountInput('')
    setShowAddAccount(false)
    setNewAccountName('')
    setNewAccountType('checking')
    setNewAccountBalance('')
  }

  const closeAndReset = () => {
    reset()
    onOpenChange(false)
  }

  const completeAndClose = () => {
    closeAndReset()
    onSuccess?.()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }
    closeAndReset()
  }

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode)
    setStep('entry')
  }

  const createIncomeEntry = async (value: number) => {
    if (!user) {
      return { data: null, error: new Error('You must be signed in to add income.') }
    }

    const incomeData: Record<string, unknown> = {
      user_id: user.id,
      amount: value,
      source: note || null,
      notes: null,
      entry_date: format(new Date(), 'yyyy-MM-dd'),
    }
    if (hasValidAccount) incomeData.account_id = selectedAccountId

    return addIncome(incomeData as Parameters<typeof addIncome>[0])
  }

  const finishIncomeSuccess = (message: string) => {
    toast.success(message)
    dispatchRefreshEvent(REFRESH_EVENTS.incomeUpdated)
    completeAndClose()
  }

  const handleNext = () => {
    if (loading) return
    const value = parsePositiveAmount(amount)
    if (!value) {
      toast.error('Enter an amount greater than $0')
      return
    }
    if (mode === 'expense') {
      void handleSubmitDirect()
      return
    }
    if (selectedAccount?.type === 'savings') {
      void handleSubmitDirect()
      return
    }
    if (fixedJars.length > 0) {
      setStep('split')
      return
    }
    void handleSubmitDirect()
  }

  const handleSubmitDirect = async () => {
    if (!amount || authLoading || loading) return
    if (!user) {
      toast.error(`You must be signed in to add ${mode === 'expense' ? 'an expense' : 'income'}.`)
      return
    }

    const value = parsePositiveAmount(amount)
    if (!value) {
      toast.error('Enter an amount greater than $0')
      return
    }

    setLoading(true)
    if (mode === 'income') {
      const { error } = await createIncomeEntry(value)
      setLoading(false)

      if (error) {
        console.error('Income insert error:', error)
        toast.error(`Failed to log income: ${getErrorMessage(error)}`)
        return
      }

      finishIncomeSuccess(`+$${value.toFixed(2)} logged!`)
      return
    }

    if (!selectedBucket) {
      toast.error('Select a jar or Bank Total')
      setLoading(false)
      return
    }

    const isJarless = selectedBucket === BANK_TOTAL_BUCKET
    const expenseData: Record<string, unknown> = {
      user_id: user.id,
      bucket_id: isJarless ? null : selectedBucket,
      amount: value,
      description: note || null,
      category: null,
      entry_date: format(new Date(), 'yyyy-MM-dd'),
    }
    if (hasValidAccount) expenseData.account_id = selectedAccountId

    const { error } = await addExpense(expenseData as Parameters<typeof addExpense>[0])
    setLoading(false)

    if (error) {
      console.error('Expense insert error:', error)
      toast.error('Failed to log expense')
      return
    }

    if (isJarless) {
      toast.success(`-$${value.toFixed(2)} from Bank Total`)
    } else {
      const jar = buckets.find((bucket) => bucket.id === selectedBucket)
      toast.success(`-$${value.toFixed(2)} from ${jar?.name || 'jar'}`)
    }
    dispatchRefreshEvents([REFRESH_EVENTS.expensesUpdated, REFRESH_EVENTS.incomeUpdated])
    completeAndClose()
  }

  const handleSplitConfirm = async (fixedAllocations: Record<string, number>) => {
    if (!amount || authLoading || loading) return
    if (!user) {
      toast.error('You must be signed in to add income.')
      return
    }

    const value = parsePositiveAmount(amount)
    if (!value) {
      toast.error('Enter an amount greater than $0')
      return
    }

    setLoading(true)
    try {
      const { data: income, error: incomeError } = await createIncomeEntry(value)

      if (incomeError || !income) {
        toast.error(`Failed to add income: ${incomeError?.message || 'Unknown error'}`)
        setLoading(false)
        return
      }

      if (Object.keys(fixedAllocations).length > 0 && supabase) {
        const { error: deleteError } = await supabase
          .from('bucket_transactions')
          .delete()
          .eq('income_entry_id', income.id)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError

        const { error: rpcError } = await supabase.rpc('allocate_income_to_buckets', {
          p_user_id: user.id,
          p_income_entry_id: income.id,
          p_amount: value,
          p_fixed_allocations: fixedAllocations,
        })

        if (rpcError) throw rpcError
      }

      finishIncomeSuccess('Income added and split!')
    } catch (err) {
      console.error('Split error:', err)
      toast.error('Failed to split income')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      toast.error('Enter an account name')
      return
    }

    setAddingAccount(true)
    const { data, error } = await createAccount({
      name: newAccountName.trim(),
      type: newAccountType,
      starting_balance: parseFloat(newAccountBalance) || 0,
      is_primary: accounts.length === 0,
    })
    setAddingAccount(false)

    if (error) {
      toast.error('Failed to add account')
      return
    }

    if (data) setSelectedAccountId(data.id)
    toast.success(`${newAccountName.trim()} added!`)
    setShowAddAccount(false)
    setNewAccountName('')
    setNewAccountType('checking')
    setNewAccountBalance('')
  }

  const addQuickAmount = () => {
    const value = parseInt(amountInput)
    if (!value || value <= 0) return
    const updated = [...quickAmounts, value].sort((a, b) => a - b).slice(0, 6)
    setQuickAmounts(updated)
    saveQuickAmounts(updated)
    setAmountInput('')
  }

  const removeQuickAmount = (idx: number) => {
    const updated = quickAmounts.filter((_, i) => i !== idx)
    setQuickAmounts(updated)
    saveQuickAmounts(updated)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[86svh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-0 sm:bottom-4 sm:rounded-2xl sm:border">
        <SheetHeader className="border-b px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <SheetTitle>{step === 'split' ? 'Split Income' : title}</SheetTitle>
              <SheetDescription>
                {step === 'split'
                  ? `Splitting ${Number.isFinite(parsedAmount) ? `$${parsedAmount.toFixed(2)}` : 'income'}${note ? ` from ${note}` : ''}.`
                  : description}
              </SheetDescription>
            </div>
            {step === 'entry' && (
              <button
                type="button"
                aria-label="Edit quick amounts"
                onClick={() => setEditingAmounts((value) => !value)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Settings2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-4 px-5 pb-5">
          {step === 'split' ? (
            <IncomeSplitStep
              amount={parseFloat(amount)}
              fixedJars={fixedJars}
              percentageJars={percentageJars}
              onConfirm={handleSplitConfirm}
              onBack={() => setStep('entry')}
              loading={loading}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/40 p-1">
                <button
                  type="button"
                  aria-pressed={mode === 'income'}
                  onClick={() => handleModeChange('income')}
                  className={cn(
                    'flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all',
                    mode === 'income'
                      ? 'bg-background text-emerald-600 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  Income
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'expense'}
                  onClick={() => handleModeChange('expense')}
                  className={cn(
                    'flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all',
                    mode === 'expense'
                      ? 'bg-background text-red-600 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Expense
                </button>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {mode === 'expense' ? 'From account' : 'Deposit to account'}
                </span>
                <div className="relative">
                  <Landmark className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                  <select
                    aria-label={mode === 'expense' ? 'From account' : 'Deposit to account'}
                    value={selectedAccountId ?? ''}
                    onChange={(event) => setSelectedAccountId(event.target.value || null)}
                    className="h-12 w-full appearance-none rounded-xl border bg-background px-10 pr-10 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="">No account selected</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                        {account.is_primary ? ' ★ Primary' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </label>

              <button
                type="button"
                onClick={() => setShowAddAccount((value) => !value)}
                className={cn(
                  'flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all',
                  showAddAccount
                    ? 'border-primary/30 bg-primary/15 text-primary'
                    : 'border-dashed text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add another account
              </button>

              {showAddAccount && (
                <div className="space-y-2 rounded-xl border bg-muted/35 p-3">
                  <Input
                    aria-label="New account name"
                    placeholder="Account name, e.g. Cash App..."
                    value={newAccountName}
                    onChange={(event) => setNewAccountName(event.target.value)}
                    className="h-9 text-sm"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select
                      aria-label="New account type"
                      value={newAccountType}
                      onChange={(event) => setNewAccountType(event.target.value)}
                      className="h-9 flex-1 rounded-md border bg-background px-2 text-sm text-foreground"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="cash">Cash</option>
                      <option value="cashapp">Cash App</option>
                      <option value="venmo">Venmo</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        aria-label="New account starting balance"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Balance..."
                        value={newAccountBalance}
                        onChange={(event) => setNewAccountBalance(event.target.value)}
                        className="h-9 pl-6 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-10 flex-1 text-xs"
                      onClick={() => setShowAddAccount(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-10 flex-1 text-xs"
                      onClick={handleAddAccount}
                      disabled={addingAccount || !newAccountName.trim()}
                    >
                      {addingAccount ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="mr-1 h-3 w-3" /> Add</>}
                    </Button>
                  </div>
                </div>
              )}

              {mode === 'expense' && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Jar / category
                  </span>
                  <div className="relative">
                    <div
                      className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full ring-2 ring-white/10"
                      style={{
                        backgroundColor:
                          selectedBucket === BANK_TOTAL_BUCKET
                            ? '#10b981'
                            : buckets.find((bucket) => bucket.id === selectedBucket)?.color ?? '#71717a',
                      }}
                    />
                    <select
                      aria-label="Jar or category"
                      value={selectedBucket}
                      onChange={(event) => setSelectedBucket(event.target.value)}
                      className="h-12 w-full appearance-none rounded-xl border bg-background px-9 pr-10 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                    >
                      <option value={BANK_TOTAL_BUCKET}>Bank Total</option>
                      {buckets.map((bucket) => (
                        <option key={bucket.id} value={bucket.id}>
                          {bucket.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </label>
              )}

              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label={mode === 'expense' ? 'Expense amount' : 'Income amount'}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-14 pl-10 text-2xl"
                  autoFocus
                />
              </div>

              {editingAmounts ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Customize quick amounts. Tap an amount to remove it.</p>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((quickAmount, idx) => (
                      <button
                        key={`${quickAmount}-${idx}`}
                        type="button"
                        aria-label={`Remove $${quickAmount} quick amount`}
                        onClick={() => removeQuickAmount(idx)}
                        className="min-h-11 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 transition-all hover:bg-red-500/20"
                      >
                        ${quickAmount} x
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <Input
                      aria-label="New quick amount"
                      type="number"
                      min="1"
                      placeholder="Add amount..."
                      value={amountInput}
                      onChange={(event) => setAmountInput(event.target.value)}
                      className="h-9 text-sm"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addQuickAmount()
                        }
                      }}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={addQuickAmount} className="min-h-10 shrink-0">
                      Add
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      aria-label={`Use $${quickAmount}`}
                      onClick={() => setAmount(quickAmount.toString())}
                      className="min-h-11 rounded-xl border bg-muted/40 px-2 py-2 text-sm font-medium transition-all hover:bg-muted active:scale-95"
                    >
                      ${quickAmount}
                    </button>
                  ))}
                </div>
              )}

              <Input
                aria-label={mode === 'income' ? 'Income source' : 'Expense description'}
                placeholder={mode === 'income' ? 'Source, optional...' : 'Description, optional...'}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="h-10 text-sm"
              />

              <div className="rounded-xl border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Ready:</span> {actionPreview}
              </div>

              <Button
                type="button"
                onClick={handleNext}
                className={cn('h-12 w-full rounded-xl text-base', mode === 'expense' && 'bg-red-600 hover:bg-red-700')}
                disabled={!amount || loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : mode === 'income' && fixedJars.length > 0 && selectedAccount?.type !== 'savings' ? (
                  'Next: Split Income'
                ) : mode === 'expense' ? (
                  'Log Expense'
                ) : (
                  'Log Income'
                )}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
