'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/providers/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { useBuckets } from '@/hooks/useBuckets'
import { updateProfileAction, createBucketAction, updateBucketAction, deleteBucketAction, fetchBucketsAction } from '@/app/actions/auth'
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
  const { profile, loading: profileLoading, updateProfile } = useProfile(user?.id)
  const { buckets, loading: bucketsLoading, updateBucket, createBucket, deleteBucket } = useBuckets(user?.id)

  const [fullName, setFullName] = useState<string | null>(null)
  const [boothRent, setBoothRent] = useState<string | null>(null)
  const [dueDay, setDueDay] = useState<string | null>(null)
  const [taxRate, setTaxRate] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [editedBuckets, setEditedBuckets] = useState<Record<string, { name?: string; percentage?: string; color?: string }>>({})
  const [savingBuckets, setSavingBuckets] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

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

  const handleSaveBuckets = async () => {
    if (Object.keys(editedBuckets).length === 0) {
      toast.info('No jar changes to save.')
      return
    }

    const totalPercentage = buckets.reduce((sum, b) => {
      const edited = editedBuckets[b.id]
      const pct = edited?.percentage !== undefined ? parseFloat(edited.percentage) : b.percentage
      return sum + (pct || 0)
    }, 0)

    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast.error(`Jar percentages must total 100%. Currently: ${totalPercentage}%`)
      return
    }

    setSavingBuckets(true)

    for (const [id, changes] of Object.entries(editedBuckets)) {
      const updates: Record<string, unknown> = {}
      if (changes.name !== undefined) updates.name = changes.name
      if (changes.percentage !== undefined) updates.percentage = parseFloat(changes.percentage)
      if (changes.color !== undefined) updates.color = changes.color

      const result = await updateBucketAction(id, updates)
      if (result.error) {
        toast.error(`Failed to update jar.`)
        setSavingBuckets(false)
        return
      }
    }

    setEditedBuckets({})
    setSavingBuckets(false)
    toast.success('Jars updated!')
    refreshBuckets()
  }

  const refreshBuckets = async () => {
    const result = await fetchBucketsAction()
    if (!result.error) {
      // Force re-render by navigating
      router.refresh()
    }
  }

  const handleAddBucket = async () => {
    if (!user) return

    const currentTotal = buckets.reduce((sum, b) => sum + b.percentage, 0)
    const remaining = Math.max(0, 100 - currentTotal)

    const result = await createBucketAction({
      name: 'New Jar',
      percentage: remaining,
      target_amount: null,
      is_tax_bucket: false,
      priority: 0,
      color: '#6b7280',
    })

    if (result.error) {
      toast.error('Failed to add jar.')
    } else {
      toast.success('Jar added!')
      refreshBuckets()
    }
  }

  const handleDeleteBucket = async (id: string, name: string) => {
    const result = await deleteBucketAction(id)
    if (result.error) {
      toast.error(`Failed to delete ${name}.`)
    } else {
      const updated = { ...editedBuckets }
      delete updated[id]
      setEditedBuckets(updated)
      toast.success(`${name} deleted.`)
      refreshBuckets()
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

  const getBucketField = (id: string, field: 'name' | 'percentage' | 'color', fallback: string) => {
    return editedBuckets[id]?.[field] ?? fallback
  }

  const setBucketField = (id: string, field: 'name' | 'percentage' | 'color', value: string) => {
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
                <CardDescription>Configure how income is split across jars. Percentages must total 100%.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddBucket}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {buckets.map((bucket) => (
              <div key={bucket.id} className="flex items-center gap-3 rounded-lg border p-3">
                <input
                  type="color"
                  value={getBucketField(bucket.id, 'color', bucket.color)}
                  onChange={(e) => setBucketField(bucket.id, 'color', e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border-0 p-0"
                />
                <Input
                  value={getBucketField(bucket.id, 'name', bucket.name)}
                  onChange={(e) => setBucketField(bucket.id, 'name', e.target.value)}
                  className="flex-1"
                />
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteBucket(bucket.id, bucket.name)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {buckets.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total: {buckets.reduce((sum, b) => {
                    const edited = editedBuckets[b.id]
                    const pct = edited?.percentage !== undefined ? parseFloat(edited.percentage) : b.percentage
                    return sum + (pct || 0)
                  }, 0)}%
                </span>
                <Button onClick={handleSaveBuckets} disabled={savingBuckets}>
                  <Save className="mr-2 h-4 w-4" />
                  {savingBuckets ? 'Saving...' : 'Save Jars'}
                </Button>
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
