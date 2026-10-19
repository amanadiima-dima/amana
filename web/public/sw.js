// Minimal service worker: makes the app installable. It deliberately caches nothing,
// so a new deployment is always picked up immediately (no stale-app problems during the beta).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
