'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Brain, Home, ListChecks, Lock, Settings, Shield, Wallet } from 'lucide-react'
import { useAuthContext } from '@/providers/AuthProvider'
import { useSubscription } from '@/hooks/useSubscription'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

const ADMIN_EMAILS = ['apeltekci@gmail.com', 'vhugo9021@icloud.com']

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/jars', label: 'Jars', icon: Wallet },
  { href: '/activity', label: 'Activity', icon: ListChecks },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/coach', label: 'Coach', icon: Brain },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function DesktopSidebar() {
  const pathname = usePathname()
  const { user } = useAuthContext()
  const { isSubscribed } = useSubscription(user?.id)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => {
      if (data.user?.email && ADMIN_EMAILS.includes(data.user.email.toLowerCase())) {
        setIsAdmin(true)
      }
    })
  }, [user])

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 border-r bg-background/95 backdrop-blur">
      {/* Logo */}
      <div className="flex items-center gap-2 h-16 px-5 border-b">
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          TipJars
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          const showLock = item.href === '/coach' && !isSubscribed

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : showLock
                    ? 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className={`h-5 w-5 ${showLock ? 'text-muted-foreground/40' : ''}`} />
              <span className="flex-1">{item.label}</span>
              {showLock && (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-primary/60" />
                  <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                    PRO
                  </span>
                </span>
              )}
            </Link>
          )
        })}

        {/* Admin link — only visible to admin users */}
        {isAdmin && (
          <>
            <div className="my-3 border-t" />
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === '/admin'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span className="flex-1">Admin</span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  )
}
