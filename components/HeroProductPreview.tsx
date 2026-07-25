'use client'

import { Sparkles } from 'lucide-react'

const JARS = [
  { name: 'Taxes', amount: '$2,226', pct: 36, color: 'bg-rose-500', bar: 'w-[36%]' },
  { name: 'Booth rent', amount: '$1,580', pct: 26, color: 'bg-sky-500', bar: 'w-[26%]' },
  { name: 'Savings', amount: '$1,336', pct: 22, color: 'bg-emerald-500', bar: 'w-[22%]' },
  { name: 'Tools', amount: '$976', pct: 16, color: 'bg-amber-500', bar: 'w-[16%]' },
]

const FEED = [
  { role: 'user', text: 'Can I take a day off next week without missing rent?' },
  {
    role: 'coach',
    text: 'Yes. Booth rent is already 82% funded. Keep $180 liquid and you’re still green.',
  },
]

export function HeroProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(24,24,27,0.06),transparent_55%)]" />

      <div className="relative grid overflow-hidden rounded-[1.75rem] border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(15,15,15,0.04),0_40px_80px_rgba(15,15,15,0.10)] lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left: jars + balance */}
        <div className="border-b border-zinc-100 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Available to allocate</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">$6,118.49</p>
              <p className="mt-2 text-sm text-zinc-500">Read-only bank sync · updated just now</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              On track
            </span>
          </div>

          <div className="space-y-4">
            {JARS.map((jar) => (
              <div key={jar.name} className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${jar.color}`} />
                    <span className="text-sm font-semibold text-zinc-900">{jar.name}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-zinc-900">{jar.amount}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200/80">
                  <div className={`h-full rounded-full ${jar.color} ${jar.bar}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: coach surface */}
        <div className="flex flex-col bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_45%)] p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Coach</p>
              <p className="text-xs text-zinc-500">Agentic money decisions, not dashboards</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            {FEED.map((item) => (
              <div
                key={item.text}
                className={
                  item.role === 'user'
                    ? 'ml-8 rounded-2xl rounded-br-md bg-zinc-950 px-4 py-3 text-sm leading-6 text-white'
                    : 'mr-4 rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-700 shadow-sm'
                }
              >
                {item.text}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-white/80 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">Next best action</p>
            <p className="mt-1 text-sm font-medium text-zinc-900">Move $120 into Taxes before Friday’s payout clears.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
