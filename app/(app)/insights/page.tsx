import { CoachCard } from '@/components/CoachCard'
import { ForecastCard } from '@/components/ForecastCard'
import { StabilityMeter } from '@/components/StabilityMeter'
import { StreakRewardsCard } from '@/components/StreakRewardsCard'
import { UpcomingBillsCard } from '@/components/UpcomingBillsCard'
import { UserMenu } from '@/components/UserMenu'
import { WeeklyChart } from '@/components/WeeklyChart'
import { WhatIfCard } from '@/components/WhatIfCard'

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Plan Ahead</p>
            <h1 className="text-xl font-bold">Insights</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-4 p-4 md:space-y-6">
        <ForecastCard />
        <section className="grid gap-4 lg:grid-cols-2">
          <StabilityMeter />
          <WeeklyChart />
        </section>
        <WhatIfCard />
        <UpcomingBillsCard />
        <CoachCard />
        <StreakRewardsCard />
      </main>
    </div>
  )
}
