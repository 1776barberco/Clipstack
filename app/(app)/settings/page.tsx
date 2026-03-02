'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/providers/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { useBuckets } from '@/hooks/useBuckets'
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
} from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const { buckets, loading: bucketsLoading, createBucket, updateBucket, deleteBucket } = useBuckets(user?.id)

  const [fullName, setFullName] = useState<string | null>(null)
  const [boothRent, setBoothRent] = useState<string | null>(null)
  const [dueDay, setDueDay] = useState<string | null>(null)
  const [taxRate, setTaxRate] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [editedBuckets, setEditedBuckets] = useState<Record<string, { name?: string; percentage?: string; color?: string; target_amount?: string; due_date?: string }>>({})
  const [savingBuckets, setSavingBuckets] = useState(false)
  const [newBucketId, setNewBucketId] = useState<string | null>(null)
  const newBucketNameRef = useRef<HTMLInputElement>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

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

  const getBucketField = (id: string, field: 'name' | 'percentage' | 'color' | 'target_amount' | 'due_date', fallback: string) => {
    return editedBuckets[id]?.[field] ?? fallback
  }

  const setBucketField = (id: string, field: 'name' | 'percentage' | 'color' | 'target_amount' | 'due_date', value: string) => {
    // Direct edit — user controls their own splits
    setEditedBuckets((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  if (profileLoading || bucketsLoading) {
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
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              <Save className="mr-2 h-4 w-4" />
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
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
