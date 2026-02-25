'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function WeeklyChart() {
  const { user } = useAuthContext()
  const { weeklyIncome, loading } = useIncome(user?.id)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const data = weeklyIncome.map((week) => ({
    name: format(parseISO(week.weekStart), 'MMM d'),
    amount: week.total,
  }))

  const totalIncome = weeklyIncome.reduce((sum, w) => sum + w.total, 0)
  const avgWeekly = weeklyIncome.length > 0 ? totalIncome / weeklyIncome.length : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Weekly Income
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">8-Week Total</p>
            <p className="text-xl font-bold">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">Weekly Average</p>
            <p className="text-xl font-bold">{formatCurrency(avgWeekly)}</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                width={60}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), 'Income']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Bar
                dataKey="amount"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
