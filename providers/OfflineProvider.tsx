'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { useAuthContext } from './AuthProvider'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext()
  const { isOnline, isSyncing, pendingCount, syncQueue } = useOfflineSync(user?.id)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    setShowStatus(true)
    const timer = setTimeout(() => setShowStatus(false), 3000)
    return () => clearTimeout(timer)
  }, [isOnline])

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      toast.info(`Syncing ${pendingCount} pending items...`, {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
      })
      syncQueue().then(() => {
        toast.success('All items synced!')
      })
    }
  }, [isOnline, pendingCount, syncQueue])

  return (
    <>
      {children}
      {showStatus && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-all ${
            isOnline
              ? 'bg-green-500 text-white'
              : 'bg-amber-500 text-white'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>Offline{pendingCount > 0 && ` (${pendingCount} pending)`}</span>
            </>
          )}
          {isSyncing && <RefreshCw className="h-4 w-4 animate-spin" />}
        </div>
      )}
    </>
  )
}
