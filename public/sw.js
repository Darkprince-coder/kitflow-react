// KitFlow Service Worker
// Only caches in production. In dev (localhost) it does nothing
// so Vite HMR works and stale cache never blocks updates.

const CACHE   = 'kitflow-v1'
const IS_DEV  = self.location.hostname === 'localhost' ||
                self.location.hostname === '127.0.0.1'

self.addEventListener('install', e => {
  self.skipWaiting()
  if (IS_DEV) return
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/', '/index.html', '/manifest.json']))
  )
})

self.addEventListener('activate', e => {
  self.clients.claim()
  if (IS_DEV) return
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
})

self.addEventListener('fetch', e => {
  // In dev: let everything through, no caching at all
  if (IS_DEV) return

  const { request } = e
  const url = new URL(request.url)

  // Never cache Supabase API calls
  if (url.hostname.includes('supabase.co')) return

  // SPA navigation — serve index.html
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // Static assets — cache first
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(request, clone))
      }
      return res
    }))
  )
})
