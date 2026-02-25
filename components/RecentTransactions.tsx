'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { useExpenses } from '@/hooks/useExpenses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { History, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'

export function RecentTransactions() {
  const { user } = useAuthContext()
  const { entries: incomeEntries, loading: incomeLoading } = useIncome(user?.id)
  const { expenses, loading: expensesLoading } = useExpenses(user?.id)

  const loading = incomeLoading || expensesLoading

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Combine and sort transactions by date
  const allTransactions = [
    ...incomeEntries.map((entry) => ({
      id: entry.id,
      type: 'income' as const,
      amount: entry.amount,
      description: entry.source || 'Income',
      date: entry.entry_date,
    })),
    ...expenses.map((expense) => ({
      id: expense.id,
      type: 'expense' as const,
      amount: expense.amount,
      description: expense.description || expense.category || 'Expense',
      bucketName: expense.bucket_name,
      date: expense.entry_date,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const recentIncome = incomeEntries.slice(0, 10)
  const recentExpenses = expenses.slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="income" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Income
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {allTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground">No transactions yet</p>
                ) : (
                  allTransactions.slice(0, 15).map((transaction) => (
                    <div
                      key={`${transaction.type}-${transaction.id}`}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(transaction.date), 'MMM d, yyyy')}
                          {'bucketName' in transaction && (
                            <span className="ml-1">• {transaction.bucketName}</span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="income">
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {recentIncome.length === 0 ? (
                  <p className="text-center text-muted-foreground">No income entries yet</p>
                ) : (
                  recentIncome.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{entry.source || 'Income'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(entry.entry_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className="font-bold text-green-600">
                        +{formatCurrency(entry.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="expenses">
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {recentExpenses.length === 0 ? (
                  <p className="text-center text-muted-foreground">No expenses yet</p>
                ) : (
                  recentExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {expense.description || expense.category || 'Expense'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(expense.entry_date), 'MMM d, yyyy')}
                          <span className="ml-1">• {expense.bucket_name}</span>
                        </p>
                      </div>
                      <span className="font-bold text-red-600">
                        -{formatCurrency(expense.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
