import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '5 Tips for Managing Your Barber Income - TipJars',
  description: 'Practical strategies for barbers to manage irregular income, save consistently, and build financial stability.',
}

export default function Post() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <article className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/blog" className="text-emerald-400 hover:text-emerald-300 text-sm mb-8 inline-block">&larr; Back to Blog</Link>
        <p className="text-zinc-500 text-sm mb-4">February 25, 2026</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-8">5 Tips for Managing Your Barber Income</h1>
        
        <div className="prose prose-invert prose-zinc max-w-none space-y-6 text-zinc-300 leading-relaxed">
          <p>Let&apos;s be real &mdash; being a barber means your income looks nothing like a 9-to-5 paycheck. One week you&apos;re booked solid, the next you&apos;re wondering where everyone went. That inconsistency doesn&apos;t mean you can&apos;t build financial stability. It just means you need a system that works for <em>your</em> reality.</p>
          <p>Here are five tips that actually work for barbers and stylists.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">1. Know Your Baseline</h2>
          <p>Before you can budget, you need to know your floor. Look at your last three months of income and find your worst week. That&apos;s your baseline. Budget your essentials around that number, not your best week. When good weeks come, the extra flows into savings and fun money &mdash; not into a lifestyle you can&apos;t sustain during slow periods.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">2. Pay Your Taxes First</h2>
          <p>This is the one that burns most self-employed people. When you get paid cash or through an app, taxes aren&apos;t taken out. It feels like you&apos;re making more than you are. Set aside 25-30% of every payment immediately. Don&apos;t touch it. When April comes, you&apos;ll thank yourself instead of scrambling to borrow money for a tax bill.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">3. Use the Jar System</h2>
          <p>The jar system is simple: every dollar that comes in gets split into categories. A common split for barbers is 50% for essentials (rent, food, bills), 25% for taxes, 15% for savings, and 10% for fun. You don&apos;t need physical jars &mdash; apps like TipJars do this automatically. The point is that every dollar has a job before you spend it.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">4. Track Everything</h2>
          <p>It takes ten seconds to log a payment after a client pays. Over a month, that gives you a clear picture of your income patterns. You&apos;ll start noticing which days are busiest, which services bring in the most, and where you can optimize. Knowledge is power &mdash; especially when it comes to money.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">5. Build a Slow-Week Fund</h2>
          <p>Think of this as your personal safety net. Aim to save enough to cover two weeks of expenses. When you have a slow week (and you will), you pull from this fund instead of going into debt or stressing out. During good weeks, top it back up. It&apos;s the difference between a slow week being an inconvenience versus a crisis.</p>

          <p className="mt-8">Managing money as a barber isn&apos;t harder than managing it with a salary &mdash; it&apos;s just different. Once you have a system that matches how you actually earn, everything clicks into place.</p>
        </div>

        <div className="mt-12 p-8 bg-zinc-900 rounded-xl text-center border border-zinc-800">
          <h3 className="text-xl font-bold mb-2">Ready to put these tips into action?</h3>
          <p className="text-zinc-400 text-sm mb-4">TipJars auto-splits your income into jars so you don&apos;t have to think about it.</p>
          <Link href="/login">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-8">Get Started Free</Button>
          </Link>
        </div>
      </article>
    </div>
  )
}
