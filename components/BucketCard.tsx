'use client'

import { useState } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useExpenses } from '@/hooks/useExpenses'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { MinusCircle, Loader2, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface BucketCardProps {
  bucket: {
    id: string
    name: string
    color: string
    percentage: number
    is_tax_bucket?: boolean
    target_amount?: number | null
  }
  balance: number
  totalBalance: number
  onExpenseAdded?: () => void
}

export function BucketCard({ bucket, balance, totalBalance, onExpenseAdded }: BucketCardProps) {
  const { user } = useAuthContext()
  const { addExpense } = useExpenses(user?.id)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const percentage = totalBalance > 0 ? (balance / totalBalance) * 100 : 0

  const handleQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseAmount || !user) return

    setLoading(true)
    const { error } = await addExpense({
      user_id: user.id,
      bucket_id: bucket.id,
      amount: parseFloat(expenseAmount),
      description: expenseDescription || null,
      category: null,
      entry_date: format(new Date(), 'yyyy-MM-dd'),
    })
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: bucket.color }}
                  />
                  <span className="font-medium">{bucket.name}</span>
                  {bucket.is_tax_bucket && (
                    <span className="text-xs text-muted-foreground">(Tax)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatCurrency(balance)}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MinusCircle className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              </div>

              <Progress
                value={percentage}
                className="h-2"
                style={
                  {
                    backgroundColor: `${bucket.color}20`,
                    '--progress-background': bucket.color,
                  } as React.CSSProperties
                }
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{bucket.target_amount && bucket.target_amount > 0 ? `$${bucket.target_amount} fixed` : `${bucket.percentage}% allocation`}</span>
                <span>{percentage.toFixed(1)}% of total</span>
              </div>

              <div className="pt-2 text-xs text-muted-foreground text-center opacity-0 group-hover:opacity-100 transition-opacity">
                Click to add expense
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
