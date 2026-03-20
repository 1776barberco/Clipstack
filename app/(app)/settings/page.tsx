'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/providers/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { useBuckets } from '@/hooks/useBuckets'
import { useBankAccounts, BankAccount } from '@/hooks/useBankAccounts'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences'
import { usePushSubscription } from '@/hooks/usePushSubscription'
import { updateProfileAction } from '@/app/actions/auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { UserMenu } from '@/components/UserMenu'
import {
  ArrowLeft,
  User,
  DollarSign,
  Calendar,
  Save,
  Plus,
  Trash2,
  Lock,
  Landmark,
  RefreshCw,
  CreditCard,
  Star,
  ChevronLeft,
  ChevronRight,
  Bell,
  Clock,
  Calculator,
} from 'lucide-react'
import { toast } from 'sonner'
import { JarSplitCalculator } from '@/components/JarSplitCalculator'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const { buckets, loading: bucketsLoading, createBucket, updateBucket, deleteBucket } = useBuckets(user?.id)
  const { accounts, loading: accountsLoading, createAccount, updateAccount, deleteAccount } = useBankAccounts(user?.id)
  const { preferences: notifPrefs, loading: notifLoading, updatePreferences: updateNotifPrefs } = useNotificationPreferences(user?.id)
  const { pushState, subscribing, subscribe: subscribePush, unsubscribe: unsubscribePush, isSupported: pushSupported } = usePushSubscription(user?.id)

  const [fullName, setFullName] = useState<string | null>(null)
  const [boothRent, setBoothRent] = useState<string | null>(null)
  const [dueDay, setDueDay] = useState<string | null>(null)
  const [taxRate, setTaxRate] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // Bank accounts state
  const [editedAccounts, setEditedAccounts] = useState<Record<string, { name?: string; type?: string; starting_balance?: string }>>({})
  const [savingAccounts, setSavingAccounts] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState('checking')
  const [newAccountBalance, setNewAccountBalance] = useState('')
  const [accountCarouselIndex, setAccountCarouselIndex] = useState(0)

  const [editedBuckets, setEditedBuckets] = useState<Record<string, { name?: string; percentage?: string; color?: string; target_amount?: string; due_date?: string; is_recurring?: string; recurring_interval?: string }>>({})
  const [savingBuckets, setSavingBuckets] = useState(false)
  const [newBucketId, setNewBucketId] = useState<string | null>(null)
  const newBucketNameRef = useRef<HTMLInputElement>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [showJarCalculator, setShowJarCalculator] = useState(false)

  // Auto-focus newly created jar name input
  useEffect(() => {
    if (newBucketId && newBucketNameRef.current) {
      newBucketNameRef.current.focus()
      newBucketNameRef.current.select()
      queueMicrotask(() => setNewBucketId(null))
    }
  }, [newBucketId, buckets])

  const displayName = fullName ?? profile?.full_name ?? ''
  const displayBoothRent = boothRent ?? (profile?.booth_rent_amount?.toString() || '')
  const displayDueDay = dueDay ?? (profile?.booth_rent_due_day?.toString() || '')
  const displayTaxRate = taxRate ?? (profile?.tax_rate != null ? (profile.tax_rate * 100).toString() : '25')

  const handleSaveProfile = async () => {
    if (!user) return
    setSavingProfile(true)

    const updates: Record<string, unknown> = {}
    if (fullName !== null) updates.full_name = fullName
    if (boothRent !== null) updates.booth_rent_amount = boothRent ? parseFloat(boothRent) : null
    if (dueDay !== null) updates.booth_rent_due_day = dueDay ? parseInt(dueDay) : null
    if (taxRate !== null) updates.tax_rate = (parseFloat(taxRate) || 25) / 100

    if (Object.keys(updates).length === 0) {
      toast.info('No changes to save.')
      setSavingProfile(false)
      return
    }

    const result = await updateProfileAction(updates)
    setSavingProfile(false)

    if (result.error) {
      toast.error('Failed to update profile.')
    } else {
      setFullName(null)
      setBoothRent(null)
      setDueDay(null)
      setTaxRate(null)
      toast.success('Profile updated!')
    }
  }

  // ── Bank Accounts ──
  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      toast.error('Account name is required.')
      return
    }

    const balance = parseFloat(newAccountBalance) || 0
    const { error } = await createAccount({
      name: newAccountName.trim(),
      type: newAccountType,
      starting_balance: balance,
      is_primary: accounts.length === 0,
    })

    if (error) {
      toast.error('Failed to add account.')
    } else {
      setNewAccountName('')
      setNewAccountType('checking')
      setNewAccountBalance('')
      setShowAddAccount(false)
      toast.success('Account added!')
    }
  }

  const handleSaveAccounts = async () => {
    if (Object.keys(editedAccounts).length === 0) {
      toast.info('No account changes to save.')
      return
    }

    setSavingAccounts(true)

    for (const [id, changes] of Object.entries(editedAccounts)) {
      const updates: Partial<Pick<BankAccount, 'name' | 'type' | 'starting_balance'>> = {}
      if (changes.name !== undefined) updates.name = changes.name
      if (changes.type !== undefined) updates.type = changes.type as BankAccount['type']
      if (changes.starting_balance !== undefined) {
        updates.starting_balance = parseFloat(changes.starting_balance) || 0
      }

      const { error } = await updateAccount(id, updates)
      if (error) {
        toast.error('Failed to update account.')
        setSavingAccounts(false)
        return
      }
    }

    setEditedAccounts({})
    setSavingAccounts(false)
    toast.success('Accounts updated!')
  }

  const handleDeleteAccount = async (id: string, name: string) => {
    if (accounts.length <= 1) {
      toast.error('You must have at least one account.')
      return
    }
    const { error } = await deleteAccount(id)
    if (error) {
      toast.error(`Failed to delete ${name}.`)
    } else {
      const updated = { ...editedAccounts }
      delete updated[id]
      setEditedAccounts(updated)
      if (accountCarouselIndex >= accounts.length - 1) {
        setAccountCarouselIndex(Math.max(0, accountCarouselIndex - 1))
      }
      toast.success(`${name} deleted.`)
    }
  }

  const handleSetPrimary = async (id: string) => {
    const { error } = await updateAccount(id, { is_primary: true })
    if (error) {
      toast.error('Failed to set primary account.')
    } else {
      toast.success('Primary account updated!')
    }
  }

  const getAccountField = (id: string, field: 'name' | 'type' | 'starting_balance', fallback: string) => {
    return editedAccounts[id]?.[field] ?? fallback
  }

  const setAccountField = (id: string, field: 'name' | 'type' | 'starting_balance', value: string) => {
    setEditedAccounts(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  // Determine if a bucket uses fixed dollar amount
  const isFixedAmount = (bucketId: string) => {
    const edited = editedBuckets[bucketId]
    if (edited?.target_amount !== undefined) {
      return parseFloat(edited.target_amount) > 0
    }
    const bucket = buckets.find(b => b.id === bucketId)
    return bucket?.target_amount != null && bucket.target_amount > 0
  }

  const toggleAllocationType = (bucketId: string) => {
    const fixed = isFixedAmount(bucketId)
    const bucket = buckets.find(b => b.id === bucketId)

    if (fixed) {
      // Switching FROM fixed TO percentage
      // Give this jar an equal share with the other percentage jars
      const otherPctBuckets = buckets.filter(b => b.id !== bucketId && !isFixedAmount(b.id))
      const otherTotal = otherPctBuckets.reduce((sum, b) => {
        const edited = editedBuckets[b.id]
        const pct = edited?.percentage !== undefined ? parseFloat(edited.percentage) : b.percentage
        return sum + (pct || 0)
      }, 0)
      // This jar gets an equal share: if others total 80% across 4 jars, this one gets ~20%
      const evenShare = otherPctBuckets.length > 0
        ? Math.round((otherTotal / otherPctBuckets.length) * 10) / 10
        : 100
      const newTotal = otherTotal + evenShare
      // Scale everything so it totals 100%
      const scale = newTotal > 0 ? 100 / newTotal : 1
      setEditedBuckets(prev => {
        const next = {
          ...prev,
          [bucketId]: { ...prev[bucketId], target_amount: '0', percentage: String(Math.round(evenShare * scale * 10) / 10) },
        }
        for (const b of otherPctBuckets) {
          const pct = prev[b.id]?.percentage !== undefined ? parseFloat(prev[b.id]!.percentage!) : b.percentage
          next[b.id] = { ...next[b.id], percentage: String(Math.round(pct * scale * 10) / 10) }
        }
        return next
      })
    } else {
      // Switching FROM percentage TO fixed
      // Remove this jar's percentage and redistribute to remaining % jars
      const thisPct = editedBuckets[bucketId]?.percentage !== undefined
        ? parseFloat(editedBuckets[bucketId]!.percentage!)
        : (bucket?.percentage || 0)
      const otherPctBuckets = buckets.filter(b => b.id !== bucketId && !isFixedAmount(b.id))
      const otherTotal = otherPctBuckets.reduce((sum, b) => {
        const edited = editedBuckets[b.id]
        const pct = edited?.percentage !== undefined ? parseFloat(edited.percentage) : b.percentage
        return sum + (pct || 0)
      }, 0)
      const scale = otherTotal > 0 ? 100 / otherTotal : 1
      setEditedBuckets(prev => {
        const next = {
          ...prev,
          [bucketId]: { ...prev[bucketId], target_amount: '100', percentage: '0' },
        }
        // Scale remaining % jars up to total 100%
        for (const b of otherPctBuckets) {
          const pct = prev[b.id]?.percentage !== undefined ? parseFloat(prev[b.id]!.percentage!) : b.percentage
          next[b.id] = { ...next[b.id], percentage: String(Math.round(pct * scale * 10) / 10) }
        }
        return next
      })
    }
  }

  const handleSaveBuckets = async () => {
    if (Object.keys(editedBuckets).length === 0) {
      toast.info('No jar changes to save.')
      return
    }

    // Only validate percentage total for percentage-based jars
    const percentageBuckets = buckets.filter(b => !isFixedAmount(b.id))
    const totalPercentage = percentageBuckets.reduce((sum, b) => {
      const edited = editedBuckets[b.id]
      const pct = edited?.percentage !== undefined ? parseFloat(edited.percentage) : b.percentage
      return sum + (pct || 0)
    }, 0)

    if (percentageBuckets.length > 0 && Math.abs(totalPercentage - 100) > 0.01) {
      toast.error(`Percentage-based jar allocations must total 100%. Currently: ${totalPercentage.toFixed(1)}%`)
      return
    }

    setSavingBuckets(true)

    for (const [id, changes] of Object.entries(editedBuckets)) {
      const updates: Record<string, unknown> = {}
      if (changes.name !== undefined) updates.name = changes.name
      if (changes.percentage !== undefined) updates.percentage = parseFloat(changes.percentage)
      if (changes.color !== undefined) updates.color = changes.color
      if (changes.target_amount !== undefined) {
        const amt = parseFloat(changes.target_amount)
        updates.target_amount = amt > 0 ? amt : null
      }
      if (changes.due_date !== undefined) {
        updates.due_date = changes.due_date || null
      }
      if (changes.is_recurring !== undefined) {
        updates.is_recurring = changes.is_recurring === 'true'
      }
      if (changes.recurring_interval !== undefined) {
        updates.recurring_interval = changes.recurring_interval || null
      }

      const result = await updateBucket(id, updates)
      if (result.error) {
        toast.error(`Failed to update jar.`)
        setSavingBuckets(false)
        return
      }
    }

    setEditedBuckets({})
    setSavingBuckets(false)
    toast.success('Jars updated!')
  }

  const handleAddBucket = async () => {
    if (!user) return

    const { data, error } = await createBucket({
      user_id: user.id,
      name: 'New Jar',
      percentage: 0,
      target_amount: null,
      due_date: null,
      is_tax_bucket: false,
      is_recurring: false,
      recurring_interval: null,
      priority: 0,
      color: '#6b7280',
    })

    if (error) {
      toast.error('Failed to add jar.')
    } else if (data) {
      toast.success('Jar added! Set your desired split below.')
      setEditedBuckets(prev => ({ ...prev, [data.id]: { name: 'New Jar' } }))
      setNewBucketId(data.id)
    }
  }

  const handleDeleteBucket = async (id: string, name: string) => {
    const { error } = await deleteBucket(id)
    if (error) {
      toast.error(`Failed to delete ${name}.`)
    } else {
      const updated = { ...editedBuckets }
      delete updated[id]
      setEditedBuckets(updated)
      toast.success(`${name} deleted.`)
    }
  }

  const handleChangePassword = async () => {
    if (!supabase) return
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      toast.error(error.message || 'Failed to update password.')
    } else {
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password updated!')
    }
  }

  const getBucketField = (id: string, field: 'name' | 'percentage' | 'color' | 'target_amount' | 'due_date' | 'is_recurring' | 'recurring_interval', fallback: string) => {
    return editedBuckets[id]?.[field] ?? fallback
  }

  const setBucketField = (id: string, field: 'name' | 'percentage' | 'color' | 'target_amount' | 'due_date' | 'is_recurring' | 'recurring_interval', value: string) => {
    // Direct edit — user controls their own splits
    setEditedBuckets((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  if (profileLoading || bucketsLoading || accountsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  // Calculate totals for display
  const percentageBuckets = buckets.filter(b => !isFixedAmount(b.id))
  const fixedBuckets = buckets.filter(b => isFixedAmount(b.id))
  const totalPercentage = percentageBuckets.reduce((sum, b) => {
    const edited = editedBuckets[b.id]
    const pct = edited?.percentage !== undefined ? parseFloat(edited.percentage) : b.percentage
    return sum + (pct || 0)
  }, 0)
  const totalFixed = fixedBuckets.reduce((sum, b) => {
    const edited = editedBuckets[b.id]
    const amt = edited?.target_amount !== undefined ? parseFloat(edited.target_amount) : (b.target_amount || 0)
    return sum + (amt || 0)
  }, 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">Settings</span>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto max-w-2xl space-y-6 p-4">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Jane Doe"
                value={displayName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="boothRent">Booth Rent ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="boothRent"
                    type="number"
                    placeholder="150"
                    value={displayBoothRent}
                    onChange={(e) => setBoothRent(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDay">Rent Due Day</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="dueDay"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="1"
                    value={displayDueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min={0}
                max={100}
                placeholder="25"
                value={displayTaxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
            <Separator />
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              <Save className="mr-2 h-4 w-4" />
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Bank Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5" />
                  Bank Accounts
                </CardTitle>
                <CardDescription>
                  Manage your bank accounts. Set starting balances to track your total across all accounts.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAddAccount(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Account Form */}
            {showAddAccount && (
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium">Add New Account</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Account Name</Label>
                    <Input
                      placeholder="e.g. Chase Checking"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <select
                      value={newAccountType}
                      onChange={(e) => setNewAccountType(e.target.value)}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="cash">Cash</option>
                      <option value="cashapp">Cash App</option>
                      <option value="venmo">Venmo</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Starting Balance</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      value={newAccountBalance}
                      onChange={(e) => setNewAccountBalance(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddAccount(false)
                      setNewAccountName('')
                      setNewAccountType('checking')
                      setNewAccountBalance('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddAccount}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Account
                  </Button>
                </div>
              </div>
            )}

            {/* Account List / Carousel */}
            {accounts.length === 0 && !showAddAccount && (
              <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
                <Landmark className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No bank accounts yet.</p>
                <p className="text-xs text-muted-foreground">Add your first account to start tracking your bank totals.</p>
                <Button variant="outline" size="sm" onClick={() => setShowAddAccount(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Account
                </Button>
              </div>
            )}

            {accounts.length > 0 && (
              <>
                {/* Carousel navigation for multiple accounts */}
                {accounts.length > 1 && (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAccountCarouselIndex(Math.max(0, accountCarouselIndex - 1))}
                      disabled={accountCarouselIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-1">
                      {accounts.map((_, i) => (
                        <button
                          key={i}
                          className={`h-2 w-2 rounded-full transition-colors ${
                            i === accountCarouselIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                          }`}
                          onClick={() => setAccountCarouselIndex(i)}
                        />
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAccountCarouselIndex(Math.min(accounts.length - 1, accountCarouselIndex + 1))}
                      disabled={accountCarouselIndex >= accounts.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Current account card */}
                {accounts[accountCarouselIndex] && (() => {
                  const account = accounts[accountCarouselIndex]
                  const accountTypeLabels: Record<string, string> = {
                    checking: 'Checking',
                    savings: 'Savings',
                    cash: 'Cash',
                    cashapp: 'Cash App',
                    venmo: 'Venmo',
                    other: 'Other',
                  }
                  return (
                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {accountTypeLabels[account.type] || account.type}
                          </span>
                          {account.is_primary && (
                            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              <Star className="h-3 w-3" /> Primary
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!account.is_primary && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleSetPrimary(account.id)}
                            >
                              Set Primary
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAccount(account.id, account.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Account Name</Label>
                        <Input
                          value={getAccountField(account.id, 'name', account.name)}
                          onChange={(e) => setAccountField(account.id, 'name', e.target.value)}
                          placeholder="Account name"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Type</Label>
                          <select
                            value={getAccountField(account.id, 'type', account.type)}
                            onChange={(e) => setAccountField(account.id, 'type', e.target.value)}
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          >
                            <option value="checking">Checking</option>
                            <option value="savings">Savings</option>
                            <option value="cash">Cash</option>
                            <option value="cashapp">Cash App</option>
                            <option value="venmo">Venmo</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Starting Balance</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              placeholder="0.00"
                              value={getAccountField(account.id, 'starting_balance', account.starting_balance.toString())}
                              onChange={(e) => setAccountField(account.id, 'starting_balance', e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Current Balance: <span className="font-medium text-foreground">${Number(account.current_balance).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  )
                })()}

                {/* Account summary */}
                {accounts.length > 1 && (
                  <div className="rounded-xl p-3 border bg-emerald-500/10 border-emerald-500/20 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-emerald-400">
                        Total across {accounts.length} accounts
                      </span>
                      <span className="font-bold text-emerald-400">
                        ${accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveAccounts}
                    disabled={savingAccounts || Object.keys(editedAccounts).length === 0}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {savingAccounts ? 'Saving...' : 'Save Accounts'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Jar Split Calculator */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Jar Split Calculator
                </CardTitle>
                <CardDescription>
                  Not sure how to split your jars? Enter your income and bills — we&apos;ll calculate the percentages for you.
                </CardDescription>
              </div>
              <Button
                variant={showJarCalculator ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowJarCalculator(!showJarCalculator)}
              >
                {showJarCalculator ? 'Close' : 'Open'}
              </Button>
            </div>
          </CardHeader>
          {showJarCalculator && (
            <CardContent>
              <JarSplitCalculator
                mode="settings"
                onComplete={() => {
                  setShowJarCalculator(false)
                  toast.success('Jars recalculated!')
                }}
              />
            </CardContent>
          )}
        </Card>

        {/* Buckets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Jars
                </CardTitle>
                <CardDescription>Configure how income is split. Use % for percentage-based or $ for fixed dollar amounts.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddBucket}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {buckets.map((bucket) => {
              const fixed = isFixedAmount(bucket.id)
              const isNewBucket = bucket.id === newBucketId
              return (
                <div key={bucket.id} className="rounded-lg border p-3 space-y-3">
                  {/* Row 1: Color + Name + Delete */}
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={getBucketField(bucket.id, 'color', bucket.color)}
                      onChange={(e) => setBucketField(bucket.id, 'color', e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border-0 p-0 shrink-0"
                    />
                    <Input
                      ref={isNewBucket ? newBucketNameRef : undefined}
                      value={getBucketField(bucket.id, 'name', bucket.name)}
                      onChange={(e) => setBucketField(bucket.id, 'name', e.target.value)}
                      placeholder="Jar name"
                      className="flex-1 font-medium"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleDeleteBucket(bucket.id, bucket.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Row 2: Allocation + Due Date */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAllocationType(bucket.id)}
                        className="text-xs font-medium px-2 py-1 rounded border hover:bg-accent transition-colors shrink-0"
                        title={fixed ? 'Switch to percentage' : 'Switch to fixed dollar amount'}
                      >
                        {fixed ? '$' : '%'}
                      </button>
                      {fixed ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">$</span>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={getBucketField(bucket.id, 'target_amount', (bucket.target_amount || 0).toString())}
                            onChange={(e) => setBucketField(bucket.id, 'target_amount', e.target.value)}
                            placeholder="0"
                            className="w-24 text-center"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={getBucketField(bucket.id, 'percentage', bucket.percentage.toString())}
                            onChange={(e) => setBucketField(bucket.id, 'percentage', e.target.value)}
                            className="w-20 text-center"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Due</Label>
                      <Input
                        type="date"
                        value={getBucketField(bucket.id, 'due_date', bucket.due_date ?? '')}
                        onChange={(e) => setBucketField(bucket.id, 'due_date', e.target.value)}
                        className="w-36 text-sm"
                      />
                    </div>
                  </div>

                  {/* Row 3: Recurring toggle + interval */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getBucketField(bucket.id, 'is_recurring', String(bucket.is_recurring ?? false)) === 'true'}
                        onChange={(e) => {
                          setBucketField(bucket.id, 'is_recurring', String(e.target.checked))
                          if (!e.target.checked) {
                            setBucketField(bucket.id, 'recurring_interval', '')
                          } else if (!getBucketField(bucket.id, 'recurring_interval', bucket.recurring_interval ?? '')) {
                            setBucketField(bucket.id, 'recurring_interval', 'monthly')
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 accent-blue-500"
                      />
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <RefreshCw className="h-3 w-3" />
                        Recurring
                      </span>
                    </label>
                    {getBucketField(bucket.id, 'is_recurring', String(bucket.is_recurring ?? false)) === 'true' && (
                      <select
                        value={getBucketField(bucket.id, 'recurring_interval', bucket.recurring_interval ?? 'monthly')}
                        onChange={(e) => setBucketField(bucket.id, 'recurring_interval', e.target.value)}
                        className="h-8 rounded border bg-background px-2 text-xs"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
            {buckets.length > 0 && (
              <div className="space-y-3">
                {/* Total indicator */}
                {percentageBuckets.length > 0 && (
                  <div className={`rounded-xl p-3 border text-sm ${
                    Math.abs(totalPercentage - 100) < 0.1
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : totalPercentage > 100
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total: {totalPercentage.toFixed(1)}%</span>
                      {Math.abs(totalPercentage - 100) < 0.1 ? (
                        <span>✓ Balanced</span>
                      ) : totalPercentage > 100 ? (
                        <span>{(totalPercentage - 100).toFixed(1)}% over</span>
                      ) : (
                        <span>{(100 - totalPercentage).toFixed(1)}% remaining</span>
                      )}
                    </div>
                  </div>
                )}
                {fixedBuckets.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Fixed amount jars: ${totalFixed.toFixed(2)} per income
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={handleSaveBuckets} disabled={savingBuckets || (percentageBuckets.length > 0 && Math.abs(totalPercentage - 100) > 0.1)}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingBuckets ? 'Saving...' : 'Save Jars'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Daily Tracking Reminders
            </CardTitle>
            <CardDescription>Get a daily nudge to log your income and expenses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Enable daily reminders</Label>
                <p className="text-xs text-muted-foreground">
                  {`We'll remind you to track your earnings each day.`}
                </p>
              </div>
              <button
                onClick={async () => {
                  const newVal = !notifPrefs?.daily_tracking_reminder
                  const result = await updateNotifPrefs({ daily_tracking_reminder: newVal })
                  if (result.error) {
                    console.error('Notification pref error:', result.error)
                    const msg = result.error && typeof result.error === 'object' && 'message' in result.error
                      ? (result.error as { message: string }).message
                      : 'Unknown error'
                    toast.error(`Failed to update reminders: ${msg}`)
                  } else {
                    toast.success(newVal ? 'Daily reminders enabled!' : 'Daily reminders disabled')
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifPrefs?.daily_tracking_reminder ? 'bg-primary' : 'bg-muted'
                }`}
                disabled={notifLoading}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifPrefs?.daily_tracking_reminder ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {notifPrefs?.daily_tracking_reminder && (
              <div className="space-y-3 rounded-lg border border-dashed border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Reminder time</Label>
                    <Input
                      type="time"
                      value={notifPrefs?.reminder_time || '18:00'}
                      onChange={async (e) => {
                        const result = await updateNotifPrefs({ reminder_time: e.target.value })
                        if (result.error) toast.error('Failed to update reminder time')
                      }}
                      className="w-32"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Timezone: {notifPrefs?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>

                {/* Push Notification Toggle */}
                {pushSupported && (
                  <div className="mt-3 pt-3 border-t border-primary/10">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-medium">Push notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          {pushState === 'denied'
                            ? 'Notifications blocked — enable in browser settings.'
                            : pushState === 'subscribed'
                            ? "You'll get a push reminder on this device."
                            : 'Get a push reminder even when the app is closed.'}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (pushState === 'subscribed') {
                            await unsubscribePush()
                            toast.success('Push notifications disabled')
                          } else {
                            await subscribePush()
                            if (Notification.permission === 'granted') {
                              toast.success('Push notifications enabled! 🔔')
                            } else if (Notification.permission === 'denied') {
                              toast.error('Notifications blocked by browser')
                            }
                          }
                        }}
                        disabled={subscribing || pushState === 'denied'}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          pushState === 'subscribed' ? 'bg-primary' : 'bg-muted'
                        } ${pushState === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            pushState === 'subscribed' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={savingPassword}>
              <Lock className="mr-2 h-4 w-4" />
              {savingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
