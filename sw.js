const CACHE = 'g20-v45';

// v45 — NETWORK-FIRST nas PÁGINAS (resolve o cache que servia versão antiga)
//
// Problema que resolve: no iPhone (e em geral), o cache do navegador/PWA
// segurava versões antigas das páginas .html. Um aluno podia ficar dias vendo
// uma tela desatualizada. Agora, sempre que houver internet, a página vem do
// servidor (versão nova). O cache só entra como rede de seguranca offline.
//
// Cuidado herdado do histórico: um SW anterior travava Game/Atlas ao interceptar
// tudo. Por isso aqui o fetch handler é ESTREITO e SEGURO:
//   - Só intercepta NAVEGACAO de página (request.mode === 'navigate'), ou seja,
//     os .html que o usuario abre. NAO intercepta CSS, JS, imagens, fontes,
//     Firebase, proxy, nada disso — esses passam direto ao servidor como sempre.
//   - Usa a rede primeiro, com timeout curto (3,5s). Se a rede falhar OU demorar
//     mais que isso, cai para a última versao em cache (se houver), para a pagina
//     nunca ficar "pendurada" esperando.
//   - Guarda no cache só a última página navegada, como rede de seguranca.

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
  if (req.method !== 'GET' || req.mode !== 'navigate') {
    return;
  }
  e.respondWith(
    fetchComTimeout(req, 3500).then(function(resp) {
      try {
        var copia = resp.clone();
        caches.open(CACHE).then(function(c) { c.put(req, copia); });
      } catch (x) {}
      return resp;
    }).catch(function() {
      return caches.match(req).then(function(cacheado) {
        return cacheado || fetch(req);
      });
    })
  );
});
