// G20 Masterclass — Service Worker v1
// Responsável por: receber push notifications e exibir ao usuário

var G20_SW_VERSION = '1.0.0';
var G20_ICON  = '/plataforma-g20/icon-192.png';
var G20_BADGE = '/plataforma-g20/apple-touch-icon.png';
var G20_BASE_URL = 'https://iorb07-ica.github.io/plataforma-g20/';

// ─── Instalação e ativação ───────────────────────────────────────────────────

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});

// ─── Receber push e exibir notificação ──────────────────────────────────────

self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) {}

  var title   = data.title  || 'G20 Masterclass';
  var body    = data.body   || 'Você tem uma nova notificação.';
  var icon    = data.icon   || G20_ICON;
  var badge   = data.badge  || G20_BADGE;
  var url     = data.url    || G20_BASE_URL + 'dashboard.html';
  var tag     = data.tag    || 'g20-notif-' + Date.now();

  var options = {
    body:              body,
    icon:              icon,
    badge:             badge,
    tag:               tag,
    renotify:          false,
    requireInteraction: false,
    vibrate:           [200, 100, 200],
    data:              { url: url },
    actions: [
      { action: 'open',    title: 'Ver agora' },
      { action: 'dismiss', title: 'Fechar'    }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─── Clique na notificação ───────────────────────────────────────────────────

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  var targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : G20_BASE_URL + 'dashboard.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Se já tem uma aba aberta da plataforma, foca nela
      for (var i = 0; i < clientList.length; i++) {
        var c = clientList[i];
        if (c.url.indexOf('iorb07-ica.github.io/plataforma-g20') !== -1 && 'focus' in c) {
          c.navigate(targetUrl);
          return c.focus();
        }
      }
      // Senão abre uma aba nova
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ─── Push subscription change (browser renovou a subscription) ──────────────

self.addEventListener('pushsubscriptionchange', function(event) {
  // O frontend vai re-registrar automaticamente no próximo carregamento
  event.waitUntil(Promise.resolve());
});
