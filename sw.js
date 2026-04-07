// G20 Masterclass — Service Worker v1.0
const CACHE_NAME = 'g20-v1';

// Arquivos essenciais para funcionar offline (shell)
const SHELL = [
  '/plataforma-g20/',
  '/plataforma-g20/login.html',
  '/plataforma-g20/dashboard.html',
  '/plataforma-g20/carteira.html',
  '/plataforma-g20/gestao-patrimonial.html',
  '/plataforma-g20/g20flix.html',
  '/plataforma-g20/g20cast.html',
  '/plataforma-g20/sala-de-aula.html',
  '/plataforma-g20/manifest.json',
  '/plataforma-g20/icons/icon-192x192.png',
  '/plataforma-g20/icons/icon-512x512.png',
];

// ── Install: faz cache do shell ──────────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activate: limpa caches antigos ──────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch: Network first, cache fallback ────────────────────
self.addEventListener('fetch', function(e) {
  // Ignora requisições não-GET e APIs externas
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.hostname !== location.hostname) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Atualiza cache com versão mais recente
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Offline: serve do cache
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('/plataforma-g20/dashboard.html');
        });
      })
  );
});
