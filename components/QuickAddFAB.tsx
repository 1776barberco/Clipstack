'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2, DollarSign, ArrowDownLeft, ArrowUpRight, Settings2 } from 'lucide-react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { useExpenses } from '@/hooks/useExpenses'
import { useBuckets } from '@/hooks/useBuckets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format } from 'date-fns'

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

export function QuickAddFAB() {
  const { user } = useAuthContext()
  const { addIncome } = useIncome(user?.id)
  const { addExpense } = useExpenses(user?.id)
  const { buckets } = useBuckets(user?.id)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('income')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [selectedBucket, setSelectedBucket] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickAmounts, setQuickAmounts] = useState(DEFAULT_QUICK_AMOUNTS)
  const [editingAmounts, setEditingAmounts] = useState(false)
  const [amountInput, setAmountInput] = useState('')

  useEffect(() => {
    setQuickAmounts(getQuickAmounts())
  }, [])

  // Listen for bottom nav "Log" tap
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-quick-log', handler)
    return () => window.removeEventListener('open-quick-log', handler)
  }, [])

  // Auto-select first bucket for expenses
  useEffect(() => {
    if (mode === 'expense' && !selectedBucket && buckets.length > 0) {
      setSelectedBucket(buckets[0].id)
    }
  }, [mode, selectedBucket, buckets])

  const handleSubmit = async () => {
    if (!amount || !user) return
    setLoading(true)

    if (mode === 'income') {
      const { error } = await addIncome({
        user_id: user.id,
        amount: parseFloat(amount),
        source: note || null,
        notes: null,
        entry_date: format(new Date(), 'yyyy-MM-dd'),
      })
      setLoading(false)
      if (error) { toast.error('Failed to log income'); return }
      toast.success(`+$${amount} logged!`)
    } else {
      if (!selectedBucket) { toast.error('Select a jar'); setLoading(false); return }
      const { error } = await addExpense({
        user_id: user.id,
        bucket_id: selectedBucket,
        amount: parseFloat(amount),
        description: note || null,
        category: null,
        entry_date: format(new Date(), 'yyyy-MM-dd'),
      })
      setLoading(false)
      if (error) { toast.error('Failed to log expense'); return }
      const jar = buckets.find(b => b.id === selectedBucket)
      toast.success(`-$${amount} from ${jar?.name || 'jar'}`)
    }

    setAmount('')
    setNote('')
    setOpen(false)
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
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => { setOpen(false); setEditingAmounts(false) }}
        />
      )}

      {/* Quick Add Sheet */}
      {open && (
        <div className="fixed bottom-20 left-3 right-3 z-50 md:hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="rounded-2xl border border-white/15 bg-background/95 backdrop-blur-2xl p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Quick Log</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingAmounts(!editingAmounts)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
                <button onClick={() => { setOpen(false); setEditingAmounts(false) }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Income / Expense Toggle */}
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

            {/* Expense: Jar selector */}
            {mode === 'expense' && buckets.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {buckets.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBucket(b.id)}
                    className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition-all ${
                      selectedBucket === b.id
                        ? 'bg-white/10 border-white/30 text-foreground'
                        : 'border-white/5 text-muted-foreground hover:border-white/15'
                    }`}
                  >
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                    {b.name}
                  </button>
                ))}
              </div>
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
                autoFocus
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
                    placeholder="Add amount..."
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
              placeholder={mode === 'income' ? 'Source (optional)' : 'Description (optional)'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-10 bg-white/5 border-white/10 text-sm"
            />

            <Button
              onClick={handleSubmit}
              className={`w-full h-12 text-base rounded-xl ${
                mode === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''
              }`}
              disabled={!amount || loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === 'income' ? 'Log Income' : 'Log Expense'}
            </Button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => { setOpen(!open); setEditingAmounts(false) }}
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
