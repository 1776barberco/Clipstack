import { Footer } from '@/components/Footer'
import { CoachCard } from '@/components/CoachCard'
import { QuickIncomeEntry } from '@/components/QuickIncomeEntry'
import { QuickExpenseEntry } from '@/components/QuickExpenseEntry'
import { BucketBalances } from '@/components/BucketBalances'
import { StabilityMeter } from '@/components/StabilityMeter'
import { BoothRentCard } from '@/components/BoothRentCard'
import { TaxEstimateCard } from '@/components/TaxEstimateCard'
import { WeeklyChart } from '@/components/WeeklyChart'
import { RecentTransactions } from '@/components/RecentTransactions'
import { UserMenu } from '@/components/UserMenu'
import { WithdrawButton } from '@/components/WithdrawButton'
import { BottomNav } from '@/components/BottomNav'
import { QuickAddFAB } from '@/components/QuickAddFAB'
import { WeeklySummaryCard } from '@/components/WeeklySummaryCard'
import { ForecastCard } from '@/components/ForecastCard'
import { WhatIfCard } from '@/components/WhatIfCard'
import { MilestoneToast } from '@/components/MilestoneToast'
import { BankTotalCard } from '@/components/BankTotalCard'
import { UpcomingBillsCard } from '@/components/UpcomingBillsCard'
import { DashboardOnboardingTour } from '@/components/DashboardOnboardingTour'
import { DashboardWelcomeModal } from '@/components/DashboardWelcomeModal'
import { DailyReminderNudge } from '@/components/DailyReminderNudge'
import { DailyMomentumCard } from '@/components/DailyMomentumCard'
import { EveningStreakReminder } from '@/components/EveningStreakReminder'
import { StreakCelebration } from '@/components/StreakCelebration'
import { StreakProtectedToast } from '@/components/StreakProtectedToast'
import { StreakRewardsCard } from '@/components/StreakRewardsCard'
import { PlaidJarMovementCard } from '@/components/PlaidJarMovementCard'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      {/* Header — Glass Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/60 backdrop-blur-2xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">TipJars</span>
          </div>
          <div className="flex items-center gap-3">
            <WithdrawButton />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 space-y-6 pb-24 md:pb-6">
        <MilestoneToast />
        <StreakCelebration />
        <StreakProtectedToast />

        <div id="tour-daily-momentum">
          <DailyMomentumCard />
        </div>

        <div id="tour-plaid-jar-movement">
          <PlaidJarMovementCard />
        </div>

        {/* Bank Total — Overall financial position */}
        <div id="tour-bank-total">
          <BankTotalCard />
        </div>

        <DailyReminderNudge />
        <EveningStreakReminder />

        {/* Weekly Summary — Hero position */}
        <div id="tour-weekly-summary">
          <WeeklySummaryCard />
        </div>

        {/* Forecast — Income projections + bucket targets */}
        <div id="tour-forecast">
          <ForecastCard />
        </div>

        {/* Desktop: Quick Income + Expense side by side (hidden on mobile/tablet — FAB handles it) */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6">
          <div id="tour-quick-income">
            <QuickIncomeEntry />
          </div>
          <QuickExpenseEntry />
        </div>

        {/* Stability + Chart */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <div id="tour-stability-meter">
            <StabilityMeter />
          </div>
          <WeeklyChart />
        </div>

        {/* What-If Scenario Slider */}
        <div id="tour-what-if">
          <WhatIfCard />
        </div>

        {/* Jars — The Core */}
        <div id="tour-buckets">
          <BucketBalances />
        </div>

        {/* Recent Activity */}
        <div id="tour-recent-transactions">
          <RecentTransactions />
        </div>

        {/* Upcoming Bills */}
        <div id="tour-upcoming-bills">
          <UpcomingBillsCard />
        </div>

        {/* AI Coach */}
        <div id="tour-ai-coach">
          <CoachCard />
        </div>

        <div id="tour-streak-rewards">
          <StreakRewardsCard />
        </div>

        {/* Rent + Tax Details */}
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
          <BoothRentCard />
          <div id="tour-tax-estimate">
            <TaxEstimateCard />
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
      <QuickAddFAB />
      <DashboardWelcomeModal />
      <DashboardOnboardingTour />
    </div>
  )
}
