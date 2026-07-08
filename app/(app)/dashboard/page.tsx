import { BankTotalCard } from '@/components/BankTotalCard'
import { BucketBalances } from '@/components/BucketBalances'
import { DailyMomentumCard } from '@/components/DailyMomentumCard'
import { DailyReminderNudge } from '@/components/DailyReminderNudge'
import { DashboardOnboardingTour } from '@/components/DashboardOnboardingTour'
import { DashboardWelcomeModal } from '@/components/DashboardWelcomeModal'
import { EveningStreakReminder } from '@/components/EveningStreakReminder'
import { Footer } from '@/components/Footer'
import { JarSnapshot } from '@/components/JarSnapshot'
import { MilestoneToast } from '@/components/MilestoneToast'
import { PlaidJarMovementCard } from '@/components/PlaidJarMovementCard'
import { QuickIncomeEntry } from '@/components/QuickIncomeEntry'
import { StreakCelebration } from '@/components/StreakCelebration'
import { StreakProtectedToast } from '@/components/StreakProtectedToast'
import { UserMenu } from '@/components/UserMenu'
import { WeeklySummaryCard } from '@/components/WeeklySummaryCard'
import { WithdrawButton } from '@/components/WithdrawButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, Inbox, ListChecks, PiggyBank, Settings } from 'lucide-react'
import Link from 'next/link'

const nextSteps = [
  { href: '/review', label: 'Review Inbox', icon: Inbox },
  { href: '/jars', label: 'Manage Jars', icon: PiggyBank },
  { href: '/activity', label: 'Review Activity', icon: ListChecks },
  { href: '/insights', label: 'Open Insights', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Today</p>
            <h1 className="text-xl font-bold">TipJars</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <WithdrawButton />
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl space-y-4 p-4 pb-4 md:space-y-6">
        <MilestoneToast />
        <StreakCelebration />
        <StreakProtectedToast />

        <section id="tour-daily-momentum">
          <DailyMomentumCard />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div id="tour-bank-total">
            <BankTotalCard />
          </div>
          <div id="tour-weekly-summary">
            <WeeklySummaryCard />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-4 md:space-y-6">
            <div id="tour-plaid-jar-movement">
              <PlaidJarMovementCard />
            </div>

            <section className="lg:hidden">
              <JarSnapshot />
            </section>

            <section className="hidden lg:block" id="tour-buckets">
              <BucketBalances />
            </section>
          </div>

          <aside className="hidden min-w-0 space-y-4 lg:sticky lg:top-24 lg:block lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto lg:pr-1">
            <QuickIncomeEntry />
            <EveningStreakReminder />
            <Card>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">Next</p>
                  <p className="text-sm text-muted-foreground">Jump into the deeper views when you need them.</p>
                </div>
                <div className="grid gap-2">
                  {nextSteps.map((item) => (
                    <Button key={item.href} asChild variant="outline" className="h-11 justify-start">
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>

        <section className="grid gap-4 lg:hidden">
          <Card>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Next</p>
                <p className="text-sm text-muted-foreground">Jump into the deeper views when you need them.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {nextSteps.map((item) => (
                  <Button key={item.href} asChild variant="outline" className="h-11 justify-start">
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <DailyReminderNudge />
      </main>

      <Footer />
      <DashboardWelcomeModal />
      <DashboardOnboardingTour />
    </div>
  )
}
