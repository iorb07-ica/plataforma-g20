/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTH GUARD — G20 Masterclass
 * ═══════════════════════════════════════════════════════════════════════════
 * Protege as páginas da plataforma:
 *   - Esconde a página desde o primeiro instante (nada aparece antes da checagem).
 *   - Sem login → login.html
 *   - Logado, mas ainda não aprovado → aguardando.html
 *   - Página de admin (data-admin="1") sem ser admin → dashboard.html
 *
 * Como usar (no <head> da página):
 *   <script src="auth-guard.js"></script>                           → aluno aprovado
 *   <script src="auth-guard.js" data-admin="1"></script>            → só admin
 *   <script src="auth-guard.js" data-sem-aprovacao="1"></script>    → só login (tela de espera)
 *
 * A checagem de aprovação lê o cadastro do aluno UMA vez por sessão
 * (fica guardada no sessionStorage), para não gastar leituras do Firestore
 * a cada troca de página.
 * Os dados continuam protegidos pelas Firestore Rules; o guard garante
 * que ninguém sem acesso veja nem a estrutura das páginas.
 */
(function () {
  'use strict';
  if (window.__g20Guard) return;
  window.__g20Guard = true;

  var tag = document.currentScript;
  var SO_ADMIN = !!(tag && tag.getAttribute('data-admin') === '1');
  var SEM_APROVACAO = !!(tag && tag.getAttribute('data-sem-aprovacao') === '1');

  // ── Esconde a página já (antes do corpo existir) e mostra um carregando ──
  var html = document.documentElement;
  html.classList.add('g20-guard');
  var st = document.createElement('style');
  st.id = 'g20-guard-css';
  st.textContent =
    'html.g20-guard body{visibility:hidden!important}' +
    'html.g20-guard::before{content:"";position:fixed;inset:0;background:#1a191e;z-index:2147483600}' +
    'html.g20-guard::after{content:"";position:fixed;top:50%;left:50%;width:38px;height:38px;margin:-19px 0 0 -19px;' +
    'border:3px solid rgba(201,169,97,.2);border-top-color:#c9a961;border-radius:50%;' +
    'animation:g20guardspin .8s linear infinite;z-index:2147483601}' +
    '@keyframes g20guardspin{to{transform:rotate(360deg)}}';
  (document.head || html).appendChild(st);

  function liberar() {
    html.classList.remove('g20-guard');
  }
  function ir(pagina) {
    try { location.replace(pagina); } catch (e) { location.href = pagina; }
  }

  // ── Checagem de aprovação / admin (1 leitura por sessão) ──
  function verificarAcesso(user) {
    if (SEM_APROVACAO) return Promise.resolve(true);

    var chave = 'g20_guard_' + user.uid;
    try {
      var memo = sessionStorage.getItem(chave);
      if (memo === 'admin') return Promise.resolve(true);
      if (memo === 'ok' && !SO_ADMIN) return Promise.resolve(true);
    } catch (e) {}

    if (!firebase.firestore) return Promise.resolve(!SO_ADMIN); // página sem Firestore: só login

    return firebase.firestore().collection('users').doc(user.uid).get().then(function (doc) {
      var d = doc.exists ? doc.data() : {};
      var admin = d.role === 'admin';
      if (SO_ADMIN && !admin) { ir('dashboard.html'); return false; }
      if (!admin && d.aprovado !== true) { ir('aguardando.html'); return false; }
      try { sessionStorage.setItem(chave, admin ? 'admin' : 'ok'); } catch (e) {}
      return true;
    }).catch(function (e) {
      // Falha de rede: não tranca o aluno para fora (os dados seguem protegidos pelas Rules).
      console.warn('[Auth Guard] não foi possível verificar o cadastro:', e && e.message);
      return !SO_ADMIN;
    });
  }

  // ── Espera o Firebase da página ficar pronto ──
  var tentativas = 0;
  function iniciar() {
    tentativas++;
    var pronto = typeof firebase !== 'undefined' && firebase.auth && firebase.apps && firebase.apps.length;
    if (!pronto) {
      if (tentativas < 150) return setTimeout(iniciar, 100); // até 15 s
      console.warn('[Auth Guard] Firebase não respondeu');
      return ir('login.html');
    }
    var resolvido = false;
    firebase.auth().onAuthStateChanged(function (user) {
      if (!user) { ir('login.html'); return; }
      if (resolvido) return;
      resolvido = true;
      verificarAcesso(user).then(function (ok) { if (ok) liberar(); });
    });
  }

  iniciar();
})();
