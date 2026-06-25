self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  const isDevAsset =
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/__') ||
    url.pathname.endsWith('.map')
  if (isLocalhost || isDevAsset) {
    return
  }

  const isNavigation = request.mode === 'navigate' || (request.destination === '' && request.headers.get('accept')?.includes('text/html'))
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open('mk-pages').then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached
      }

      return fetch(request).then((response) => {
        const copy = response.clone()
        caches.open('mk-assets').then((cache) => cache.put(request, copy))
        return response
      })
    }),
  )
})
