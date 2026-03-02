'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, PlusCircle, Settings } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogTap = () => {
    if (pathname !== '/dashboard') {
      router.push('/dashboard')
      // Small delay to let the page load, then open FAB
      setTimeout(() => window.dispatchEvent(new CustomEvent('open-quick-log')), 300)
    } else {
      window.dispatchEvent(new CustomEvent('open-quick-log'))
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="mx-2 mb-2 flex items-center justify-around rounded-2xl border border-white/10 bg-background/80 backdrop-blur-2xl py-2 shadow-2xl">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-300 ${
            pathname === '/dashboard'
              ? 'text-primary bg-primary/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home className={`h-5 w-5 transition-transform duration-300 ${pathname === '/dashboard' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>

        {/* Log — opens FAB */}
        <button
          onClick={handleLogTap}
          className="flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-300 text-muted-foreground hover:text-foreground active:scale-95"
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 border border-primary/30">
            <PlusCircle className="h-5 w-5 text-primary" />
          </div>
          <span className="text-[10px] font-medium">Log</span>
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-300 ${
            pathname === '/settings'
              ? 'text-primary bg-primary/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className={`h-5 w-5 transition-transform duration-300 ${pathname === '/settings' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-medium">Settings</span>
        </Link>
      </div>
    </nav>
  )
}
