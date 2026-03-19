'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNotificationPreferences } from './useNotificationPreferences'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

type PushState = 'unsupported' | 'denied' | 'prompt' | 'subscribed' | 'unsubscribed' | 'loading'

export function usePushSubscription(userId: string | undefined) {
  const { preferences, updatePreferences } = useNotificationPreferences(userId)
  const [pushState, setPushState] = useState<PushState>('loading')
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported')
      return
    }

    if (!VAPID_PUBLIC_KEY) {
      setPushState('unsupported')
      return
    }

    const checkState = async () => {
      const permission = Notification.permission
      if (permission === 'denied') {
        setPushState('denied')
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription && preferences?.push_enabled) {
          setPushState('subscribed')
        } else {
          setPushState(permission === 'default' ? 'prompt' : 'unsubscribed')
        }
      } catch {
        setPushState('unsubscribed')
      }
    }

    checkState()
  }, [preferences?.push_enabled])

  const subscribe = useCallback(async () => {
    if (!userId || !VAPID_PUBLIC_KEY) return

    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushState(permission === 'denied' ? 'denied' : 'prompt')
        return
      }

      const registration = await navigator.serviceWorker.ready
      
      // Unsubscribe from any existing subscription first
      const existing = await registration.pushManager.getSubscription()
      if (existing) {
        await existing.unsubscribe()
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })

      const subJson = subscription.toJSON()

      await updatePreferences({
        push_enabled: true,
        push_subscription: subJson,
      })

      setPushState('subscribed')
    } catch (err) {
      console.error('Push subscription failed:', err)
      setPushState('unsubscribed')
    } finally {
      setSubscribing(false)
    }
  }, [userId, updatePreferences])

  const unsubscribe = useCallback(async () => {
    setSubscribing(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
      }

      await updatePreferences({
        push_enabled: false,
        push_subscription: null,
      })

      setPushState('unsubscribed')
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    } finally {
      setSubscribing(false)
    }
  }, [updatePreferences])

  return {
    pushState,
    subscribing,
    subscribe,
    unsubscribe,
    isSupported: pushState !== 'unsupported',
  }
}
