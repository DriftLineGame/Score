/* SCODE-Score offline shell.
   Serves the app from the device cache first, so a dead signal mid-round
   can never stop the page from loading. Fresh copies are fetched quietly
   in the background and used on the next launch.
   Bump CACHE below when you publish changes. */
const CACHE = 'scode-score-v1';

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then(function (cached) {
      const network = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return cached || caches.match('index.html');
      });
      // cached copy wins instantly; network refreshes it for next time
      return cached || network;
    })
  );
});
