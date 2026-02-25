'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useTaxEstimate } from '@/hooks/useTaxEstimate'
import { useProfile } from '@/hooks/useProfile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function TaxEstimateCard() {
  const { user } = useAuthContext()
  const { profile } = useProfile(user?.id)
  const { estimate, loading } = useTaxEstimate(user?.id, profile?.tax_rate)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tax Estimate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    )
  }

  if (!estimate) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Tax Estimate
          <Badge variant="secondary" className="ml-auto">
            {estimate.quarter}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Estimated Tax Owed</p>
            <p className="text-3xl font-bold">{formatCurrency(estimate.estimatedTax)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-xs text-muted-foreground">Quarterly Income</p>
              <p className="font-medium">{formatCurrency(estimate.estimatedIncome)}</p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-xs text-muted-foreground">Tax Rate</p>
              <p className="font-medium">{(estimate.taxRate * 100).toFixed(0)}%</p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              This is an estimate based on your tracked income. Consult a tax professional for accurate filing.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
