'use client'

import Link from 'next/link'
import { ArrowRight, Wallet } from 'lucide-react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useBuckets } from '@/hooks/useBuckets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'

export function JarSnapshot() {
  const { user } = useAuthContext()
  const { buckets, loading, getBucketBalance } = useBuckets(user?.id)
  const priorityJars = buckets.slice(0, 3)

  return (
    <Card id="tour-buckets">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5" aria-hidden="true" />
          Jars At A Glance
        </CardTitle>
        <Link
          href="/jars"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View All
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <div className="h-12 animate-pulse rounded-lg bg-muted" />
            <div className="h-12 animate-pulse rounded-lg bg-muted" />
            <div className="h-12 animate-pulse rounded-lg bg-muted" />
          </>
        ) : priorityJars.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Create your first jar to start splitting tips, chair rent, taxes, and savings.
          </div>
        ) : (
          priorityJars.map((jar) => {
            const balance = getBucketBalance(jar.id)
            const target = jar.target_amount && jar.target_amount > 0 ? jar.target_amount : null
            const progress = target ? Math.min(100, (balance / target) * 100) : jar.percentage

            return (
              <Link
                key={jar.id}
                href="/jars"
                className="block rounded-lg border p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: jar.color }} />
                    <span className="truncate text-sm font-medium">{jar.name}</span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(balance)}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
