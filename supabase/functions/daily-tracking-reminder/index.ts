// Supabase Edge Function: daily-tracking-reminder
// Creates reminder notifications for users who opted in to daily tracking reminders.
// Sends real Web Push notifications to subscribed devices.
// Intended to be called via cron (e.g., every hour) to check per-user reminder_time.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ===== Web Push helpers (RFC 8291 / RFC 8188 via web-push) =====

async function importVapidKeys(publicKeyB64: string, privateKeyB64: string) {
  // Convert URL-safe base64 to raw bytes
  function b64ToBytes(b64: string): Uint8Array {
    const padding = '='.repeat((4 - (b64.length % 4)) % 4)
    const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
    return bytes
  }

  const pubBytes = b64ToBytes(publicKeyB64)
  const privBytes = b64ToBytes(privateKeyB64)

  const publicKey = await crypto.subtle.importKey(
    'raw',
    pubBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    []
  )

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      x: btoa(String.fromCharCode(...pubBytes.slice(1, 33))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
      y: btoa(String.fromCharCode(...pubBytes.slice(33, 65))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
      d: btoa(String.fromCharCode(...privBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign']
  )

  return { publicKey, privateKey, publicKeyBytes: pubBytes }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function createVapidJwt(
  audience: string,
  subject: string,
  privateKey: CryptoKey,
  expSeconds = 12 * 60 * 60
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { aud: audience, exp: now + expSeconds, sub: subject }

  const enc = new TextEncoder()
  const headerB64 = bytesToBase64Url(enc.encode(JSON.stringify(header)))
  const payloadB64 = bytesToBase64Url(enc.encode(JSON.stringify(payload)))
  const unsignedToken = `${headerB64}.${payloadB64}`

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    enc.encode(unsignedToken)
  )

  // Convert DER signature to raw r||s (64 bytes)
  const sigBytes = new Uint8Array(signature)
  let r: Uint8Array, s: Uint8Array
  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32)
    s = sigBytes.slice(32, 64)
  } else {
    // DER encoded
    const rLen = sigBytes[3]
    const rStart = 4 + (rLen - 32 > 0 ? rLen - 32 : 0)
    r = sigBytes.slice(4, 4 + rLen)
    if (r.length > 32) r = r.slice(r.length - 32)
    const sOffset = 4 + rLen
    const sLen = sigBytes[sOffset + 1]
    s = sigBytes.slice(sOffset + 2, sOffset + 2 + sLen)
    if (s.length > 32) s = s.slice(s.length - 32)
    // Pad to 32 bytes
    if (r.length < 32) { const p = new Uint8Array(32); p.set(r, 32 - r.length); r = p }
    if (s.length < 32) { const p = new Uint8Array(32); p.set(s, 32 - s.length); s = p }
  }

  const rawSig = new Uint8Array(64)
  rawSig.set(r, 0)
  rawSig.set(s, 32)

  return `${unsignedToken}.${bytesToBase64Url(rawSig)}`
}

// Encrypt payload per RFC 8291 (aes128gcm)
async function encryptPayload(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: Uint8Array
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKeyBytes: Uint8Array }> {
  function b64ToBytes(b64: string): Uint8Array {
    const padding = '='.repeat((4 - (b64.length % 4)) % 4)
    const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
    return bytes
  }

  const clientPubKey = b64ToBytes(subscription.keys.p256dh)
  const authSecret = b64ToBytes(subscription.keys.auth)

  // Generate ephemeral ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  )

  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey)
  const localPublicKeyBytes = new Uint8Array(localPublicKeyRaw)

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    'raw',
    clientPubKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  )

  // ECDH shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientKey },
    localKeyPair.privateKey,
    256
  )
  const sharedSecret = new Uint8Array(sharedSecretBits)

  const enc = new TextEncoder()

  // HKDF to derive IKM from auth secret
  const ikmKey = await crypto.subtle.importKey('raw', sharedSecret, { name: 'HKDF' }, false, ['deriveBits'])
  
  // info for auth: "WebPush: info\0" + client_pub + server_pub
  const authInfo = new Uint8Array([
    ...enc.encode('WebPush: info\0'),
    ...clientPubKey,
    ...localPublicKeyBytes,
  ])

  // salt for HKDF auth extraction = authSecret
  const ikmBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: authInfo },
    ikmKey,
    256
  )
  const ikm = new Uint8Array(ikmBits)

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // Derive CEK and nonce from IKM
  const prkKey = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits'])

  const cekInfo = enc.encode('Content-Encoding: aes128gcm\0')
  const cekBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: salt, info: cekInfo },
    prkKey,
    128
  )

  const nonceInfo = enc.encode('Content-Encoding: nonce\0')
  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: salt, info: nonceInfo },
    prkKey,
    96
  )

  const cek = await crypto.subtle.importKey('raw', cekBits, { name: 'AES-GCM' }, false, ['encrypt'])
  const nonce = new Uint8Array(nonceBits)

  // Pad payload (add \x02 delimiter)
  const paddedPayload = new Uint8Array(payload.length + 1)
  paddedPayload.set(payload)
  paddedPayload[payload.length] = 2 // padding delimiter

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    cek,
    paddedPayload
  )

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = 4096
  const header = new Uint8Array(16 + 4 + 1 + localPublicKeyBytes.length)
  header.set(salt, 0)
  new DataView(header.buffer).setUint32(16, rs)
  header[20] = localPublicKeyBytes.length
  header.set(localPublicKeyBytes, 21)

  const encrypted = new Uint8Array(header.length + ciphertext.byteLength)
  encrypted.set(header, 0)
  encrypted.set(new Uint8Array(ciphertext), header.length)

  return { encrypted, salt, localPublicKeyBytes }
}

async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: object,
  vapidPrivateKey: CryptoKey,
  vapidPublicKeyBytes: Uint8Array,
  vapidSubject: string
): Promise<{ success: boolean; status: number; gone?: boolean }> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload))

  const { encrypted } = await encryptPayload(subscription, payloadBytes)

  const url = new URL(subscription.endpoint)
  const audience = `${url.protocol}//${url.host}`

  const jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey)
  const vapidPubB64 = bytesToBase64Url(vapidPublicKeyBytes)

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Authorization': `vapid t=${jwt}, k=${vapidPubB64}`,
    },
    body: encrypted,
  })

  const gone = response.status === 404 || response.status === 410
  return { success: response.ok || response.status === 201, status: response.status, gone }
}

// ===== Main handler =====

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load VAPID keys
    const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY') || Deno.env.get('VAPID_PUBLIC_KEY') || ''
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || ''
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || ''
    const pushEnabled = vapidPublicKey && vapidPrivateKey && vapidSubject

    let vapidKeys: { publicKey: CryptoKey; privateKey: CryptoKey; publicKeyBytes: Uint8Array } | null = null
    if (pushEnabled) {
      try {
        vapidKeys = await importVapidKeys(vapidPublicKey, vapidPrivateKey)
      } catch (e) {
        console.error('Failed to import VAPID keys:', e)
      }
    }

    const now = new Date()

    // Find users with daily_tracking_reminder enabled
    const { data: prefs, error: prefsError } = await supabaseClient
      .from('notification_preferences')
      .select('user_id, reminder_time, timezone, push_enabled, push_subscription')
      .eq('daily_tracking_reminder', true)

    if (prefsError) throw prefsError

    const notifications = []
    const pushResults: { userId: string; success: boolean; status: number }[] = []
    const staleSubscriptions: string[] = []
    const today = now.toISOString().split('T')[0]

    for (const pref of prefs || []) {
      // Parse the user's reminder time and convert to UTC to check if it's time
      const [hours] = (pref.reminder_time || '18:00').split(':').map(Number)

      try {
        const userNow = new Date(now.toLocaleString('en-US', { timeZone: pref.timezone || 'America/New_York' }))
        const userHour = userNow.getHours()
        if (userHour !== hours) continue
      } catch {
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

      const title = hasActivity
        ? "Don't forget to finish logging today!"
        : "Time to log today's earnings! 💰"
      const message = hasActivity
        ? "You've started logging today — make sure everything's captured before the day ends."
        : "Take a minute to log your income and expenses. Your future self will thank you!"

      // Create the in-app notification
      const notification = {
        user_id: pref.user_id,
        type: 'daily_tracking_reminder',
        title,
        message,
        data: { date: today, has_activity: hasActivity },
      }
      notifications.push(notification)

      // Send real push notification if user has push enabled and valid subscription
      if (
        vapidKeys &&
        pref.push_enabled &&
        pref.push_subscription &&
        typeof pref.push_subscription === 'object' &&
        (pref.push_subscription as Record<string, unknown>).endpoint
      ) {
        try {
          const sub = pref.push_subscription as { endpoint: string; keys: { p256dh: string; auth: string } }
          const result = await sendPushNotification(
            sub,
            {
              title,
              body: message,
              tag: 'tipjars-daily-reminder',
              url: '/dashboard',
            },
            vapidKeys.privateKey,
            vapidKeys.publicKeyBytes,
            vapidSubject
          )
          pushResults.push({ userId: pref.user_id, success: result.success, status: result.status })

          if (result.gone) {
            staleSubscriptions.push(pref.user_id)
          }
        } catch (e) {
          console.error(`Push failed for user ${pref.user_id}:`, e)
          pushResults.push({ userId: pref.user_id, success: false, status: 0 })
        }
      }
    }

    // Bulk insert in-app notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        console.error('Failed to store daily reminders:', insertError)
      }
    }

    // Clean up stale push subscriptions (410 Gone / 404)
    if (staleSubscriptions.length > 0) {
      const { error: cleanupError } = await supabaseClient
        .from('notification_preferences')
        .update({ push_enabled: false, push_subscription: null, updated_at: new Date().toISOString() })
        .in('user_id', staleSubscriptions)

      if (cleanupError) {
        console.error('Failed to clean stale subscriptions:', cleanupError)
      } else {
        console.log(`Cleaned ${staleSubscriptions.length} stale push subscriptions`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_created: notifications.length,
        push_sent: pushResults.filter(r => r.success).length,
        push_failed: pushResults.filter(r => !r.success).length,
        stale_cleaned: staleSubscriptions.length,
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
