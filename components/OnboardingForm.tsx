'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/providers/AuthProvider'
import { completeOnboarding } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Scissors, User, DollarSign, Calendar, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const BUCKET_TEMPLATES = [
  {
    name: 'Essentials',
    percentage: 50,
    color: '#3b82f6',
    priority: 1,
  },
  {
    name: 'Taxes',
    percentage: 25,
    color: '#ef4444',
    is_tax_bucket: true,
    priority: 2,
  },
  {
    name: 'Savings',
    percentage: 15,
    color: '#22c55e',
    priority: 3,
  },
  {
    name: 'Fun',
    percentage: 10,
    color: '#f59e0b',
    priority: 4,
  },
]

export function OnboardingForm() {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [boothRent, setBoothRent] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuthContext()
  const router = useRouter()

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = async () => {
    if (!user) return

    setLoading(true)

    try {
      const result = await completeOnboarding({
        fullName: fullName,
        boothRent: boothRent ? parseFloat(boothRent) : null,
        dueDay: dueDay ? parseInt(dueDay) : null,
      })

      if (result.error) throw new Error(result.error)

      toast.success('Welcome to TipJars!')
      router.push('/dashboard')
    } catch (error: any) {
      const msg = error?.message || 'Something went wrong.'
      toast.error(msg)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">What&apos;s your name?</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="boothRent">Weekly booth rent (optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="boothRent"
                  type="number"
                  placeholder="150"
                  value={boothRent}
                  onChange={(e) => setBoothRent(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDay">Rent due day of month (optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="dueDay"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="1"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              We&apos;ll set up your default jars based on the 50/25/15/10 rule:
            </p>
            <div className="space-y-2">
              {BUCKET_TEMPLATES.map((bucket) => (
                <div
                  key={bucket.name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <span className="font-medium">{bucket.name}</span>
                    {bucket.is_tax_bucket && (
                      <span className="text-xs text-muted-foreground">(Tax)</span>
                    )}
                  </div>
                  <span className="font-bold">{bucket.percentage}%</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              You can customize these anytime from your settings.
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Scissors className="h-8 w-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Let&apos;s get you set up</CardTitle>
        <CardDescription>
          Step {step} of {totalSteps}
        </CardDescription>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent>
        <div className="mb-6">{renderStep()}</div>
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          {step < totalSteps ? (
            <Button
              className="flex-1"
              onClick={handleNext}
              disabled={step === 1 && !fullName}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleComplete}
              disabled={loading}
            >
              {loading ? (
                'Setting up...'
              ) : (
                <>
                  Complete Setup
                  <CheckCircle className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
