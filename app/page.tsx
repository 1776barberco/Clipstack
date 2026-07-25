import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Banknote,
  MessageSquareText,
  ShieldCheck,
  Split,
  Target,
  WifiOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/Footer'
import { HeroAnimation } from '@/components/HeroAnimation'
import { HeroCommand } from '@/components/HeroCommand'
import { HeroProductPreview } from '@/components/HeroProductPreview'

export const metadata: Metadata = {
  title: 'TipJars — Agentic money management for barbers & stylists',
  description:
    'Ask TipJars what to do with uneven income. Split tips, fund taxes and booth rent, and get coach-level decisions in seconds.',
  openGraph: {
    title: 'TipJars — Agentic money management for barbers & stylists',
    description:
      'Ask TipJars what to do with uneven income. Split tips, fund taxes and booth rent, and get coach-level decisions in seconds.',
    url: 'https://www.tipjars.co',
    siteName: 'TipJars',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TipJars — Agentic money management for barbers & stylists',
    description:
      'Ask TipJars what to do with uneven income. Split tips, fund taxes and booth rent, and get coach-level decisions in seconds.',
  },
}

const CAPABILITIES = [
  {
    icon: MessageSquareText,
    title: 'Ask first, click second',
    desc: 'Type a money question in plain English. TipJars answers with your real jars, not generic advice.',
  },
  {
    icon: Split,
    title: 'Instant income splits',
    desc: 'Drop in today’s tips and watch taxes, booth rent, savings, and tools fill automatically.',
  },
  {
    icon: Target,
    title: 'Next best action',
    desc: 'Every session ends with one clear move: what to fund, what to hold, what is safe to spend.',
  },
  {
    icon: Banknote,
    title: 'Built for uneven weeks',
    desc: 'Chair days, slow Tuesdays, walk-in spikes. Stability score tracks the reality of your book.',
  },
  {
    icon: ShieldCheck,
    title: 'Read-only bank sync',
    desc: 'Connect accounts for visibility without write access. Review activity, keep control.',
  },
  {
    icon: WifiOff,
    title: 'Offline between clients',
    desc: 'Log income on the floor without Wi-Fi. Sync when you are back online.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Connect your world',
    desc: 'Add jars for taxes, booth rent, savings, and tools. Optional read-only bank sync.',
  },
  {
    num: '02',
    title: 'Talk to the coach',
    desc: 'Ask what is safe to spend, how to split a payout, or whether rent is covered.',
  },
  {
    num: '03',
    title: 'Act with confidence',
    desc: 'One recommended move, backed by your balances. Less spreadsheet, more booked-out calm.',
  },
]

const PROOF = [
  {
    quote: 'I used to dread tax season. Now I just check my tax jar and I am good.',
    name: 'Marcus T.',
    role: 'Barber · Atlanta',
  },
  {
    quote: 'Finally something that gets how we earn. Not every week is the same behind the chair.',
    name: 'Jasmine R.',
    role: 'Cosmetologist · Houston',
  },
  {
    quote: 'Between booth rent and supplies, I never knew where my money went. Now I do.',
    name: 'Priya M.',
    role: 'Nail tech · Chicago',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fbfbfa] text-zinc-900">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-[#fbfbfa]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-icon.png" alt="TipJars" width={28} height={28} />
            <span className="text-[15px] font-semibold tracking-tight">TipJars</span>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <a href="#product" className="hidden text-zinc-500 transition hover:text-zinc-900 sm:block">
              Product
            </a>
            <a href="#how" className="hidden text-zinc-500 transition hover:text-zinc-900 sm:block">
              How it works
            </a>
            <a href="#pricing" className="hidden text-zinc-500 transition hover:text-zinc-900 sm:block">
              Pricing
            </a>
            <Link href="/blog" className="hidden text-zinc-500 transition hover:text-zinc-900 sm:block">
              Blog
            </Link>
            <Link href="/login">
              <Button className="h-9 rounded-full bg-zinc-950 px-4 text-sm text-white hover:bg-zinc-800">
                Sign in
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
        <HeroAnimation />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Agentic money OS for beauty pros
            </div>
            <h1 className="text-balance text-5xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-6xl lg:text-7xl">
              Your money has a coach now.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-500 sm:text-xl">
              TipJars turns uneven tip income into clear jars, safe-to-spend answers, and one next action —
              built for barbers, stylists, and independents who do not live in spreadsheets.
            </p>
          </div>

          <div className="mt-10">
            <HeroCommand />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-500">
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5">Read-only bank sync</span>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5">Tax + booth rent jars</span>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5">AI coach included</span>
          </div>

          <div id="product" className="mt-16 sm:mt-20">
            <HeroProductPreview />
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-t border-zinc-200/80 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Why TipJars</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Agent-first. Industry-native. Zero clutter.
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-500 sm:text-lg">
              Most finance apps show charts. TipJars answers the only question that matters after a long day:
              what should I do with this money right now?
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,15,15,0.03)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-zinc-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-zinc-200/80 bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Three moves. Booked-out calm.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.num} className="rounded-3xl border border-zinc-200 bg-[#fbfbfa] p-7">
                <p className="font-mono text-sm font-medium text-zinc-400">{step.num}</p>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t border-zinc-200/80 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Proof</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Built for people who get paid irregularly.
            </h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {PROOF.map((item) => (
              <figure key={item.name} className="rounded-3xl border border-zinc-200 bg-white p-6">
                <blockquote className="text-sm leading-7 text-zinc-700">“{item.quote}”</blockquote>
                <figcaption className="mt-6">
                  <p className="text-sm font-semibold text-zinc-950">{item.name}</p>
                  <p className="text-xs text-zinc-400">{item.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-zinc-200/80 bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Start free. Upgrade when the coach earns it.
            </h2>
            <p className="mt-4 text-base text-zinc-500">
              No lock-in. Built so the free tier already feels premium.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-zinc-200 bg-[#fbfbfa] p-8">
              <p className="text-sm font-semibold text-zinc-950">Free</p>
              <p className="mt-1 text-sm text-zinc-500">Everything to get organized.</p>
              <div className="mt-6 flex items-end gap-1">
                <span className="text-5xl font-semibold tracking-tight">$0</span>
                <span className="pb-1 text-sm text-zinc-400">/ forever</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-zinc-600">
                {[
                  'Unlimited income tracking',
                  'Custom jar splits',
                  'Tax set-asides',
                  'Booth rent tracking',
                  'Weekly stability score',
                  'Offline mode',
                  '2 AI insights per refresh',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="mt-8 block">
                <Button variant="outline" className="h-11 w-full rounded-full border-zinc-300">
                  Get started
                </Button>
              </Link>
            </div>

            <div className="relative rounded-3xl border border-zinc-950 bg-zinc-950 p-8 text-white shadow-[0_20px_60px_rgba(15,15,15,0.18)]">
              <span className="absolute -top-3 left-8 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-zinc-950">
                Most popular
              </span>
              <p className="text-sm font-semibold">AI Coach Pro</p>
              <p className="mt-1 text-sm text-zinc-400">Your personal financial operator.</p>
              <div className="mt-6 flex items-end gap-1">
                <span className="text-5xl font-semibold tracking-tight">$9.99</span>
                <span className="pb-1 text-sm text-zinc-500">/ month</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-zinc-300">
                {[
                  'Everything in Free',
                  'Unlimited AI insights',
                  '1-on-1 AI Coach chat',
                  'Coach personality control',
                  'Personalized savings goals',
                  'Spending habit analysis',
                  'Seasonal income forecasts',
                  'Priority support',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="mt-8 block">
                <Button className="h-11 w-full rounded-full bg-white text-zinc-950 hover:bg-zinc-100">
                  Start 7-day free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="mt-3 text-center text-[11px] text-zinc-500">Cancel anytime. No commitment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-200/80 px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-zinc-200 bg-white px-8 py-14 text-center shadow-[0_1px_2px_rgba(15,15,15,0.03),0_30px_60px_rgba(15,15,15,0.06)] sm:px-16">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Stop guessing after every tip day.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-500">
            Open TipJars, ask one question, and leave with a funded plan for taxes, rent, and real life.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login">
              <Button className="h-12 rounded-full bg-zinc-950 px-8 text-base text-white hover:bg-zinc-800">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#product">
              <Button variant="outline" className="h-12 rounded-full border-zinc-300 px-8 text-base">
                See the product
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
