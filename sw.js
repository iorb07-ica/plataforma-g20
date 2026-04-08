const CACHE = 'g20-v4';

// Apenas assets estáticos que raramente mudam
const STATIC = [
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'G20_Masterclass_-_logo_dashboard.png',
];

// Páginas HTML — sempre busca da rede primeiro
const PAGES = [
  'dashboard.html',
  'login.html',
  'carteira.html',
  'gestao-patrimonial.html',
  'g20flix.html',
  'g20cast.html',
  'sala-de-aula.html',
  'aguardando.html',
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
      url.includes('vercel.app') || url.includes('bcb.gov.br') ||
      url.includes('fonts.googleapis') || url.includes('gstatic.com')) return;

  // HTMLs — network-first: sempre tenta rede, só usa cache se offline
  var isHTML = PAGES.some(function(p) { return url.endsWith(p) || url.includes(p + '?'); });
  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        // Offline: usa cache como fallback
        return caches.match(e.request);
      })
    );
    return;
  }

  // Assets estáticos — cache-first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      });
    })
  );
});
