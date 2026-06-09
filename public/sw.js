const CACHE = 'saidadivida-v2';
const PRECACHE = ['/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  if (request.url.includes('supabase.co')) return;
  if (request.url.includes('googleapis.com')) return;

  // HTML navigation → network-first so updates always chegam
  if (request.mode === 'navigate' || request.destination === 'document') {
    e.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          caches.open(CACHE).then(c => c.put(request, response.clone()));
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Assets com hash (JS/CSS) → cache-first
  e.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok && response.type === 'basic') {
          caches.open(CACHE).then(c => c.put(request, response.clone()));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

// ── Push notification recebida ─────────────────
self.addEventListener('push', e => {
  let data = { title: '⚡ SaiDaDívida', body: 'Você tem contas a vencer!', url: '/' };
  try { if (e.data) data = { ...data, ...e.data.json() }; } catch { /* ignore */ }

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200],
      data: { url: data.url },
      actions: [
        { action: 'open',    title: '📋 Ver contas' },
        { action: 'dismiss', title: 'Dispensar' },
      ],
    })
  );
});

// ── Clique na notificação ──────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;

  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
