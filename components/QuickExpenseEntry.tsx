'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IncomeEntrySheet } from '@/components/IncomeEntrySheet'
import { Plus, Receipt } from 'lucide-react'

interface QuickExpenseEntryProps {
  defaultBucketId?: string
  onSuccess?: () => void
}

export function QuickExpenseEntry({ defaultBucketId, onSuccess }: QuickExpenseEntryProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Quick Expense Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button type="button" className="w-full" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Log Expense
          </Button>
        </CardContent>
      </Card>

      <IncomeEntrySheet
        open={open}
        onOpenChange={setOpen}
        defaultMode="expense"
        defaultBucketId={defaultBucketId}
        title="Quick Expense"
        description="Record an expense from an account and assign it to a jar or Bank Total."
        onSuccess={onSuccess}
      />
    </>
  )
}
