'use client'

import { useState } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useBuckets } from '@/hooks/useBuckets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Calculator,
  Loader2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

type Frequency = 'weekly' | 'biweekly' | 'monthly'

interface Bill {
  id: string
  name: string
  amount: string
  frequency: Frequency
}

const FREQUENCY_TO_MONTHLY: Record<Frequency, number> = {
  weekly: 4.33,
  biweekly: 2.167,
  monthly: 1,
}

const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
}

const BILL_PRESETS = [
  { name: 'Booth Rent', emoji: '💈' },
  { name: 'Phone Bill', emoji: '📱' },
  { name: 'Car Payment', emoji: '🚗' },
  { name: 'Car Insurance', emoji: '🛡️' },
  { name: 'Health Insurance', emoji: '🏥' },
  { name: 'Subscriptions', emoji: '📺' },
  { name: 'Groceries', emoji: '🛒' },
  { name: 'Gas', emoji: '⛽' },
  { name: 'Rent / Mortgage', emoji: '🏠' },
  { name: 'Utilities', emoji: '💡' },
  { name: 'Supplies', emoji: '✂️' },
  { name: 'Child Support', emoji: '👶' },
]

const JAR_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4',
  '#84cc16', '#d946ef',
]

interface SuggestedJar {
  name: string
  percentage: number
  color: string
  isTax: boolean
  monthlyAmount: number
}

interface JarSplitCalculatorProps {
  mode?: 'onboarding' | 'settings'
  onComplete?: () => void
  onSkip?: () => void
}

export function JarSplitCalculator({ mode = 'settings', onComplete, onSkip }: JarSplitCalculatorProps) {
  const { user } = useAuthContext()
  const { buckets, createBucket, deleteBucket } = useBuckets(user?.id)

  const [step, setStep] = useState(1)
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeFrequency, setIncomeFrequency] = useState<Frequency>('weekly')
  const [bills, setBills] = useState<Bill[]>([])
  const [includeTax, setIncludeTax] = useState(true)
  const [taxRate, setTaxRate] = useState('25')
  const [applying, setApplying] = useState(false)

  const totalSteps = 4

  // ── Helpers ──

  const monthlyIncome = (parseFloat(incomeAmount) || 0) * FREQUENCY_TO_MONTHLY[incomeFrequency]

  const getMonthlyBill = (bill: Bill) =>
    (parseFloat(bill.amount) || 0) * FREQUENCY_TO_MONTHLY[bill.frequency]

  const totalMonthlyBills = bills.reduce((sum, b) => sum + getMonthlyBill(b), 0)

  const addBill = (name: string = '', frequency: Frequency = 'monthly') => {
    setBills(prev => [...prev, { id: Date.now().toString(), name, amount: '', frequency }])
  }

  const removeBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id))
  }

  const updateBill = (id: string, field: keyof Bill, value: string) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const addPreset = (name: string) => {
    if (bills.some(b => b.name === name)) {
      toast.info(`${name} already added`)
      return
    }
    addBill(name, name === 'Booth Rent' ? 'weekly' : 'monthly')
  }

  // ── Suggested Jars ──

  const getSuggestedJars = (): SuggestedJar[] => {
    if (monthlyIncome <= 0) return []

    const jars: SuggestedJar[] = []
    let usedPct = 0
    let colorIdx = 0

    // Tax jar first
    if (includeTax) {
      const taxPct = parseFloat(taxRate) || 25
      jars.push({
        name: 'Tax Reserve',
        percentage: taxPct,
        color: JAR_COLORS[colorIdx++],
        isTax: true,
        monthlyAmount: monthlyIncome * taxPct / 100,
      })
      usedPct += taxPct
    }

    // Bill jars
    bills.forEach(bill => {
      const monthly = getMonthlyBill(bill)
      if (monthly <= 0 || !bill.name.trim()) return
      const pct = Math.round((monthly / monthlyIncome) * 1000) / 10
      jars.push({
        name: bill.name.trim(),
        percentage: pct,
        color: JAR_COLORS[colorIdx % JAR_COLORS.length],
        isTax: false,
        monthlyAmount: monthly,
      })
      colorIdx++
      usedPct += pct
    })

    const remaining = Math.max(0, 100 - usedPct)

    // Savings: 30% of remaining (at least)
    if (remaining > 0) {
      const savingsPct = Math.round(remaining * 0.3 * 10) / 10
      jars.push({
        name: 'Savings',
        percentage: savingsPct,
        color: '#22c55e',
        isTax: false,
        monthlyAmount: monthlyIncome * savingsPct / 100,
      })

      // Spending: the rest
      const spendingPct = Math.round((remaining - savingsPct) * 10) / 10
      if (spendingPct > 0) {
        jars.push({
          name: 'Spending Money',
          percentage: spendingPct,
          color: '#a855f7',
          isTax: false,
          monthlyAmount: monthlyIncome * spendingPct / 100,
        })
      }
    }

    return jars
  }

  const suggestedJars = getSuggestedJars()
  const totalSuggestedPct = suggestedJars.reduce((sum, j) => sum + j.percentage, 0)
  const billsExceedIncome = totalMonthlyBills >= monthlyIncome && monthlyIncome > 0

  // ── Apply ──

  const handleApply = async () => {
    if (!user) return
    setApplying(true)

    try {
      // If settings mode, delete existing buckets first (user confirmed)
      if (mode === 'settings' && buckets.length > 0) {
        for (const bucket of buckets) {
          await deleteBucket(bucket.id)
        }
      }

      // Create new jars
      for (let i = 0; i < suggestedJars.length; i++) {
        const jar = suggestedJars[i]
        await createBucket({
          user_id: user.id,
          name: jar.name,
          percentage: Math.round(jar.percentage * 10) / 10,
          target_amount: null,
          due_date: null,
          is_tax_bucket: jar.isTax,
          is_recurring: false,
          recurring_interval: null,
          priority: suggestedJars.length - i,
          color: jar.color,
        })
      }

      toast.success('Jars set up! 🎉')
      onComplete?.()
    } catch (err) {
      console.error('Apply error:', err)
      toast.error('Failed to set up jars. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  // ── Render Steps ──

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold">How much do you make?</h3>
        <p className="text-sm text-muted-foreground">Your average take-home — tips, cuts, color, everything.</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={incomeAmount}
            onChange={(e) => setIncomeAmount(e.target.value)}
            className="pl-12 text-2xl h-14 bg-white/5 border-white/10"
            autoFocus
          />
        </div>

        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
          {(['weekly', 'biweekly', 'monthly'] as Frequency[]).map(freq => (
            <button
              key={freq}
              onClick={() => setIncomeFrequency(freq)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                incomeFrequency === freq
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {FREQUENCY_LABELS[freq]}
            </button>
          ))}
        </div>

        {monthlyIncome > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            ≈ <span className="font-semibold text-foreground">${monthlyIncome.toFixed(0)}</span> / month
          </div>
        )}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold">What bills do you pay?</h3>
        <p className="text-sm text-muted-foreground">Add your recurring expenses — we&apos;ll figure out the split.</p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Add</p>
        <div className="flex flex-wrap gap-2">
          {BILL_PRESETS.map(preset => {
            const added = bills.some(b => b.name === preset.name)
            return (
              <button
                key={preset.name}
                onClick={() => addPreset(preset.name)}
                disabled={added}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition-all ${
                  added
                    ? 'bg-primary/10 border-primary/30 text-primary opacity-60'
                    : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground active:scale-95'
                }`}
              >
                <span>{preset.emoji}</span>
                {preset.name}
                {added && ' ✓'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bill list */}
      {bills.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Bills</p>
          {bills.map(bill => (
            <div key={bill.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Bill name"
                  value={bill.name}
                  onChange={(e) => updateBill(bill.id, 'name', e.target.value)}
                  className="h-8 bg-transparent border-white/10 text-sm"
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={bill.amount}
                      onChange={(e) => updateBill(bill.id, 'amount', e.target.value)}
                      className="h-8 pl-6 bg-transparent border-white/10 text-sm"
                    />
                  </div>
                  <select
                    value={bill.frequency}
                    onChange={(e) => updateBill(bill.id, 'frequency', e.target.value)}
                    className="h-8 rounded-md border border-white/10 bg-transparent px-2 text-xs text-foreground"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => removeBill(bill.id)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        onClick={() => addBill()}
        className="w-full border-dashed border-white/10"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Custom Bill
      </Button>

      {/* Tax toggle */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium">Set aside for taxes?</p>
            <p className="text-xs text-muted-foreground">Recommended for 1099 / self-employed</p>
          </div>
          <button
            onClick={() => setIncludeTax(!includeTax)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              includeTax ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              includeTax ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </label>
        {includeTax && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Tax rate:</Label>
            <Input
              type="number"
              min="1"
              max="50"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="h-8 w-20 bg-transparent border-white/10 text-sm text-center"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {bills.length > 0 && monthlyIncome > 0 && (
        <div className={`rounded-xl border p-3 text-sm ${
          billsExceedIncome
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          <div className="flex justify-between">
            <span>Monthly bills total:</span>
            <span className="font-semibold">${totalMonthlyBills.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Monthly income:</span>
            <span className="font-semibold">${monthlyIncome.toFixed(0)}</span>
          </div>
          {billsExceedIncome && (
            <div className="flex items-center gap-1 mt-1 text-red-400">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Bills exceed income — review your amounts</span>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <Sparkles className="h-8 w-8 mx-auto text-primary animate-pulse" />
        <h3 className="text-lg font-semibold">Your Suggested Jar Split</h3>
        <p className="text-sm text-muted-foreground">
          Based on ${monthlyIncome.toFixed(0)}/month income
        </p>
      </div>

      {/* Jar bars */}
      <div className="space-y-3">
        {suggestedJars.map((jar, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: jar.color }} />
                <span className="font-medium">{jar.name}</span>
                {jar.isTax && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">TAX</span>}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">${jar.monthlyAmount.toFixed(0)}/mo</span>
                <span className="font-semibold text-foreground">{jar.percentage.toFixed(1)}%</span>
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(jar.percentage, 100)}%`,
                  backgroundColor: jar.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className={`rounded-xl border p-3 text-sm ${
        Math.abs(totalSuggestedPct - 100) < 1
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : totalSuggestedPct > 100
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
      }`}>
        <div className="flex items-center justify-between">
          <span className="font-medium">Total: {totalSuggestedPct.toFixed(1)}%</span>
          {Math.abs(totalSuggestedPct - 100) < 1 ? (
            <span>✓ Balanced</span>
          ) : totalSuggestedPct > 100 ? (
            <span>⚠️ {(totalSuggestedPct - 100).toFixed(1)}% over</span>
          ) : (
            <span>{(100 - totalSuggestedPct).toFixed(1)}% unallocated</span>
          )}
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        You can always adjust these later in Settings.
      </p>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <CheckCircle className="h-12 w-12 mx-auto text-emerald-400" />
        <h3 className="text-lg font-semibold">Ready to Apply?</h3>
        {mode === 'settings' && buckets.length > 0 && (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-400">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            This will replace your current {buckets.length} jar{buckets.length !== 1 ? 's' : ''} with the new split.
            Existing jar balances will be reset.
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          We&apos;ll create {suggestedJars.length} jars to automatically split your income every time you log it.
        </p>
      </div>

      {/* Quick preview */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
        {suggestedJars.map((jar, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: jar.color }} />
              <span>{jar.name}</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{jar.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <Button
        onClick={handleApply}
        disabled={applying}
        className="w-full h-12 text-base rounded-xl"
      >
        {applying ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            Apply to My Jars
          </>
        )}
      </Button>
    </div>
  )

  const canProceed = () => {
    switch (step) {
      case 1: return parseFloat(incomeAmount) > 0
      case 2: return true // bills are optional
      case 3: return suggestedJars.length > 0
      case 4: return true
      default: return false
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-white/10 bg-background/80 backdrop-blur-xl">
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Calculator className="h-5 w-5 text-primary" />
          Jar Split Calculator
        </CardTitle>
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 === step
                  ? 'w-8 bg-primary'
                  : i + 1 < step
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-white/10'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Step {step} of {totalSteps}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {/* Navigation */}
        {step < 4 && (
          <div className="flex gap-2 pt-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="border-white/10">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            {mode === 'onboarding' && step === 1 && onSkip && (
              <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
                Skip for now
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              {step === 3 ? 'Apply These Jars' : 'Next'}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(3)} className="border-white/10">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
