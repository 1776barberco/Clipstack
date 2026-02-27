// Supabase Edge Function: booth-rent-reminder
// Sends notifications to users 24h before booth rent is due

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current date info
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDay = tomorrow.getDate()

    // Find users with booth rent due tomorrow
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name, booth_rent_amount, booth_rent_due_day')
      .eq('booth_rent_due_day', tomorrowDay)
      .not('booth_rent_amount', 'is', null)

    if (usersError) {
      throw usersError
    }

    const notifications = []

    for (const user of users || []) {
      // Check if user has enough in their Essentials bucket
      const { data: bucketData } = await supabaseClient
        .from('bucket_balances')
        .select('current_balance')
        .eq('user_id', user.id)
        .eq('bucket_name', 'Essentials')
        .single()

      const essentialsBalance = bucketData?.current_balance ?? 0
      const hasEnoughFunds = essentialsBalance >= (user.booth_rent_amount || 0)

      // Create notification record
      const notification = {
        user_id: user.id,
        type: 'booth_rent_reminder',
        title: 'Booth Rent Due Tomorrow',
        message: hasEnoughFunds
          ? `Your booth rent of $${user.booth_rent_amount} is due tomorrow. You have sufficient funds in your Essentials jar.`
          : `Your booth rent of $${user.booth_rent_amount} is due tomorrow. You may need to transfer funds to your Essentials jar.`,
        data: {
          booth_rent_amount: user.booth_rent_amount,
          essentials_balance: essentialsBalance,
          has_enough_funds: hasEnoughFunds,
        },
        created_at: new Date().toISOString(),
      }

      notifications.push(notification)

      // TODO: Send actual push notification or email
      // For now, we just log it
      console.log('Notification for user:', user.email, notification)
    }

    // Store notifications in database
    if (notifications.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        console.error('Failed to store notifications:', insertError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: notifications.length,
        users_notified: users?.map((u) => u.email) || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
