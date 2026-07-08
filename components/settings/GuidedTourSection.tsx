'use client'

import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type GuidedTourSectionProps = {
  onReplay: () => void
}

export function GuidedTourSection({ onReplay }: GuidedTourSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-5 w-5" />
          Guided Tour
        </CardTitle>
        <CardDescription>Replay the onboarding tour anytime from settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          If you want another walkthrough of the daily income flow, jars, forecast, and weekly summary, you can launch it again here.
        </p>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onReplay}>
          <Compass className="mr-2 h-4 w-4" />
          Replay Tour
        </Button>
      </CardContent>
    </Card>
  )
}
