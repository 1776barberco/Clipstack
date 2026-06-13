import { BankTotalCard } from '@/components/BankTotalCard'
import { BoothRentCard } from '@/components/BoothRentCard'
import { BucketBalances } from '@/components/BucketBalances'
import { CoachCard } from '@/components/CoachCard'
import { DailyMomentumCard } from '@/components/DailyMomentumCard'
import { DailyReminderNudge } from '@/components/DailyReminderNudge'
import { DashboardOnboardingTour } from '@/components/DashboardOnboardingTour'
import { DashboardWelcomeModal } from '@/components/DashboardWelcomeModal'
import { EveningStreakReminder } from '@/components/EveningStreakReminder'
import { Footer } from '@/components/Footer'
import { ForecastCard } from '@/components/ForecastCard'
import { JarSnapshot } from '@/components/JarSnapshot'
import { MilestoneToast } from '@/components/MilestoneToast'
import { PlaidJarMovementCard } from '@/components/PlaidJarMovementCard'
import { QuickExpenseEntry } from '@/components/QuickExpenseEntry'
import { QuickIncomeEntry } from '@/components/QuickIncomeEntry'
import { RecentTransactions } from '@/components/RecentTransactions'
import { StabilityMeter } from '@/components/StabilityMeter'
import { StreakCelebration } from '@/components/StreakCelebration'
import { StreakProtectedToast } from '@/components/StreakProtectedToast'
import { StreakRewardsCard } from '@/components/StreakRewardsCard'
import { TaxEstimateCard } from '@/components/TaxEstimateCard'
import { UserMenu } from '@/components/UserMenu'
import { WeeklyChart } from '@/components/WeeklyChart'
import { WeeklySummaryCard } from '@/components/WeeklySummaryCard'
import { WhatIfCard } from '@/components/WhatIfCard'
import { UpcomingBillsCard } from '@/components/UpcomingBillsCard'
import { WithdrawButton } from '@/components/WithdrawButton'

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

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div id="tour-bank-total">
            <BankTotalCard />
          </div>
          <div id="tour-daily-momentum">
            <DailyMomentumCard />
          </div>
        </section>

        <div id="tour-plaid-jar-movement">
          <PlaidJarMovementCard />
        </div>

        <section className="lg:hidden">
          <JarSnapshot />
        </section>

        <section className="hidden lg:block" id="tour-buckets">
          <BucketBalances />
        </section>

        <DailyReminderNudge />
        <div className="hidden lg:block">
          <EveningStreakReminder />
        </div>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div id="tour-weekly-summary">
            <WeeklySummaryCard />
          </div>
          <div className="hidden lg:block">
            <ForecastCard />
          </div>
        </section>

        <section className="hidden gap-6 lg:grid lg:grid-cols-2">
          <div id="tour-quick-income">
            <QuickIncomeEntry />
          </div>
          <QuickExpenseEntry />
        </section>

        <section className="hidden gap-6 lg:grid lg:grid-cols-2">
          <div id="tour-stability-meter">
            <StabilityMeter />
          </div>
          <WeeklyChart />
        </section>

        <section className="hidden lg:block" id="tour-what-if">
          <WhatIfCard />
        </section>

        <section className="hidden lg:block" id="tour-recent-transactions">
          <RecentTransactions />
        </section>

        <section className="hidden lg:block" id="tour-upcoming-bills">
          <UpcomingBillsCard />
        </section>

        <section className="hidden lg:block" id="tour-ai-coach">
          <CoachCard />
        </section>

        <section className="hidden lg:block" id="tour-streak-rewards">
          <StreakRewardsCard />
        </section>

        <section className="hidden gap-6 lg:grid lg:grid-cols-2">
          <BoothRentCard />
          <div id="tour-tax-estimate">
            <TaxEstimateCard />
          </div>
        </section>
      </main>

      <Footer />
      <DashboardWelcomeModal />
      <DashboardOnboardingTour />
    </div>
  )
}
