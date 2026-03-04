'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users, DollarSign, TrendingUp, AlertTriangle,
  Search, Shield, ShieldCheck, ShieldX, ArrowLeft,
  UserPlus, UserMinus, RefreshCw, Zap, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface Stats {
  totalUsers: number
  active: number
  trialing: number
  pastDue: number
  canceled: number
  mrr: number
  conversionRate: number
  isTestMode: boolean
}

interface Subscriber {
  id: string | null
  user_id: string
  full_name: string
  email: string
  status: string
  stripe_customer_id: string | null
  trial_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  is_admin: boolean
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600 border-green-200',
  trialing: 'bg-blue-500/10 text-blue-600 border-blue-200',
  past_due: 'bg-red-500/10 text-red-600 border-red-200',
  canceled: 'bg-zinc-500/10 text-zinc-500 border-zinc-200',
  inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-200',
  free: 'bg-zinc-500/10 text-zinc-400 border-zinc-200',
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [grantEmail, setGrantEmail] = useState('')
  const [granting, setGranting] = useState(false)
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>('test')
  const [hasTestKeys, setHasTestKeys] = useState(false)
  const [hasLiveKeys, setHasLiveKeys] = useState(false)
  const [togglingMode, setTogglingMode] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, subsRes, modeRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/subscribers${search ? `?q=${encodeURIComponent(search)}` : ''}`),
        fetch('/api/admin/stripe-mode'),
      ])

      if (statsRes.status === 403 || subsRes.status === 403) {
        const errData = await statsRes.json().catch(() => ({}))
        console.error('Admin access denied:', errData)
        toast.error(`Access denied: ${errData?.debug?.email || 'unknown email'}`)
        router.push('/dashboard')
        return
      }

      setStats(await statsRes.json())
      setSubscribers(await subsRes.json())

      if (modeRes.ok) {
        const modeData = await modeRes.json()
        setStripeMode(modeData.mode)
        setHasTestKeys(modeData.hasTestKeys)
        setHasLiveKeys(modeData.hasLiveKeys)
      }
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [search, router])

  useEffect(() => { fetchData() }, [fetchData])

  const handleGrantAccess = async (userId: string) => {
    setGranting(true)
    const res = await fetch('/api/admin/grant-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    setGranting(false)

    if (res.ok) {
      toast.success('Access granted')
      fetchData()
    } else {
      toast.error('Failed to grant access')
    }
  }

  const handleRevokeAccess = async (userId: string) => {
    const res = await fetch('/api/admin/grant-access', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })

    if (res.ok) {
      toast.success('Access revoked')
      fetchData()
    } else {
      toast.error('Failed to revoke access')
    }
  }

  const handleToggleStripeMode = async (newMode: 'test' | 'live') => {
    setTogglingMode(true)
    const res = await fetch('/api/admin/stripe-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: newMode }),
    })
    setTogglingMode(false)

    if (res.ok) {
      setStripeMode(newMode)
      toast.success(`Switched to ${newMode} mode`)
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Failed to switch mode')
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6 max-w-4xl">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold">{stats.trialing}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Trialing</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-2xl font-bold">${stats.mrr.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MRR</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Conversion</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stripe Mode Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Zap className={`h-5 w-5 ${stripeMode === 'test' ? 'text-amber-500' : 'text-green-500'}`} />
                <div>
                  <p className="font-medium text-sm">Stripe Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {stripeMode === 'test'
                      ? 'Using test keys — no real charges'
                      : 'Using live keys — real money'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={stripeMode === 'test' ? 'default' : 'outline'}
                  size="sm"
                  disabled={!hasTestKeys || togglingMode}
                  onClick={() => handleToggleStripeMode('test')}
                  className={stripeMode === 'test' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  {togglingMode && stripeMode !== 'test' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Test
                </Button>
                <Button
                  variant={stripeMode === 'live' ? 'default' : 'outline'}
                  size="sm"
                  disabled={!hasLiveKeys || togglingMode}
                  onClick={() => handleToggleStripeMode('live')}
                  className={stripeMode === 'live' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  {togglingMode && stripeMode !== 'live' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Live
                </Button>
              </div>
            </div>
            {!hasTestKeys && (
              <p className="text-xs text-amber-500 mt-2">⚠️ Test keys not configured in Vercel env vars</p>
            )}
          </CardContent>
        </Card>

        {/* All Users */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {subscribers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search ? 'No users match your search' : 'No users yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {subscribers.map((sub) => (
                  <div key={sub.user_id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium truncate">{sub.full_name}</span>
                        <Badge variant="outline" className={statusColors[sub.status] || statusColors.free}>
                          {sub.status}
                        </Badge>
                        {sub.is_admin && (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">
                            <Shield className="h-3 w-3 mr-0.5" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{sub.email}</p>
                      <p className="text-[10px] text-muted-foreground/70 font-mono mt-0.5 select-all">{sub.user_id}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Joined {new Date(sub.created_at).toLocaleDateString()}</span>
                        {sub.trial_end && (
                          <span>Trial ends {new Date(sub.trial_end).toLocaleDateString()}</span>
                        )}
                        {sub.cancel_at_period_end && (
                          <span className="text-amber-500">Cancels at period end</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sub.status === 'active' || sub.status === 'trialing' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleRevokeAccess(sub.user_id)}
                        >
                          <ShieldX className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGrantAccess(sub.user_id)}
                          disabled={granting}
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          Grant
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Grant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-5 w-5" />
              Grant Coach Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Manually grant AI Coach access to a user (for beta testers or comps).
              Enter their Supabase User ID.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="User ID (UUID)"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  if (grantEmail) handleGrantAccess(grantEmail)
                }}
                disabled={!grantEmail || granting}
              >
                {granting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
                Grant
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
