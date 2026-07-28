import { BankTotalCard } from '@/components/BankTotalCard'
import { DailyMomentumCard } from '@/components/DailyMomentumCard'
import { DailyReminderNudge } from '@/components/DailyReminderNudge'
import { DashboardOnboardingTour } from '@/components/DashboardOnboardingTour'
import { DashboardWelcomeModal } from '@/components/DashboardWelcomeModal'
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
import {
  ArrowRight,
  BarChart3,
  Brain,
  Inbox,
  ListChecks,
  PiggyBank,
  Search,
  Settings,
  WalletCards,
} from 'lucide-react'
import Link from 'next/link'

const coachPrompts = [
  'Can I safely spend anything today?',
  'How should I split this week\'s tips?',
  'Is booth rent covered yet?',
]

const nextSteps = [
  {
    href: '/review',
    label: 'Clear review inbox',
    detail: 'Approve new activity before it touches your jars.',
    icon: Inbox,
  },
  {
    href: '/jars',
    label: 'Tune jar rules',
    detail: 'Adjust taxes, booth rent, savings, and tools.',
    icon: PiggyBank,
  },
  {
    href: '/coach',
    label: 'Ask the coach',
    detail: 'Turn balances into one recommended money move.',
    icon: Brain,
  },
  {
    href: '/activity',
    label: 'Audit activity',
    detail: 'Check deposits, withdrawals, and jar movement.',
    icon: ListChecks,
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <WalletCards className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Today</p>
              <h1 className="text-sm font-semibold tracking-tight sm:text-base">TipJars Command</h1>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden h-9 rounded-full text-muted-foreground hover:text-foreground sm:inline-flex">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>
            <div className="hidden sm:block">
              <WithdrawButton />
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-5 pb-24 sm:px-6 lg:pb-8">
        <MilestoneToast />
        <StreakCelebration />
        <StreakProtectedToast />

        <section className="rounded-[2rem] border border-border bg-card text-card-foreground shadow-[0_12px_40px_rgba(15,15,15,0.04)] dark:shadow-none">
          <div className="space-y-5 p-5 sm:p-7 lg:p-8">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Agentic money OS active
              </div>
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl lg:text-5xl">
                Ask first. Move money second.
              </h2>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground">
                Start with one money question, then review only the details that need action.
              </p>
            </div>

            <Link
              href="/coach?q=What%20should%20I%20do%20with%20my%20money%20today%3F"
              className="group flex min-h-16 items-center gap-3 rounded-[1.5rem] border border-border bg-muted p-3 transition hover:border-ring hover:bg-accent"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Search className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ask TipJars</p>
                <p className="truncate text-sm font-medium text-foreground sm:text-base">
                  What should I do with my money today?
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <div className="flex flex-wrap gap-2">
              {coachPrompts.slice(0, 2).map((prompt) => (
                <Button key={prompt} asChild variant="outline" className="h-9 rounded-full border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                  <Link href={`/coach?q=${encodeURIComponent(prompt)}`}>{prompt}</Link>
                </Button>
              ))}
              <Button asChild variant="ghost" className="h-9 rounded-full text-muted-foreground">
                <Link href="/coach">More coach prompts</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 space-y-4 md:space-y-5">
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

            <div id="tour-plaid-jar-movement">
              <PlaidJarMovementCard />
            </div>

            <section className="lg:hidden">
              <JarSnapshot />
            </section>

            <section className="hidden lg:block">
              <JarSnapshot />
            </section>
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto lg:pr-1">
            <Card className="border-border bg-card text-card-foreground shadow-[0_1px_2px_rgba(15,15,15,0.03)] dark:shadow-none">
              <CardContent className="space-y-4 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Next best actions</p>
                  <p className="mt-1 text-sm text-muted-foreground">Keep only the next couple moves visible.</p>
                </div>
                <div className="grid gap-2">
                  {nextSteps.slice(0, 2).map((item) => (
                    <Button key={item.href} asChild variant="ghost" className="h-auto justify-start rounded-2xl border border-border bg-muted p-3 text-left hover:bg-accent">
                      <Link href={item.href} className="flex w-full items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card text-card-foreground shadow-sm dark:shadow-none">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                          <span className="mt-0.5 block whitespace-normal text-xs leading-5 text-muted-foreground">{item.detail}</span>
                        </span>
                        <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <QuickIncomeEntry />

            <Button asChild variant="outline" className="h-11 w-full rounded-full border-border bg-card lg:hidden">
              <Link href="/insights">
                <BarChart3 className="h-4 w-4" />
                Open insights
              </Link>
            </Button>
          </aside>
        </section>

        <DailyReminderNudge />
      </main>

      <Footer />
      <DashboardWelcomeModal />
      <DashboardOnboardingTour />
    </div>
  )
}
