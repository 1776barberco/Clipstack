'use client'

import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/providers/AuthProvider'
import { useSubscription } from '@/hooks/useSubscription'
import { Brain, Sparkles, TrendingUp, Lightbulb, Shield, ArrowLeft, MessageCircle, Target, BarChart3, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BottomNav } from '@/components/BottomNav'
import { UserMenu } from '@/components/UserMenu'

export default function CoachPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const { isSubscribed, isTrialing, trialDaysLeft, loading } = useSubscription(user?.id)

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
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-bold">AI Coach</span>
              {isTrialing && trialDaysLeft > 0 && (
                <span className="text-xs text-muted-foreground bg-primary/10 rounded-full px-2 py-0.5">
                  {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in trial
                </span>
              )}
            </div>
            <UserMenu />
          </div>
        </header>
        <main className="container mx-auto p-4 pb-24 lg:pb-6">
          <div className="text-center py-20 max-w-lg mx-auto">
            <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Coach chat coming soon!</p>
            <p className="text-sm text-muted-foreground mt-2">Your personalized AI coach is being built. Check back soon.</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // Free users see the paywall — responsive layout
  const features = [
    {
      icon: <Sparkles className="h-5 w-5 text-purple-400" />,
      title: 'Unlimited AI Insights',
      desc: 'Get personalized tips based on your real income and spending patterns.',
    },
    {
      icon: <MessageCircle className="h-5 w-5 text-blue-400" />,
      title: '1-on-1 Chat With Your Coach',
      desc: 'Ask questions, get advice, and plan your next money move.',
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-green-400" />,
      title: 'Seasonal Forecasts',
      desc: 'Know when to save more and when you can breathe easy.',
    },
    {
      icon: <Palette className="h-5 w-5 text-pink-400" />,
      title: 'Choose Your Coach Vibe',
      desc: '4 personality styles — from motivational hype to straight talk.',
    },
    {
      icon: <Target className="h-5 w-5 text-amber-400" />,
      title: 'Personalized Savings Goals',
      desc: 'Your coach sets targets based on your actual earnings.',
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-cyan-400" />,
      title: 'Spending Habit Analysis',
      desc: 'Spot patterns, cut waste, and keep more of what you earn.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-bold">AI Coach</span>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 pb-24 lg:pb-12">
        {/* Desktop: two-column layout / Mobile: single column */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start lg:py-12 max-w-5xl mx-auto">

          {/* Left column: Hero + Features */}
          <div>
            {/* Hero */}
            <div className="text-center lg:text-left pt-12 lg:pt-0 pb-8">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-primary/20 mb-6">
                <Brain className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">Meet Your AI Coach</h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto lg:mx-0">
                A personal financial coach built for barbers, stylists, and beauty professionals.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid gap-3 sm:grid-cols-2 mb-8 lg:mb-0">
              {features.map((feature) => (
                <Card key={feature.title} className="bg-card/50">
                  <CardContent className="flex gap-3 p-4">
                    <div className="shrink-0 mt-0.5">{feature.icon}</div>
                    <div>
                      <h3 className="font-semibold text-sm mb-0.5">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right column: Pricing card (sticky on desktop) */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border-2 border-primary bg-gradient-to-b from-primary/10 to-transparent p-8 text-center max-w-md mx-auto">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Brain className="h-7 w-7 text-primary" />
              </div>
              <div className="text-sm font-medium text-primary mb-2">AI Coach Pro</div>
              <div className="mb-1">
                <span className="text-5xl font-bold">$9.99</span>
                <span className="text-muted-foreground text-sm"> / month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">7-day free trial · Cancel anytime</p>

              <ul className="text-sm text-left space-y-2 mb-6 max-w-xs mx-auto">
                {[
                  'Unlimited AI insights',
                  '1-on-1 coach chat',
                  '4 coach personalities',
                  'Savings goal planning',
                  'Spending analysis',
                  'Seasonal forecasts',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-primary text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* TODO: Wire to Stripe Checkout */}
              <Button
                className="w-full h-12 text-base rounded-full bg-primary hover:bg-primary/90"
                onClick={() => {
                  alert('Stripe integration coming soon! You\'ll be able to start your free trial here.')
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Start 7-Day Free Trial
              </Button>

              <div className="flex items-center justify-center gap-1 mt-4 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>Secured by Stripe · Cancel in Settings</span>
              </div>
            </div>

            {/* Social proof */}
            <p className="text-xs text-muted-foreground text-center mt-6">
              Join barbers, stylists, and independent contractors already leveling up their finances
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
