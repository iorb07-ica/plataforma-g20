/* G20 — Sidebar colapsável compartilhada */
(function(){
  'use strict';

  var COLLAPSED_KEY = 'g20_sidebar_collapsed';
  var isDesktop = window.innerWidth > 768;

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

      // Style early — bloqueia transition durante o boot
      earlyStyle = document.createElement('style');
      earlyStyle.id = 'g20-sidebar-early';
      earlyStyle.textContent =
        'html.sidebar-collapsed .sidebar,html.sidebar-collapsed .main{transition:none !important}' +
        'body.sidebar-collapsed .sidebar,body.sidebar-collapsed .main{transition:none !important}';
      document.head.appendChild(earlyStyle);
    } catch(e) {}
  }

  function aplicarEstado(){
    if (!isDesktop) return;
    var saved = localStorage.getItem(COLLAPSED_KEY);
    var sb = document.getElementById('sidebar') || document.querySelector('.sidebar');
    if (saved !== '0') {
      document.documentElement.classList.add('sidebar-collapsed');
      document.body.classList.add('sidebar-collapsed');
      if (sb) sb.classList.add('sidebar-collapsed');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
      document.body.classList.remove('sidebar-collapsed');
      if (sb) sb.classList.remove('sidebar-collapsed');
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
      var collapsed = !document.body.classList.contains('sidebar-collapsed');
      try { localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0'); } catch(e) {}
      if (collapsed) {
        document.documentElement.classList.add('sidebar-collapsed');
        document.body.classList.add('sidebar-collapsed');
        if (sb) sb.classList.add('sidebar-collapsed');
      } else {
        document.documentElement.classList.remove('sidebar-collapsed');
        document.body.classList.remove('sidebar-collapsed');
        if (sb) sb.classList.remove('sidebar-collapsed');
      }
      atualizarLegendaBtn();
    };
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

  // ═══════════════════════════════════════════════════════════════
  // INJECT NAV — injeta HTML da sidebar igual em TODAS as páginas
  // Uma mudança aqui reflete automaticamente em todas as páginas.
  // ═══════════════════════════════════════════════════════════════
  var NAV_ITEMS = [
    { section: 'Principal', id: 'nav-section--principal', items: [
      { href: 'dashboard.html',          ico: '🏠', lucide: 'layout-dashboard', label: 'Dashboard',      id: '' }
    ]},
    { section: 'Conteúdo', id: 'nav-section--conteudo', items: [
      { href: 'sala-de-aula.html',       ico: '📚', lucide: 'graduation-cap',  label: 'Sala de Aula',   id: 'tut-sala' },
      { href: 'g20flix.html',            ico: '🎬', lucide: 'clapperboard',    label: 'G20Flix',        id: 'tut-flix', badge: '80' },
      { href: 'g20cast.html',            ico: '🎧', lucide: 'headphones',      label: 'G20Cast',        id: 'tut-cast' },
      { href: 'carteira.html',           ico: '📊', lucide: 'trending-up',     label: 'Carteira G20',   id: 'tut-carteira' },
      { href: 'game.html',               ico: '🏆', lucide: 'trophy',          label: 'Game G20',       id: '' }
    ]},
    { section: 'Investimentos', id: 'nav-section--investimentos', items: [
      { href: 'gestao-patrimonial.html', ico: '💰', lucide: 'briefcase',       label: 'Minha Carteira', id: 'tut-gestao' }
    ]},
    { section: 'Comunidade', id: 'nav-section--comunidade', items: [
      { href: '#',                        ico: '👨‍💻', lucide: 'user-round',    label: 'Consultoria',    id: '' },
      { href: '#',                        ico: '💬', lucide: 'message-circle',  label: 'Grupo WhatsApp', id: '' }
    ]}
  ];

  function injectNav() {
    var sidebar = document.querySelector('#sidebar, .sidebar');
    if (!sidebar) return;

    // Detecta página atual
    var currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    // Se nav já foi injetada (ex: volta ao dashboard), só atualiza o active
    var existing = sidebar.querySelectorAll('.nav-section');
    if (existing.length > 0) {
      sidebar.querySelectorAll('.nav-item').forEach(function(a) {
        var href = a.getAttribute('href') || '';
        if (href !== '#' && href === currentPage) {
          a.classList.add('active');
        } else {
          a.classList.remove('active');
        }
      });
      return; // sem recriar DOM — sem flash
    }

    // Ponto de inserção: antes do sidebar-footer
    var footer = sidebar.querySelector('.sidebar-footer');

    // Usa DocumentFragment — monta off-screen, insere de uma vez
    var frag = document.createDocumentFragment();

    NAV_ITEMS.forEach(function(section) {
      var div = document.createElement('div');
      div.className = 'nav-section ' + section.id;

      var label = document.createElement('div');
      label.className = 'nav-label';
      label.textContent = section.section;
      div.appendChild(label);

      section.items.forEach(function(item) {
        var isActive = item.href !== '#' && currentPage === item.href;
        var a = document.createElement('a');
        a.href = item.href;
        a.className = 'nav-item' + (isActive ? ' active' : '');
        if (item.id) a.id = item.id;
        a.setAttribute('data-tooltip', item.label);
        a.onclick = function(){ if(typeof csm === 'function') csm(); };

        var ico = document.createElement('span');
        ico.className = 'ico';
        ico.textContent = item.ico;
        a.appendChild(ico);

        var i = document.createElement('i');
        i.setAttribute('data-lucide', item.lucide);
        a.appendChild(i);

        a.appendChild(document.createTextNode(item.label));

        if (item.badge) {
          var badge = document.createElement('span');
          badge.style.cssText = 'margin-left:6px;background:var(--gold);color:#000;font-size:9px;font-weight:700;padding:1px 6px;border-radius:8px';
          badge.textContent = item.badge;
          a.appendChild(badge);
        }

        div.appendChild(a);
      });

      frag.appendChild(div);
    });

    // Inserção única e atômica — sem múltiplos repaints
    if (footer) {
      sidebar.insertBefore(frag, footer);
    } else {
      sidebar.appendChild(frag);
    }

    // Re-inicializa lucide icons se disponível
    if (window.lucide && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  function init(){
    aplicarEstado();
    injectNav();
    injectCollapseBtn();
    setTooltips();
    bindClickBounce();
    injectLogoutConfirm();
    atualizarLegendaBtn();
    initPageFade();
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        document.body.classList.add('sidebar-ready');
      });
    });
  }

  // PAGE FADE — fade-in suave, sem tela preta
  // O delay:50ms garante que o browser pintou pelo menos 1 frame antes de começar
  function initPageFade() {
    if (document.getElementById('g20-page-fade')) return;
    var style = document.createElement('style');
    style.id = 'g20-page-fade';
    style.textContent =
      '@keyframes g20In{0%{opacity:0}100%{opacity:1}}' +
      '.main{animation:g20In 900ms ease-out 50ms both}';
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
