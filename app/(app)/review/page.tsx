import { Footer } from '@/components/Footer'
import { PlaidReviewInbox } from '@/components/PlaidReviewInbox'
import { UserMenu } from '@/components/UserMenu'

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Plaid transactions</p>
            <h1 className="text-xl font-bold">Review Inbox</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-4 p-4 pb-4 md:space-y-6">
        <PlaidReviewInbox />
      </main>

      <Footer />
    </div>
  )
}
