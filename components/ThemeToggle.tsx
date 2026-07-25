'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? 'icon' : 'sm'}
      className={compact ? 'h-9 w-9 rounded-full' : 'h-9 rounded-full'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(nextTheme)}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!compact && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </Button>
  )
}
