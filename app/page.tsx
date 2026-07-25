import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/Footer'
import { HeroAnimation } from '@/components/HeroAnimation'

export const metadata: Metadata = {
  title: 'TipJars — Smart Money Management for Barbers & Stylists',
  description: 'Split your tips, track expenses, and build savings — all in one app built for beauty professionals.',
  openGraph: {
    title: 'TipJars — Smart Money Management for Barbers & Stylists',
    description: 'Split your tips, track expenses, and build savings — all in one app built for beauty professionals.',
    url: 'https://www.tipjars.co',
    siteName: 'TipJars',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TipJars — Smart Money Management for Barbers & Stylists',
    description: 'Split your tips, track expenses, and build savings — all in one app built for beauty professionals.',
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-icon.png" alt="TipJars" width={28} height={28} />
          <span className="text-lg font-semibold tracking-tight">TipJars</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a href="#features" className="hidden sm:block text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Features
          </a>
          <a href="#pricing" className="hidden sm:block text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Pricing
          </a>
          <Link href="/blog" className="hidden sm:block text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Blog
          </Link>
          <Link href="/login">
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-full px-5 h-9 text-sm">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-16 text-center sm:pb-20 sm:pt-20">
        <HeroAnimation />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm backdrop-blur">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Read-only bank sync, jar tracking, and AI coaching
          </div>
          <h1 className="mb-6 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight text-zinc-950 text-balance sm:text-7xl">
            Run your money like a booked-out business.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-zinc-600 text-pretty sm:text-xl">
            TipJars turns uneven income into clear jars for taxes, bills, savings, and real life. Built for barbers, stylists, and independent pros who need decisions faster than spreadsheets.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login">
              <Button className="h-12 rounded-full bg-zinc-950 px-8 text-base text-white hover:bg-zinc-800">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" className="h-12 rounded-full border-zinc-300 bg-white/90 px-8 text-base text-zinc-700 backdrop-blur hover:bg-white">
                See How It Works
              </Button>
            </a>
          </div>
          <div className="mt-10 grid w-full max-w-2xl gap-2 text-xs text-zinc-500 sm:grid-cols-3 sm:text-sm">
            {['Split tips automatically', 'Review bank activity', 'Know what is safe to spend'].map((item) => (
              <div key={item} className="rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 text-center font-medium shadow-sm backdrop-blur">
                {item}
              </div>
            ))}
          </div>

          {/* In-flow product mock — cannot collide with absolute decorations */}
          <div className="relative z-10 mt-12 w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-5 text-left shadow-2xl shadow-zinc-900/10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Total in jars</p>
                <p className="text-3xl font-black tracking-tight text-zinc-950">$6,118.49</p>
              </div>
              <div className="rounded-full border border-zinc-200 px-2 py-1 text-[11px] font-semibold text-zinc-600">
                Live
              </div>
            </div>
            <div className="space-y-2">
              {[
                ['Essentials', '40%', 'bg-blue-500'],
                ['Taxes', '25%', 'bg-red-500'],
                ['Savings', '15%', 'bg-emerald-500'],
              ].map(([name, pct, color]) => (
                <div key={name} className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-2 text-xs">
                  <span className="truncate font-semibold text-zinc-800">{name}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <span className={`block h-full rounded-full ${color}`} style={{ width: pct }} />
                  </span>
                  <span className="text-right font-semibold text-zinc-500">{pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-16 tracking-tight">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-0">
            {[
              { num: '1', title: 'Sign up', desc: 'Create your free account in thirty seconds.' },
              { num: '2', title: 'Set your jars', desc: 'Choose how to split your income. We suggest a starting point.' },
              { num: '3', title: 'Track everything', desc: 'Log what you earn. Every dollar flows to the right place.' },
            ].map((step, i) => (
              <div key={step.num} className={`text-center px-8 py-4 ${
                i < 2 ? 'sm:border-r sm:border-zinc-200 sm:dark:border-zinc-800' : ''
              }`}>
                <div className="text-3xl font-bold text-zinc-300 dark:text-zinc-700 mb-3">{step.num}</div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-16 tracking-tight">Built for how you actually work</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
            {[
              { title: 'Income splitting', desc: 'Split every dollar automatically across your jars.' },
              { title: 'Tax jar', desc: 'Set aside taxes as you earn. No more April surprises.' },
              { title: 'Rent tracking', desc: 'Track booth rent, chair rent, station rent, and business expenses in one place.' },
              { title: 'Stability score', desc: 'See how consistent your income is, week over week.' },
              { title: 'Offline mode', desc: 'Log income between clients, even without Wi-Fi.' },
              { title: 'Simple setup', desc: 'No accounting degree required. Up and running in minutes.' },
            ].map((feature) => (
              <div key={feature.title}>
                <h3 className="font-semibold mb-1.5 flex items-center gap-2">
                  <span className="text-zinc-300 dark:text-zinc-600">&mdash;</span>
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pl-5">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-24 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-16 tracking-tight">Trusted by beauty and grooming professionals</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { quote: 'I used to dread tax season. Now I just check my tax jar and I\'m good.', name: 'Marcus T.', city: 'Atlanta, Barber' },
              { quote: 'Finally something that gets how we earn. Not every week is the same when you\'re behind the chair.', name: 'Jasmine R.', city: 'Houston, Cosmetologist' },
              { quote: 'Between booth rent and supplies, I never knew where my money went. Now I do.', name: 'Priya M.', city: 'Chicago, Nail Tech' },
            ].map((t) => (
              <div key={t.name} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-zinc-400">{t.city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 tracking-tight">Simple pricing</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-center mb-12 max-w-lg mx-auto">
            Start free. Upgrade when you&apos;re ready for personalized coaching.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8">
              <h3 className="font-bold text-lg mb-1">Free</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">Everything you need to get organized.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-zinc-400 text-sm"> / forever</span>
              </div>
              <ul className="text-sm text-zinc-600 dark:text-zinc-300 space-y-3 mb-8">
                {[
                  'Unlimited income tracking',
                  'Custom jar splits',
                  'Tax set-asides',
                  'Booth rent tracking',
                  'Weekly stability score',
                  'Offline mode',
                  '2 AI insights per refresh',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="text-green-500 text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <Button variant="outline" className="w-full rounded-full h-11 border-zinc-300 dark:border-zinc-700">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* AI Coach Pro Tier */}
            <div className="relative border-2 border-primary rounded-2xl p-8 bg-gradient-to-b from-primary/5 to-transparent">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">AI Coach Pro</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">Your personal financial coach.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-zinc-400 text-sm"> / month</span>
              </div>
              <ul className="text-sm text-zinc-600 dark:text-zinc-300 space-y-3 mb-8">
                {[
                  'Everything in Free',
                  'Unlimited AI insights',
                  '1-on-1 AI Coach chat',
                  'Choose your coach personality',
                  'Personalized savings goals',
                  'Spending habit analysis',
                  'Seasonal income forecasts',
                  'Priority support',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="text-primary text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <Button className="w-full rounded-full h-11 bg-primary hover:bg-primary/90">
                  Start 7-Day Free Trial
                </Button>
              </Link>
              <p className="text-[11px] text-zinc-400 text-center mt-3">Cancel anytime. No commitment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-28 text-center border-t border-zinc-200 dark:border-zinc-800">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Ready to take control?</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">Start organizing your money in minutes.</p>
        <Link href="/login">
          <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-full px-8 h-12 text-base">
            Get Started
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
