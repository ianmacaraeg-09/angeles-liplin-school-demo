// Service worker for the installable school app.
// - Network first, so a new release or new content always wins when online.
// - Falls back to what was last seen, so the app still opens without a connection.
// - Shows alert notifications and opens the app on tap.
const CACHE = 'school-app-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key)
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)) }
        return res
      })
      .catch(async () => (await caches.match(req)) || (await caches.match('./index.html')) || Response.error()),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    if (all.length) { await all[0].focus(); return }
    await self.clients.openWindow('./#/m/alerts')
  })())
})
