'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Settings, Brain, Lock } from 'lucide-react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useSubscription } from '@/hooks/useSubscription'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthContext()
  const { isSubscribed } = useSubscription(user?.id)

  const handleCoachTap = () => {
    if (isSubscribed) {
      router.push('/coach')
    } else {
      // Push to coach page which will show the paywall
      router.push('/coach')
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
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

        {/* Coach — always visible, locked for free users */}
        <button
          onClick={handleCoachTap}
          className={`relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-300 ${
            isSubscribed
              ? pathname === '/coach'
                ? 'text-primary bg-primary/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                : 'text-muted-foreground hover:text-foreground'
              : 'text-muted-foreground/50'
          }`}
        >
          <div className={`relative flex items-center justify-center h-8 w-8 rounded-full border ${
            isSubscribed
              ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-primary/30'
              : 'bg-muted/50 border-muted-foreground/20'
          }`}>
            <Brain className={`h-5 w-5 transition-transform duration-300 ${
              isSubscribed ? 'text-primary' : 'text-muted-foreground/40'
            } ${pathname === '/coach' && isSubscribed ? 'scale-110' : ''}`} />
            {/* Lock badge for free users */}
            {!isSubscribed && (
              <div className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-primary shadow-sm">
                <Lock className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
            )}
          </div>
          <span className={`text-[10px] font-medium ${!isSubscribed ? 'text-muted-foreground/50' : ''}`}>
            Coach
          </span>
          {/* Pro badge */}
          {!isSubscribed && (
            <span className="absolute -top-0.5 right-1 text-[8px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 border border-primary/20">
              PRO
            </span>
          )}
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
