'use client'

import { useState } from 'react'
import { DollarSign, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IncomeEntrySheet } from '@/components/IncomeEntrySheet'

export function QuickIncomeEntry() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Card id="tour-quick-income">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Daily Income Check-In
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            TipJars works best when you log income every day. Even a rough number helps the app guide your spending better.
          </p>
        </CardHeader>
        <CardContent>
          <Button type="button" className="w-full" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Log Income or Expense
          </Button>
        </CardContent>
      </Card>

      <IncomeEntrySheet
        open={open}
        onOpenChange={setOpen}
        defaultMode="income"
        title="Daily Check-In"
        description="Log what you made today or record an expense so TipJars can keep your jars current."
      />
    </>
  )
}
