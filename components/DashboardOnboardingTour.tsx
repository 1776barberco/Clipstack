'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'

type TourStep = {
  title: string
  body: string
  targetId: string
}

export const TOUR_STORAGE_KEY = 'tipjars-dashboard-tour-completed'

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-daily-momentum',
    title: 'This is your daily momentum board',
    body: 'It shows today\'s progress at a glance, including your streak, your latest income check-in, and the jar with the most money sitting in it.',
  },
  {
    targetId: 'tour-plaid-jar-movement',
    title: 'Review bank activity in your jar plan',
    body: 'After you connect your bank through Plaid, synced transactions show up here so you can review income, spending, and jar movement without manually entering everything.',
  },
  {
    targetId: 'tour-bank-total',
    title: 'Your money across all accounts lives here',
    body: 'This gives you a top-level view of all your money across connected accounts so you know your real position before you spend.',
  },
  {
    targetId: 'tour-weekly-summary',
    title: 'Check your weekly snapshot',
    body: 'Use this to see how your income is trending so you can make better day-to-day spending decisions before the week gets away from you.',
  },
  {
    targetId: 'tour-quick-income',
    title: 'Log income every day',
    body: 'This is the habit that makes TipJars work. Entering your daily income helps the app guide your spending and improve your splits over time.',
  },
  {
    targetId: 'tour-quick-add',
    title: 'Quick Add lets you log income and expenses fast',
    body: 'Use Quick Add for rapid check-ins. You can switch between income and expense, tap quick amounts, choose an account, and log without digging through screens.',
  },
  {
    targetId: 'tour-stability-meter',
    title: 'The stability meter shows how safe your cushion is',
    body: 'This score tells you how stable your money situation is based on what you have saved relative to your average income.',
  },
  {
    targetId: 'tour-buckets',
    title: 'Your jars show where each dollar should go',
    body: 'Every income entry gets split into your jars so you can see what is safe to spend, save, or hold back for taxes and bills.',
  },
  {
    targetId: 'tour-what-if',
    title: 'Use What If to test jar changes before you commit',
    body: 'This lets you explore how changing a jar percentage could affect future balances, so you can make smarter adjustments.',
  },
  {
    targetId: 'tour-upcoming-bills',
    title: 'Upcoming Bills keeps due dates visible',
    body: 'Track what is due soon, what is overdue, and what is coming later so your budget is not blindsided by recurring payments.',
  },
  {
    targetId: 'tour-ai-coach',
    title: 'AI Coach gives you personalized guidance',
    body: 'This dashboard surfaces money insights for your patterns, and if your plan includes it, you can go deeper and ask the AI coach direct questions.',
  },
  {
    targetId: 'tour-streak-rewards',
    title: 'Streak rewards turn consistency into momentum',
    body: 'These rewards are there to reinforce the daily habit. The more consistently you log income, the more milestones you unlock.',
  },
  {
    targetId: 'tour-forecast',
    title: 'Forecast helps you plan ahead',
    body: 'As you keep logging income, TipJars learns your earning patterns and gets better at showing what your next few weeks may look like.',
  },
  {
    targetId: 'tour-tax-estimate',
    title: 'Tax Estimate helps you avoid surprises',
    body: 'Use this to see your estimated tax exposure based on tracked income so you can keep enough money set aside.',
  },
  {
    targetId: 'tour-recent-transactions',
    title: 'Review your recent activity',
    body: 'Use this to stay honest about what came in, what went out, and how your daily habits are affecting your overall spending.',
  },
  {
    targetId: 'tour-settings',
    title: 'Settings is where you tune the system',
    body: 'From Settings you can update jars, reminders, tax rate, accounts, and replay the tour whenever you need another walkthrough.',
  },
]

export function DashboardOnboardingTour() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    setMounted(true)
    if (typeof window === 'undefined') return

    const completed = window.localStorage.getItem(TOUR_STORAGE_KEY)
    const shouldOpen = window.localStorage.getItem('tipjars-force-tour-open') === 'true'

    if (!completed || shouldOpen) {
      setOpen(true)
      if (shouldOpen) {
        window.localStorage.removeItem('tipjars-force-tour-open')
      }
    }
  }, [])

  const currentStep = useMemo(() => TOUR_STEPS[stepIndex], [stepIndex])

  useEffect(() => {
    if (!open || !currentStep || typeof document === 'undefined') return

    const el = document.getElementById(currentStep.targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [open, currentStep])

  useEffect(() => {
    if (typeof document === 'undefined') return

    TOUR_STEPS.forEach((step, idx) => {
      const el = document.getElementById(step.targetId)
      if (!el) return

      if (open && idx === stepIndex) {
        el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background', 'rounded-2xl')
      } else {
        el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background', 'rounded-2xl')
      }
    })

    return () => {
      TOUR_STEPS.forEach((step) => {
        const el = document.getElementById(step.targetId)
        if (!el) return
        el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background', 'rounded-2xl')
      })
    }
  }, [open, stepIndex])

  const finishTour = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    }
    setOpen(false)
  }

  if (!mounted || !open || !currentStep) return null

  return (
    <div className="fixed inset-x-0 bottom-20 z-[100] px-4 md:bottom-6">
      <Card className="mx-auto max-w-md border-primary/20 bg-background/95 shadow-2xl backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Onboarding tour</p>
              <CardTitle className="mt-1 text-lg">{currentStep.title}</CardTitle>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={finishTour} aria-label="Close tour">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{currentStep.body}</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Step {stepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStepIndex((idx) => Math.max(0, idx - 1))}
                disabled={stepIndex === 0}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              {stepIndex < TOUR_STEPS.length - 1 ? (
                <Button onClick={() => setStepIndex((idx) => idx + 1)}>
                  Next
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={finishTour}>Finish tour</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
