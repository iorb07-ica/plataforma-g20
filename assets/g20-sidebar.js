/* G20 — Sidebar colapsável compartilhada
   Auto-detecta a .sidebar, injeta o botão circular, aplica tooltip por
   nav-item, e persiste o estado em localStorage (g20_sidebar_collapsed).
   Compatível com as páginas que seguem o padrão: <nav class="sidebar">
   contendo <a class="nav-item"><span class="ico">...</span>Label</a>.
*/
(function(){
  'use strict';

  var COLLAPSED_KEY = 'g20_sidebar_collapsed';

  // 1) Sidebar colapsada por padrão (desktop). Só expande se o usuário explicitamente expandiu.
  try{
    var saved = localStorage.getItem(COLLAPSED_KEY);
    if(window.innerWidth>768 && saved !== '0'){
      document.body && document.body.classList.add('sidebar-collapsed');
    }
  }catch(e){}

  function atualizarLegendaBtn(){
    var btn = document.querySelector('.sidebar-collapse-btn');
    if(!btn) return;
    var collapsed = document.body.classList.contains('sidebar-collapsed');
    var txt = collapsed ? 'Expandir menu' : 'Recolher menu';
    btn.title = txt;
    btn.setAttribute('aria-label', txt);
  }

  window.toggleSidebarCollapse = function(){
    if(window.innerWidth<=768) return; // mobile: sidebar é overlay
    var collapsed = document.body.classList.toggle('sidebar-collapsed');
    try{ localStorage.setItem(COLLAPSED_KEY, collapsed?'1':'0'); }catch(e){}
    atualizarLegendaBtn();
  };

  function injectCollapseBtn(){
    var sidebar = document.querySelector('.sidebar');
    if(!sidebar) return;
    if(sidebar.querySelector('.sidebar-collapse-btn')) return;
    var btn = document.createElement('button');
    btn.className = 'sidebar-collapse-btn';
    btn.type = 'button';
    btn.onclick = window.toggleSidebarCollapse;
    btn.innerHTML = '<svg class="collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';
    sidebar.appendChild(btn);
  }

  // Auto-atribui data-tooltip em cada nav-item baseado no seu texto (após remover .ico e badges)
  function setTooltips(){
    document.querySelectorAll('.sidebar .nav-item').forEach(function(item){
      if(item.hasAttribute('data-tooltip')) return;
      var clone = item.cloneNode(true);
      clone.querySelectorAll('.ico, .badge-infinity').forEach(function(c){c.remove();});
      // Remove spans com style inline de badge (ex: contador 80 no G20Flix)
      clone.querySelectorAll('span[style*="margin-left:auto"], span[style*="background:var(--gold)"]').forEach(function(c){c.remove();});
      var text = (clone.textContent || '').trim();
      if(text) item.setAttribute('data-tooltip', text);
    });
  }

  function init(){
    injectCollapseBtn();
    setTooltips();
    atualizarLegendaBtn();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
