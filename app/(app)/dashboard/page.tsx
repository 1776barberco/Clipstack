import { Footer } from '@/components/Footer'
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
import Image from 'next/image'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="TipJars" width={32} height={32} />
            <span className="text-xl font-bold">TipJars</span>
          </div>
          <div className="flex items-center gap-4">
            <WithdrawButton />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 space-y-6">
        {/* Top Row: Quick actions + Stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          <QuickIncomeEntry />
          <QuickExpenseEntry />
          <StabilityMeter />
        </div>

        {/* Middle Row: Charts + Financial info */}
        <div className="grid gap-6 lg:grid-cols-2">
          <WeeklyChart />
          <RecentTransactions />
        </div>

        {/* Bottom Row: Jars + Rent/Tax details */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BucketBalances />
          </div>
          <div className="space-y-6">
            <BoothRentCard />
            <TaxEstimateCard />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
