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
import { QuickExpenseEntry } from '@/components/QuickExpenseEntry'
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
  CheckCircle2,
  Inbox,
  ListChecks,
  PiggyBank,
  Search,
  Settings,
  Sparkles,
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

const systemChecks = [
  'Tips split into jars',
  'Booth rent stays visible',
  'Coach keeps the next move clear',
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#fbfbfa] text-zinc-950">
      <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-[#fbfbfa]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
              <WalletCards className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Today</p>
              <h1 className="text-sm font-semibold tracking-tight sm:text-base">TipJars Command</h1>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden h-9 rounded-full text-zinc-600 hover:text-zinc-950 sm:inline-flex">
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

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 pb-24 sm:px-6 lg:pb-8">
        <MilestoneToast />
        <StreakCelebration />
        <StreakProtectedToast />

        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(15,15,15,0.06)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-7 p-5 sm:p-7 lg:p-8">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-[#fbfbfa] px-3 py-1.5 text-xs font-medium text-zinc-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Agentic money OS active
                </div>
                <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl lg:text-6xl">
                  Ask first. Move money second.
                </h2>
                <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-zinc-500 sm:text-lg">
                  Your dashboard should not feel like accounting homework. Start with the coach, confirm the next move,
                  then let TipJars keep taxes, booth rent, savings, and tools in line.
                </p>
              </div>

              <Link
                href="/coach"
                className="group flex min-h-16 items-center gap-3 rounded-[1.5rem] border border-zinc-200 bg-[#fbfbfa] p-3 shadow-inner transition hover:border-zinc-300 hover:bg-white"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                  <Search className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Ask TipJars</p>
                  <p className="truncate text-sm font-medium text-zinc-800 sm:text-base">
                    What should I do with my money today?
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-zinc-950">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              <div className="flex flex-wrap gap-2">
                {coachPrompts.map((prompt) => (
                  <Button key={prompt} asChild variant="outline" className="h-9 rounded-full border-zinc-200 bg-white text-zinc-600">
                    <Link href="/coach">{prompt}</Link>
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-200 bg-zinc-950 p-5 text-white sm:p-7 lg:border-l lg:border-t-0">
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <Sparkles className="h-4 w-4 text-emerald-300" />
                    Coach readout
                  </div>
                  <p className="mt-5 text-3xl font-semibold tracking-tight">One calm money move at a time.</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    The old dashboard showed everything at once. This version prioritizes the decision loop: ask,
                    review, split, repeat.
                  </p>
                </div>
                <div className="space-y-3">
                  {systemChecks.map((check) => (
                    <div key={check} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                      {check}
                    </div>
                  ))}
                </div>
              </div>
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

            <section className="hidden lg:block" id="tour-buckets">
              <BucketBalances />
            </section>
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto lg:pr-1">
            <Card className="border-zinc-200 bg-white shadow-[0_1px_2px_rgba(15,15,15,0.03)]">
              <CardContent className="space-y-4 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Next best actions</p>
                  <p className="mt-1 text-sm text-zinc-500">Four places to go when the coach needs proof or action.</p>
                </div>
                <div className="grid gap-2">
                  {nextSteps.map((item) => (
                    <Button key={item.href} asChild variant="ghost" className="h-auto justify-start rounded-2xl border border-zinc-200 bg-[#fbfbfa] p-3 text-left hover:bg-white">
                      <Link href={item.href} className="flex w-full items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-sm">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-zinc-950">{item.label}</span>
                          <span className="mt-0.5 block whitespace-normal text-xs leading-5 text-zinc-500">{item.detail}</span>
                        </span>
                        <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-zinc-400" />
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <QuickIncomeEntry />
            <QuickExpenseEntry />
            <EveningStreakReminder />

            <Button asChild variant="outline" className="h-11 w-full rounded-full border-zinc-200 bg-white lg:hidden">
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
