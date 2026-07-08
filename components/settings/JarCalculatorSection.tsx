'use client'

import { Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JarSplitCalculator } from '@/components/JarSplitCalculator'

type JarCalculatorSectionProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function JarCalculatorSection({ open, onOpenChange, onComplete }: JarCalculatorSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Jar Split Calculator
            </CardTitle>
            <CardDescription>
              Not sure how to split your jars? Enter your income and bills, we&apos;ll calculate the percentages for you.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant={open ? 'default' : 'outline'}
            size="sm"
            className="min-h-10 w-full sm:w-auto"
            onClick={() => onOpenChange(!open)}
          >
            {open ? 'Close' : 'Open'}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          <JarSplitCalculator mode="settings" onComplete={onComplete} />
        </CardContent>
      )}
    </Card>
  )
}
