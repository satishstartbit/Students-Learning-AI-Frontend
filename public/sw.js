/*
 * Service worker - one job only: when a page can't be loaded because there
 * is no internet, show /offline.html ("You're offline") instead of the
 * browser's own error page.
 *
 * Deliberately NOT an app cache: it never stores or serves the app's code,
 * API answers or images, so it can't show an old version after a deploy.
 * Only page navigations are touched, and only when the network fails.
 * Registered by src/main.jsx in production builds.
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
