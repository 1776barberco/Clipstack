'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { toast } from 'sonner'
import { Banknote, CreditCard, Landmark, Link2, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePlaidConnections } from '@/hooks/usePlaidConnections'

function formatMoney(amount: number | null | undefined) {
  if (amount == null) return 'Balance unavailable'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function getDisplayedBalance(account: { current_balance: number | null; available_balance: number | null; type: string | null }) {
  // Dashboard/account totals should use current balance. Available can be lower
  // for pending holds, unposted deposits, or institution-specific rules.
  return account.current_balance ?? account.available_balance
}

function formatTransactionAmount(amount: number, type: string) {
  const signed = type === 'income' ? Math.abs(amount) : -Math.abs(amount)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(signed)
}

type PlaidConnectionCardProps = {
  userId?: string
}

export function PlaidConnectionCard({ userId }: PlaidConnectionCardProps) {
  const { items, accounts, transactions, loading, syncing, disconnectingId, error, reload, sync, disconnect } = usePlaidConnections(userId)
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [creatingLink, setCreatingLink] = useState(false)
  const [exchanging, setExchanging] = useState(false)
  const [itemToDisconnect, setItemToDisconnect] = useState<string | null>(null)

  const connectedCount = accounts.length
  const selectedItem = items.find((item) => item.id === itemToDisconnect) ?? null
  const lastSynced = useMemo(() => {
    const latest = items
      .map((item) => item.last_synced_at)
      .filter(Boolean)
      .sort()
      .at(-1)

    return latest ? new Date(latest).toLocaleString() : 'Not synced yet'
  }, [items])

  const createLinkToken = useCallback(async () => {
    setCreatingLink(true)
    try {
      const response = await fetch('/api/plaid/link-token', { method: 'POST' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? 'Could not start Plaid Link')
      setLinkToken(payload.link_token)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start Plaid Link')
    } finally {
      setCreatingLink(false)
    }
  }, [])

  const onSuccess = useCallback(async (publicToken: string) => {
    setExchanging(true)
    try {
      const response = await fetch('/api/plaid/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? 'Could not connect bank')
      toast.success('Bank connected. Pulling transactions now.')
      await sync()
      setLinkToken(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not connect bank')
    } finally {
      setExchanging(false)
    }
  }, [sync])

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess })

  useEffect(() => {
    if (linkToken && ready) open()
  }, [linkToken, open, ready])

  const handleSync = async () => {
    try {
      const result = await sync()
      const totals = Array.isArray(result?.results) ? result.results : []
      const added = totals.reduce((sum: number, item: { added?: number }) => sum + (item.added ?? 0), 0)
      const modified = totals.reduce((sum: number, item: { modified?: number }) => sum + (item.modified ?? 0), 0)
      toast.success(`Synced ${added} new and ${modified} updated transactions`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Plaid sync failed')
    }
  }

  const handleDisconnect = async () => {
    if (!itemToDisconnect) return

    try {
      const payload = await disconnect(itemToDisconnect)
      toast.success(`${payload.institution_name ?? 'Bank'} disconnected`)
      setItemToDisconnect(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect bank')
    }
  }

  return (
    <>
    <Card className="border-blue-200 bg-blue-50/40">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-blue-600" />
              Bank Transaction Sync
            </CardTitle>
            <CardDescription>
              Securely connect your bank through Plaid to see up-to-date balances, income, and spending in TipJars. TipJars uses read-only transaction data to make jar tracking easier, it never touches or moves your money.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            Read-only
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs text-muted-foreground">Connected accounts</p>
            <p className="text-2xl font-semibold">{loading ? '...' : connectedCount}</p>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs text-muted-foreground">Transactions imported</p>
            <p className="text-2xl font-semibold">{loading ? '...' : transactions.length}</p>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs text-muted-foreground">Last sync</p>
            <p className="text-sm font-medium">{lastSynced}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={createLinkToken} disabled={creatingLink || exchanging}>
            <Link2 className="mr-2 h-4 w-4" />
            {connectedCount ? 'Connect another account' : 'Connect bank'}
          </Button>
          <Button variant="outline" onClick={handleSync} disabled={!connectedCount || syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync transactions
          </Button>
          <Button variant="ghost" onClick={reload} disabled={loading}>
            Refresh
          </Button>
        </div>

        {accounts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Connected accounts</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {accounts.map((account) => {
                const parentItem = items.find((item) => item.id === account.plaid_item_id)

                return (
                  <div key={account.id} className="rounded-lg border bg-white p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        {account.type === 'credit' ? <CreditCard className="h-4 w-4 text-muted-foreground" /> : <Banknote className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[account.subtype, account.mask ? `••${account.mask}` : null].filter(Boolean).join(' • ')}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {parentItem?.institution_name ?? 'Connected bank'} · Read-only
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatMoney(getDisplayedBalance(account))}</p>
                          <p className="text-[11px] text-muted-foreground">Current</p>
                          {account.available_balance != null && account.available_balance !== account.current_balance && (
                            <p className="text-[11px] text-muted-foreground">
                              Available {formatMoney(account.available_balance)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setItemToDisconnect(account.plaid_item_id)}
                          disabled={disconnectingId === account.plaid_item_id}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          {disconnectingId === account.plaid_item_id ? 'Disconnecting...' : 'Disconnect'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {transactions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Latest bank activity</h3>
            <div className="divide-y rounded-lg border bg-white">
              {transactions.slice(0, 8).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="font-medium">{transaction.merchant_name ?? transaction.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(`${transaction.date}T00:00:00`).toLocaleDateString()} • {transaction.primary_category ?? transaction.transaction_type}
                    </p>
                  </div>
                  <p className={`font-semibold ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>
                    {formatTransactionAmount(transaction.amount, transaction.transaction_type)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={Boolean(itemToDisconnect)} onOpenChange={(open) => !open && setItemToDisconnect(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect bank?</DialogTitle>
          <DialogDescription>
            This will remove {selectedItem?.institution_name ?? 'this bank'} from TipJars, stop future syncs, and delete its imported accounts and transactions from your dashboard. TipJars will also revoke the Plaid connection.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setItemToDisconnect(null)} disabled={Boolean(disconnectingId)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDisconnect} disabled={Boolean(disconnectingId)}>
            {disconnectingId ? 'Disconnecting...' : 'Disconnect bank'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
