/* G20 — Sidebar colapsável compartilhada */
(function(){
  'use strict';

  var COLLAPSED_KEY = 'g20_sidebar_collapsed';
  var isDesktop = window.innerWidth > 768;

  // 1) Injeta <style> bloqueante ANTES do render para evitar qualquer flash.
  //    Se colapsada, sidebar=68px e main margin=68px SEM transição.
  var earlyStyle = null;
  try {
    var saved = localStorage.getItem(COLLAPSED_KEY);
    if (isDesktop && saved !== '0') {
      earlyStyle = document.createElement('style');
      earlyStyle.id = 'g20-sidebar-early';
      earlyStyle.textContent =
        '.sidebar{width:68px !important;transition:none !important}' +
        '.main{margin-left:68px !important;transition:none !important}' +
        '.nav-label{display:none !important}' +
        '.user-info,.user-edit-ico,.badge-infinity{display:none !important}' +
        '.nav-item{justify-content:center !important;padding:0 !important;height:46px !important;font-size:0 !important}' +
        '.nav-item span:not(.ico){display:none !important}' +
        '.nav-item .ico{font-size:20px !important}' +
        '.sidebar-footer-links{display:none !important}' +
        '.btn-logout{padding:10px 0 !important;justify-content:center !important;display:flex !important;align-items:center !important}' +
        '.btn-logout .logout-text{display:none !important}' +
        '.btn-logout .logout-ico{display:inline-block !important;width:22px !important;height:22px !important}' +
        '.logo-ball-wrap{padding:16px 8px 14px !important}' +
        '.logo-ball{width:44px !important;height:44px !important}' +
        '.sidebar-user{justify-content:center !important;padding:14px 0 !important}';
      document.head.appendChild(earlyStyle);
    }
  } catch(e) {}

  function aplicarEstado(){
    if (!isDesktop) return;
    var saved = localStorage.getItem(COLLAPSED_KEY);
    if (saved !== '0') {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    // Remove o style de emergência — agora body.sidebar-collapsed cuida de tudo
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
  // Expor para o dashboard chamar após animar o toggle
  window._g20AtualizarLegendaBtn = atualizarLegendaBtn;

  // toggleSidebarCollapse é definido pelo dashboard-v21.html (com animação).
  // O g20-sidebar.js NÃO sobrescreve — apenas define fallback se não existir.
  if (!window.toggleSidebarCollapse) {
    window.toggleSidebarCollapse = function(){
      if (window.innerWidth <= 768) return;
      var collapsed = !document.body.classList.contains('sidebar-collapsed');
      try { localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0'); } catch(e) {}
      if (collapsed) {
        document.body.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
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

  function init(){
    aplicarEstado();
    injectCollapseBtn();
    setTooltips();
    bindClickBounce();
    injectLogoutConfirm();
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
})();
