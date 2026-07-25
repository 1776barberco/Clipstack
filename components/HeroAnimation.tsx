'use client'

const jars = [
  { name: 'Taxes', amount: '$2,226', color: 'bg-red-500', position: 'left-[2%] top-[14%]', delay: '0s' },
  { name: 'Savings', amount: '$1,336', color: 'bg-emerald-500', position: 'right-[2%] top-[18%]', delay: '0.35s' },
  { name: 'Essentials', amount: '$1,580', color: 'bg-blue-500', position: 'left-[4%] bottom-[12%]', delay: '0.7s' },
  { name: 'Tools', amount: '$686', color: 'bg-slate-500', position: 'right-[5%] bottom-[14%]', delay: '1.05s' },
]

const activity = [
  { label: 'Apple Cash', amount: '+$294.90', color: 'text-emerald-600', position: 'left-[22%] top-[8%]', delay: '0.2s' },
  { label: 'Tesla Supercharger', amount: '-$40.37', color: 'text-zinc-900', position: 'right-[18%] top-[62%]', delay: '0.9s' },
  { label: 'Panda Express', amount: '-$31.71', color: 'text-zinc-900', position: 'left-[20%] bottom-[6%]', delay: '1.4s' },
]

export function HeroAnimation() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-px bg-zinc-200" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-zinc-200" />

      {/* Soft ambient rings — never cover the copy column */}
      <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/60 opacity-60" />
      <div className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/50 opacity-50" />

      <div className="money-flow money-flow-one" />
      <div className="money-flow money-flow-two" />
      <div className="money-flow money-flow-three" />

      {/* Product mock sits BELOW the headline column so copy stays readable */}
      <div className="absolute left-1/2 top-[78%] hidden w-[17rem] -translate-x-1/2 rounded-3xl border border-zinc-200 bg-white/95 p-4 shadow-2xl shadow-zinc-900/10 backdrop-blur sm:block lg:top-[76%]">
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

      {jars.map((jar) => (
        <div
          key={jar.name}
          className={`hero-float absolute hidden min-w-36 rounded-2xl border border-zinc-200 bg-white/90 p-3 shadow-xl shadow-zinc-900/10 opacity-90 lg:block ${jar.position}`}
          style={{ animationDelay: jar.delay }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${jar.color}`} />
            <span className="text-sm font-bold text-zinc-900">{jar.name}</span>
          </div>
          <p className="text-xl font-black tracking-tight text-zinc-950">{jar.amount}</p>
        </div>
      ))}

      {activity.map((item) => (
        <div
          key={item.label}
          className={`activity-chip absolute hidden rounded-full border border-zinc-200 bg-white/90 px-3 py-2 shadow-lg shadow-zinc-900/10 opacity-85 xl:block ${item.position}`}
          style={{ animationDelay: item.delay }}
        >
          <span className="mr-2 text-xs font-semibold text-zinc-500">{item.label}</span>
          <span className={`text-sm font-black ${item.color}`}>{item.amount}</span>
        </div>
      ))}

      <style jsx>{`
        .money-flow {
          position: absolute;
          left: 50%;
          top: 50%;
          height: 1px;
          width: min(76vw, 820px);
          transform-origin: center;
          background: linear-gradient(90deg, transparent, rgba(24, 24, 27, 0.12), transparent);
          animation: flow 7s linear infinite;
          opacity: 0.45;
        }

        .money-flow-one {
          transform: translate(-50%, -50%) rotate(0deg);
        }

        .money-flow-two {
          transform: translate(-50%, -50%) rotate(35deg);
          animation-delay: -2s;
        }

        .money-flow-three {
          transform: translate(-50%, -50%) rotate(-32deg);
          animation-delay: -4s;
        }

        .hero-float {
          animation: floatCard 6s ease-in-out infinite;
        }

        .activity-chip {
          animation: floatChip 7s ease-in-out infinite;
        }

        @keyframes flow {
          0% {
            opacity: 0.15;
            background-position: -420px 0;
          }
          50% {
            opacity: 0.45;
          }
          100% {
            opacity: 0.15;
            background-position: 420px 0;
          }
        }

        @keyframes floatCard {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes floatChip {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.78;
          }
          50% {
            transform: translateY(8px);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .money-flow,
          .hero-float,
          .activity-chip {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
