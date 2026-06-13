'use client'

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { useExpenses, type Expense } from '@/hooks/useExpenses'
import { useBuckets } from '@/hooks/useBuckets'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Plus, Loader2, MinusCircle, Landmark } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { IncomeSplitStep } from '@/components/IncomeSplitStep'
import { supabase } from '@/lib/supabase/client'

export function QuickIncomeEntry() {
  const { user, loading: authLoading } = useAuthContext()
  const { addIncome } = useIncome(user?.id)
  const { addExpense } = useExpenses(user?.id)
  const { buckets } = useBuckets(user?.id)
  const { accounts } = useBankAccounts(user?.id)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [isNegative, setIsNegative] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'entry' | 'split'>('entry')

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      const primary = accounts.find((account) => account.is_primary)
      setSelectedAccountId(primary?.id ?? accounts[0].id)
    }
  }, [accounts, selectedAccountId])

  // Separate fixed vs percentage jars
  const fixedJars = buckets
    .filter((b) => b.target_amount && b.target_amount > 0)
    .map((b) => ({
      id: b.id,
      name: b.name,
      color: b.color,
      target_amount: b.target_amount!,
    }))

  const percentageJars = buckets
    .filter((b) => !b.target_amount || b.target_amount === 0)
    .filter((b) => b.percentage > 0)
    .map((b) => ({
      id: b.id,
      name: b.name,
      color: b.color,
      percentage: b.percentage,
    }))

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return

    // Negative entries (expenses) skip the split step
    if (isNegative) {
      handleSubmitDirect()
      return
    }

    // Savings accounts skip the split step - money is already earmarked
    const selectedAccount = accounts.find((a) => a.id === selectedAccountId)
    if (selectedAccount?.type === 'savings') {
      handleSubmitDirect()
      return
    }

    // If there are fixed jars, show the split step
    if (fixedJars.length > 0) {
      setStep('split')
    } else {
      // No fixed jars — just submit directly (all percentage-based)
      handleSubmitDirect()
    }
  }

  const handleSubmitDirect = async () => {
    if (!amount) return
    if (authLoading) return
    if (!user) {
      toast.error(`You must be signed in to add ${isNegative ? 'an expense' : 'income'}.`)
      return
    }

    setLoading(true)
    const parsedAmount = Math.abs(parseFloat(amount))
    const { error } = isNegative
      ? await addExpense({
          user_id: user.id,
          bucket_id: null,
          amount: parsedAmount,
          description: source || 'Expense',
          category: 'Expense',
          entry_date: format(new Date(), 'yyyy-MM-dd'),
          account_id: selectedAccountId,
        } satisfies Omit<Expense, 'id' | 'created_at' | 'updated_at'>)
      : await addIncome({
          user_id: user.id,
          amount: parsedAmount,
          source: source || null,
          notes: null,
          entry_date: format(new Date(), 'yyyy-MM-dd'),
          account_id: selectedAccountId,
        } as Parameters<typeof addIncome>[0])
    setLoading(false)

    if (error) {
      console.error(`${isNegative ? 'Expense' : 'Income'} insert error:`, error)
      toast.error(`Failed to add ${isNegative ? 'expense' : 'income'}: ${error.message || 'Unknown error'}`)
    } else {
      toast.success(isNegative ? 'Expense recorded!' : 'Income added!')
      setAmount('')
      setSource('')
      setSelectedAccountId(null)
      setIsNegative(false)
      setStep('entry')
    }
  }

  const handleSplitConfirm = async (fixedAllocations: Record<string, number>) => {
    if (!user || !amount) return

    setLoading(true)
    try {
      // 1. Insert the income entry
      const incomeData: Record<string, unknown> = {
        user_id: user.id,
        amount: parseFloat(amount),
        source: source || null,
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

      // 2. If there are manual fixed allocations, call the RPC with them
      // The DB trigger will fire automatically on income insert,
      // but we need to override for manual splits.
      // We'll delete the auto-allocated transactions and re-allocate with manual splits.
      if (Object.keys(fixedAllocations).length > 0 && supabase) {
        // Delete the auto-generated transactions from the trigger
        await supabase
          .from('bucket_transactions')
          .delete()
          .eq('income_entry_id', income.id)
          .eq('user_id', user.id)

        // Re-allocate with manual fixed amounts
        await supabase.rpc('allocate_income_to_buckets', {
          p_user_id: user.id,
          p_income_entry_id: income.id,
          p_amount: parseFloat(amount),
          p_fixed_allocations: fixedAllocations,
        })
      }

      toast.success('Income added and split!')
      window.dispatchEvent(new Event('income-updated'))
      setAmount('')
      setSource('')
      setIsNegative(false)
      setStep('entry')
    } catch (err) {
      console.error('Split error:', err)
      toast.error('Failed to split income')
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [20, 40, 60, 80, 100, 150, 200]

  // Step 2: Split screen
  if (step === 'split') {
    return (
      <Card id="tour-quick-income">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Daily Check-In
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Log what you made today so TipJars can guide your spending and keep improving your split.
          </p>
        </CardHeader>
        <CardContent>
          <IncomeSplitStep
            amount={parseFloat(amount)}
            fixedJars={fixedJars}
            percentageJars={percentageJars}
            onConfirm={handleSplitConfirm}
            onBack={() => setStep('entry')}
            loading={loading}
          />
        </CardContent>
      </Card>
    )
  }

  // Step 1: Amount entry
  return (
    <Card id="tour-quick-income">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Daily Income Check-In
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          TipJars works best when you log income every day. Even a rough number helps the app guide your spending better.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleNext} className="space-y-4">
          {/* Income / Expense toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={isNegative ? 'outline' : 'default'}
              size="sm"
              className="flex-1"
              onClick={() => setIsNegative(false)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Income
            </Button>
            <Button
              type="button"
              variant={isNegative ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setIsNegative(true)}
            >
              <MinusCircle className="mr-1 h-4 w-4" />
              Expense
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">What did you make today?</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Enter today's income"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-lg"
                autoFocus
              />
            </div>
            {isNegative && (
              <p className="text-xs text-amber-500">
                This will be recorded as an expense (negative amount).
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(amt.toString())}
              >
                ${amt}
              </Button>
            ))}
          </div>

          {/* Account selector */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="account" className="flex items-center gap-1">
                <Landmark className="h-3 w-3" />
                Account
              </Label>
              <select
                id="account"
                value={selectedAccountId ?? accounts[0].id}
                onChange={(e) => setSelectedAccountId(e.target.value || null)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {accounts.map((acct) => (
                  <option key={acct.id} value={acct.id}>
                    {acct.name}
                    {acct.is_primary ? ' ★' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="source">Source (optional)</Label>
            <Input
              id="source"
              placeholder={isNegative ? 'e.g., Supplies, Tools' : 'e.g., Haircut, Color, Tips'}
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!amount || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isNegative ? (
              <>
                <MinusCircle className="mr-2 h-4 w-4" />
                Record Expense
              </>
            ) : fixedJars.length > 0 ? (
              <>
                Next: Split Today's Income
                <DollarSign className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Log Today's Income
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
