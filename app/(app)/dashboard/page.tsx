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
        {/* Weekly Summary — Hero position */}
        <WeeklySummaryCard />

        {/* Forecast — Income projections + bucket targets */}
        <ForecastCard />

        {/* Desktop: Quick Income + Expense side by side (hidden on mobile/tablet — FAB handles it) */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6">
          <QuickIncomeEntry />
          <QuickExpenseEntry />
        </div>

        {/* Stability + Chart */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <StabilityMeter />
          <WeeklyChart />
        </div>

        {/* What-If Scenario Slider */}
        <WhatIfCard />

        {/* Jars — The Core */}
        <BucketBalances />

        {/* Recent Activity */}
        <RecentTransactions />

        {/* AI Coach */}
        <CoachCard />

        {/* Rent + Tax Details */}
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
          <BoothRentCard />
          <TaxEstimateCard />
        </div>
      </main>

      <Footer />
      <BottomNav />
      <QuickAddFAB />
    </div>
  )
}
