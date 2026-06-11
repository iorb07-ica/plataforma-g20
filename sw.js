const CACHE = 'g20-v44';

// v44 — SW TRANSPARENTE (diagnostico/estabilidade)
// O fetch handler foi removido: o Service Worker NAO intercepta mais nenhuma
// requisicao. Todas as paginas e recursos vem direto do servidor, sem
// intermediario. Isso elimina qualquer possibilidade de o SW corromper ou
// travar a entrega das paginas (Game/Atlas travando no meio do carregamento).
// O PWA (manifest/instalacao) continua funcionando normalmente.

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    // Apaga TODOS os caches antigos do SW (g20-v42, v43, etc.)
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

// SEM listener de 'fetch' — navegacao 100% direta ao servidor.
