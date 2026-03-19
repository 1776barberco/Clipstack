// This is the service worker for TipJars
// Handles push notifications and offline sync

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ===== Push Notifications =====
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body || 'Time to check your jars!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
    },
    actions: [
      { action: 'open', title: 'Open TipJars' },
      { action: 'dismiss', title: 'Later' },
    ],
    tag: data.tag || 'tipjars-reminder',
    renotify: true,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'TipJars', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})

// ===== Background Sync =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-income') {
    event.waitUntil(syncIncomeData())
  }
})

async function syncIncomeData() {
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_INCOME' })
  })
}
