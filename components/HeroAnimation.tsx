'use client'

/**
 * Decorative ambient background for the homepage hero.
 * Intentionally NO large product mock or dense floating cards here —
 * those sit in-flow under the copy so they can never explode the layout.
 */
export function HeroAnimation() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-px bg-zinc-200" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-zinc-200" />

      {/* Soft ambient rings */}
      <div className="absolute left-1/2 top-[42%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/70" />
      <div className="absolute left-1/2 top-[42%] h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/60" />

      <div className="money-flow money-flow-one" />
      <div className="money-flow money-flow-two" />
      <div className="money-flow money-flow-three" />

      {/* Corner accents only — stay away from the center copy column */}
      <div className="hero-float absolute left-6 top-10 hidden rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 shadow-lg lg:block">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-xs font-bold text-zinc-900">Taxes</span>
        </div>
        <p className="text-sm font-black tracking-tight text-zinc-950">$2,226</p>
      </div>
      <div
        className="hero-float absolute right-6 top-16 hidden rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 shadow-lg lg:block"
        style={{ animationDelay: '0.4s' }}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-zinc-900">Savings</span>
        </div>
        <p className="text-sm font-black tracking-tight text-zinc-950">$1,336</p>
      </div>

      <style jsx>{`
        .money-flow {
          position: absolute;
          left: 50%;
          top: 42%;
          height: 1px;
          width: min(70vw, 720px);
          transform-origin: center;
          background: linear-gradient(90deg, transparent, rgba(24, 24, 27, 0.12), transparent);
          animation: flow 7s linear infinite;
          opacity: 0.4;
        }

        .money-flow-one {
          transform: translate(-50%, -50%) rotate(0deg);
        }

        .money-flow-two {
          transform: translate(-50%, -50%) rotate(32deg);
          animation-delay: -2s;
        }

        .money-flow-three {
          transform: translate(-50%, -50%) rotate(-28deg);
          animation-delay: -4s;
        }

        .hero-float {
          animation: floatCard 6s ease-in-out infinite;
        }

        @keyframes flow {
          0% {
            opacity: 0.12;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            opacity: 0.12;
          }
        }

        @keyframes floatCard {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .money-flow,
          .hero-float {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
