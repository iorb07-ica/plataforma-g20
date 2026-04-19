const CACHE = 'g20-v8';

// Apenas assets estÃ¡ticos que raramente mudam
const STATIC = [
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'G20_Masterclass_-_logo_dashboard.png',
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(STATIC).catch(function(){});
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

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;

  var url = e.request.url;

  // Nunca intercepta APIs externas
  if (url.includes('firebaseapp') || url.includes('googleapis') ||
      url.includes('firestore') || url.includes('anchor.fm') ||
      url.includes('brapi.dev') || url.includes('twelvedata') ||
      url.includes('bcb.gov.br') || url.includes('fonts.googleapis') ||
      url.includes('gstatic.com') || url.includes('vercel.app') ||
      url.includes('awesomeapi.com.br') || url.includes('yahoo') ||
      url.includes('cdnjs.cloudflare.com')) return;

  // HTMLs â€” NUNCA usa cache, sempre busca da rede
  if (url.endsWith('.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Assets â€” network-first (busca rede, cache sÃ³ como fallback offline)
  e.respondWith(
    fetch(e.request).then(function(response) {
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
      }
      return response;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
