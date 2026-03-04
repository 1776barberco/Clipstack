'use client'

import { useState } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { useBuckets } from '@/hooks/useBuckets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { IncomeSplitStep } from '@/components/IncomeSplitStep'
import { supabase } from '@/lib/supabase/client'

export function QuickIncomeEntry() {
  const { user, loading: authLoading } = useAuthContext()
  const { addIncome } = useIncome(user?.id)
  const { buckets } = useBuckets(user?.id)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'entry' | 'split'>('entry')

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
      toast.error('You must be signed in to add income.')
      return
    }

    setLoading(true)
    const { error } = await addIncome({
      user_id: user.id,
      amount: parseFloat(amount),
      source: source || null,
      notes: null,
      entry_date: format(new Date(), 'yyyy-MM-dd'),
    })
    setLoading(false)

    if (error) {
      console.error('Income insert error:', error)
      toast.error(`Failed to add income: ${error.message || 'Unknown error'}`)
    } else {
      toast.success('Income added!')
      setAmount('')
      setSource('')
      setStep('entry')
    }
  }

  const handleSplitConfirm = async (fixedAllocations: Record<string, number>) => {
    if (!user || !amount) return

    setLoading(true)
    try {
      // 1. Insert the income entry
      const { data: income, error: incomeError } = await addIncome({
        user_id: user.id,
        amount: parseFloat(amount),
        source: source || null,
        notes: null,
        entry_date: format(new Date(), 'yyyy-MM-dd'),
      })

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
      setAmount('')
      setSource('')
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Split Your Income
          </CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Quick Income Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleNext} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-lg"
                autoFocus
              />
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="source">Source (optional)</Label>
            <Input
              id="source"
              placeholder="e.g., Haircut, Color, Tips"
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
            ) : fixedJars.length > 0 ? (
              <>
                Next: Split Income
                <DollarSign className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Income
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
