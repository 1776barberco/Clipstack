'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { useBoothRent } from '@/hooks/useBoothRent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Home, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export function BoothRentCard() {
  const { user } = useAuthContext()
  const { profile } = useProfile(user?.id)
  const { amount, dueDay, daysUntilDue, isDueSoon, nextDueDate } = useBoothRent(
    user?.id,
    profile?.booth_rent_amount,
    profile?.booth_rent_due_day
  )

  if (!amount || !dueDay) {
    return null
  }

  return (
    <Card className={isDueSoon ? 'border-amber-500' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Booth Rent
          {isDueSoon && (
            <Badge variant="destructive" className="ml-auto">
              Due Soon
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-3xl font-bold">{formatCurrency(amount)}</p>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Due Date</span>
            </div>
            <span className="font-medium">
              {nextDueDate ? format(nextDueDate, 'MMM d') : `Day ${dueDay}`}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2">
              {isDueSoon ? (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm">Days Remaining</span>
            </div>
            <span className={`font-medium ${isDueSoon ? 'text-amber-500' : ''}`}>
              {daysUntilDue} days
            </span>
          </div>

          {isDueSoon && (
            <p className="text-sm text-amber-600">
              Your booth rent is due soon. Make sure you have enough in your Essentials jar!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
