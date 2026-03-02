'use client'

import { useState } from 'react'
import { Plus, X, Loader2, DollarSign } from 'lucide-react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function QuickAddFAB() {
  const { user } = useAuthContext()
  const { addIncome } = useIncome(user?.id)
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!amount || !user) return
    setLoading(true)
    const { error } = await addIncome({
      user_id: user.id,
      amount: parseFloat(amount),
      source: null,
      notes: null,
      entry_date: format(new Date(), 'yyyy-MM-dd'),
    })
    setLoading(false)
    if (error) {
      toast.error('Failed to add income')
    } else {
      toast.success(`$${amount} logged!`)
      setAmount('')
      setOpen(false)
    }
  }

  const quickAmounts = [20, 40, 60, 100]

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Quick Add Sheet */}
      {open && (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="rounded-2xl border border-white/15 bg-background/95 backdrop-blur-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Quick Log</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

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
                autoFocus
              />
            </div>

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

            <Button
              onClick={handleSubmit}
              className="w-full h-12 text-base rounded-xl"
              disabled={!amount || loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Log Income'}
            </Button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-20 right-4 z-50 md:hidden h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90 ${
          open
            ? 'bg-destructive text-destructive-foreground rotate-45'
            : 'bg-primary text-primary-foreground shadow-[0_0_30px_rgba(99,102,241,0.4)]'
        } border border-white/20 backdrop-blur-xl`}
      >
        <Plus className="h-6 w-6" />
      </button>
    </>
  )
}
