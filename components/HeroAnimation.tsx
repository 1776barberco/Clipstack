'use client'

/** Ambient backdrop only — no absolute product chrome that can collide with copy. */
export function HeroAnimation() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-px bg-zinc-200/80" />
      <div className="absolute left-1/2 top-0 h-[36rem] w-[72rem] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(24,24,27,0.055),transparent_60%)]" />
      <div className="absolute left-[12%] top-[18%] h-40 w-40 rounded-full bg-emerald-200/20 blur-3xl" />
      <div className="absolute right-[10%] top-[28%] h-44 w-44 rounded-full bg-sky-200/20 blur-3xl" />
    </div>
  )
}
