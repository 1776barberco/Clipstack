// Supabase Edge Function: daily-tracking-reminder
// Creates reminder notifications for users who opted in to daily tracking reminders.
// Intended to be called via cron (e.g., every hour) to check per-user reminder_time.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    // Current hour in HH:00 format for matching
    const currentHour = now.getUTCHours()

    // Find users with daily_tracking_reminder enabled
    // We match users whose reminder_time (in their timezone) falls in the current UTC hour
    const { data: prefs, error: prefsError } = await supabaseClient
      .from('notification_preferences')
      .select('user_id, reminder_time, timezone')
      .eq('daily_tracking_reminder', true)

    if (prefsError) throw prefsError

    const notifications = []
    const today = now.toISOString().split('T')[0]

    for (const pref of prefs || []) {
      // Parse the user's reminder time and convert to UTC to check if it's time
      const [hours, minutes] = (pref.reminder_time || '18:00').split(':').map(Number)
      
      // Simple timezone offset check — create a date in the user's timezone
      // and see if the current UTC hour matches
      try {
        const userNow = new Date(now.toLocaleString('en-US', { timeZone: pref.timezone || 'America/New_York' }))
        const userHour = userNow.getHours()
        
        // Only send if current hour in user's timezone matches their reminder hour
        if (userHour !== hours) continue
      } catch {
        // Invalid timezone, skip
        continue
      }

      // Check if we already sent a reminder today
      const { data: existing } = await supabaseClient
        .from('notifications')
        .select('id')
        .eq('user_id', pref.user_id)
        .eq('type', 'daily_tracking_reminder')
        .gte('created_at', `${today}T00:00:00Z`)
        .limit(1)

      if (existing && existing.length > 0) continue

      // Check if user already logged income/expenses today
      const { data: todayIncome } = await supabaseClient
        .from('income_entries')
        .select('id')
        .eq('user_id', pref.user_id)
        .eq('entry_date', today)
        .limit(1)

      const { data: todayExpenses } = await supabaseClient
        .from('expenses')
        .select('id')
        .eq('user_id', pref.user_id)
        .eq('entry_date', today)
        .limit(1)

      const hasActivity = (todayIncome && todayIncome.length > 0) || (todayExpenses && todayExpenses.length > 0)

      // Create the notification
      const notification = {
        user_id: pref.user_id,
        type: 'daily_tracking_reminder',
        title: hasActivity ? "Don't forget to finish logging today!" : "Time to log today's earnings! 💰",
        message: hasActivity
          ? "You've started logging today — make sure everything's captured before the day ends."
          : "Take a minute to log your income and expenses. Your future self will thank you!",
        data: {
          date: today,
          has_activity: hasActivity,
        },
      }

      notifications.push(notification)
    }

    // Bulk insert notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        console.error('Failed to store daily reminders:', insertError)
      }

      // TODO: Send actual push notifications when VAPID keys are configured
      // For each user with push_enabled and a valid push_subscription,
      // send a Web Push notification using the web-push library.
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_created: notifications.length,
        checked_at: now.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
