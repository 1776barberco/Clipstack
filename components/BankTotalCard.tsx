'use client'

import { useAuthContext } from '@/providers/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { usePlaidConnections } from '@/hooks/usePlaidConnections'
import { Card, CardContent } from '@/components/ui/card'
import { Landmark, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function BankTotalCard() {
  const { user } = useAuthContext()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const { accounts, loading: accountsLoading, getTotalStartingBalance } = useBankAccounts(user?.id)
  const { accounts: plaidAccounts, loading: plaidLoading } = usePlaidConnections(user?.id)

  const loading = profileLoading || accountsLoading || plaidLoading

  if (loading) {
    return <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
  }

  // Use bank_accounts total if available, fall back to profiles.starting_balance for backwards compat
  const startingBalance = accounts.length > 0
    ? getTotalStartingBalance()
    : Number(profile?.starting_balance ?? 0)

  const plaidAvailableTotal = plaidAccounts.reduce((sum, account) => {
    if (!account.is_active || account.type !== 'depository') return sum
    return sum + Number(account.available_balance ?? account.current_balance ?? 0)
  }, 0)

  const plaidCurrentTotal = plaidAccounts.reduce((sum, account) => {
    if (!account.is_active || account.type !== 'depository') return sum
    return sum + Number(account.current_balance ?? account.available_balance ?? 0)
  }, 0)

  const spendableTotal = plaidAccounts.length > 0 ? plaidAvailableTotal : startingBalance
  const isOverdrawn = spendableTotal < 0

  // Don't show if user hasn't set a starting balance or connected bank accounts
  if (startingBalance === 0 && plaidAccounts.length === 0) {
    return null
  }

  return (
    <Card
      className={`border ${
        isOverdrawn
          ? 'bg-gradient-to-br from-red-500/20 via-red-900/10 to-transparent border-red-500/30'
          : 'bg-gradient-to-br from-emerald-500/20 via-emerald-900/10 to-transparent border-emerald-500/20'
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isOverdrawn ? (
                <TrendingDown className="h-4 w-4 text-red-400" />
              ) : (
                <Landmark className="h-4 w-4 text-emerald-400" />
              )}
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {plaidAccounts.length > 0 ? 'Available to Spend' : accounts.length > 1 ? 'Total Available Across Accounts' : 'Available Bank Total'}
              </p>
            </div>
            <p
              className={`text-3xl font-bold ${
                isOverdrawn ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {isOverdrawn && '-'}
              {formatCurrency(Math.abs(spendableTotal))}
            </p>
            {isOverdrawn && (
              <p className="text-xs text-red-400/80 mt-1">
                ⚠️ Account overdrawn — time to hustle! 💪
              </p>
            )}
          </div>
          <div className="text-right space-y-1">
            {(startingBalance > 0 || plaidAccounts.length > 0) && (
              <div>
                <p className="text-xs text-muted-foreground">
                  {plaidAccounts.length > 0 ? `Current balance (${plaidAccounts.filter((a) => a.is_active && a.type === 'depository').length} accts)` : accounts.length > 1 ? `Starting (${accounts.length} accts)` : 'Starting'}
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  {formatCurrency(plaidAccounts.length > 0 ? plaidCurrentTotal : startingBalance)}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
