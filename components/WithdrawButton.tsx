'use client'

import { useState } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useRulesEngine } from '@/hooks/useRulesEngine'
import { useBuckets } from '@/hooks/useBuckets'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, ArrowDownLeft } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

export function WithdrawButton() {
  const { user } = useAuthContext()
  const { buckets, getBucketBalance } = useBuckets(user?.id)
  const { checkAffordability } = useRulesEngine(user?.id)
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [bucketId, setBucketId] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkResult, setCheckResult] = useState<ReturnType<typeof checkAffordability> | null>(null)

  const handleAmountChange = (value: string) => {
    setAmount(value)
    if (bucketId && value) {
      const result = checkAffordability({
        fromBucketId: bucketId,
        amount: parseFloat(value) || 0,
      })
      setCheckResult(result)
    }
  }

  const handleBucketChange = (value: string) => {
    setBucketId(value)
    if (amount) {
      const result = checkAffordability({
        fromBucketId: value,
        amount: parseFloat(amount) || 0,
      })
      setCheckResult(result)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !bucketId || !amount || !supabase) return

    setLoading(true)
    const { error } = await supabase.from('bucket_transactions').insert({
      user_id: user.id,
      bucket_id: bucketId,
      amount: parseFloat(amount),
      type: 'withdrawal',
      description: description || 'Withdrawal',
    })
    setLoading(false)

    if (error) {
      toast.error('Failed to process withdrawal')
    } else {
      toast.success('Withdrawal recorded!')
      setOpen(false)
      setAmount('')
      setBucketId('')
      setDescription('')
      setCheckResult(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowDownLeft className="mr-2 h-4 w-4" />
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw from Jar</DialogTitle>
          <DialogDescription>
            Withdraw funds from one of your jars.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>From Jar</Label>
            <Select value={bucketId} onValueChange={handleBucketChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select jar" />
              </SelectTrigger>
              <SelectContent>
                {buckets.map((bucket) => (
                  <SelectItem key={bucket.id} value={bucket.id}>
                    {bucket.name} ({formatCurrency(getBucketBalance(bucket.id))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              placeholder="What is this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {checkResult && (
            <div
              className={`rounded-lg p-3 text-sm ${
                checkResult.canAfford
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">
                    {checkResult.canAfford ? 'Can afford' : 'Cannot afford'}
                  </p>
                  <p>{checkResult.reason}</p>
                  {!checkResult.canAfford && checkResult.suggestedMaxAmount > 0 && (
                    <p>
                      Suggested max: {formatCurrency(checkResult.suggestedMaxAmount)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!bucketId || !amount || !checkResult?.canAfford || loading}
          >
            {loading ? 'Processing...' : 'Withdraw'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
