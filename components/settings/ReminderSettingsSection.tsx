'use client'

import { Bell, Clock } from 'lucide-react'
import { toast } from 'sonner'
import type { NotificationPreferences } from '@/hooks/useNotificationPreferences'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ReminderSettingsSectionProps = {
  preferences: NotificationPreferences | null
  loading: boolean
  pushState: 'unsupported' | 'denied' | 'prompt' | 'subscribed' | 'unsubscribed' | 'loading'
  pushSupported: boolean
  subscribing: boolean
  onUpdatePreferences: (updates: Partial<NotificationPreferences>) => Promise<{ error?: unknown }>
  onSubscribePush: () => Promise<void>
  onUnsubscribePush: () => Promise<void>
}

export function ReminderSettingsSection({
  preferences,
  loading,
  pushState,
  pushSupported,
  subscribing,
  onUpdatePreferences,
  onSubscribePush,
  onUnsubscribePush,
}: ReminderSettingsSectionProps) {
  const remindersEnabled = preferences?.daily_tracking_reminder

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Daily Tracking Reminders
        </CardTitle>
        <CardDescription>Get a daily nudge to log your income and expenses.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium" htmlFor="daily-tracking-reminders">Enable gentle daily reminders</Label>
            <p className="text-xs text-muted-foreground">
              We&apos;ll send a light nudge if you haven&apos;t logged your income yet.
            </p>
          </div>
          <button
            id="daily-tracking-reminders"
            type="button"
            role="switch"
            aria-checked={Boolean(remindersEnabled)}
            onClick={async () => {
              const newVal = !remindersEnabled
              const result = await onUpdatePreferences({ daily_tracking_reminder: newVal })
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
            className={`relative inline-flex h-11 w-14 shrink-0 items-center rounded-full transition-colors ${remindersEnabled ? 'bg-primary' : 'bg-muted'}`}
            disabled={loading}
            aria-label="Toggle daily tracking reminders"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${remindersEnabled ? 'translate-x-8' : 'translate-x-2'}`}
            />
          </button>
        </div>

        {remindersEnabled && (
          <div className="space-y-3 rounded-lg border border-dashed border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <Label className="text-xs" htmlFor="reminder-time">Reminder time</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={preferences?.reminder_time || '18:00'}
                  onChange={async (e) => {
                    const result = await onUpdatePreferences({ reminder_time: e.target.value })
                    if (result.error) toast.error('Failed to update reminder time')
                  }}
                  className="w-32"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Timezone: {preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>

            {pushSupported && (
              <div className="mt-3 border-t border-primary/10 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium" htmlFor="push-notifications">Push notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      {pushState === 'denied'
                        ? 'Notifications blocked - enable in browser settings.'
                        : pushState === 'subscribed'
                          ? "You'll get daily and streak-warning push reminders on this device."
                          : 'Get push reminders even when the app is closed, including streak warnings in the evening.'}
                    </p>
                  </div>
                  <button
                    id="push-notifications"
                    type="button"
                    role="switch"
                    aria-checked={pushState === 'subscribed'}
                    onClick={async () => {
                      if (pushState === 'subscribed') {
                        await onUnsubscribePush()
                        toast.success('Push notifications disabled')
                      } else {
                        await onSubscribePush()
                        if (Notification.permission === 'granted') {
                          toast.success('Push notifications enabled!')
                        } else if (Notification.permission === 'denied') {
                          toast.error('Notifications blocked by browser')
                        }
                      }
                    }}
                    disabled={subscribing || pushState === 'denied'}
                    aria-label="Toggle push notifications"
                    className={`relative inline-flex h-11 w-14 shrink-0 items-center rounded-full transition-colors ${
                      pushState === 'subscribed' ? 'bg-primary' : 'bg-muted'
                    } ${pushState === 'denied' ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        pushState === 'subscribed' ? 'translate-x-8' : 'translate-x-2'
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
  )
}
