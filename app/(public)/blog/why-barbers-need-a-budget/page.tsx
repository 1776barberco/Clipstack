import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Why Every Barber Needs a Budget (And How to Start) - TipJars',
  description: 'Traditional budgets fail barbers because they assume steady paychecks. Learn how jar-based budgeting works for irregular income.',
}

export default function Post() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <article className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/blog" className="text-emerald-400 hover:text-emerald-300 text-sm mb-8 inline-block">&larr; Back to Blog</Link>
        <p className="text-zinc-500 text-sm mb-4">February 20, 2026</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-8">Why Every Barber Needs a Budget (And How to Start)</h1>
        
        <div className="prose prose-invert prose-zinc max-w-none space-y-6 text-zinc-300 leading-relaxed">
          <p>If the word &ldquo;budget&rdquo; makes you cringe, you&apos;re not alone. Most barbers and stylists have tried budgeting at some point &mdash; maybe a spreadsheet, maybe an app designed for people with biweekly paychecks &mdash; and it felt pointless. That&apos;s not because budgeting doesn&apos;t work. It&apos;s because the wrong kind of budget doesn&apos;t work for you.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">Why Traditional Budgets Fail Barbers</h2>
          <p>Most budgeting advice assumes you make the same amount every two weeks. You don&apos;t. You might make $800 one week and $400 the next. Traditional budgets also assume your income arrives on predictable dates. Yours comes in throughout the day, in cash, Venmo, Cash App, and credit card tips.</p>
          <p>When the foundation doesn&apos;t match your reality, the whole system collapses. You&apos;re not bad with money &mdash; you just haven&apos;t found the right tool.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">The Jar System: Built for Irregular Income</h2>
          <p>Instead of planning around a fixed monthly income, the jar system works on percentages. Every time money comes in &mdash; whether it&apos;s $20 or $200 &mdash; it gets split the same way. The recommended split for barbers:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Essentials (50%)</strong> &mdash; Booth rent, supplies, food, bills, transportation</li>
            <li><strong>Taxes (25%)</strong> &mdash; Set aside for quarterly or annual tax payments</li>
            <li><strong>Savings (15%)</strong> &mdash; Emergency fund, future goals, equipment upgrades</li>
            <li><strong>Fun (10%)</strong> &mdash; Going out, new kicks, whatever makes you happy</li>
          </ul>
          <p>The beauty is that it works whether you make $300 or $3,000 in a week. The percentages stay the same. Your lifestyle scales with your income naturally.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">How to Start Today</h2>
          <p>You don&apos;t need to overhaul your life. Start with one change: every time you get paid today, split it. Even if you do it mentally at first &mdash; &ldquo;okay, $50 of this $200 goes to taxes&rdquo; &mdash; you&apos;re already ahead of most people.</p>
          <p>Better yet, use an app that does the math for you. Log the income, and the split happens automatically. After a week, you&apos;ll see exactly where your money is going. After a month, you&apos;ll wonder how you ever lived without it.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">The Real Benefit: Peace of Mind</h2>
          <p>The biggest thing a budget gives you isn&apos;t more money &mdash; it&apos;s less stress. When you know taxes are covered, rent is handled, and savings are growing, you can focus on what you actually love: your craft. You show up to the chair with a clear head instead of a gnawing worry about bills.</p>
          <p>You got into this business because you&apos;re talented. A good budget lets that talent shine without the financial anxiety dimming it.</p>
        </div>

        <div className="mt-12 p-8 bg-zinc-900 rounded-xl text-center border border-zinc-800">
          <h3 className="text-xl font-bold mb-2">Start your jar-based budget today</h3>
          <p className="text-zinc-400 text-sm mb-4">TipJars makes it automatic. Sign up in 30 seconds.</p>
          <Link href="/login">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-8">Get Started Free</Button>
          </Link>
        </div>
      </article>
    </div>
  )
}
