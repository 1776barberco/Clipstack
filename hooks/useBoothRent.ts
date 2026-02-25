import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { differenceInDays, format } from 'date-fns'

interface BoothRentStatus {
  amount: number | null
  dueDay: number | null
  daysUntilDue: number | null
  isDueSoon: boolean
  nextDueDate: Date | null
}

export function useBoothRent(
  userId: string | undefined,
  boothRentAmount: number | null | undefined,
  boothRentDueDay: number | null | undefined
) {
  const [status, setStatus] = useState<BoothRentStatus>({
    amount: null,
    dueDay: null,
    daysUntilDue: null,
    isDueSoon: false,
    nextDueDate: null,
  })

  useEffect(() => {
    if (!userId || !boothRentDueDay) {
      return
    }

    const calculateStatus = () => {
      const now = new Date()
      const currentDay = now.getDate()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      let nextDueDate: Date

      if (currentDay <= boothRentDueDay) {
        // Due date is this month
        nextDueDate = new Date(currentYear, currentMonth, boothRentDueDay)
      } else {
        // Due date is next month
        nextDueDate = new Date(currentYear, currentMonth + 1, boothRentDueDay)
      }

      const daysUntilDue = differenceInDays(nextDueDate, now)
      const isDueSoon = daysUntilDue <= 3

      setStatus({
        amount: boothRentAmount || null,
        dueDay: boothRentDueDay,
        daysUntilDue,
        isDueSoon,
        nextDueDate,
      })
    }

    calculateStatus()
  }, [userId, boothRentAmount, boothRentDueDay])

  return status
}
