const CACHE = 'g20-v15';
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
    // 1) Apaga TODOS os caches antigos (inclusive de SWs muito velhos presos no device)
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
    // 2) Assume o controle imediato de todas as abas
    .then(function() { return self.clients.claim(); })
    // 3) Recarrega cada aba aberta para sair de qualquer HTML velho servido pelo SW anterior
    .then(function() { return self.clients.matchAll({ type: 'window' }); })
    .then(function(clients) {
      clients.forEach(function(c) {
        try { c.navigate(c.url); } catch (err) {}
      });
    })
  );
});
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  if (url.includes('firebaseapp') || url.includes('googleapis') ||
      url.includes('firestore') || url.includes('anchor.fm') ||
      url.includes('brapi.dev') || url.includes('twelvedata') ||
      url.includes('bcb.gov.br') || url.includes('fonts.googleapis') ||
      url.includes('gstatic.com') || url.includes('vercel.app') ||
      url.includes('awesomeapi.com.br') || url.includes('yahoo') ||
      url.includes('cdnjs.cloudflare.com')) return;
  if (url.endsWith('.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
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
