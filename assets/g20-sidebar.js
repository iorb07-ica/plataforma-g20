/* G20 — Sidebar colapsável compartilhada v2
   Reescrito para eliminar conflitos com CSS overrides
   ─────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var COLLAPSED_KEY = 'g20_sidebar_collapsed';
  var DURATION = 400; // ms — igual ao transition do CSS

  // ─── Estado inicial SEM earlyStyle (causa de pulos) ───────
  // O CSS já cuida do estado inicial via body.sidebar-collapsed
  // aplicado antes do render por este script

  function isDesktop() {
    return window.innerWidth > 768;
  }

  // Aplica estado inicial imediatamente — sem criar <style> extra
  function aplicarEstadoInicial() {
    if (!isDesktop()) return;
    var saved = localStorage.getItem(COLLAPSED_KEY);
    // Default: expandido (saved === null ou '0')
    if (saved === '1') {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }

  // Toggle principal — cortina suave sem pulo
  window.toggleSidebarCollapse = function () {
    if (!isDesktop()) return;

    var sb = document.querySelector('.sidebar');
    var main = document.querySelector('.main');
    if (!sb) return;

    var isCollapsed = document.body.classList.contains('sidebar-collapsed');

    if (!isCollapsed) {
      // RECOLHENDO: animar width manualmente ANTES de adicionar classe
      // Isso evita que o CSS do body.sidebar-collapsed mude tamanhos abruptamente
      sb.style.transition = 'width ' + DURATION + 'ms cubic-bezier(.4,0,.2,1)';
      sb.style.width = 'var(--sidebar-collapsed, 68px)';
      if (main) {
        main.style.transition = 'margin-left ' + DURATION + 'ms cubic-bezier(.4,0,.2,1)';
        main.style.marginLeft = 'var(--sidebar-collapsed, 68px)';
      }
      setTimeout(function () {
        // Limpar inline styles e deixar CSS tomar conta
        sb.style.width = '';
        sb.style.transition = '';
        if (main) {
          main.style.transition = '';
          main.style.marginLeft = '';
        }
        document.body.classList.add('sidebar-collapsed');
        try { localStorage.setItem(COLLAPSED_KEY, '1'); } catch (e) {}
        atualizarLegendaBtn();
        wrapNavTexts();
      }, DURATION);

    } else {
      // EXPANDINDO: remover classe imediatamente — cortina abre naturalmente
      document.body.classList.remove('sidebar-collapsed');
      if (main) {
        main.style.transition = '';
        main.style.marginLeft = '';
      }
      try { localStorage.setItem(COLLAPSED_KEY, '0'); } catch (e) {}
      atualizarLegendaBtn();
    }
  };

  function atualizarLegendaBtn() {
    var btn = document.querySelector('.sidebar-collapse-btn');
    if (!btn) return;
    var collapsed = document.body.classList.contains('sidebar-collapsed');
    btn.title = collapsed ? 'Expandir menu' : 'Recolher menu';
    btn.setAttribute('aria-label', collapsed ? 'Expandir menu' : 'Recolher menu');
  }

  // Injeta botão orelha — apenas se não existir ainda
  function injectCollapseBtn() {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar || sidebar.querySelector('.sidebar-collapse-btn')) return;
    var btn = document.createElement('button');
    btn.className = 'sidebar-collapse-btn';
    btn.type = 'button';
    btn.onclick = window.toggleSidebarCollapse;
    btn.innerHTML =
      '<svg class="collapse-icon" viewBox="0 0 24 24" fill="none" ' +
      'stroke="#3d2e00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' +
      '<polyline points="15 18 9 12 15 6" stroke="#3d2e00" stroke-width="3"/>' +
      '</svg>';
    sidebar.appendChild(btn);
  }

  // Wrappa textos dos nav-items em span.nav-item-text para transição suave
  function wrapNavTexts() {
    document.querySelectorAll('.sidebar .nav-item').forEach(function (item) {
      if (item.querySelector('.nav-item-text')) return; // já wrappado
      item.childNodes.forEach(function (node) {
        if (node.nodeType === 3 && node.textContent.trim()) {
          var span = document.createElement('span');
          span.className = 'nav-item-text';
          span.textContent = node.textContent;
          item.replaceChild(span, node);
        }
      });
    });
  }

  // Tooltips para nav-items no collapsed
  function setTooltips() {
    document.querySelectorAll('.sidebar .nav-item').forEach(function (item) {
      if (item.hasAttribute('data-tooltip')) return;
      var clone = item.cloneNode(true);
      clone.querySelectorAll('.ico, .badge-infinity, .nav-item-text').forEach(function (c) { c.remove(); });
      var text = (clone.textContent || '').trim();
      if (text) item.setAttribute('data-tooltip', text);
    });
    var logout = document.querySelector('.sidebar .btn-logout');
    if (logout && !logout.hasAttribute('data-tooltip')) {
      logout.setAttribute('data-tooltip', 'Sair');
    }
  }

  // Confirmação de logout
  function injectLogoutConfirm() {
    var btn = document.querySelector('.sidebar .btn-logout');
    if (!btn || btn._confirmBound) return;
    btn._confirmBound = true;
    var originalOnclick = btn.getAttribute('onclick');
    btn.removeAttribute('onclick');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      showLogoutConfirm(originalOnclick);
    });
  }

  function showLogoutConfirm(action) {
    var existing = document.getElementById('g20LogoutConfirm');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'g20LogoutConfirm';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);' +
      '-webkit-backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;' +
      'justify-content:center;animation:g20FadeIn .15s ease';
    var box = document.createElement('div');
    box.style.cssText =
      'background:var(--bg2,#0d1018);border:1px solid var(--border,rgba(255,255,255,.06));' +
      'border-radius:16px;padding:28px 32px;max-width:360px;width:90vw;' +
      'box-shadow:0 24px 60px rgba(0,0,0,.6);text-align:center';
    box.innerHTML =
      '<div style="font-size:36px;margin-bottom:12px">👋</div>' +
      '<div style="font-size:18px;font-weight:700;color:var(--text,#eef0f4);margin-bottom:6px">Deseja sair?</div>' +
      '<div style="font-size:13px;color:var(--text2,#9aa5b8);margin-bottom:24px;line-height:1.5">' +
      'Você será desconectado da plataforma G20 Masterclass.</div>' +
      '<div style="display:flex;gap:10px;justify-content:center">' +
      '<button id="g20LogoutCancel" style="flex:1;padding:10px 20px;border-radius:10px;font-size:13px;' +
      'font-weight:700;cursor:pointer;border:1px solid var(--border,rgba(255,255,255,.06));' +
      'background:transparent;color:var(--text2,#9aa5b8);transition:all .15s;font-family:inherit">Cancelar</button>' +
      '<button id="g20LogoutOk" style="flex:1;padding:10px 20px;border-radius:10px;font-size:13px;' +
      'font-weight:700;cursor:pointer;border:none;background:linear-gradient(135deg,#e63946,#c0392b);' +
      'color:#fff;transition:all .15s;font-family:inherit;box-shadow:0 4px 14px rgba(230,57,70,.3)">Sair</button>' +
      '</div>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function closeConfirm() {
      var el = document.getElementById('g20LogoutConfirm');
      if (el) el.remove();
    }

    overlay.addEventListener('click', function (ev) { if (ev.target === overlay) closeConfirm(); });
    document.getElementById('g20LogoutCancel').addEventListener('click', closeConfirm);
    document.getElementById('g20LogoutOk').addEventListener('click', function () {
      closeConfirm();
      if (action) {
        try { eval(action); } catch (err) { window.location.href = 'login.html'; }
      } else {
        window.location.href = 'login.html';
      }
    });

    var cancelBtn = document.getElementById('g20LogoutCancel');
    var okBtn = document.getElementById('g20LogoutOk');
    cancelBtn.addEventListener('mouseenter', function () {
      this.style.borderColor = 'var(--gold,#e8b84b)';
      this.style.color = 'var(--text,#eef0f4)';
    });
    cancelBtn.addEventListener('mouseleave', function () {
      this.style.borderColor = 'var(--border,rgba(255,255,255,.06))';
      this.style.color = 'var(--text2,#9aa5b8)';
    });
    okBtn.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-1px)';
      this.style.boxShadow = '0 6px 20px rgba(230,57,70,.4)';
    });
    okBtn.addEventListener('mouseleave', function () {
      this.style.transform = '';
      this.style.boxShadow = '0 4px 14px rgba(230,57,70,.3)';
    });
  }

  function init() {
    aplicarEstadoInicial();
    injectCollapseBtn();
    wrapNavTexts();
    setTooltips();
    injectLogoutConfirm();
    atualizarLegendaBtn();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
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
