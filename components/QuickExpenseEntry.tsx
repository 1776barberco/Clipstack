'use client'

import { useState } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useExpenses } from '@/hooks/useExpenses'
import { useBuckets } from '@/hooks/useBuckets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Receipt, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface QuickExpenseEntryProps {
  defaultBucketId?: string
  onSuccess?: () => void
}

export function QuickExpenseEntry({ defaultBucketId, onSuccess }: QuickExpenseEntryProps) {
  const { user, loading: authLoading } = useAuthContext()
  const { addExpense } = useExpenses(user?.id)
  const { buckets } = useBuckets(user?.id)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [bucketId, setBucketId] = useState(defaultBucketId || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !bucketId) return
    if (authLoading) return
    if (!user) {
      toast.error('You must be signed in to add an expense.')
      return
    }

    setLoading(true)
    const { error } = await addExpense({
      user_id: user.id,
      bucket_id: bucketId,
      amount: parseFloat(amount),
      description: description || null,
      category: category || null,
      entry_date: format(new Date(), 'yyyy-MM-dd'),
    })
    setLoading(false)

    if (error) {
      console.error('Expense insert error:', error)
      toast.error(`Failed to add expense: ${error.message || 'Unknown error'}`)
    } else {
      toast.success('Expense added!')
      setAmount('')
      setDescription('')
      setCategory('')
      if (!defaultBucketId) {
        setBucketId('')
      }
      onSuccess?.()
    }
  }

  const quickAmounts = [10, 20, 50, 100, 200]
  const categories = ['Supplies', 'Tools', 'Education', 'Marketing', 'Booth Rent', 'Other']

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Quick Expense Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-lg"
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

          {!defaultBucketId && (
            <div className="space-y-2">
              <Label htmlFor="bucket">Jar</Label>
              <Select value={bucketId} onValueChange={setBucketId}>
                <SelectTrigger id="bucket">
                  <SelectValue placeholder="Select a jar" />
                </SelectTrigger>
                <SelectContent>
                  {buckets.map((bucket) => (
                    <SelectItem key={bucket.id} value={bucket.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: bucket.color }}
                        />
                        {bucket.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat.toLowerCase()}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="e.g., New scissors, Hair products..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!amount || !bucketId || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
