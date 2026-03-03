'use client'

import Link from 'next/link'
import { Brain, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthContext } from '@/providers/AuthProvider'
import { useSubscription } from '@/hooks/useSubscription'

export function CoachNavButton() {
  const { user } = useAuthContext()
  const { isSubscribed } = useSubscription(user?.id)

  return (
    <Link href="/coach">
      <Button
        variant={isSubscribed ? 'default' : 'outline'}
        size="sm"
        className={`relative rounded-full gap-1.5 ${
          !isSubscribed
            ? 'border-primary/30 text-muted-foreground hover:text-foreground hover:border-primary/50'
            : ''
        }`}
      >
        <Brain className={`h-4 w-4 ${isSubscribed ? '' : 'text-muted-foreground/60'}`} />
        <span className="hidden sm:inline">Coach</span>
        {!isSubscribed && (
          <Lock className="h-3 w-3 text-primary" />
        )}
        {!isSubscribed && (
          <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold text-primary-foreground bg-primary rounded-full px-1.5 py-0.5 leading-none">
            PRO
          </span>
        )}
      </Button>
    </Link>
  )
}
