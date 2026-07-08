'use client'

import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PasswordSettingsSectionProps = {
  newPassword: string
  confirmPassword: string
  saving: boolean
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onSave: () => void
}

export function PasswordSettingsSection({
  newPassword,
  confirmPassword,
  saving,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSave,
}: PasswordSettingsSectionProps) {
  return (
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
            onChange={(e) => onNewPasswordChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
          />
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={onSave} disabled={saving}>
          <Lock className="mr-2 h-4 w-4" />
          {saving ? 'Updating...' : 'Update Password'}
        </Button>
      </CardContent>
    </Card>
  )
}
