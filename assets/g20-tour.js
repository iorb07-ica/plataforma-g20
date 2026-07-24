/* ═══════════════════════════════════════════════════════════════════════════
   G20 TOUR — motor de tour guiado da Plataforma G20
   v1.0 — sessão 50.0 (24/07/2026)

   O QUE É
   Overlay com recorte (spotlight) sobre o elemento + balão Dark Luxury
   explicando o que aquilo faz. Vanilla JS puro, sem lib externa, sem custo.

   COMO USAR NUMA PÁGINA
   1) <script src="assets/g20-tour.js?v=1"></script>  (antes do </body>)
   2) G20Tour.auto({
        id: 'dashboard',        // chave de persistência (uma por página)
        versao: 1,              // suba o número pra forçar todo mundo a ver de novo
        steps: [ {el:'#idDoElemento', titulo:'...', texto:'...'}, ... ]
      });

   OPÇÕES DE CADA PASSO
   el          seletor CSS do alvo. Omita (ou null) para um passo centralizado.
   titulo      título do balão
   texto       corpo do balão (aceita HTML simples)
   pos         'bottom' | 'top' | 'left' | 'right' | 'auto' (padrão 'auto')
   pad         folga do recorte em px (padrão 8)
   raio        border-radius do recorte em px (padrão 14)
   skipMobile  true = não mostra em telas <= 768px
   mobileOnly  true = só mostra em telas <= 768px

   API PÚBLICA
   G20Tour.auto(cfg)     agenda o tour do primeiro acesso (respeita "já viu")
   G20Tour.start(cfg)    força o tour agora, ignorando o "já viu"
   G20Tour.reset(id)     limpa a marcação local + Firestore (pra testar)
   G20Tour.ativo()       true se o tour está aberto

   PERSISTÊNCIA
   localStorage: g20_tour_{id}  -> número da versão vista
   Firestore:    users/{uid}/dados/tour  -> { dashboard: 1, ... }
   O Firestore garante que o aluno não veja de novo ao trocar de dispositivo.
   O localStorage evita uma leitura de rede em toda abertura.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';
  if (window.G20Tour) return;

  var CSS_ID = 'g20-tour-css';
  var MOBILE = function () { return window.innerWidth <= 768; };

  /* ───────────────────────── ESTADO ───────────────────────── */
  var S = {
    aberto: false,
    steps: [],
    idx: 0,
    cfg: null,
    els: null,          // { blocker, hole, tip, ... }
    alvo: null,
    onKey: null,
    onMove: null
  };

  /* ───────────────────────── CSS ───────────────────────── */
  function injetarCSS() {
    if (document.getElementById(CSS_ID)) return;
    var st = document.createElement('style');
    st.id = CSS_ID;
    st.textContent = [
      '.g20t-blocker{position:fixed;inset:0;z-index:99990;background:transparent;cursor:default}',
      '.g20t-hole{position:fixed;top:0;left:0;width:0;height:0;border-radius:14px;z-index:99991;pointer-events:none;',
      'box-shadow:0 0 0 9999px rgba(6,8,12,.82),0 0 0 2px rgba(232,184,75,.85),0 0 34px rgba(232,184,75,.22);',
      'transition:top .34s cubic-bezier(.4,0,.2,1),left .34s cubic-bezier(.4,0,.2,1),width .34s cubic-bezier(.4,0,.2,1),height .34s cubic-bezier(.4,0,.2,1),border-radius .2s}',
      '.g20t-hole.is-empty{box-shadow:0 0 0 9999px rgba(6,8,12,.86)}',
      'body.light .g20t-hole{box-shadow:0 0 0 9999px rgba(10,16,30,.62),0 0 0 2px rgba(200,148,58,.9),0 0 34px rgba(232,184,75,.25)}',
      'body.light .g20t-hole.is-empty{box-shadow:0 0 0 9999px rgba(10,16,30,.7)}',

      '.g20t-tip{position:fixed;z-index:99992;width:360px;max-width:calc(100vw - 28px);',
      'background:var(--surface,#171b23);border:1px solid rgba(232,184,75,.30);border-radius:16px;',
      'box-shadow:0 28px 70px rgba(0,0,0,.62),0 2px 0 rgba(255,255,255,.04) inset;',
      'padding:0;overflow:hidden;opacity:0;transform:translateY(8px);',
      'transition:opacity .22s ease,transform .22s ease;font-family:"DM Sans",sans-serif}',
      '.g20t-tip.is-in{opacity:1;transform:translateY(0)}',
      'body.light .g20t-tip{background:#fbfcfd;border-color:rgba(200,148,58,.38);box-shadow:0 24px 60px rgba(20,40,80,.22)}',

      '.g20t-bar{height:3px;background:rgba(255,255,255,.07)}',
      '.g20t-bar i{display:block;height:100%;background:linear-gradient(90deg,#c8943a,#e8b84b);transition:width .3s ease}',
      '.g20t-body{padding:18px 20px 6px}',
      '.g20t-count{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#c9a961;margin-bottom:8px}',
      '.g20t-titulo{font-family:"Bebas Neue","DM Sans",sans-serif;font-size:24px;letter-spacing:.8px;line-height:1.05;color:var(--text,#eef0f4);margin-bottom:8px}',
      '.g20t-texto{font-size:13.5px;line-height:1.58;color:var(--text2,#9aa5b8)}',
      '.g20t-texto b,.g20t-texto strong{color:var(--text,#eef0f4);font-weight:600}',

      '.g20t-foot{display:flex;align-items:center;gap:8px;padding:14px 20px 18px}',
      '.g20t-btn{font-family:"DM Sans",sans-serif;font-size:13px;font-weight:600;border-radius:9px;padding:9px 16px;',
      'cursor:pointer;border:1px solid transparent;transition:.18s;line-height:1}',
      '.g20t-skip{background:none;color:var(--text3,#7a8599);padding-left:0;margin-right:auto}',
      '.g20t-skip:hover{color:var(--text2,#9aa5b8)}',
      '.g20t-back{background:none;border-color:rgba(255,255,255,.12);color:var(--text2,#9aa5b8)}',
      '.g20t-back:hover{border-color:rgba(232,184,75,.45);color:var(--text,#eef0f4)}',
      'body.light .g20t-back{border-color:rgba(20,40,80,.16)}',
      '.g20t-next{background:linear-gradient(135deg,#e8b84b,#c8943a);color:#0b0d14;box-shadow:0 6px 18px rgba(232,184,75,.22)}',
      '.g20t-next:hover{filter:brightness(1.06);box-shadow:0 8px 22px rgba(232,184,75,.32)}',

      '.g20t-arrow{position:fixed;z-index:99992;width:12px;height:12px;background:var(--surface,#171b23);',
      'border-left:1px solid rgba(232,184,75,.30);border-top:1px solid rgba(232,184,75,.30);opacity:0;transition:opacity .22s ease}',
      '.g20t-arrow.is-in{opacity:1}',
      'body.light .g20t-arrow{background:#fbfcfd;border-color:rgba(200,148,58,.38)}',

      /* Mobile: o balão vira bottom sheet e a seta some */
      '@media(max-width:768px){',
      '.g20t-tip{left:10px!important;right:10px!important;width:auto!important;max-width:none;',
      'top:auto!important;bottom:calc(14px + env(safe-area-inset-bottom,0px))!important;border-radius:18px}',
      '.g20t-tip.is-sheet-top{top:14px!important;bottom:auto!important}',
      '.g20t-arrow{display:none!important}',
      '.g20t-titulo{font-size:22px}',
      '}',

      /* Botão "rever tour" na topbar */
      '.g20t-help{display:inline-flex;align-items:center;justify-content:center}',
      '@media(prefers-reduced-motion:reduce){.g20t-hole,.g20t-tip,.g20t-arrow{transition:none!important}}'
    ].join('');
    document.head.appendChild(st);
  }

  /* ───────────────────────── UTILS ───────────────────────── */
  function q(sel) { try { return document.querySelector(sel); } catch (e) { return null; } }

  function visivel(el) {
    if (!el) return false;
    var cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    // Fora da tela na horizontal (ex.: sidebar recolhida no mobile)
    if (r.right <= 0 || r.left >= window.innerWidth) return false;
    return true;
  }

  function passoValido(p) {
    if (p.mobileOnly && !MOBILE()) return false;
    if (p.skipMobile && MOBILE()) return false;
    if (!p.el) return true;                 // passo centralizado
    return visivel(q(p.el));
  }

  function uidAtual() {
    try {
      if (window.firebase && firebase.auth && firebase.auth().currentUser) return firebase.auth().currentUser.uid;
    } catch (e) {}
    try { return localStorage.getItem('g20_uid') || null; } catch (e) { return null; }
  }

  function lerLocal(id) {
    try { return parseInt(localStorage.getItem('g20_tour_' + id) || '0', 10) || 0; } catch (e) { return 0; }
  }
  function gravarLocal(id, v) {
    try { localStorage.setItem('g20_tour_' + id, String(v)); } catch (e) {}
  }

  function refTour() {
    var uid = uidAtual();
    if (!uid || !window.firebase || !firebase.firestore) return null;
    try { return firebase.firestore().collection('users').doc(uid).collection('dados').doc('tour'); }
    catch (e) { return null; }
  }

  function lerRemoto(id) {
    return new Promise(function (res) {
      var ref = refTour();
      if (!ref) return res(0);
      ref.get()
        .then(function (d) { res((d.exists && parseInt(d.data()[id] || 0, 10)) || 0); })
        .catch(function () { res(0); });
    });
  }

  function gravarRemoto(id, v) {
    var ref = refTour();
    if (!ref) return;
    var patch = {}; patch[id] = v;
    patch.atualizadoEm = new Date().toISOString();
    ref.set(patch, { merge: true }).catch(function () {});
  }

  /* ───────────────────────── DOM DO TOUR ───────────────────────── */
  function montarDOM() {
    var blocker = document.createElement('div');
    blocker.className = 'g20t-blocker';
    blocker.setAttribute('aria-hidden', 'true');

    var hole = document.createElement('div');
    hole.className = 'g20t-hole is-empty';

    var arrow = document.createElement('div');
    arrow.className = 'g20t-arrow';

    var tip = document.createElement('div');
    tip.className = 'g20t-tip';
    tip.setAttribute('role', 'dialog');
    tip.setAttribute('aria-live', 'polite');
    tip.innerHTML =
      '<div class="g20t-bar"><i style="width:0%"></i></div>' +
      '<div class="g20t-body">' +
        '<div class="g20t-count"></div>' +
        '<div class="g20t-titulo"></div>' +
        '<div class="g20t-texto"></div>' +
      '</div>' +
      '<div class="g20t-foot">' +
        '<button type="button" class="g20t-btn g20t-skip">Pular tour</button>' +
        '<button type="button" class="g20t-btn g20t-back">Voltar</button>' +
        '<button type="button" class="g20t-btn g20t-next">Próximo</button>' +
      '</div>';

    document.body.appendChild(blocker);
    document.body.appendChild(hole);
    document.body.appendChild(arrow);
    document.body.appendChild(tip);

    var els = {
      blocker: blocker, hole: hole, arrow: arrow, tip: tip,
      bar: tip.querySelector('.g20t-bar i'),
      count: tip.querySelector('.g20t-count'),
      titulo: tip.querySelector('.g20t-titulo'),
      texto: tip.querySelector('.g20t-texto'),
      skip: tip.querySelector('.g20t-skip'),
      back: tip.querySelector('.g20t-back'),
      next: tip.querySelector('.g20t-next')
    };

    els.skip.addEventListener('click', function () { encerrar(true); });
    els.back.addEventListener('click', function () { ir(S.idx - 1); });
    els.next.addEventListener('click', function () {
      if (S.idx >= S.steps.length - 1) encerrar(true); else ir(S.idx + 1);
    });
    blocker.addEventListener('click', function (e) { e.stopPropagation(); });

    return els;
  }

  /* ───────────────────────── POSICIONAMENTO ───────────────────────── */
  function posicionar() {
    if (!S.aberto || !S.els) return;
    var p = S.steps[S.idx] || {};
    var e = S.els;
    var vw = window.innerWidth, vh = window.innerHeight;

    // 1) recorte
    if (!S.alvo) {
      e.hole.classList.add('is-empty');
      e.hole.style.top = (vh / 2) + 'px';
      e.hole.style.left = (vw / 2) + 'px';
      e.hole.style.width = '0px';
      e.hole.style.height = '0px';
    } else {
      var pad = (typeof p.pad === 'number') ? p.pad : 8;
      var r = S.alvo.getBoundingClientRect();
      e.hole.classList.remove('is-empty');
      e.hole.style.top = (r.top - pad) + 'px';
      e.hole.style.left = (r.left - pad) + 'px';
      e.hole.style.width = (r.width + pad * 2) + 'px';
      e.hole.style.height = (r.height + pad * 2) + 'px';
      e.hole.style.borderRadius = ((typeof p.raio === 'number') ? p.raio : 14) + 'px';
    }

    // 2) balão — no mobile vira bottom sheet (CSS cuida das laterais)
    if (MOBILE()) {
      e.arrow.classList.remove('is-in');
      // Se o alvo está na metade de baixo, o sheet sobe pro topo pra não cobrir
      var sobeParaTopo = false;
      if (S.alvo) {
        var rm = S.alvo.getBoundingClientRect();
        sobeParaTopo = (rm.top + rm.height / 2) > vh * 0.55;
      }
      e.tip.classList.toggle('is-sheet-top', sobeParaTopo);
      return;
    }
    e.tip.classList.remove('is-sheet-top');

    var tw = e.tip.offsetWidth, th = e.tip.offsetHeight;
    var m = 16, borda = 14;

    if (!S.alvo) {
      e.tip.style.left = Math.round((vw - tw) / 2) + 'px';
      e.tip.style.top = Math.round((vh - th) / 2) + 'px';
      e.arrow.classList.remove('is-in');
      return;
    }

    var rect = S.alvo.getBoundingClientRect();
    var pos = p.pos || 'auto';
    if (pos === 'auto') {
      if (rect.bottom + th + m + borda < vh) pos = 'bottom';
      else if (rect.top - th - m - borda > 0) pos = 'top';
      else if (rect.right + tw + m + borda < vw) pos = 'right';
      else if (rect.left - tw - m - borda > 0) pos = 'left';
      else pos = 'bottom';
    }

    var L, T;
    if (pos === 'bottom') { L = rect.left + rect.width / 2 - tw / 2; T = rect.bottom + m; }
    else if (pos === 'top') { L = rect.left + rect.width / 2 - tw / 2; T = rect.top - th - m; }
    else if (pos === 'right') { L = rect.right + m; T = rect.top + rect.height / 2 - th / 2; }
    else { L = rect.left - tw - m; T = rect.top + rect.height / 2 - th / 2; }

    L = Math.max(borda, Math.min(L, vw - tw - borda));
    T = Math.max(borda, Math.min(T, vh - th - borda));
    e.tip.style.left = Math.round(L) + 'px';
    e.tip.style.top = Math.round(T) + 'px';

    // 3) seta
    var ax, ay, rot;
    var cx = Math.max(L + 18, Math.min(rect.left + rect.width / 2, L + tw - 18));
    var cy = Math.max(T + 18, Math.min(rect.top + rect.height / 2, T + th - 18));
    if (pos === 'bottom') { ax = cx - 6; ay = T - 6; rot = 45; }
    else if (pos === 'top') { ax = cx - 6; ay = T + th - 6; rot = 225; }
    else if (pos === 'right') { ax = L - 6; ay = cy - 6; rot = -45; }
    else { ax = L + tw - 6; ay = cy - 6; rot = 135; }
    e.arrow.style.left = Math.round(ax) + 'px';
    e.arrow.style.top = Math.round(ay) + 'px';
    e.arrow.style.transform = 'rotate(' + rot + 'deg)';
    e.arrow.classList.add('is-in');
  }

  /* Espera o scroll estabilizar antes de desenhar (evita balão fora do lugar) */
  function aguardarScroll(el, cb) {
    if (!el) return cb();
    var ultimo = null, estaveis = 0, tentativas = 0;
    (function checa() {
      var y = Math.round(el.getBoundingClientRect().top);
      if (y === ultimo) estaveis++; else estaveis = 0;
      ultimo = y;
      tentativas++;
      if (estaveis >= 3 || tentativas > 40) return cb();
      requestAnimationFrame(checa);
    })();
  }

  /* ───────────────────────── NAVEGAÇÃO ───────────────────────── */
  function ir(i) {
    if (!S.aberto) return;
    if (i < 0) i = 0;
    if (i >= S.steps.length) return encerrar(true);
    S.idx = i;

    var p = S.steps[i], e = S.els;
    S.alvo = p.el ? q(p.el) : null;

    e.tip.classList.remove('is-in');
    e.arrow.classList.remove('is-in');

    e.count.textContent = 'Passo ' + (i + 1) + ' de ' + S.steps.length;
    e.titulo.textContent = p.titulo || '';
    e.texto.innerHTML = p.texto || '';
    e.bar.style.width = Math.round(((i + 1) / S.steps.length) * 100) + '%';
    e.back.style.display = (i === 0) ? 'none' : '';
    e.next.textContent = (i === S.steps.length - 1) ? 'Começar' : 'Próximo';
    e.skip.style.display = (i === S.steps.length - 1) ? 'none' : '';

    if (S.alvo) {
      try { S.alvo.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch (err) { }
    }

    aguardarScroll(S.alvo, function () {
      posicionar();
      requestAnimationFrame(function () {
        posicionar();                       // 2ª passada: já com a altura real do balão
        e.tip.classList.add('is-in');
        try { e.next.focus({ preventScroll: true }); } catch (err) { }
      });
    });
  }

  function encerrar(concluido) {
    if (!S.aberto) return;
    S.aberto = false;

    if (S.onKey) document.removeEventListener('keydown', S.onKey, true);
    if (S.onMove) {
      window.removeEventListener('resize', S.onMove);
      window.removeEventListener('scroll', S.onMove, true);
    }

    var e = S.els;
    if (e) {
      e.tip.classList.remove('is-in');
      e.arrow.classList.remove('is-in');
      setTimeout(function () {
        [e.blocker, e.hole, e.arrow, e.tip].forEach(function (n) {
          if (n && n.parentNode) n.parentNode.removeChild(n);
        });
      }, 240);
    }
    S.els = null; S.alvo = null;

    if (concluido && S.cfg && S.cfg.id) {
      var v = S.cfg.versao || 1;
      gravarLocal(S.cfg.id, v);
      gravarRemoto(S.cfg.id, v);
    }
    if (S.cfg && typeof S.cfg.aoFechar === 'function') {
      try { S.cfg.aoFechar(); } catch (err) { }
    }
  }

  /* ───────────────────────── START ───────────────────────── */
  function start(cfg) {
    if (S.aberto) return;
    if (!cfg || !cfg.steps || !cfg.steps.length) return;

    injetarCSS();

    var steps = cfg.steps.filter(passoValido);
    if (!steps.length) {
      console.warn('[G20Tour] nenhum passo visível — tour cancelado');
      return;
    }

    S.cfg = cfg;
    S.steps = steps;
    S.idx = 0;
    S.aberto = true;
    S.els = montarDOM();

    S.onKey = function (ev) {
      if (!S.aberto) return;
      if (ev.key === 'Escape') { ev.preventDefault(); encerrar(true); }
      else if (ev.key === 'ArrowRight' || ev.key === 'Enter') { ev.preventDefault(); if (S.idx >= S.steps.length - 1) encerrar(true); else ir(S.idx + 1); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); ir(S.idx - 1); }
    };
    document.addEventListener('keydown', S.onKey, true);

    var raf = null;
    S.onMove = function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = null; posicionar(); });
    };
    window.addEventListener('resize', S.onMove);
    window.addEventListener('scroll', S.onMove, true);

    console.log('[G20Tour] iniciado — ' + steps.length + ' passos (id: ' + (cfg.id || '—') + ')');
    ir(0);
  }

  /* ───────────────────────── AUTO (primeiro acesso) ───────────────────────── */
  /* Espera o splash sumir + o dashboard renderizar antes de disparar. */
  function esperarPronto(cb, extraMs) {
    var lim = Date.now() + 15000;
    (function checa() {
      var ov = document.getElementById('g20LoadingOverlay');
      var fechado = !ov || ov.style.display === 'none' || ov.classList.contains('is-hiding');
      if (fechado || Date.now() > lim) {
        setTimeout(cb, typeof extraMs === 'number' ? extraMs : 900);
        return;
      }
      setTimeout(checa, 200);
    })();
  }

  function auto(cfg) {
    if (!cfg || !cfg.id) return;
    var v = cfg.versao || 1;

    // 1) Caminho rápido: já viu nesta máquina, nem toca a rede.
    if (lerLocal(cfg.id) >= v) return;

    // 2) Trava opcional (ex.: só aluno aprovado)
    if (typeof cfg.guard === 'function') {
      try { if (!cfg.guard()) return; } catch (e) { return; }
    }

    // 3) Confere no Firestore — cobre troca de dispositivo/navegador.
    lerRemoto(cfg.id).then(function (remoto) {
      if (remoto >= v) { gravarLocal(cfg.id, remoto); return; }
      esperarPronto(function () { start(cfg); }, cfg.atraso);
    });
  }

  function reset(id) {
    try { localStorage.removeItem('g20_tour_' + id); } catch (e) {}
    var ref = refTour();
    if (ref) {
      var patch = {}; patch[id] = 0;
      ref.set(patch, { merge: true }).catch(function () {});
    }
    console.log('[G20Tour] reset de "' + id + '" feito. Recarregue a página.');
  }

  window.G20Tour = {
    auto: auto,
    start: start,
    reset: reset,
    ativo: function () { return S.aberto; },
    versao: '1.0'
  };
})();
