const CACHE = 'g20-v46';

// v46 — NETWORK-FIRST nas páginas + STALE-WHILE-REVALIDATE em CSS/JS
//
// Resolve o cache de vez, para TODOS os tipos de arquivo:
//   - PÁGINAS (.html / navegação): rede primeiro (timeout 3,5s). Sempre a versão
//     nova quando há internet; cai no cache só offline.
//   - CSS e JS (mesma origem): entrega o cache na hora (rápido, não trava) e
//     busca a versão nova em segundo plano, que passa a valer na PRÓXIMA abertura.
//     Isso é "stale-while-revalidate": nunca pendura esperando a rede, então NÃO
//     repete o travamento de Game/Atlas que um SW antigo causava.
//   - Todo o resto (imagens, fontes, Firebase, proxy, etc.): passa direto, sem
//     interceptar, comportamento normal do navegador.

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

function fetchComTimeout(request, ms) {
  return new Promise(function(resolve, reject) {
    var expirou = false;
    var t = setTimeout(function() { expirou = true; reject(new Error('timeout')); }, ms);
    fetch(request).then(function(resp) {
      if (expirou) return;
      clearTimeout(t);
      resolve(resp);
    }).catch(function(err) {
      if (expirou) return;
      clearTimeout(t);
      reject(err);
    });
  });
}

self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  // 1) PÁGINAS (navegação): rede primeiro, cache como rede de segurança.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetchComTimeout(req, 3500).then(function(resp) {
        try { var c = resp.clone(); caches.open(CACHE).then(function(x){ x.put(req, c); }); } catch (x) {}
        return resp;
      }).catch(function() {
        return caches.match(req).then(function(cacheado) { return cacheado || fetch(req); });
      })
    );
    return;
  }

  // 2) CSS e JS da MESMA origem: stale-while-revalidate.
  var url;
  try { url = new URL(req.url); } catch (x) { return; }
  var mesmaOrigem = url.origin === self.location.origin;
  var ehCssJs = /\.(css|js)(\?|$)/i.test(url.pathname);

  if (mesmaOrigem && ehCssJs) {
    e.respondWith(
      caches.open(CACHE).then(function(cache) {
        return cache.match(req).then(function(cacheado) {
          // busca a versão nova em segundo plano e guarda para a próxima vez
          var rede = fetch(req).then(function(resp) {
            try { cache.put(req, resp.clone()); } catch (x) {}
            return resp;
          }).catch(function() { return cacheado; });
          // entrega o que tem no cache já (rápido); se não tem, espera a rede
          return cacheado || rede;
        });
      })
    );
    return;
  }

  // 3) Todo o resto: passa direto, sem interceptar.
});
