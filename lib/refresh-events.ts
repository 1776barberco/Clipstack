import type { SupabaseClient } from '@supabase/supabase-js'

export const REFRESH_EVENTS = {
  incomeUpdated: 'income-updated',
  expensesUpdated: 'expenses-updated',
} as const

export type RefreshEventName = (typeof REFRESH_EVENTS)[keyof typeof REFRESH_EVENTS]

type RefreshTable = {
  table: string
  channel?: string
}

type UserRefreshSubscriptionOptions = {
  client: SupabaseClient
  userId: string
  tables: RefreshTable[]
  events?: RefreshEventName[]
  refresh: () => void
}

export function dispatchRefreshEvent(eventName: RefreshEventName) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(eventName))
}

export function dispatchRefreshEvents(eventNames: RefreshEventName[]) {
  const uniqueEvents = [...new Set(eventNames)]
  uniqueEvents.forEach(dispatchRefreshEvent)
}

export function subscribeToUserRefresh({
  client,
  userId,
  tables,
  events = [],
  refresh,
}: UserRefreshSubscriptionOptions) {
  const subscriptions = tables.map(({ table, channel }) =>
    client
      .channel(channel ?? `${table}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `user_id=eq.${userId}`,
        },
        refresh
      )
      .subscribe()
  )

  const uniqueEvents = [...new Set(events)]

  if (typeof window !== 'undefined') {
    uniqueEvents.forEach((eventName) => {
      window.addEventListener(eventName, refresh)
    })
  }

  return () => {
    subscriptions.forEach((subscription) => {
      subscription.unsubscribe()
    })

    if (typeof window !== 'undefined') {
      uniqueEvents.forEach((eventName) => {
        window.removeEventListener(eventName, refresh)
      })
    }
  }
}
