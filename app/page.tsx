import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'TipJars - Budget in Style',
  description: 'Smart budgeting app for barbers, stylists, and beauty professionals. Auto-split your tips into jars for essentials, taxes, savings, and fun.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero */}
      <section className="px-6 pt-20 pb-16 text-center max-w-4xl mx-auto">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium">
          🌟 Free for barbers & stylists
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
          You didn&apos;t become a barber<br />to stress about money.
        </h1>
        <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          TipJars auto-splits every dollar you earn into smart jars — so taxes are covered, rent is handled, and you actually get to enjoy your money.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg rounded-xl w-full sm:w-auto">
              Get Started Free
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-8 py-6 text-lg rounded-xl w-full sm:w-auto">
              Learn More
            </Button>
          </a>
        </div>
      </section>

      {/* Pain Points */}
      <section className="px-6 py-16 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Sound familiar?</h2>
          <p className="text-zinc-400 mb-12">You&apos;re not alone. Most barbers and stylists deal with this every week.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { emoji: '💸', title: 'Irregular income', desc: 'Some weeks are great, some are slow. Hard to plan when every week is different.' },
              { emoji: '😰', title: 'Tax surprises', desc: 'April rolls around and suddenly you owe thousands you didn\'t set aside.' },
              { emoji: '🤷', title: 'No budget system', desc: 'You know you should budget, but spreadsheets aren\'t built for how you earn.' },
              { emoji: '🔄', title: 'Paycheck to paycheck', desc: 'Making good money but somehow always feeling broke by the end of the month.' },
            ].map((item) => (
              <Card key={item.title} className="bg-zinc-900 border-zinc-800 text-left">
                <CardContent className="pt-6">
                  <span className="text-3xl mb-3 block">{item.emoji}</span>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">How it works</h2>
          <p className="text-zinc-400 mb-12">Three steps. That&apos;s it.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Sign up', desc: 'Create your free account in 30 seconds. No credit card needed.' },
              { step: '2', title: 'Set your jars', desc: 'We start you with Essentials (50%), Taxes (25%), Savings (15%), and Fun (10%). Customize anytime.' },
              { step: '3', title: 'Track & auto-split', desc: 'Log your income and watch every dollar flow into the right jar automatically.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-16 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-12">Built for how you actually work</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: '🎯', title: 'Jar-based budgeting', desc: 'Auto-split income into customizable jars. See exactly where every dollar goes.' },
              { emoji: '📊', title: 'Tax set-asides', desc: 'Never get surprised by taxes again. Your tax jar fills automatically with every payment.' },
              { emoji: '🏠', title: 'Booth rent tracking', desc: 'Track your chair rent, product costs, and other business expenses in one place.' },
              { emoji: '📈', title: 'Weekly stability score', desc: 'See how consistent your income is and track your financial health over time.' },
              { emoji: '📱', title: 'Works offline', desc: 'Log income between clients even without WiFi. Syncs when you\'re back online.' },
              { emoji: '✨', title: 'Dead simple', desc: 'No accounting degree needed. Built for people who cut hair, not spreadsheets.' },
            ].map((item) => (
              <Card key={item.title} className="bg-zinc-900 border-zinc-800 text-left">
                <CardContent className="pt-6">
                  <span className="text-2xl mb-2 block">{item.emoji}</span>
                  <h3 className="font-semibold text-zinc-100 mb-1">{item.title}</h3>
                  <p className="text-zinc-400 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-12">What barbers are saying</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { quote: 'I used to dread tax season. Now I just check my tax jar and I\'m good. Game changer.', name: 'Marcus T.', role: 'Barber, Atlanta' },
              { quote: 'Finally something that gets how we earn. Not every week is the same and TipJars gets that.', name: 'Jasmine R.', role: 'Stylist, Houston' },
              { quote: 'I\'ve saved more in 3 months with TipJars than I did all last year. The jar system just works.', name: 'Devon K.', role: 'Barber, Chicago' },
            ].map((item) => (
              <Card key={item.name} className="bg-zinc-900 border-zinc-800 text-left">
                <CardContent className="pt-6">
                  <p className="text-zinc-300 text-sm mb-4 italic">&ldquo;{item.quote}&rdquo;</p>
                  <p className="font-semibold text-zinc-100 text-sm">{item.name}</p>
                  <p className="text-zinc-500 text-xs">{item.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 bg-zinc-900/50">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Simple pricing</h2>
          <p className="text-zinc-400 mb-8">TipJars is free. Seriously.</p>
          <Card className="bg-zinc-900 border-emerald-500/30">
            <CardContent className="pt-8 pb-8">
              <div className="text-4xl font-bold text-emerald-400 mb-2">$0</div>
              <p className="text-zinc-400 text-sm mb-6">Free forever. No hidden fees.</p>
              <ul className="text-left text-sm text-zinc-300 space-y-2 mb-6">
                {['Unlimited income tracking', 'Custom jar splits', 'Tax set-asides', 'Weekly stability score', 'Offline mode', 'All future features'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-5">
                  Get Started Free
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to budget in style?</h2>
        <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
          Join barbers and stylists who stopped stressing about money and started building real wealth.
        </p>
        <Link href="/login">
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-6 text-lg rounded-xl">
            Start Now — It&apos;s Free
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} TipJars. Budget in style.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-zinc-300">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-300">Terms</Link>
            <Link href="/blog" className="hover:text-zinc-300">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
