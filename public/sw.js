/*
 * Service worker - two jobs:
 *   1. when a page can't be loaded because there is no internet, show
 *      /offline.html ("You're offline") instead of the browser's own error page;
 *   2. browser push notifications (Phase 1): show each push the server sends
 *      (backend services/push.service.js) and open its page when tapped.
 *
 * Deliberately NOT an app cache: it never stores or serves the app's code,
 * API answers or images, so it can't show an old version after a deploy.
 * Only page navigations are touched, and only when the network fails.
 * Registered by src/main.jsx in production builds, and by the
 * "Browser notifications" switch (components/push/usePush.js) when someone
 * turns push on.
 */
const CACHE = 'gf-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});

/* --- Browser push ---------------------------------------------------------
 * The server sends { title, body, url, tag }. No data is cached here.
 */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Growing Focus', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Growing Focus';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      tag: data.tag || undefined,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open) {
        open.focus();
        return open.navigate ? open.navigate(url) : undefined;
      }
      return self.clients.openWindow(url);
    })
  );
});
