'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthContext } from '@/providers/AuthProvider'
import { useSubscription } from '@/hooks/useSubscription'
import { Brain, Sparkles, TrendingUp, Lightbulb, Shield, ArrowLeft, MessageCircle, Target, BarChart3, Palette, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BottomNav } from '@/components/BottomNav'
import { UserMenu } from '@/components/UserMenu'
import { CoachChat } from '@/components/CoachChat'
import { ToneSelector } from '@/components/ToneSelector'
import { supabase } from '@/lib/supabase/client'

export default function CoachPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthContext()
  const { isSubscribed, isTrialing, trialDaysLeft, loading } = useSubscription(user?.id)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [tone, setTone] = useState('motivator')
  const [userName, setUserName] = useState<string | undefined>()

  const isSuccess = searchParams.get('success') === 'true'

  // Load user's preferred tone
  useEffect(() => {
    if (!user || !supabase) return
    supabase
      .from('profiles')
      .select('coach_tone, full_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }: { data: { coach_tone?: string; full_name?: string } | null }) => {
        if (data?.coach_tone) setTone(data.coach_tone)
        if (data?.full_name) setUserName(data.full_name.split(' ')[0])
      })
  }, [user])

  // Save tone preference when changed
  const handleToneChange = (newTone: string) => {
    setTone(newTone)
    if (user && supabase) {
      supabase.from('profiles').update({ coach_tone: newTone }).eq('id', user.id).then(() => {})
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Subscribed users (or admins) get the full coach chat
  if (isSubscribed || isSuccess) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">AI Coach</span>
              {isTrialing && trialDaysLeft > 0 && (
                <span className="text-[10px] text-muted-foreground bg-primary/10 rounded-full px-2 py-0.5">
                  {trialDaysLeft}d trial
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ToneSelector selectedTone={tone} onSelect={handleToneChange} />
              <UserMenu />
            </div>
          </div>
        </header>

        {isSuccess && (
          <div className="border-b bg-green-500/10 p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Welcome to AI Coach Pro! Your 7-day trial has started 🎉</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden lg:pl-0">
          <CoachChat tone={tone} userName={userName} />
        </div>

        <BottomNav />
      </div>
    )
  }

  // Free users see the paywall
  const features = [
    { icon: MessageCircle, title: 'Unlimited Chat', desc: 'Ask anything about your finances, budgeting, and goals' },
    { icon: Brain, title: 'Smart Insights', desc: 'AI analyzes your income patterns and spending habits' },
    { icon: Target, title: 'Goal Setting', desc: 'Set and track savings goals with personalized strategies' },
    { icon: BarChart3, title: 'Weekly Reports', desc: 'Get detailed breakdowns of your financial progress' },
    { icon: Palette, title: '4 Coach Styles', desc: 'Choose your vibe: Motivator, Mentor, Drill Sergeant, or Numbers Nerd' },
    { icon: Shield, title: 'Tax Guidance', desc: 'Stay on top of quarterly taxes with smart reminders' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-bold">AI Coach Pro</span>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto p-4 pb-24 lg:pb-6">
        <div className="grid lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
          {/* Features */}
          <div className="lg:col-span-3 space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Your Personal AI Financial Coach</h1>
              <p className="text-muted-foreground">
                Get personalized budgeting advice, tax guidance, and savings strategies — built for barbers, stylists, and independent contractors.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature) => (
                <Card key={feature.title}>
                  <CardContent className="p-4 flex gap-3">
                    <feature.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{feature.title}</p>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">
                💬 Join barbers, stylists, and independent contractors already leveling up their finances
              </p>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <Card className="border-primary/30">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-primary uppercase tracking-wider">AI Coach Pro</p>
                    <div className="flex items-baseline justify-center gap-1 mt-2">
                      <span className="text-4xl font-bold">$9.99</span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">7-day free trial</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    {['Unlimited AI coaching', 'All 4 coach personalities', 'Income pattern analysis', 'Tax strategy guidance', 'Goal tracking & advice', 'Cancel anytime'].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full h-12 text-base rounded-full bg-primary hover:bg-primary/90"
                    disabled={checkoutLoading}
                    onClick={async () => {
                      setCheckoutLoading(true)
                      try {
                        const res = await fetch('/api/stripe/checkout', { method: 'POST' })
                        const data = await res.json()
                        if (data.url) {
                          window.location.href = data.url
                        } else {
                          alert(data.error || 'Failed to start checkout')
                          setCheckoutLoading(false)
                        }
                      } catch {
                        alert('Something went wrong. Please try again.')
                        setCheckoutLoading(false)
                      }
                    }}
                  >
                    {checkoutLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Start 7-Day Free Trial
                  </Button>

                  <p className="text-[10px] text-center text-muted-foreground">
                    No charge for 7 days. Cancel anytime. Auto-renews at $9.99/mo.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
