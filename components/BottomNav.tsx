'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Home, ListChecks, Plus, Wallet } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/jars', label: 'Jars', icon: Wallet },
  { href: '/activity', label: 'Activity', icon: ListChecks },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
]

export function BottomNav() {
  const pathname = usePathname()

  const openQuickLog = () => {
    window.dispatchEvent(new Event('open-quick-log'))
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-background/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-2xl backdrop-blur-xl lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        {navItems.slice(0, 2).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <button
          id="tour-quick-add"
          type="button"
          onClick={openQuickLog}
          className="relative -mt-5 flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-primary px-2 text-[11px] font-semibold text-primary-foreground shadow-[0_12px_28px_rgba(99,102,241,0.35)] transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Log income or expense"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>Log</span>
        </button>

        {navItems.slice(2).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
