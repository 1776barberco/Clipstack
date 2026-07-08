'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Bell, Landmark, Lock, User, Wallet } from 'lucide-react'
import { useAuthContext } from '@/providers/AuthProvider'
import { updateProfileAction } from '@/app/actions/auth'
import { supabase } from '@/lib/supabase/client'
import { useBankAccounts, type BankAccount } from '@/hooks/useBankAccounts'
import { useBuckets } from '@/hooks/useBuckets'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences'
import { usePlaidConnections } from '@/hooks/usePlaidConnections'
import { useProfile } from '@/hooks/useProfile'
import { usePushSubscription } from '@/hooks/usePushSubscription'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserMenu } from '@/components/UserMenu'
import { PlaidConnectionCard } from '@/components/PlaidConnectionCard'
import { GuidedTourSection } from '@/components/settings/GuidedTourSection'
import { JarCalculatorSection } from '@/components/settings/JarCalculatorSection'
import { JarsSettingsSection } from '@/components/settings/JarsSettingsSection'
import { ManualAccountsSection } from '@/components/settings/ManualAccountsSection'
import { PasswordSettingsSection } from '@/components/settings/PasswordSettingsSection'
import { ProfileSettingsSection } from '@/components/settings/ProfileSettingsSection'
import { ReminderSettingsSection } from '@/components/settings/ReminderSettingsSection'
import type { BucketField, BucketTotals, EditedAccount, EditedBucket } from '@/components/settings/types'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const { buckets, loading: bucketsLoading, createBucket, updateBucket, deleteBucket } = useBuckets(user?.id)
  const { accounts, loading: accountsLoading, createAccount, updateAccount, deleteAccount } = useBankAccounts(user?.id)
  const { accounts: plaidAccounts, loading: plaidLoading } = usePlaidConnections(user?.id)
  const { preferences: notifPrefs, loading: notifLoading, updatePreferences: updateNotifPrefs } = useNotificationPreferences(user?.id)
  const { pushState, subscribing, subscribe: subscribePush, unsubscribe: unsubscribePush, isSupported: pushSupported } = usePushSubscription(user?.id)

  const [fullName, setFullName] = useState<string | null>(null)
  const [boothRent, setBoothRent] = useState<string | null>(null)
  const [dueDay, setDueDay] = useState<string | null>(null)
  const [taxRate, setTaxRate] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [editedAccounts, setEditedAccounts] = useState<Record<string, EditedAccount>>({})
  const [savingAccounts, setSavingAccounts] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState('checking')
  const [newAccountBalance, setNewAccountBalance] = useState('')
  const [accountCarouselIndex, setAccountCarouselIndex] = useState(0)

  const [editedBuckets, setEditedBuckets] = useState<Record<string, EditedBucket>>({})
  const [savingBuckets, setSavingBuckets] = useState(false)
  const [newBucketId, setNewBucketId] = useState<string | null>(null)
  const newBucketNameRef = useRef<HTMLInputElement>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [showJarCalculator, setShowJarCalculator] = useState(false)

  const activePlaidAccounts = plaidAccounts.filter((account) => account.is_active)

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
    if (accounts.length <= 1 && activePlaidAccounts.length === 0) {
      toast.error('You must have at least one manual or connected account.')
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
      toast.success(`${name} deleted. Remaining jars rebalanced.`)
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

    if (fixed) {
      const otherPctBuckets = buckets.filter(b => b.id !== bucketId && !isFixedAmount(b.id))
      const otherTotal = otherPctBuckets.reduce((sum, b) => {
        const edited = editedBuckets[b.id]
        const pct = edited?.percentage !== undefined ? parseFloat(edited.percentage) : b.percentage
        return sum + (pct || 0)
      }, 0)
      const evenShare = otherPctBuckets.length > 0
        ? Math.round((otherTotal / otherPctBuckets.length) * 10) / 10
        : 100
      const newTotal = otherTotal + evenShare
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
      return
    }

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
      for (const b of otherPctBuckets) {
        const pct = prev[b.id]?.percentage !== undefined ? parseFloat(prev[b.id]!.percentage!) : b.percentage
        next[b.id] = { ...next[b.id], percentage: String(Math.round(pct * scale * 10) / 10) }
      }
      return next
    })
  }

  const handleSaveBuckets = async () => {
    if (Object.keys(editedBuckets).length === 0) {
      toast.info('No jar changes to save.')
      return
    }

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
      if (changes.group_name !== undefined) updates.group_name = changes.group_name.trim() || null
      if (changes.percentage !== undefined) updates.percentage = parseFloat(changes.percentage)
      if (changes.color !== undefined) updates.color = changes.color
      if (changes.target_amount !== undefined) {
        const amt = parseFloat(changes.target_amount)
        updates.target_amount = amt > 0 ? amt : null
      }
      if (changes.due_date !== undefined) updates.due_date = changes.due_date || null
      if (changes.is_recurring !== undefined) updates.is_recurring = changes.is_recurring === 'true'
      if (changes.recurring_interval !== undefined) updates.recurring_interval = changes.recurring_interval || null

      const result = await updateBucket(id, updates)
      if (result.error) {
        toast.error('Failed to update jar.')
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
      group_name: null,
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
      toast.success(`${name} deleted. Remaining jars rebalanced.`)
    }
  }

  const getBucketField = (id: string, field: BucketField, fallback: string) => {
    return editedBuckets[id]?.[field] ?? fallback
  }

  const setBucketField = (id: string, field: BucketField, value: string) => {
    setEditedBuckets((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
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

  if (profileLoading || bucketsLoading || accountsLoading || plaidLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

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
  const bucketTotals: BucketTotals = { percentageBuckets, fixedBuckets, totalPercentage, totalFixed }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Back to dashboard" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">Settings</span>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto max-w-4xl p-4">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-5">
            <TabsTrigger value="profile" className="min-h-11">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="money" className="min-h-11">
              <Landmark className="h-4 w-4" />
              Money
            </TabsTrigger>
            <TabsTrigger value="jars" className="min-h-11">
              <Wallet className="h-4 w-4" />
              Jars
            </TabsTrigger>
            <TabsTrigger value="reminders" className="min-h-11">
              <Bell className="h-4 w-4" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="security" className="min-h-11">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSettingsSection
              value={{
                email: user?.email || '',
                fullName: displayName,
                boothRent: displayBoothRent,
                dueDay: displayDueDay,
                taxRate: displayTaxRate,
              }}
              saving={savingProfile}
              onChange={(field, value) => {
                if (field === 'fullName') setFullName(value)
                if (field === 'boothRent') setBoothRent(value)
                if (field === 'dueDay') setDueDay(value)
                if (field === 'taxRate') setTaxRate(value)
              }}
              onSave={handleSaveProfile}
            />

            <GuidedTourSection
              onReplay={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('tipjars-force-tour-open', 'true')
                  window.localStorage.removeItem('tipjars-dashboard-tour-completed')
                  window.localStorage.removeItem('tipjars-dashboard-welcome-dismissed')
                }
                router.push('/dashboard')
              }}
            />
          </TabsContent>

          <TabsContent value="money" className="space-y-6">
            <PlaidConnectionCard userId={user?.id} />

            <ManualAccountsSection
              accounts={accounts}
              activePlaidAccountCount={activePlaidAccounts.length}
              editedAccounts={editedAccounts}
              saving={savingAccounts}
              showAddAccount={showAddAccount}
              newAccountName={newAccountName}
              newAccountType={newAccountType}
              newAccountBalance={newAccountBalance}
              carouselIndex={accountCarouselIndex}
              onShowAddAccountChange={setShowAddAccount}
              onNewAccountNameChange={setNewAccountName}
              onNewAccountTypeChange={setNewAccountType}
              onNewAccountBalanceChange={setNewAccountBalance}
              onCarouselIndexChange={setAccountCarouselIndex}
              onAddAccount={handleAddAccount}
              onSaveAccounts={handleSaveAccounts}
              onDeleteAccount={handleDeleteAccount}
              onSetPrimary={handleSetPrimary}
              getAccountField={getAccountField}
              setAccountField={setAccountField}
            />
          </TabsContent>

          <TabsContent value="jars" className="space-y-6">
            <JarCalculatorSection
              open={showJarCalculator}
              onOpenChange={setShowJarCalculator}
              onComplete={() => {
                setShowJarCalculator(false)
                toast.success('Jars recalculated!')
              }}
            />

            <JarsSettingsSection
              buckets={buckets}
              totals={bucketTotals}
              saving={savingBuckets}
              newBucketId={newBucketId}
              newBucketNameRef={newBucketNameRef}
              isFixedAmount={isFixedAmount}
              getBucketField={getBucketField}
              setBucketField={setBucketField}
              onToggleAllocationType={toggleAllocationType}
              onAddBucket={handleAddBucket}
              onDeleteBucket={handleDeleteBucket}
              onSaveBuckets={handleSaveBuckets}
            />
          </TabsContent>

          <TabsContent value="reminders" className="space-y-6">
            <ReminderSettingsSection
              preferences={notifPrefs}
              loading={notifLoading}
              pushState={pushState}
              pushSupported={pushSupported}
              subscribing={subscribing}
              onUpdatePreferences={updateNotifPrefs}
              onSubscribePush={subscribePush}
              onUnsubscribePush={unsubscribePush}
            />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <PasswordSettingsSection
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              saving={savingPassword}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onSave={handleChangePassword}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
