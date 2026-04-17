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
        '.nav-item{justify-content:center !important;padding:12px 0 !important;font-size:0 !important}' +
        '.nav-item span:not(.ico){display:none !important}' +
        '.nav-item .ico{font-size:20px !important}' +
        '.sidebar-footer-links{display:none !important}' +
        '.btn-logout{padding:10px 0 !important;justify-content:center !important;display:flex !important;align-items:center !important}' +
        '.btn-logout .logout-text{display:none !important}' +
        '.btn-logout .logout-ico{display:block !important;width:22px !important;height:22px !important}' +
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

  function init(){
    aplicarEstado();
    injectCollapseBtn();
    setTooltips();
    bindClickBounce();
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
