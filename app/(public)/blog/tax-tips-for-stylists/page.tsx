import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Tax Tips Every Stylist Should Know - TipJars',
  description: 'Essential tax advice for self-employed stylists and barbers. Deductions, estimated payments, and how to avoid surprises.',
}

export default function Post() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <article className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/blog" className="text-emerald-400 hover:text-emerald-300 text-sm mb-8 inline-block">&larr; Back to Blog</Link>
        <p className="text-zinc-500 text-sm mb-4">February 15, 2026</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-8">Tax Tips Every Stylist Should Know</h1>
        
        <div className="prose prose-invert prose-zinc max-w-none space-y-6 text-zinc-300 leading-relaxed">
          <p>Taxes are the thing nobody wants to talk about in the beauty industry. But if you&apos;re a stylist, barber, or any independent beauty professional, understanding your taxes is the difference between keeping your hard-earned money and giving the IRS a surprise bonus.</p>
          <p>Here&apos;s what you need to know &mdash; in plain English.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">You&apos;re Self-Employed (Yes, Really)</h2>
          <p>If you rent a booth, work on commission without taxes withheld, or freelance, you&apos;re self-employed in the eyes of the IRS. That means nobody is withholding taxes for you. The money you take home looks like your full income, but roughly 25-30% of it belongs to Uncle Sam. If you spend it all, you&apos;ll owe big when tax season hits.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">Set Aside 25-30% of Every Dollar</h2>
          <p>This is the golden rule. Every payment you receive, immediately move 25-30% into a separate account (or jar). This covers your federal income tax plus self-employment tax (which covers Social Security and Medicare). Yes, it feels like a lot. But it&apos;s money you were never supposed to spend.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">Deductions Are Your Best Friend</h2>
          <p>As a self-employed stylist, you can deduct legitimate business expenses from your income before calculating taxes. Common deductions include:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Booth rent</strong> &mdash; Your biggest expense and fully deductible</li>
            <li><strong>Tools and supplies</strong> &mdash; Clippers, shears, combs, capes, cleaning supplies</li>
            <li><strong>Product costs</strong> &mdash; Anything you use on clients or sell</li>
            <li><strong>Continuing education</strong> &mdash; Classes, workshops, certifications</li>
            <li><strong>Phone and internet</strong> &mdash; The business-use percentage</li>
            <li><strong>Mileage</strong> &mdash; If you travel between locations or to supply stores</li>
            <li><strong>Business insurance</strong> &mdash; Liability insurance premiums</li>
          </ul>
          <p>Keep receipts for everything. A photo on your phone works. The more deductions you track, the less you owe.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">Pay Quarterly (Avoid Penalties)</h2>
          <p>The IRS expects self-employed people to pay estimated taxes four times a year &mdash; in April, June, September, and January. If you wait until April to pay everything at once, you might owe penalties on top of your tax bill. Set calendar reminders and pay from your tax jar each quarter. It&apos;s less painful in small chunks than one massive payment.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">Keep Business and Personal Separate</h2>
          <p>Open a separate bank account for your business income. This makes tracking income and expenses infinitely easier and looks much better if you ever get audited. It doesn&apos;t need to be fancy &mdash; a free checking account works fine.</p>

          <h2 className="text-xl font-bold text-zinc-100 mt-8">Consider Getting Help</h2>
          <p>A good tax professional who understands self-employment can save you way more than they cost. Ask other barbers or stylists in your area for recommendations. Many offer flat-rate pricing for simple self-employment returns.</p>

          <p className="mt-8">Taxes don&apos;t have to be scary. With the right system, they become just another part of running your business &mdash; handled, predictable, and stress-free.</p>
        </div>

        <div className="mt-12 p-8 bg-zinc-900 rounded-xl text-center border border-zinc-800">
          <h3 className="text-xl font-bold mb-2">Never forget to set aside taxes again</h3>
          <p className="text-zinc-400 text-sm mb-4">TipJars automatically puts 25% of every payment into your tax jar.</p>
          <Link href="/login">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-8">Get Started Free</Button>
          </Link>
        </div>
      </article>
    </div>
  )
}
