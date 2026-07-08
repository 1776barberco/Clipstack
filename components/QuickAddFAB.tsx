'use client'

import { useEffect, useState } from 'react'
import { IncomeEntrySheet } from '@/components/IncomeEntrySheet'

export function QuickAddFAB() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-quick-log', handler)
    return () => window.removeEventListener('open-quick-log', handler)
  }, [])

  return (
    <IncomeEntrySheet
      open={open}
      onOpenChange={setOpen}
      defaultMode="income"
      title="Quick Log"
      description="Log income or expenses and keep your jars up to date."
    />
  )
}
