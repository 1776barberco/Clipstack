'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Loader2, DollarSign, ArrowDownLeft, ArrowUpRight, Settings2, ArrowLeft, Landmark, PlusCircle, Check, ChevronDown } from 'lucide-react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { useExpenses } from '@/hooks/useExpenses'
import { useBuckets } from '@/hooks/useBuckets'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'

const DEFAULT_QUICK_AMOUNTS = [20, 40, 60, 100]
const STORAGE_KEY = 'tipjars-quick-amounts'

function getQuickAmounts(): number[] {
  if (typeof window === 'undefined') return DEFAULT_QUICK_AMOUNTS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_QUICK_AMOUNTS
}

function saveQuickAmounts(amounts: number[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(amounts)) } catch {}
}

type Mode = 'income' | 'expense'
type Step = 'entry' | 'split'

export function QuickAddFAB() {
  const { user } = useAuthContext()
  const { addIncome } = useIncome(user?.id)
  const { addExpense } = useExpenses(user?.id)
  const { buckets } = useBuckets(user?.id)
  const { accounts, createAccount } = useBankAccounts(user?.id)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('income')
  const [step, setStep] = useState<Step>('entry')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [selectedBucket, setSelectedBucket] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickAmounts, setQuickAmounts] = useState(DEFAULT_QUICK_AMOUNTS)
  const [editingAmounts, setEditingAmounts] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [fixedAllocations, setFixedAllocations] = useState<Record<string, string>>({})
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState('checking')
  const [newAccountBalance, setNewAccountBalance] = useState('')
  const [addingAccount, setAddingAccount] = useState(false)

  // Separate fixed vs percentage jars
  const fixedJars = buckets.filter((b) => b.target_amount && b.target_amount > 0)
  const percentageJars = buckets.filter((b) => !b.target_amount || b.target_amount === 0).filter((b) => b.percentage > 0)
  const hasFixedJars = fixedJars.length > 0
  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  )
  const selectedExpenseTarget = selectedBucket === '__bank_total__'
    ? 'Bank Total'
    : buckets.find((bucket) => bucket.id === selectedBucket)?.name
  const amountLabel = amount ? `$${parseFloat(amount || '0').toFixed(2)}` : 'this amount'
  const actionPreview = mode === 'expense'
    ? `Log ${amountLabel} expense${selectedAccount ? ` from ${selectedAccount.name}` : ''}${selectedExpenseTarget ? ` to ${selectedExpenseTarget}` : ''}`
    : `Log ${amountLabel} income${selectedAccount ? ` to ${selectedAccount.name}` : ''}`
  const submitLabel = mode === 'expense' ? 'Log Expense' : 'Log Income'

  useEffect(() => {
    setQuickAmounts(getQuickAmounts())
  }, [])

  // Listen for bottom nav "Log" tap
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-quick-log', handler)
    return () => window.removeEventListener('open-quick-log', handler)
  }, [])

  // Auto-select "Bank Total" for expenses by default
  useEffect(() => {
    if (mode === 'expense' && !selectedBucket) {
      setSelectedBucket('__bank_total__')
    }
  }, [mode, selectedBucket])

  // Auto-select primary bank account for income and expenses (or single account)
  useEffect(() => {
    if ((mode === 'income' || mode === 'expense') && accounts.length > 0 && !selectedAccountId) {
      const primary = accounts.find(a => a.is_primary)
      setSelectedAccountId(primary?.id ?? accounts[0].id)
    }
  }, [mode, accounts, selectedAccountId])

  const handleNext = () => {
    if (!amount) return
    if (mode === 'income' && hasFixedJars) {
      // Initialize allocations with jar target amounts as defaults
      const defaults: Record<string, string> = {}
      fixedJars.forEach((b) => {
        defaults[b.id] = (b.target_amount || 0).toString()
      })
      setFixedAllocations(defaults)
      setStep('split')
    } else {
      handleSubmitDirect()
    }
  }

  const handleSubmitDirect = async () => {
    if (!amount || !user) return
    setLoading(true)

    if (mode === 'income') {
      const incomeData: Record<string, unknown> = {
        user_id: user.id,
        amount: parseFloat(amount),
        source: note || null,
        notes: null,
        entry_date: format(new Date(), 'yyyy-MM-dd'),
      }
      // Only attach account_id if we actually have a valid selection
      if (selectedAccountId && accounts.some(a => a.id === selectedAccountId)) {
        incomeData.account_id = selectedAccountId
      }
      const { error } = await addIncome(incomeData as Parameters<typeof addIncome>[0])
      setLoading(false)
      if (error) {
        console.error('Income insert error:', error)
        const msg = typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Unknown error'
        toast.error(`Failed to log income: ${msg}`)
        return
      }
      toast.success(`+$${amount} logged!`)
      window.dispatchEvent(new Event('income-updated'))
    } else {
      if (!selectedBucket) { toast.error('Select a jar or Bank Total'); setLoading(false); return }
      const isJarless = selectedBucket === '__bank_total__'
      const expenseData: Record<string, unknown> = {
        user_id: user.id,
        bucket_id: isJarless ? null : selectedBucket,
        amount: parseFloat(amount),
        description: note || null,
        category: null,
        entry_date: format(new Date(), 'yyyy-MM-dd'),
      }
      if (selectedAccountId && accounts.some(a => a.id === selectedAccountId)) {
        expenseData.account_id = selectedAccountId
      }
      const { error } = await addExpense(expenseData as Parameters<typeof addExpense>[0])
      setLoading(false)
      if (error) { toast.error('Failed to log expense'); return }
      if (isJarless) {
        toast.success(`-$${amount} from Bank Total`)
      } else {
        const jar = buckets.find(b => b.id === selectedBucket)
        toast.success(`-$${amount} from ${jar?.name || 'jar'}`)
      }
      window.dispatchEvent(new Event('income-updated'))
    }

    resetAndClose()
  }

  const handleSplitConfirm = async () => {
    if (!user || !amount) return
    setLoading(true)

    try {
      // 1. Insert income entry
      const incomeData: Record<string, unknown> = {
        user_id: user.id,
        amount: parseFloat(amount),
        source: note || null,
        notes: null,
        entry_date: format(new Date(), 'yyyy-MM-dd'),
      }
      if (selectedAccountId) {
        incomeData.account_id = selectedAccountId
      }
      const { data: income, error: incomeError } = await addIncome(incomeData as Parameters<typeof addIncome>[0])

      if (incomeError || !income) {
        toast.error(`Failed to add income: ${incomeError?.message || 'Unknown error'}`)
        setLoading(false)
        return
      }

      // 2. Delete auto-allocated transactions and re-allocate with manual splits
      const allocations: Record<string, number> = {}
      Object.entries(fixedAllocations).forEach(([id, val]) => {
        const num = parseFloat(val)
        if (num > 0) allocations[id] = num
      })

      if (Object.keys(allocations).length > 0 && supabase) {
        await supabase
          .from('bucket_transactions')
          .delete()
          .eq('income_entry_id', income.id)
          .eq('user_id', user.id)

        await supabase.rpc('allocate_income_to_buckets', {
          p_user_id: user.id,
          p_income_entry_id: income.id,
          p_amount: parseFloat(amount),
          p_fixed_allocations: allocations,
        })
      }

      toast.success('Income added and split!')
      // Trigger dashboard data refresh (Realtime may miss SECURITY DEFINER changes)
      window.dispatchEvent(new Event('income-updated'))
      resetAndClose()
    } catch (err) {
      console.error('Split error:', err)
      toast.error('Failed to split income')
    } finally {
      setLoading(false)
    }
  }

  const resetAndClose = () => {
    setAmount('')
    setNote('')
    setStep('entry')
    setFixedAllocations({})
    setSelectedAccountId(null)
    setOpen(false)
    setEditingAmounts(false)
    setShowAddAccount(false)
    setNewAccountName('')
    setNewAccountType('checking')
    setNewAccountBalance('')
  }

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) { toast.error('Enter an account name'); return }
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
    if (data) {
      setSelectedAccountId(data.id)
    }
    toast.success(`${newAccountName.trim()} added!`)
    setShowAddAccount(false)
    setNewAccountName('')
    setNewAccountType('checking')
    setNewAccountBalance('')
  }

  const handleSubmit = async () => {
    handleNext()
  }

  const addQuickAmount = () => {
    const val = parseInt(amountInput)
    if (!val || val <= 0) return
    const updated = [...quickAmounts, val].sort((a, b) => a - b).slice(0, 6)
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
	    <div>
      {/* Overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close quick log"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={resetAndClose}
        />
      )}

      {/* Quick Add Sheet */}
      {open && (
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 animate-in slide-in-from-bottom-5 duration-300 md:hidden">
          <div className="max-h-[72vh] space-y-4 overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-background/95 p-5 shadow-2xl backdrop-blur-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {step === 'split' && (
                  <button
                    type="button"
                    aria-label="Back to amount entry"
                    onClick={() => setStep('entry')}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <h3 className="font-semibold text-lg">{step === 'split' ? 'Split Income' : 'Quick Log'}</h3>
              </div>
              <div className="flex items-center gap-2">
                {step === 'entry' && (
                  <button
                    type="button"
                    aria-label="Edit quick amounts"
                    onClick={() => setEditingAmounts(!editingAmounts)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Settings2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Close quick log"
                  onClick={resetAndClose}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {step === 'split' ? (
              <>
                {/* Split Step */}
                <div className="text-sm text-muted-foreground">
                  Splitting <span className="font-semibold text-foreground">${parseFloat(amount).toFixed(2)}</span>
                  {note ? <span> from {note}</span> : ''}
                </div>

                {/* Fixed Jars */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fixed Jars</p>
                  {fixedJars.map((b) => {
                    return (
                      <div key={b.id} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                        <span className="text-sm flex-1 truncate">{b.name}</span>
                        <div className="relative w-24">
                          <DollarSign className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={fixedAllocations[b.id] || ''}
                            onChange={(e) => setFixedAllocations(prev => ({ ...prev, [b.id]: e.target.value }))}
                            className="pl-6 h-9 text-sm bg-white/5 border-white/10"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Remainder preview for percentage jars */}
                {percentageJars.length > 0 && (() => {
                  const totalFixed = Object.values(fixedAllocations).reduce((sum, v) => sum + (parseFloat(v) || 0), 0)
                  const remainder = Math.max(0, parseFloat(amount) - totalFixed)
                  const totalPct = percentageJars.reduce((sum, b) => sum + b.percentage, 0)
                  return (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Percentage Jars — <span className="text-foreground">${remainder.toFixed(2)}</span> remaining
                      </p>
                      {percentageJars.map((b) => {
                        const share = totalPct > 0 ? (remainder * b.percentage / totalPct) : 0
                        return (
                          <div key={b.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                            <span className="flex-1 truncate">{b.name} ({b.percentage}%)</span>
                            <span className="font-mono text-xs">${share.toFixed(2)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}

                {/* Over-budget warning */}
                {(() => {
                  const totalFixed = Object.values(fixedAllocations).reduce((sum, v) => sum + (parseFloat(v) || 0), 0)
                  const over = totalFixed > parseFloat(amount)
                  return over ? (
                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                      ⚠️ Fixed jar allocations (${totalFixed.toFixed(2)}) exceed income (${parseFloat(amount).toFixed(2)})
                    </div>
                  ) : null
                })()}

                <Button
                  onClick={handleSplitConfirm}
                  className="w-full h-12 text-base rounded-xl"
                  disabled={loading || Object.values(fixedAllocations).reduce((sum, v) => sum + (parseFloat(v) || 0), 0) > parseFloat(amount)}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Split'}
                </Button>
              </>
            ) : (
              <>
                {/* Entry Step (original) */}
            <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
              <button
                onClick={() => setMode('income')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
                  mode === 'income'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Income
              </button>
              <button
                onClick={() => setMode('expense')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
                  mode === 'expense'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Expense
              </button>
            </div>

            {/* Income/Expense: Bank account selector + Add Account */}
            {(mode === 'income' || mode === 'expense') && (
              <div className="space-y-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {mode === 'expense' ? 'From account' : 'Deposit to account'}
                  </span>
                  <div className="relative">
                    <Landmark className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                    <select
                      value={selectedAccountId ?? ''}
                      onChange={(e) => setSelectedAccountId(e.target.value || null)}
                      className="h-12 w-full appearance-none rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-10 pr-10 text-sm font-semibold text-foreground outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25"
                    >
                      <option value="">No account selected</option>
                      {accounts.map((acct) => (
                        <option key={acct.id} value={acct.id}>
                          {acct.name}{acct.is_primary ? ' ★ Primary' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </label>

                <button
                  onClick={() => setShowAddAccount(!showAddAccount)}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                    showAddAccount
                      ? 'bg-primary/15 border-primary/30 text-primary'
                      : 'border-dashed border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground'
                  }`}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add another account
                </button>

                {/* Inline Add Account form */}
                {showAddAccount && (
	                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
	                    <Input
	                      placeholder="Account name, e.g. Cash App…"
	                      value={newAccountName}
	                      onChange={(e) => setNewAccountName(e.target.value)}
	                      className="h-9 bg-white/5 border-white/10 text-sm"
	                    />
                    <div className="flex gap-2">
                      <select
                        value={newAccountType}
                        onChange={(e) => setNewAccountType(e.target.value)}
                        className="h-9 flex-1 rounded-md border border-white/10 bg-white/5 px-2 text-sm text-foreground"
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
                          type="number"
                          step="0.01"
                          min="0"
	                          placeholder="Balance…"
                          value={newAccountBalance}
                          onChange={(e) => setNewAccountBalance(e.target.value)}
                          className="h-9 pl-6 bg-white/5 border-white/10 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setShowAddAccount(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={handleAddAccount}
                        disabled={addingAccount || !newAccountName.trim()}
                      >
                        {addingAccount ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" /> Add</>}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Expense: Jar selector (including Bank Total) */}
            {mode === 'expense' && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Jar / category
                </span>
                <div className="relative">
                  <div
                    className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full ring-2 ring-white/10"
                    style={{ backgroundColor: selectedBucket === '__bank_total__' ? '#10b981' : buckets.find((b) => b.id === selectedBucket)?.color ?? '#71717a' }}
                  />
                  <select
                    value={selectedBucket}
                    onChange={(e) => setSelectedBucket(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-white/25 bg-white/10 px-9 pr-10 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="__bank_total__">Bank Total</option>
                    {buckets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </label>
            )}

            {/* Amount */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-2xl h-14 bg-white/5 border-white/10"
	              />
            </div>

            {/* Quick amounts or edit mode */}
            {editingAmounts ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Customize quick amounts (tap to remove):</p>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((amt, idx) => (
                    <button
                      key={idx}
                      onClick={() => removeQuickAmount(idx)}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
                    >
                      ${amt} ×
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
	                    placeholder="Add amount…"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="h-9 bg-white/5 border-white/10 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuickAmount())}
                  />
                  <Button size="sm" variant="outline" onClick={addQuickAmount} className="shrink-0">
                    Add
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-medium transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            )}

            {/* Note */}
	            <Input
	              placeholder={mode === 'income' ? 'Source, optional…' : 'Description, optional…'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-10 bg-white/5 border-white/10 text-sm"
            />

            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Ready:</span> {actionPreview}
            </div>

            <Button
              onClick={handleSubmit}
              className={`w-full h-12 text-base rounded-xl ${
                mode === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''
              }`}
              disabled={!amount || loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === 'income' ? (hasFixedJars ? 'Next: Split Income' : submitLabel) : submitLabel}
            </Button>
              </>
            )}
          </div>
        </div>
      )}

	    </div>
	  )
	}
