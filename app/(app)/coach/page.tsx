'use client'

import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/providers/AuthProvider'
import { useSubscription } from '@/hooks/useSubscription'
import { Brain, Lock, Sparkles, TrendingUp, Lightbulb, Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/BottomNav'

export default function CoachPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const { isSubscribed, loading } = useSubscription(user?.id)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Subscribed users get the full coach chat (Phase 3)
  if (isSubscribed) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-bold">AI Coach</span>
            </div>
          </div>
        </header>
        <main className="container mx-auto p-4 pb-24">
          <div className="text-center py-20">
            <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Coach chat coming soon!</p>
            <p className="text-sm text-muted-foreground mt-2">Your personalized AI coach is being built.</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // Free users see the paywall
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-bold ml-2">AI Coach</span>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-24">
        {/* Hero */}
        <div className="text-center pt-12 pb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-primary/20 mb-6">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Meet Your AI Coach</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            A personal financial coach built for barbers, stylists, and beauty professionals.
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-4 max-w-md mx-auto mb-8">
          {[
            {
              icon: <Sparkles className="h-5 w-5 text-purple-400" />,
              title: 'Unlimited AI Insights',
              desc: 'Get personalized tips based on your real income and spending patterns.',
            },
            {
              icon: <Brain className="h-5 w-5 text-blue-400" />,
              title: '1-on-1 Chat With Your Coach',
              desc: 'Ask questions, get advice, and make smarter money moves.',
            },
            {
              icon: <TrendingUp className="h-5 w-5 text-green-400" />,
              title: 'Seasonal Forecasts',
              desc: 'Know when to save more and when you can breathe easy.',
            },
            {
              icon: <Lightbulb className="h-5 w-5 text-amber-400" />,
              title: 'Choose Your Coach Vibe',
              desc: '4 personality styles — from motivational hype to straight talk.',
            },
          ].map((feature) => (
            <div key={feature.title} className="flex gap-4 p-4 rounded-xl border bg-card">
              <div className="shrink-0 mt-0.5">{feature.icon}</div>
              <div>
                <h3 className="font-semibold text-sm mb-0.5">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing CTA */}
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border-2 border-primary bg-gradient-to-b from-primary/10 to-transparent p-6 text-center">
            <div className="text-sm font-medium text-primary mb-1">AI Coach Pro</div>
            <div className="mb-1">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-muted-foreground text-sm"> / month</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5">7-day free trial · Cancel anytime</p>

            {/* TODO: Wire to Stripe Checkout */}
            <Button
              className="w-full h-12 text-base rounded-full bg-primary hover:bg-primary/90"
              onClick={() => {
                // Will redirect to Stripe Checkout once wired
                // For now, show coming soon
                alert('Stripe integration coming soon! You\'ll be able to start your free trial here.')
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Start 7-Day Free Trial
            </Button>

            <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Secured by Stripe · Cancel in Settings</span>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="max-w-md mx-auto mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Join barbers & stylists already leveling up their finances
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
