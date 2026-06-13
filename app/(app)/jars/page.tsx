import { BankTotalCard } from '@/components/BankTotalCard'
import { BoothRentCard } from '@/components/BoothRentCard'
import { BucketBalances } from '@/components/BucketBalances'
import { TaxEstimateCard } from '@/components/TaxEstimateCard'
import { UserMenu } from '@/components/UserMenu'
import { WithdrawButton } from '@/components/WithdrawButton'

export default function JarsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Manage Money</p>
            <h1 className="text-xl font-bold">Jars</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <WithdrawButton />
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-4 p-4 md:space-y-6">
        <BankTotalCard />
        <BucketBalances />
        <section className="grid gap-4 md:grid-cols-2">
          <BoothRentCard />
          <TaxEstimateCard />
        </section>
      </main>
    </div>
  )
}
