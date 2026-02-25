import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { startOfQuarter, endOfQuarter, format } from 'date-fns'

interface TaxEstimate {
  quarter: string
  year: number
  quarterNum: number
  estimatedIncome: number
  estimatedTax: number
  taxRate: number
}

export function useTaxEstimate(userId: string | undefined, taxRate: number = 0.25) {
  const [estimate, setEstimate] = useState<TaxEstimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId || !supabase) {
      setLoading(false)
      return
    }

    const calculateTax = async () => {
      try {
        const now = new Date()
        const quarterStart = startOfQuarter(now)
        const quarterEnd = endOfQuarter(now)

        const { data, error } = await supabase
          .from('income_entries')
          .select('amount')
          .eq('user_id', userId)
          .gte('entry_date', format(quarterStart, 'yyyy-MM-dd'))
          .lte('entry_date', format(quarterEnd, 'yyyy-MM-dd'))

        if (error) throw error

        const totalIncome = (data || []).reduce((sum: number, entry: { amount: number }) => sum + Number(entry.amount), 0)
        const estimatedTax = totalIncome * taxRate

        const quarterNum = Math.floor(now.getMonth() / 3) + 1

        setEstimate({
          quarter: `Q${quarterNum} ${now.getFullYear()}`,
          year: now.getFullYear(),
          quarterNum,
          estimatedIncome: totalIncome,
          estimatedTax,
          taxRate,
        })
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    calculateTax()
  }, [userId, taxRate])

  return { estimate, loading, error }
}
