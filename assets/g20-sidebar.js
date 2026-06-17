/* G20 — Sidebar colapsável compartilhada */
(function(){
  'use strict';

  var COLLAPSED_KEY = 'g20_sidebar_collapsed';
  var isDesktop = window.innerWidth > 768;

  // ═══════════════ PRIVACIDADE — PC COMPARTILHADO ═══════════════
  // Chaves financeiras/pessoais que NUNCA podem sobrar para o próximo usuário.
  var G20_PRIVATE_KEYS = ['aportes','dividendos','rvAportes','rvDividendos','rendaFixa','splits',
    'patrimonioBens','patrimonioSnaps','carteiraMeta','metaIF','metaIF_anual','lastRVTotal',
    'cotacoesCache','splits_cache','bonificacoes_cache',
    'tokenBrapi','tokenFmp','tokenLogoDev','tokenTwelve',
    'prov_last_import','prov_last_status','prov_last_start',
    'rv_prov_last_import','rv_prov_last_status','rv_prov_last_start'];
  function g20WipeFinance(){
    try{
      G20_PRIVATE_KEYS.forEach(function(k){ try{ localStorage.removeItem('g20_'+k); }catch(e){} });
      // backups dinâmicos (g20_backup_*)
      for(var i = localStorage.length - 1; i >= 0; i--){
        var key = localStorage.key(i);
        if(key && key.indexOf('g20_backup') === 0){ try{ localStorage.removeItem(key); }catch(e){} }
      }
    }catch(e){}
  }
  window._g20WipeFinance = g20WipeFinance;

  // Guarda de TROCA DE USUÁRIO (vale em TODAS as páginas — a sidebar carrega em todas):
  // se logar alguém diferente do dono do cache, apaga os dados do anterior antes de
  // qualquer tela exibir resíduo. Firebase carrega depois da sidebar, então aguardamos.
  (function(){
    function attach(){
      try{
        if(typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length || !firebase.auth) return false;
        firebase.auth().onAuthStateChanged(function(user){
          if(!user) return;
          try{
            var owner = localStorage.getItem('g20_dados_owner');
            if(owner && owner !== user.uid){ g20WipeFinance(); }
            localStorage.setItem('g20_dados_owner', user.uid);
          }catch(e){}
        });
        return true;
      }catch(e){ return false; }
    }
    if(!attach()){
      var n = 0, t = setInterval(function(){ if(attach() || ++n > 60) clearInterval(t); }, 50);
    }
  })();

  // ═══════════════ LOGOUT AUTOMÁTICO POR INATIVIDADE (30 min) ═══════════════
  // Protege quem esquece a aba aberta em PC compartilhado. A "última atividade"
  // é compartilhada entre abas (localStorage), então estar ativo em uma aba
  // mantém todas logadas — só desconecta após 30 min SEM atividade em nenhuma.
  (function(){
    var IDLE_MS = 30 * 60 * 1000;          // 30 minutos
    var ACT_KEY = 'g20_last_activity';
    var lastMark = 0;

    function autoLogout(){
      try{
        g20WipeFinance();
        ['dados_owner','uid','user_profile'].forEach(function(k){ try{ localStorage.removeItem('g20_'+k); }catch(e){} });
      }catch(e){}
      try{ localStorage.removeItem(ACT_KEY); }catch(e){}
      var dest = 'login.html?timeout=1';
      try{
        if(typeof firebase !== 'undefined' && firebase.auth){
          firebase.auth().signOut().then(function(){ location.href = dest; }).catch(function(){ location.href = dest; });
          return;
        }
      }catch(e){}
      location.href = dest;
    }

    function markActivity(){ try{ localStorage.setItem(ACT_KEY, String(Date.now())); }catch(e){} }
    function onActivity(){
      var now = Date.now();
      if(now - lastMark < 5000) return;     // throttle: no máximo 1 marca/5s
      lastMark = now;
      markActivity();
    }
    function checkIdle(){
      try{
        var last = parseInt(localStorage.getItem(ACT_KEY) || '0', 10);
        if(last && (Date.now() - last) >= IDLE_MS){ autoLogout(); }
      }catch(e){}
    }

    ['mousemove','mousedown','keydown','scroll','touchstart','click'].forEach(function(ev){
      window.addEventListener(ev, onActivity, { passive: true });
    });
    markActivity();                          // marca atividade ao abrir a página
    setInterval(checkIdle, 60 * 1000);       // verifica a cada 1 min
  })();

  // 1) Aplicar estado collapsed o MAIS CEDO POSSÍVEL pra evitar flash.
  //    - Adiciona classe no <html> (já existe quando o script roda)
  //    - <body> ainda não existe nesse ponto, então usamos MutationObserver pra adicionar
  //      a classe assim que ele aparecer no DOM.
  //    - Injeta <style> com transition:none pra bloquear qualquer animação durante o boot.
  var earlyStyle = null;
  var saved = null;
  try { saved = localStorage.getItem(COLLAPSED_KEY); } catch(e) {}
  var shouldCollapse = isDesktop && saved !== '0';

  if (shouldCollapse) {
    try {
      // Adiciona classe no <html> (sempre disponível)
      document.documentElement.classList.add('sidebar-collapsed');

      // Tenta adicionar no body (pode ainda não existir)
      if (document.body) {
        document.body.classList.add('sidebar-collapsed');
      } else {
        // body ainda não existe — observa o DOM até ele aparecer
        var bodyObs = new MutationObserver(function(mutations, obs){
          if (document.body) {
            document.body.classList.add('sidebar-collapsed');
            obs.disconnect();
          }
        });
        bodyObs.observe(document.documentElement, { childList: true });
      }

      // Style early — bloqueia transition e FORÇA largura collapsed durante o boot
      earlyStyle = document.createElement('style');
      earlyStyle.id = 'g20-sidebar-early';
      earlyStyle.textContent =
        'html.sidebar-collapsed .sidebar,body.sidebar-collapsed .sidebar{' +
        'transition:none !important;width:68px !important;min-width:68px !important;max-width:68px !important}' +
        'html.sidebar-collapsed .main,body.sidebar-collapsed .main,html.sidebar-collapsed main,body.sidebar-collapsed main{' +
        'transition:none !important;margin-left:68px !important}';
      document.head.appendChild(earlyStyle);
    } catch(e) {}
  }

  function aplicarEstado(){
    if (!isDesktop) return;
    var saved = localStorage.getItem(COLLAPSED_KEY);
    var sb = document.getElementById('sidebar') || document.querySelector('.sidebar');
    var main = document.querySelector('.main') || document.querySelector('main');
    if (saved !== '0') {
      document.documentElement.classList.add('sidebar-collapsed');
      document.body.classList.add('sidebar-collapsed');
      if (sb) {
        sb.classList.add('sidebar-collapsed');
        // Inline style — especificidade máxima, ganha qualquer CSS
        sb.style.setProperty('width', '68px', 'important');
        sb.style.setProperty('min-width', '68px', 'important');
        sb.style.setProperty('max-width', '68px', 'important');
      }
      if (main) main.style.setProperty('margin-left', '68px', 'important');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
      document.body.classList.remove('sidebar-collapsed');
      if (sb) {
        sb.classList.remove('sidebar-collapsed');
        sb.style.removeProperty('width');
        sb.style.removeProperty('min-width');
        sb.style.removeProperty('max-width');
      }
      if (main) main.style.removeProperty('margin-left');
    }
    // Remove o style de emergência (bloqueava transitions no boot)
    if (earlyStyle && earlyStyle.parentNode) {
      earlyStyle.parentNode.removeChild(earlyStyle);
      earlyStyle = null;
    }
  }

  function atualizarLegendaBtn(){
    var btn = document.querySelector('.sidebar-collapse-btn');
    if (!btn) return;
    var collapsed = document.body.classList.contains('sidebar-collapsed');
    var txt = collapsed ? 'Expandir menu' : 'Recolher menu';
    btn.title = txt;
    btn.setAttribute('aria-label', txt);
  }

  // Fallback — o dashboard pode definir o seu próprio toggleSidebarCollapse
  if (!window.toggleSidebarCollapse) {
    window.toggleSidebarCollapse = function(){
      if (window.innerWidth <= 768) return;
      var sb = document.getElementById('sidebar') || document.querySelector('.sidebar');
      var main = document.querySelector('.main') || document.querySelector('main');
      var collapsed = !document.body.classList.contains('sidebar-collapsed');
      try { localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0'); } catch(e) {}
      if (collapsed) {
        document.documentElement.classList.add('sidebar-collapsed');
        document.body.classList.add('sidebar-collapsed');
        if (sb) {
          sb.classList.add('sidebar-collapsed');
          sb.style.setProperty('width', '68px', 'important');
          sb.style.setProperty('min-width', '68px', 'important');
          sb.style.setProperty('max-width', '68px', 'important');
        }
        if (main) main.style.setProperty('margin-left', '68px', 'important');
      } else {
        document.documentElement.classList.remove('sidebar-collapsed');
        document.body.classList.remove('sidebar-collapsed');
        if (sb) {
          sb.classList.remove('sidebar-collapsed');
          sb.style.removeProperty('width');
          sb.style.removeProperty('min-width');
          sb.style.removeProperty('max-width');
        }
        if (main) main.style.removeProperty('margin-left');
      }
      atualizarLegendaBtn();
    };
  }

  // ─── DRAWER MOBILE — abrir/fechar a sidebar como gaveta no celular ───
  // Definidas como fallback: páginas que já têm a sua própria versão continuam
  // usando a delas; páginas sem (ex: aporte-g20-live) ganham um drawer funcional.
  // Breakpoint canônico do drawer: 768px.
  var DRAWER_BP = 768;

  if (!window.toggleSidebar) {
    window.toggleSidebar = function(){
      var sb = document.getElementById('sidebar') || document.querySelector('.sidebar');
      var ov = document.getElementById('overlay');
      if (!sb) return;
      var willOpen = !sb.classList.contains('open');
      sb.classList.toggle('open', willOpen);
      if (ov) ov.classList.toggle('show', willOpen);
      // Trava o scroll do conteúdo enquanto o menu está aberto
      document.body.style.overflow = willOpen ? 'hidden' : '';
    };
  }

  if (!window.closeSidebar) {
    window.closeSidebar = function(){
      var sb = document.getElementById('sidebar') || document.querySelector('.sidebar');
      var ov = document.getElementById('overlay');
      if (sb) sb.classList.remove('open');
      if (ov) ov.classList.remove('show');
      document.body.style.overflow = '';
    };
  }

  // csm = "close sidebar mobile": fecha ao navegar, só em telas pequenas.
  // O g20-sidebar.js chama csm() no clique de cada item do menu.
  if (!window.csm) {
    window.csm = function(){
      if (window.innerWidth <= DRAWER_BP) window.closeSidebar();
    };
  }

  // Robustez universal (não depende de cada página configurar):
  // 1) ESC fecha o drawer aberto.
  // 2) Se voltar pra largura desktop com o drawer aberto, limpa o estado.
  if (!window._g20DrawerGlobalBound) {
    window._g20DrawerGlobalBound = true;
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' || e.keyCode === 27) {
        var sb = document.getElementById('sidebar') || document.querySelector('.sidebar');
        if (sb && sb.classList.contains('open') && typeof window.closeSidebar === 'function') {
          window.closeSidebar();
        }
      }
    });
    window.addEventListener('resize', function(){
      if (window.innerWidth > DRAWER_BP) {
        var sb = document.getElementById('sidebar') || document.querySelector('.sidebar');
        if (sb && sb.classList.contains('open') && typeof window.closeSidebar === 'function') {
          window.closeSidebar();
        }
      }
    });
  }

  function injectCollapseBtn(){
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar || sidebar.querySelector('.sidebar-collapse-btn')) return;
    var btn = document.createElement('button');
    btn.className = 'sidebar-collapse-btn';
    btn.type = 'button';
    btn.onclick = window.toggleSidebarCollapse;
    btn.innerHTML = '<svg class="collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';
    sidebar.appendChild(btn);
  }

  function setTooltips(){
    document.querySelectorAll('.sidebar .nav-item').forEach(function(item){
      if (item.hasAttribute('data-tooltip')) return;
      var clone = item.cloneNode(true);
      clone.querySelectorAll('.ico, .badge-infinity').forEach(function(c){ c.remove(); });
      clone.querySelectorAll('span[style*="margin-left:auto"], span[style*="background:var(--gold)"]').forEach(function(c){ c.remove(); });
      var text = (clone.textContent || '').trim();
      if (text) item.setAttribute('data-tooltip', text);
    });
    var logout = document.querySelector('.sidebar .btn-logout');
    if (logout && !logout.hasAttribute('data-tooltip')) {
      logout.setAttribute('data-tooltip', 'Sair');
    }
  }

  function bindClickBounce(){
    document.querySelectorAll('.sidebar .nav-item').forEach(function(item){
      if(item._bounceBound) return;
      item._bounceBound = true;
      item.addEventListener('click', function(){
        var items = document.querySelectorAll('.sidebar .nav-item');
        items.forEach(function(el){ el.classList.add('nav-click'); });
        setTimeout(function(){
          items.forEach(function(el){ el.classList.remove('nav-click'); });
        }, 400);
      });
    });
  }

  function injectLogoutConfirm(){
    var btn = document.querySelector('.sidebar .btn-logout');
    if(!btn || btn._confirmBound) return;
    btn._confirmBound = true;
    var originalOnclick = btn.getAttribute('onclick');
    btn.removeAttribute('onclick');
    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      showLogoutConfirm(originalOnclick);
    });
  }

  function showLogoutConfirm(action){
    var existing = document.getElementById('g20LogoutConfirm');
    if(existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'g20LogoutConfirm';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;animation:g20FadeIn .15s ease';
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--bg2,#0d1018);border:1px solid var(--border,rgba(255,255,255,.06));border-radius:16px;padding:28px 32px;max-width:360px;width:90vw;box-shadow:0 24px 60px rgba(0,0,0,.6);text-align:center';
    box.innerHTML =
      '<div style="font-size:36px;margin-bottom:12px">👋</div>' +
      '<div style="font-size:18px;font-weight:700;color:var(--text,#eef0f4);margin-bottom:6px">Deseja sair?</div>' +
      '<div style="font-size:13px;color:var(--text2,#9aa5b8);margin-bottom:24px;line-height:1.5">Você será desconectado da plataforma G20 Masterclass.</div>' +
      '<div style="display:flex;gap:10px;justify-content:center">' +
        '<button id="g20LogoutCancel" style="flex:1;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid var(--border,rgba(255,255,255,.06));background:transparent;color:var(--text2,#9aa5b8);transition:all .15s;font-family:inherit">Cancelar</button>' +
        '<button id="g20LogoutOk" style="flex:1;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;background:linear-gradient(135deg,#e63946,#c0392b);color:#fff;transition:all .15s;font-family:inherit;box-shadow:0 4px 14px rgba(230,57,70,.3)">Sair</button>' +
      '</div>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(ev){ if(ev.target === overlay) closeConfirm(); });
    document.getElementById('g20LogoutCancel').addEventListener('click', closeConfirm);
    document.getElementById('g20LogoutOk').addEventListener('click', function(){
      closeConfirm();
      // ── Privacidade em computador compartilhado ──
      // Apaga TODO dado pessoal/financeiro + sessão ao sair, para que o próximo
      // usuário (outro aluno) jamais veja resíduo do anterior.
      try {
        g20WipeFinance();
        ['dados_owner','uid','user_profile'].forEach(function(k){ try{ localStorage.removeItem('g20_'+k); }catch(e){} });
      } catch(e){}
      if(action){
        try { eval(action); } catch(err){ window.location.href='login.html'; }
      } else {
        window.location.href = 'login.html';
      }
    });
    document.getElementById('g20LogoutCancel').addEventListener('mouseenter', function(){ this.style.borderColor='var(--gold,#e8b84b)'; this.style.color='var(--text,#eef0f4)'; });
    document.getElementById('g20LogoutCancel').addEventListener('mouseleave', function(){ this.style.borderColor='var(--border,rgba(255,255,255,.06))'; this.style.color='var(--text2,#9aa5b8)'; });
    document.getElementById('g20LogoutOk').addEventListener('mouseenter', function(){ this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 20px rgba(230,57,70,.4)'; });
    document.getElementById('g20LogoutOk').addEventListener('mouseleave', function(){ this.style.transform=''; this.style.boxShadow='0 4px 14px rgba(230,57,70,.3)'; });

    function closeConfirm(){
      var el = document.getElementById('g20LogoutConfirm');
      if(el) el.remove();
    }
  }

  // Inject fadeIn animation
  try {
    var styleEl = document.createElement('style');
    styleEl.textContent = '@keyframes g20FadeIn{from{opacity:0}to{opacity:1}}';
    document.head.appendChild(styleEl);
  } catch(e){}

  // ═══ TABS — lista central, injetada em todas as páginas ═══
  var TABS = [
    { href: 'command-center.html',   lucide: 'grid-3x3',         label: 'Command Center' },
    { href: 'minha-jornada.html',    lucide: 'book-open',        label: 'Minha Jornada' },
    { href: 'noticias.html',         lucide: 'newspaper',        label: 'Notícias & Calendário' }
  ];

  function injectTabs() {
    var container = document.querySelector('.g20-tabs');
    if (!container) return;
    // Se já foi injetado por este script, não reinjetar (evita piscar)
    if (container.getAttribute('data-g20-injected') === 'v1') return;
    var currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    container.innerHTML = '';
    TABS.forEach(function(tab) {
      var el;
      if (tab.soon) {
        el = document.createElement('div');
        el.className = 'g20-tab soon';
        el.title = tab.label + ' (em breve)';
      } else {
        el = document.createElement('a');
        el.href = tab.href;
        el.className = 'g20-tab';
        el.title = tab.label;
        if (tab.href === currentPage || (tab.href === 'dashboard.html' && currentPage === '')) {
          el.classList.add('active');
        }
      }
      var icon = document.createElement('i');
      icon.setAttribute('data-lucide', tab.lucide);
      el.appendChild(icon);
      el.appendChild(document.createTextNode(tab.label));
      container.appendChild(el);
    });
    container.setAttribute('data-g20-injected', 'v1');
    if (window.lucide && lucide.createIcons) lucide.createIcons();
  }

  // ═══ NAV ITEMS — lista central, injetada em todas as páginas ═══
  var NAV_ITEMS = [
    { section: 'Principal', cls: 'nav-section--principal', items: [
      { href: 'dashboard.html',          ico: '🏠', lucide: 'layout-dashboard', label: 'Dashboard',      id: '' }
    ]},
    { section: 'Conteúdo', cls: 'nav-section--conteudo', items: [
      { href: 'sala-de-aula.html',       ico: '📚', lucide: 'graduation-cap',  label: 'Sala de Aula',   id: 'tut-sala' },
      { href: 'g20flix.html',            ico: '🎬', lucide: 'clapperboard',    label: 'G20Flix',        id: 'tut-flix', badge: '80' },
      { href: 'g20cast.html',            ico: '🎧', lucide: 'headphones',      label: 'G20Cast',        id: 'tut-cast' },
      { href: 'g20cast-premium.html',    ico: '⭐', lucide: 'star',            label: 'G20Cast Premium', id: '' },
      { href: 'carteira.html',           ico: '📊', lucide: 'trending-up',     label: 'Carteira G20',   id: 'tut-carteira' },
      { href: 'game-g20.html',               ico: '🏆', lucide: 'trophy',          label: 'Game G20',       id: '' },
      { href: 'biblioteca.html',         ico: '📖', lucide: 'book-open',       label: 'Biblioteca G20', id: '' }
    ]},
    { section: 'Investimentos', cls: 'nav-section--investimentos', items: [
      { href: 'gestao-patrimonial.html', ico: '💰', lucide: 'briefcase',       label: 'Minha Carteira', id: 'tut-gestao' },
      { href: 'atlas.html',              ico: '🌍', lucide: 'globe',            label: 'Atlas G20',      id: 'tut-atlas'  }
    ]},
    { section: 'Planejamento', cls: 'nav-section--planejamento', items: [
      { href: 'gestao-financeira.html', ico: '🧾', lucide: 'wallet',           label: 'Gestão Financeira', id: '' }
    ]},
    { section: 'Comunidade', cls: 'nav-section--comunidade', items: [
      { href: 'consultoria.html',         ico: '👨\u200d💻', lucide: 'user-round',   label: 'Consultoria',    id: '' },
      { href: 'arena.html',               ico: '💬', lucide: 'message-circle',  label: 'Arena G20',      id: '' },
      { href: 'networking.html',          ico: '🤝', lucide: 'users',           label: 'Networking',     id: '' }
    ]}
  ];

  function buildSectionEl(sec, currentPage) {
    var div = document.createElement('div');
    div.className = 'nav-section ' + sec.cls;
    var lbl = document.createElement('div');
    lbl.className = 'nav-label';
    lbl.textContent = sec.section;
    div.appendChild(lbl);
    sec.items.forEach(function(item) {
      var a = document.createElement('a');
      a.href = item.href;
      a.className = 'nav-item' + (item.href !== '#' && currentPage === item.href ? ' active' : '');
      if (item.id) a.id = item.id;
      a.setAttribute('data-tooltip', item.label);
      if (typeof csm === 'function') a.onclick = function(){ csm(); };
      var ico = document.createElement('span');
      ico.className = 'ico';
      ico.textContent = item.ico;
      a.appendChild(ico);
      var i = document.createElement('i');
      i.setAttribute('data-lucide', item.lucide);
      a.appendChild(i);
      a.appendChild(document.createTextNode(item.label));
      if (item.badge) {
        var b = document.createElement('span');
        b.style.cssText = 'margin-left:6px;background:var(--gold);color:#000;font-size:9px;font-weight:700;padding:1px 6px;border-radius:8px';
        b.textContent = item.badge;
        a.appendChild(b);
      }
      div.appendChild(a);
    });
    return div;
  }

  function injectNav() {
    var sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
    if (!sidebar) return;

    // Se já tem nav-sections injetadas, atualiza o active E corrige hrefs
    var existing = sidebar.querySelectorAll('.nav-section');
    var currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    if (existing.length > 0) {
      // Corrigir hrefs hardcoded errados usando NAV_ITEMS como fonte da verdade
      var allItems = [];
      NAV_ITEMS.forEach(function(sec){ sec.items.forEach(function(item){ allItems.push(item); }); });
      sidebar.querySelectorAll('.nav-item').forEach(function(a) {
        var tooltip = a.getAttribute('data-tooltip') || '';
        var match = allItems.find(function(item){ return item.label === tooltip; });
        if (match && match.href !== '#') {
          a.href = match.href;
          a.onclick = null;
          a.removeAttribute('onclick');
        }
        var href = a.getAttribute('href') || '';
        if (href !== '#' && href === currentPage) a.classList.add('active');
        else a.classList.remove('active');
      });

      // Reconstrói todos os itens de cada seção com o HTML padrão
      NAV_ITEMS.forEach(function(sec) {
        var secEl = sidebar.querySelector('.' + sec.cls);
        if (!secEl) return;
        // Remove todos os nav-items existentes na seção
        secEl.querySelectorAll('.nav-item').forEach(function(el){ el.parentNode.removeChild(el); });
        // Recria todos com HTML idêntico ao branch principal
        sec.items.forEach(function(item) {
          var a = document.createElement('a');
          a.href = item.href;
          a.className = 'nav-item' + (item.href !== '#' && currentPage === item.href ? ' active' : '');
          if (item.id) a.id = item.id;
          a.setAttribute('data-tooltip', item.label);
          if (typeof csm === 'function') a.onclick = function(){ csm(); };
          var ico = document.createElement('span');
          ico.className = 'ico';
          ico.textContent = item.ico;
          a.appendChild(ico);
          var i = document.createElement('i');
          i.setAttribute('data-lucide', item.lucide);
          a.appendChild(i);
          a.appendChild(document.createTextNode(item.label));
          if (item.badge) {
            var b = document.createElement('span');
            b.style.cssText = 'margin-left:6px;background:var(--gold);color:#000;font-size:9px;font-weight:700;padding:1px 6px;border-radius:8px';
            b.textContent = item.badge;
            a.appendChild(b);
          }
          secEl.appendChild(a);
        });
      });
      // Injeta seções do NAV_ITEMS que ainda não existem no HTML da página
      // (ex: Planejamento). Mantém a ordem do NAV_ITEMS.
      var _footerEl = sidebar.querySelector('.sidebar-footer');
      NAV_ITEMS.forEach(function(sec, idx) {
        if (sidebar.querySelector('.' + sec.cls)) return; // já existe
        var secEl = buildSectionEl(sec, currentPage);
        var anchor = null;
        for (var j = idx + 1; j < NAV_ITEMS.length; j++) {
          var nextEl = sidebar.querySelector('.' + NAV_ITEMS[j].cls);
          if (nextEl) { anchor = nextEl; break; }
        }
        if (anchor) sidebar.insertBefore(secEl, anchor);
        else if (_footerEl) sidebar.insertBefore(secEl, _footerEl);
        else sidebar.appendChild(secEl);
      });

      if (window.lucide && lucide.createIcons) lucide.createIcons();

      return;
    }

    var footer = sidebar.querySelector('.sidebar-footer');
    var frag = document.createDocumentFragment();

    NAV_ITEMS.forEach(function(sec) {
      var div = document.createElement('div');
      div.className = 'nav-section ' + sec.cls;

      var lbl = document.createElement('div');
      lbl.className = 'nav-label';
      lbl.textContent = sec.section;
      div.appendChild(lbl);

      sec.items.forEach(function(item) {
        var a = document.createElement('a');
        a.href = item.href;
        a.className = 'nav-item' + (item.href !== '#' && currentPage === item.href ? ' active' : '');
        if (item.id) a.id = item.id;
        a.setAttribute('data-tooltip', item.label);
        if (typeof csm === 'function') a.onclick = function(){ csm(); };

        var ico = document.createElement('span');
        ico.className = 'ico';
        ico.textContent = item.ico;
        a.appendChild(ico);

        var i = document.createElement('i');
        i.setAttribute('data-lucide', item.lucide);
        a.appendChild(i);

        a.appendChild(document.createTextNode(item.label));

        if (item.badge) {
          var b = document.createElement('span');
          b.style.cssText = 'margin-left:6px;background:var(--gold);color:#000;font-size:9px;font-weight:700;padding:1px 6px;border-radius:8px';
          b.textContent = item.badge;
          a.appendChild(b);
        }
        div.appendChild(a);
      });
      frag.appendChild(div);
    });

    if (footer) sidebar.insertBefore(frag, footer);
    else sidebar.appendChild(frag);

    if (window.lucide && lucide.createIcons) lucide.createIcons();
  }

  // Envolve text nodes dos nav-items em span.nav-item-text
  // Necessário para o CSS collapsed esconder o texto corretamente
  function initSidebarTexts(){
    document.querySelectorAll('#sidebar .nav-item').forEach(function(item){
      if (item.querySelector('.nav-item-text')) return;
      item.childNodes.forEach(function(node){
        if (node.nodeType === 3 && node.textContent.trim()){
          var span = document.createElement('span');
          span.className = 'nav-item-text';
          span.textContent = node.textContent;
          item.replaceChild(span, node);
        }
      });
    });
  }

  // ── INJECT SKELETON ──────────────────────────────────────────────────────
  // Se a <nav class="sidebar"> estiver vazia (apenas esqueleto mínimo),
  // injeta o HTML completo: logo, user-block e footer.
  // Isso permite que qualquer página nova use apenas:
  //   <nav class="sidebar" id="sidebar"></nav>
  // e tenha a sidebar idêntica a todas as outras páginas automaticamente.
  function injectSidebarSkeleton(){
    var sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
    if (!sidebar) return;
    // Se já tem logo-ball-wrap, está completo — não faz nada
    if (sidebar.querySelector('.logo-ball-wrap')) return;
    // Injetar esqueleto completo
    sidebar.innerHTML =
      '<a href="dashboard.html" class="logo-ball-wrap" onclick="if(typeof csm===\'function\')csm()">' +
        '<div class="logo-ball"><img id="g20LogoImg" alt="G20"></div>' +
      '</a>' +
      '<div class="sidebar-user" id="sidebarUserBlock" onclick="window.location.href=\'perfil.html\'" style="cursor:pointer">' +
        '<div class="user-avatar" id="sidebarAvatar"><span id="sidebarInitials">G20</span></div>' +
        '<div class="user-info">' +
          '<div class="user-name" id="sidebarName"><span class="user-name-text">Carregando...</span></div>' +
          '<div class="user-turma"><span class="user-online"></span><span id="sidebarTurma"></span></div>' +
        '</div>' +
        '<span class="user-edit-ico">✏️</span>' +
      '</div>' +
      '<div class="sidebar-footer">' +
        '<button class="btn-logout" data-tooltip="Sair" id="sidebarLogoutBtn">' +
          '<span class="logout-ico-emoji">🚪</span>' +
          '<span class="logout-text">Sair</span>' +
        '</button>' +
      '</div>';
    // Injetar logo base64
    var logoImg = sidebar.querySelector('#g20LogoImg');
    if (logoImg) logoImg.src = 'data:image/jpeg;base64,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';
  }

  // ═══ WIDGET DE FEEDBACK — botão flutuante + modal (todas as páginas) ═══
  function injectFeedbackWidget(){
    // só em páginas internas (com sidebar/topbar); nunca injeta duas vezes
    if (document.getElementById('g20FeedbackBtn') || document.getElementById('g20FeedbackFab')) return;
    if (!document.querySelector('.sidebar') && !document.querySelector('.topbar')) return;

    var MEGAFONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>';
    var ICOUP   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
    var ICOINFO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

    // ---- estilos auto-contidos ----
    var st = document.createElement('style');
    st.id = 'g20-feedback-style';
    st.textContent = ''
    + '#g20FeedbackFab{position:fixed;right:24px;bottom:24px;z-index:9990;display:flex;align-items:center;'
    +   'height:54px;padding:0 17px;border:none;border-radius:27px;cursor:pointer;'
    +   'background:linear-gradient(135deg,var(--gold,#c9a961),var(--gold-light,#e8c766));'
    +   "color:#1a191e;font-family:'DM Sans',system-ui,sans-serif;font-weight:700;font-size:14px;"
    +   'box-shadow:0 10px 30px rgba(0,0,0,.5),0 2px 10px rgba(201,169,97,.45);'
    +   'transition:transform .18s ease,box-shadow .18s ease}'
    + '#g20FeedbackFab:hover{transform:translateY(-2px);box-shadow:0 16px 38px rgba(0,0,0,.55),0 3px 14px rgba(201,169,97,.6)}'
    + '#g20FeedbackFab:active{transform:translateY(0)}'
    + '#g20FeedbackFab svg{width:22px;height:22px;flex:none}'
    + '#g20FeedbackFab .g20fb-fab-txt{max-width:0;opacity:0;overflow:hidden;white-space:nowrap;'
    +   'transition:max-width .25s ease,opacity .2s ease,margin .25s ease}'
    + '#g20FeedbackFab:hover .g20fb-fab-txt{max-width:120px;opacity:1;margin-left:9px}'
    + '.g20fb-topbtn{width:40px !important;height:40px !important;'
    +   'border:1px solid var(--v21-gold-border,rgba(201,169,97,.18)) !important}'
    + '.g20fb-topbtn svg{width:16px;height:16px;stroke:var(--gold,#c9a961) !important;fill:none}'
    + '.g20fb-topbtn:hover svg{stroke:var(--gold-light,#e8c766) !important}'
    + '.g20fb-overlay{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;'
    +   'background:rgba(8,8,10,.74);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);padding:20px}'
    + '.g20fb-overlay.open{display:flex;animation:g20fbFade .18s ease}'
    + '@keyframes g20fbFade{from{opacity:0}to{opacity:1}}'
    + '.g20fb-modal{position:relative;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;'
    +   'background:var(--surface,#27252c);border:1px solid var(--border,rgba(255,255,255,.08));'
    +   'border-radius:20px;box-shadow:0 28px 60px rgba(0,0,0,.65);'
    +   "font-family:'DM Sans',system-ui,sans-serif;color:var(--text,#eef0f4);"
    +   'animation:g20fbPop .22s cubic-bezier(.2,.9,.3,1.2)}'
    + '@keyframes g20fbPop{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}'
    + '.g20fb-close{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:9px;'
    +   'border:1px solid var(--border,rgba(255,255,255,.08));background:rgba(255,255,255,.04);'
    +   'color:var(--text2,#9aa5b8);font-size:20px;line-height:1;cursor:pointer;transition:.15s;z-index:2}'
    + '.g20fb-close:hover{color:var(--text,#eef0f4);border-color:var(--gold,#c9a961)}'
    + '.g20fb-form,.g20fb-success{padding:26px 26px 22px}'
    + '.g20fb-head{display:flex;gap:13px;align-items:flex-start;margin-bottom:20px;padding-right:34px}'
    + '.g20fb-head-ico{flex:none;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;'
    +   'justify-content:center;background:linear-gradient(135deg,var(--gold,#c9a961),var(--gold-light,#e8c766));color:#1a191e}'
    + '.g20fb-head-ico svg{width:24px;height:24px}'
    + '.g20fb-head h3{margin:0 0 3px;font-size:18px;font-weight:700}'
    + '.g20fb-head p{margin:0;font-size:12.5px;line-height:1.45;color:var(--text2,#9aa5b8)}'
    + '.g20fb-field{margin-bottom:16px}'
    + '.g20fb-field>label{display:block;font-size:12px;font-weight:700;letter-spacing:.04em;'
    +   'text-transform:uppercase;color:var(--text2,#9aa5b8);margin-bottom:8px}'
    + '.g20fb-opt{font-weight:500;text-transform:none;letter-spacing:0;opacity:.8}'
    + '.g20fb-tipos{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}'
    + '.g20fb-pill{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 4px;cursor:pointer;'
    +   'border-radius:11px;border:1px solid var(--border,rgba(255,255,255,.08));background:rgba(255,255,255,.03);'
    +   'color:var(--text2,#9aa5b8);font-family:inherit;font-size:12px;font-weight:600;transition:.15s}'
    + '.g20fb-pill span{font-size:17px}'
    + '.g20fb-pill:hover{border-color:rgba(201,169,97,.5);color:var(--text,#eef0f4)}'
    + '.g20fb-pill.active{border-color:var(--gold,#c9a961);background:rgba(201,169,97,.13);color:var(--gold,#c9a961)}'
    + '.g20fb-modal input[type=text],.g20fb-modal textarea{width:100%;box-sizing:border-box;'
    +   'background:rgba(0,0,0,.28);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:11px;'
    +   'padding:11px 13px;color:var(--text,#eef0f4);font-family:inherit;font-size:14px;resize:vertical;transition:.15s}'
    + '.g20fb-modal input[type=text]:focus,.g20fb-modal textarea:focus{outline:none;border-color:var(--gold,#c9a961);'
    +   'box-shadow:0 0 0 3px rgba(201,169,97,.13)}'
    + '.g20fb-modal textarea{min-height:96px;line-height:1.5}'
    + '.g20fb-modal ::placeholder{color:#5f6776}'
    + ".g20fb-count{text-align:right;font-size:11px;color:var(--text2,#9aa5b8);margin-top:5px;"
    +   "font-family:'JetBrains Mono',monospace}"
    + '.g20fb-drop{display:flex;align-items:center;justify-content:center;gap:9px;padding:16px;cursor:pointer;'
    +   'border:1.5px dashed var(--border,rgba(255,255,255,.14));border-radius:12px;'
    +   'color:var(--text2,#9aa5b8);font-size:12.5px;text-align:center;transition:.15s}'
    + '.g20fb-drop:hover,.g20fb-drop.drag{border-color:var(--gold,#c9a961);background:rgba(201,169,97,.07);color:var(--text,#eef0f4)}'
    + '.g20fb-drop svg{width:18px;height:18px;flex:none}'
    + '.g20fb-thumbs{display:flex;flex-wrap:wrap;gap:8px;margin-top:9px}'
    + '.g20fb-thumb{position:relative;width:62px;height:62px;border-radius:9px;overflow:hidden;'
    +   'border:1px solid var(--border,rgba(255,255,255,.1))}'
    + '.g20fb-thumb img{width:100%;height:100%;object-fit:cover}'
    + '.g20fb-thumb button{position:absolute;top:2px;right:2px;width:18px;height:18px;border:none;border-radius:5px;'
    +   'background:rgba(0,0,0,.78);color:#fff;font-size:12px;line-height:1;cursor:pointer;display:flex;'
    +   'align-items:center;justify-content:center}'
    + '.g20fb-note{display:flex;gap:7px;font-size:11px;color:var(--text2,#9aa5b8);line-height:1.45;'
    +   'background:rgba(255,255,255,.03);border-radius:9px;padding:9px 11px;margin-bottom:14px}'
    + '.g20fb-note svg{width:14px;height:14px;margin-top:1px}'
    + '.g20fb-err{display:none;font-size:12.5px;color:#ff8a8a;background:rgba(230,57,70,.12);'
    +   'border:1px solid rgba(230,57,70,.3);border-radius:9px;padding:9px 11px;margin-bottom:12px}'
    + '.g20fb-err.show{display:block}'
    + '.g20fb-foot{display:flex;gap:10px;justify-content:flex-end;margin-top:4px}'
    + '.g20fb-btn-ghost,.g20fb-btn-gold{padding:11px 20px;border-radius:11px;cursor:pointer;'
    +   'font-family:inherit;font-weight:700;font-size:13.5px;transition:.15s;border:1px solid transparent}'
    + '.g20fb-btn-ghost{background:transparent;border-color:var(--border,rgba(255,255,255,.1));color:var(--text2,#9aa5b8)}'
    + '.g20fb-btn-ghost:hover{color:var(--text,#eef0f4);border-color:var(--text2,#9aa5b8)}'
    + '.g20fb-btn-gold{background:linear-gradient(135deg,var(--gold,#c9a961),var(--gold-light,#e8c766));color:#1a191e;border:none}'
    + '.g20fb-btn-gold:hover{transform:translateY(-1px);box-shadow:0 7px 20px rgba(201,169,97,.4)}'
    + '.g20fb-btn-gold:disabled{opacity:.6;cursor:wait;transform:none;box-shadow:none}'
    + '.g20fb-success{text-align:center;padding:40px 30px 30px}'
    + '.g20fb-success-ico{width:60px;height:60px;margin:0 auto 16px;border-radius:50%;display:flex;'
    +   'align-items:center;justify-content:center;font-size:30px;font-weight:700;'
    +   'background:linear-gradient(135deg,var(--gold,#c9a961),var(--gold-light,#e8c766));color:#1a191e}'
    + '.g20fb-success h3{margin:0 0 8px;font-size:19px}'
    + '.g20fb-success p{margin:0 0 22px;font-size:13.5px;line-height:1.5;color:var(--text2,#9aa5b8)}'
    + '@media(max-width:768px){'
    +   '#g20FeedbackFab{right:16px;bottom:16px;height:50px;padding:0 14px}'
    +   '#g20FeedbackFab:hover .g20fb-fab-txt{max-width:0;opacity:0;margin-left:0}'
    +   '.g20fb-form,.g20fb-success{padding:22px 18px 18px}'
    +   '.g20fb-tipos{gap:6px}}';
    document.head.appendChild(st);

    // ---- gatilho: botão na topbar (preferido) ou flutuante (fallback) ----
    var trigger, topRight = document.querySelector('.topbar-right');
    if (topRight){
      // botão de ícone na topbar — mesmo padrão do sino e do tema
      trigger = document.createElement('button');
      trigger.id = 'g20FeedbackBtn';
      trigger.type = 'button';
      trigger.className = 'btn-icon g20fb-topbtn';
      trigger.title = 'Enviar feedback — bugs e sugestões';
      trigger.setAttribute('aria-label', 'Enviar feedback');
      trigger.innerHTML = MEGAFONE;
      // insere antes do primeiro botão de ícone (sino); senão, no início
      var firstIcon = topRight.querySelector('.btn-icon');
      if (firstIcon) topRight.insertBefore(trigger, firstIcon);
      else topRight.insertBefore(trigger, topRight.firstChild);
    } else {
      // fallback: botão flutuante p/ páginas sem topbar
      trigger = document.createElement('button');
      trigger.id = 'g20FeedbackFab';
      trigger.type = 'button';
      trigger.setAttribute('aria-label', 'Enviar feedback');
      trigger.innerHTML = MEGAFONE + '<span class="g20fb-fab-txt">Feedback</span>';
      document.body.appendChild(trigger);
    }

    // ---- modal ----
    var ov = document.createElement('div');
    ov.className = 'g20fb-overlay';
    ov.id = 'g20fbOverlay';
    ov.innerHTML = ''
    + '<div class="g20fb-modal" id="g20fbModal" role="dialog" aria-modal="true" aria-label="Central de Feedback">'
    +   '<button class="g20fb-close" id="g20fbClose" type="button" aria-label="Fechar">&times;</button>'
    +   '<div class="g20fb-form" id="g20fbForm">'
    +     '<div class="g20fb-head">'
    +       '<div class="g20fb-head-ico">' + MEGAFONE + '</div>'
    +       '<div><h3>Central de Feedback</h3>'
    +       '<p>Encontrou um bug ou tem uma ideia? Sua opinião constrói a Plataforma G20.</p></div>'
    +     '</div>'
    +     '<div class="g20fb-field"><label>Tipo</label>'
    +       '<div class="g20fb-tipos" id="g20fbTipos">'
    +         '<button type="button" class="g20fb-pill" data-tipo="bug"><span>🐛</span>Bug</button>'
    +         '<button type="button" class="g20fb-pill active" data-tipo="sugestao"><span>💡</span>Sugestão</button>'
    +         '<button type="button" class="g20fb-pill" data-tipo="duvida"><span>❓</span>Dúvida</button>'
    +         '<button type="button" class="g20fb-pill" data-tipo="outro"><span>💬</span>Outro</button>'
    +       '</div>'
    +     '</div>'
    +     '<div class="g20fb-field"><label for="g20fbTitulo">Título <span class="g20fb-opt">(opcional)</span></label>'
    +       '<input type="text" id="g20fbTitulo" maxlength="80" placeholder="Resuma em poucas palavras"></div>'
    +     '<div class="g20fb-field"><label for="g20fbMsg">Mensagem</label>'
    +       '<textarea id="g20fbMsg" rows="5" maxlength="2000" placeholder="Descreva com o máximo de detalhes. Se for um bug, conte o que você fez e o que aconteceu."></textarea>'
    +       '<div class="g20fb-count"><span id="g20fbCount">0</span>/2000</div></div>'
    +     '<div class="g20fb-field"><label>Prints <span class="g20fb-opt">(opcional — até 3)</span></label>'
    +       '<div class="g20fb-drop" id="g20fbDrop">' + ICOUP
    +         '<span>Arraste, clique ou cole (Ctrl+V) uma imagem</span>'
    +         '<input type="file" id="g20fbFile" accept="image/*" multiple style="display:none"></div>'
    +       '<div class="g20fb-thumbs" id="g20fbThumbs"></div></div>'
    +     '<div class="g20fb-note">' + ICOINFO
    +       '<span>Enviaremos junto a página atual e os dados do seu navegador para nos ajudar a entender o contexto.</span></div>'
    +     '<div class="g20fb-err" id="g20fbErr"></div>'
    +     '<div class="g20fb-foot">'
    +       '<button type="button" class="g20fb-btn-ghost" id="g20fbCancel">Cancelar</button>'
    +       '<button type="button" class="g20fb-btn-gold" id="g20fbSend">Enviar feedback</button>'
    +     '</div>'
    +   '</div>'
    +   '<div class="g20fb-success" id="g20fbSuccess" hidden>'
    +     '<div class="g20fb-success-ico">&#10003;</div>'
    +     '<h3>Feedback enviado!</h3>'
    +     '<p>Obrigado por ajudar a construir a Plataforma G20. Sua mensagem foi registrada e será analisada.</p>'
    +     '<button type="button" class="g20fb-btn-gold" id="g20fbDone">Fechar</button>'
    +   '</div>'
    + '</div>';
    document.body.appendChild(ov);

    // ---- estado + helpers ----
    var fbImages = [];
    var fbTipo   = 'sugestao';
    var sending  = false;
    var elForm  = document.getElementById('g20fbForm');
    var elOk    = document.getElementById('g20fbSuccess');
    var elMsg   = document.getElementById('g20fbMsg');
    var elTit   = document.getElementById('g20fbTitulo');
    var elErr   = document.getElementById('g20fbErr');
    var elSend  = document.getElementById('g20fbSend');
    var elThumb = document.getElementById('g20fbThumbs');
    var elFile  = document.getElementById('g20fbFile');
    var elDrop  = document.getElementById('g20fbDrop');

    function showErr(t){ elErr.textContent = t; elErr.classList.add('show'); }
    function hideErr(){ elErr.classList.remove('show'); }

    function setTipo(t){
      fbTipo = t;
      var pills = document.querySelectorAll('#g20fbTipos .g20fb-pill');
      for (var i=0;i<pills.length;i++){
        pills[i].classList.toggle('active', pills[i].getAttribute('data-tipo') === t);
      }
    }

    function openModal(){
      elForm.hidden = false; elOk.hidden = true;
      elTit.value = ''; elMsg.value = '';
      document.getElementById('g20fbCount').textContent = '0';
      fbImages = []; renderThumbs(); hideErr();
      setTipo('sugestao');
      elSend.disabled = false; elSend.textContent = 'Enviar feedback';
      ov.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(function(){ try{ elMsg.focus(); }catch(e){} }, 160);
    }
    function closeModal(){
      ov.classList.remove('open');
      document.body.style.overflow = '';
    }

    function renderThumbs(){
      elThumb.innerHTML = '';
      fbImages.forEach(function(d, i){
        var t = document.createElement('div');
        t.className = 'g20fb-thumb';
        t.innerHTML = '<img src="' + d + '" alt="print"><button type="button" data-i="' + i + '" aria-label="Remover">&times;</button>';
        elThumb.appendChild(t);
      });
    }

    // comprime a imagem no navegador (redimensiona + JPEG) p/ caber no Firestore
    function fbCompress(file){
      return new Promise(function(res, rej){
        var fr = new FileReader();
        fr.onload = function(){
          var im = new Image();
          im.onload = function(){
            var mx = 1280, w = im.width, h = im.height;
            if (w > mx || h > mx){
              if (w >= h){ h = Math.round(h * mx / w); w = mx; }
              else { w = Math.round(w * mx / h); h = mx; }
            }
            var c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(im, 0, 0, w, h);
            res(c.toDataURL('image/jpeg', 0.7));
          };
          im.onerror = function(){ rej(); };
          im.src = fr.result;
        };
        fr.onerror = function(){ rej(); };
        fr.readAsDataURL(file);
      });
    }

    function addFiles(list){
      hideErr();
      var arr = [].slice.call(list || []).filter(function(f){
        return f && f.type && f.type.indexOf('image') === 0;
      });
      if (!arr.length) return;
      arr.forEach(function(f){
        if (fbImages.length >= 3){ showErr('Você pode anexar no máximo 3 imagens.'); return; }
        fbCompress(f).then(function(d){
          if (fbImages.length >= 3) return;
          fbImages.push(d); renderThumbs();
        }).catch(function(){
          showErr('Não consegui processar uma das imagens. Tente outra.');
        });
      });
    }

    function fbSubmit(){
      if (sending) return;
      hideErr();
      var msg = (elMsg.value || '').trim();
      if (msg.length < 5){
        showErr('Escreva um pouco mais na mensagem (mínimo 5 caracteres).');
        try{ elMsg.focus(); }catch(e){}
        return;
      }
      var totalKB = fbImages.reduce(function(s, d){ return s + d.length; }, 0) / 1024;
      if (totalKB > 850){
        showErr('As imagens estão muito pesadas juntas. Remova uma e tente novamente.');
        return;
      }
      if (typeof firebase === 'undefined' || !firebase.firestore){
        showErr('Não foi possível conectar. Recarregue a página e tente de novo.');
        return;
      }
      sending = true;
      elSend.disabled = true;
      elSend.textContent = 'Enviando...';

      var u = null;
      try { u = firebase.auth && firebase.auth().currentUser; } catch(e){}
      var pagina = (location.pathname.split('/').pop() || '').toLowerCase();

      firebase.firestore().collection('sugestoes').add({
        tipo:      fbTipo,
        titulo:    (elTit.value || '').trim(),
        mensagem:  msg,
        imagens:   fbImages.slice(),
        pagina:    pagina,
        url:       location.href,
        userAgent: navigator.userAgent,
        tela:      (screen.width + 'x' + screen.height),
        viewport:  (window.innerWidth + 'x' + window.innerHeight),
        uid:       u ? u.uid : null,
        nome:      u ? (u.displayName || '') : '',
        email:     u ? (u.email || '') : '',
        status:    'novo',
        criadoEm:  firebase.firestore.FieldValue.serverTimestamp()
      }).then(function(){
        elForm.hidden = true;
        elOk.hidden = false;
      }).catch(function(err){
        showErr('Erro ao enviar: ' + ((err && err.message) || 'tente novamente em instantes.'));
      }).then(function(){
        sending = false;
        elSend.disabled = false;
        elSend.textContent = 'Enviar feedback';
      });
    }

    // ---- eventos ----
    trigger.addEventListener('click', openModal);
    document.getElementById('g20fbClose').addEventListener('click', closeModal);
    document.getElementById('g20fbCancel').addEventListener('click', closeModal);
    document.getElementById('g20fbDone').addEventListener('click', closeModal);
    ov.addEventListener('click', function(e){ if (e.target === ov) closeModal(); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && ov.classList.contains('open')) closeModal();
    });

    document.getElementById('g20fbTipos').addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('.g20fb-pill') : null;
      if (b) setTipo(b.getAttribute('data-tipo'));
    });

    elMsg.addEventListener('input', function(){
      document.getElementById('g20fbCount').textContent = String((elMsg.value || '').length);
    });

    elDrop.addEventListener('click', function(){ elFile.click(); });
    elFile.addEventListener('change', function(){ addFiles(elFile.files); elFile.value = ''; });
    elDrop.addEventListener('dragover', function(e){ e.preventDefault(); elDrop.classList.add('drag'); });
    elDrop.addEventListener('dragleave', function(){ elDrop.classList.remove('drag'); });
    elDrop.addEventListener('drop', function(e){
      e.preventDefault(); elDrop.classList.remove('drag');
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });

    elThumb.addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('button[data-i]') : null;
      if (!b) return;
      fbImages.splice(parseInt(b.getAttribute('data-i'), 10), 1);
      renderThumbs();
    });

    // colar print direto (Ctrl+V) com o modal aberto
    document.addEventListener('paste', function(e){
      if (!ov.classList.contains('open')) return;
      var items = (e.clipboardData && e.clipboardData.items) || [];
      var files = [];
      for (var i=0;i<items.length;i++){
        if (items[i].type && items[i].type.indexOf('image') === 0){
          var f = items[i].getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) addFiles(files);
    });

    elSend.addEventListener('click', fbSubmit);
  }

  // ═══ SWITCH DE TEMA — chave única, clique em qualquer ponto alterna ═══
  // Centraliza a lógica do tema: substitui o switch da página por uma versão
  // que funciona como chave de verdade. O clone remove handlers antigos das
  // páginas que ainda têm o JS de tema legado no próprio <script>.
  // Sincroniza o estado visual (sol/lua) de TODOS os switches da página.
  function syncThemeSwitches(){
    var theme = document.body.classList.contains('light') ? 'light' : 'dark';
    document.querySelectorAll('.v21-theme-switch .v21-theme-opt').forEach(function(o){
      o.classList.toggle('active', o.getAttribute('data-theme') === theme);
    });
  }

  // Normaliza o switch da página: só ícones (sol/lua), sem texto "Dark".
  // NÃO prende handler de clique — quem cuida do clique é a delegação global.
  function setupThemeSwitch(){
    var sw = document.getElementById('v21ThemeSwitch');
    if (sw && sw.id !== 'g20ThemeSwitch'){
      sw.innerHTML =
        '<div class="v21-theme-opt" data-theme="light"><i data-lucide="sun"></i></div>' +
        '<div class="v21-theme-opt" data-theme="dark"><i data-lucide="moon"></i></div>';
      // troca o id: o JS de tema legado procura 'v21ThemeSwitch' e não acha mais
      var fresh = sw.cloneNode(true);
      fresh.id = 'g20ThemeSwitch';
      fresh.setAttribute('role', 'button');
      fresh.setAttribute('tabindex', '0');
      fresh.setAttribute('title', 'Alternar tema claro/escuro');
      fresh.setAttribute('aria-label', 'Alternar tema');
      sw.parentNode.replaceChild(fresh, sw);
    }
    if (window.lucide && lucide.createIcons) lucide.createIcons();
    syncThemeSwitches();
  }

  // Delegação global: um único ouvinte de clique para o switch de tema.
  // Funciona mesmo que o switch seja recriado/substituído por outro script.
  function setupThemeDelegation(){
    if (window.__g20ThemeDelegated) return;
    window.__g20ThemeDelegated = true;

    // aplica o tema salvo já na carga
    try {
      var saved = localStorage.getItem('g20-theme') || 'dark';
      document.body.classList.toggle('light', saved === 'light');
    } catch(e){}

    function alternar(){
      var isLight = document.body.classList.toggle('light');
      try { localStorage.setItem('g20-theme', isLight ? 'light' : 'dark'); } catch(err){}
      syncThemeSwitches();
    }
    document.addEventListener('click', function(e){
      if (e.target.closest && e.target.closest('.v21-theme-switch')) alternar();
    });
    document.addEventListener('keydown', function(e){
      if ((e.key === 'Enter' || e.key === ' ') &&
          e.target.closest && e.target.closest('.v21-theme-switch')){
        e.preventDefault(); alternar();
      }
    });
  }

  function init(){
    injectSidebarSkeleton();
    aplicarEstado();
    injectTabs();
    injectNav();
    initSidebarTexts();
    injectCollapseBtn();
    setTooltips();
    bindClickBounce();
    injectLogoutConfirm();
    injectFeedbackWidget();
    setupThemeDelegation();
    setupThemeSwitch();
    atualizarLegendaBtn();
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        document.body.classList.add('sidebar-ready');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Garante que o item Atlas G20 apareça mesmo quando a sidebar demora a renderizar
  // Usa MutationObserver para detectar quando .nav-section--investimentos entra no DOM
  (function waitForInvestimentos(){
    var secEl = document.querySelector('.nav-section--investimentos');
    if (secEl) {
      injectNav();
      return;
    }
    var obs = new MutationObserver(function(){
      var sec = document.querySelector('.nav-section--investimentos');
      if (sec) {
        obs.disconnect();
        injectNav();
      }
    });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  })();
})();
