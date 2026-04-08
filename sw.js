const CACHE = 'g20-v3';
const PAGES = [
  'dashboard.html',
  'login.html',
  'carteira.html',
  'gestao-patrimonial.html',
  'g20flix.html',
  'g20cast.html',
  'sala-de-aula.html',
  'aguardando.html',
  'manifest.json',
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(PAGES);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// Stale-while-revalidate: serve cache imediatamente, atualiza em background
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  if (url.includes('firebaseapp') || url.includes('googleapis') ||
      url.includes('firestore') || url.includes('anchor.fm') ||
      url.includes('brapi.dev') || url.includes('twelvedata') ||
      url.includes('vercel.app')) return;

  e.respondWith(
    caches.open(CACHE).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        var fetchPromise = fetch(e.request).then(function(response) {
          if (response && response.status === 200) {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(function() { return cached; });
        return cached || fetchPromise;
      });
    })
  );
});
