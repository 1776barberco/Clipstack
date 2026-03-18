'use client'

import { useState } from 'react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useIncome } from '@/hooks/useIncome'
import { useExpenses } from '@/hooks/useExpenses'
import { useAnomalies } from '@/hooks/useAnomalies'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AnomalyBanner } from '@/components/AnomalyBanner'
import { History, TrendingUp, TrendingDown, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function RecentTransactions() {
  const { user } = useAuthContext()
  const { entries: incomeEntries, loading: incomeLoading, mutate: mutateIncome } = useIncome(user?.id)
  const { expenses, loading: expensesLoading, mutate: mutateExpenses } = useExpenses(user?.id)
  const { isAnomalous, getAnomalyInfo, anomalyCount } = useAnomalies(user?.id)
  const [expandedAnomaly, setExpandedAnomaly] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, type: 'income' | 'expense') => {
    if (!confirm(`Are you sure you want to delete this ${type}? This will also reverse any changes to your jars and bank balance.`)) {
      return
    }

    setIsDeleting(id)
    try {
      const response = await fetch('/api/transactions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type }),
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success(`${type === 'income' ? 'Income' : 'Expense'} deleted successfully`)
      if (type === 'income') mutateIncome()
      else mutateExpenses()
    } catch (error) {
      toast.error('Failed to delete transaction')
    } finally {
      setIsDeleting(null)
    }
  }

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
            <AnomalyBanner anomalyCount={anomalyCount} />
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {allTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground">No transactions yet</p>
                ) : (
                  allTransactions.slice(0, 15).map((transaction) => {
                    const anomalous = transaction.type === 'expense' && isAnomalous(transaction.id)
                    const anomalyInfo = anomalous ? getAnomalyInfo(transaction.id) : null
                    const isExpanded = expandedAnomaly === `all-${transaction.id}`

                    return (
                      <div
                        key={`${transaction.type}-${transaction.id}`}
                        className={`rounded-lg border p-3 ${anomalous ? 'border-amber-500/30' : ''}`}
                        onClick={() => anomalous && setExpandedAnomaly(isExpanded ? null : `all-${transaction.id}`)}
                        role={anomalous ? 'button' : undefined}
                        tabIndex={anomalous ? 0 : undefined}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(transaction.date), 'MMM d, yyyy')}
                              {'bucketName' in transaction && (
                                <span className="ml-1">• {transaction.bucketName}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`font-bold ${
                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </span>
                            {anomalous && (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs ml-2">
                                Unusual
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-2 h-8 w-8 text-muted-foreground hover:text-red-600"
                              disabled={isDeleting === transaction.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(transaction.id, transaction.type)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {isExpanded && anomalyInfo && (
                          <p className="text-xs text-amber-500/80 mt-2">
                            {anomalyInfo.reason}
                          </p>
                        )}
                      </div>
                    )
                  })
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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600">
                          +{formatCurrency(entry.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          disabled={isDeleting === entry.id}
                          onClick={() => handleDelete(entry.id, 'income')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                  recentExpenses.map((expense) => {
                    const anomalous = isAnomalous(expense.id)
                    const anomalyInfo = anomalous ? getAnomalyInfo(expense.id) : null
                    const isExpanded = expandedAnomaly === `exp-${expense.id}`

                    return (
                      <div
                        key={expense.id}
                        className={`rounded-lg border p-3 ${anomalous ? 'border-amber-500/30' : ''}`}
                        onClick={() => anomalous && setExpandedAnomaly(isExpanded ? null : `exp-${expense.id}`)}
                        role={anomalous ? 'button' : undefined}
                        tabIndex={anomalous ? 0 : undefined}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {expense.description || expense.category || 'Expense'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(expense.entry_date), 'MMM d, yyyy')}
                              <span className="ml-1">• {expense.bucket_name}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-red-600">
                              -{formatCurrency(expense.amount)}
                            </span>
                            {anomalous && (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs ml-2">
                                Unusual
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              disabled={isDeleting === expense.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(expense.id, 'expense')
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {isExpanded && anomalyInfo && (
                          <p className="text-xs text-amber-500/80 mt-2">
                            {anomalyInfo.reason}
                          </p>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
