'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useBuckets } from '@/hooks/useBuckets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BucketCard } from './BucketCard'

export function BucketBalances() {
  const { user } = useAuthContext()
  const { buckets, loading, getBucketBalance, getTotalBalance } = useBuckets(user?.id)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jar Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalBalance = getTotalBalance()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Jar Balances
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {buckets.map((bucket) => (
            <BucketCard
              key={bucket.id}
              bucket={bucket}
              balance={getBucketBalance(bucket.id)}
              totalBalance={totalBalance}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
