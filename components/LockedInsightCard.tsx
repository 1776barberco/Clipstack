'use client'

import { Lock, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface LockedInsightCardProps {
  /** Fake title to show through the blur */
  title: string
  /** Visual style — matches the insight type */
  colorClass: string
  icon: React.ReactNode
}

export function LockedInsightCard({ title, colorClass, icon }: LockedInsightCardProps) {
  return (
    <Link href="/coach" className="block group">
      <div className={`relative rounded-lg border p-3 overflow-hidden ${colorClass}`}>
        {/* Blurred fake content */}
        <div className="blur-[6px] select-none pointer-events-none" aria-hidden>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-medium text-sm">{title}</span>
            </div>
          </div>
          <p className="mt-2 text-sm opacity-90">
            Based on your recent patterns, here are some personalized recommendations
            to help optimize your financial strategy this month...
          </p>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg transition-all group-hover:bg-background/50">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 border border-primary/20 mb-2">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs font-semibold text-foreground">Unlock with AI Coach</p>
          <div className="flex items-center gap-1 mt-1">
            <Sparkles className="h-3 w-3 text-primary" />
            <p className="text-[10px] text-muted-foreground">7-day free trial</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
