'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, PlusCircle, Settings } from 'lucide-react'

const tabs = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard#log', label: 'Log', icon: PlusCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="mx-2 mb-2 flex items-center justify-around rounded-2xl border border-white/10 bg-background/80 backdrop-blur-2xl py-2 shadow-2xl">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href === '/dashboard' && pathname === '/dashboard')
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-300 ${
                isActive
                  ? 'text-primary bg-primary/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
