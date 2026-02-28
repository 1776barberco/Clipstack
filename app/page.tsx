import type { Metadata } from 'next'
import Link from 'next/link'
import { Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'TipJars — Budget in Style',
  description: 'Smart budgeting for barbers, stylists, and independent professionals. Split every dollar automatically.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          <span className="text-lg font-semibold tracking-tight">TipJars</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/login" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            Sign In
          </Link>
          <Link href="/login">
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-full px-5 h-9 text-sm">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-28 pb-32 text-center max-w-3xl mx-auto">
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          Your money,
          <br />
          organized.
        </h1>
        <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 mb-10 max-w-xl mx-auto">
          Know exactly where every dollar goes. Built for barbers, stylists, and independent professionals &mdash; not spreadsheets.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login">
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-full px-8 h-12 text-base">
              Get Started
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" className="border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-full px-8 h-12 text-base">
              Learn More
            </Button>
          </a>
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
      <section className="px-6 py-24 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Free. No catch.</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10">Everything you need, nothing you don&apos;t.</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-300 space-y-3 text-left max-w-xs mx-auto mb-10">
            {[
              'Unlimited income tracking',
              'Custom jar splits',
              'Tax set-asides',
              'Weekly stability score',
              'Offline mode',
              'All future features',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="text-zinc-400">&mdash;</span>
                {item}
              </li>
            ))}
          </ul>
          <Link href="/login">
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-full px-8 h-12 text-base">
              Get Started
            </Button>
          </Link>
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
