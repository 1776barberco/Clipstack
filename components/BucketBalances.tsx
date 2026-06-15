'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useBuckets } from '@/hooks/useBuckets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers3, Wallet } from 'lucide-react'
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
  const jarGroups = buckets.reduce<Array<{
    name: string
    balance: number
    target: number
    percentage: number
    count: number
    color: string
    jars: string[]
  }>>((groups, bucket) => {
    const name = bucket.group_name?.trim() || 'Ungrouped'
    const existing = groups.find((group) => group.name === name)
    const balance = getBucketBalance(bucket.id)
    const target = Number(bucket.target_amount ?? 0)
    const percentage = Number(bucket.percentage ?? 0)

    if (existing) {
      existing.balance += balance
      existing.target += target
      existing.percentage += percentage
      existing.count += 1
      existing.jars.push(bucket.name)
      return groups
    }

    groups.push({
      name,
      balance,
      target,
      percentage,
      count: 1,
      color: bucket.color,
      jars: [bucket.name],
    })
    return groups
  }, [])
  const multiJarGroups = jarGroups.filter((group) => group.count > 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Jar Balances
        </CardTitle>
      </CardHeader>
      <CardContent>
        {buckets.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🫙</div>
            <p className="font-medium mb-1">No jars yet</p>
            <p className="text-sm text-muted-foreground mb-3">Head to Settings to create your first jar and start splitting your income.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">Total in jars</p>
              <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
            {multiJarGroups.length > 0 && (
              <section className="mb-5 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Layers3 className="h-4 w-4" />
                  Jar groups
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {multiJarGroups.map((group) => {
                    const fundedPct = group.target > 0 ? Math.min(100, Math.round((group.balance / group.target) * 100)) : null
                    return (
                      <div key={group.name} className="rounded-lg border bg-muted/30 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
                            <p className="truncate text-sm font-semibold">{group.name} group</p>
                          </div>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Layers3 className="h-3 w-3" />
                            {group.count} jars
                          </span>
                        </div>
                        <p className="text-xl font-bold">{formatCurrency(group.balance)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          Includes {group.jars.join(' + ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {group.target > 0
                            ? `${fundedPct}% funded of ${formatCurrency(group.target)}`
                            : `${group.percentage.toFixed(1)}% allocation`}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Individual jars
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {buckets.map((bucket) => (
                  <BucketCard
                    key={bucket.id}
                    bucket={bucket}
                    balance={getBucketBalance(bucket.id)}
                    totalBalance={totalBalance}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  )
}
