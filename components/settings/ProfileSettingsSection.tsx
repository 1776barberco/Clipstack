'use client'

import { Calendar, DollarSign, Save, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { ProfileSettingsValue } from './types'

type ProfileSettingsSectionProps = {
  value: ProfileSettingsValue
  saving: boolean
  onChange: (field: 'fullName' | 'boothRent' | 'dueDay' | 'taxRate', value: string) => void
  onSave: () => void
}

export function ProfileSettingsSection({ value, saving, onChange, onSave }: ProfileSettingsSectionProps) {
  return (
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
          <Input id="email" value={value.email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="Jane Doe"
            value={value.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
          />
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="boothRent">Booth Rent ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="boothRent"
                type="number"
                placeholder="150"
                value={value.boothRent}
                onChange={(e) => onChange('boothRent', e.target.value)}
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
                value={value.dueDay}
                onChange={(e) => onChange('dueDay', e.target.value)}
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
            value={value.taxRate}
            onChange={(e) => onChange('taxRate', e.target.value)}
          />
        </div>
        <Separator />
        <Button type="button" className="w-full sm:w-auto" onClick={onSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </CardContent>
    </Card>
  )
}
