import { RecentTransactions } from '@/components/RecentTransactions'
import { UserMenu } from '@/components/UserMenu'

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Money Log</p>
            <h1 className="text-xl font-bold">Activity</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto max-w-4xl space-y-4 p-4 md:space-y-6">
        <RecentTransactions />
      </main>
    </div>
  )
}
