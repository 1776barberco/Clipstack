'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Dashboard Error</h2>
      <p className="text-muted-foreground">{error.message || 'Failed to load dashboard.'}</p>
      <Button onClick={reset}>Retry</Button>
    </div>
  )
}
