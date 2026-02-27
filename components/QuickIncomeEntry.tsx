'use client'

import { useState } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function QuickIncomeEntry() {
  const { user } = useAuthContext()
  const { addIncome } = useIncome(user?.id)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return
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
    }
  }

  const quickAmounts = [20, 40, 60, 80, 100, 150, 200]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Quick Income Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
