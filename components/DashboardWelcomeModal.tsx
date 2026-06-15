'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowRight, Sparkles } from 'lucide-react'

import { useAuthContext } from '@/providers/AuthProvider'
import { useProfile } from '@/hooks/useProfile'

const WELCOME_STORAGE_KEY = 'tipjars-dashboard-welcome-dismissed'
const TOUR_STORAGE_KEY = 'tipjars-dashboard-tour-completed'

export function DashboardWelcomeModal() {
  const { user } = useAuthContext()
  const { profile, loading } = useProfile(user?.id)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || loading) return

    const frame = window.requestAnimationFrame(() => {
      const dismissed = window.localStorage.getItem(WELCOME_STORAGE_KEY)
      const createdAt = profile?.created_at ? new Date(profile.created_at) : null
      const accountAgeMs = createdAt ? Date.now() - createdAt.getTime() : Number.MAX_SAFE_INTEGER
      const isBrandNewUser = accountAgeMs < 1000 * 60 * 60 * 24 * 3

      if (!dismissed && isBrandNewUser) {
        setOpen(true)
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [loading, profile?.created_at])

  const handleStartTour = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(WELCOME_STORAGE_KEY, 'true')
      window.localStorage.removeItem(TOUR_STORAGE_KEY)
    }
    setOpen(false)
  }

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(WELCOME_STORAGE_KEY, 'true')
      window.localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md rounded-3xl border-primary/20 bg-background/95 p-0 shadow-2xl" showCloseButton={false}>
        <div className="rounded-t-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pt-6 pb-4">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl">Welcome to TipJars</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              This app works best when you use it every day. Log your daily income, let TipJars split it into your jars, and build better spending habits over time.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 pb-6">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">Best way to use TipJars</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Log your income daily, even if it&apos;s just a rough estimate</li>
              <li>• Check your jars before you spend</li>
              <li>• Review your weekly summary to tighten your habits</li>
            </ul>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full" onClick={handleStartTour}>
              Start guided tour
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full" onClick={handleSkip}>
              Skip for now
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
