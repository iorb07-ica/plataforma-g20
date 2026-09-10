/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTH GUARD — G20 Masterclass
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Arquivo de proteção de autenticação. Deve ser importado ANTES de qualquer
 * outro script em TODAS as páginas protegidas (exceto login.html).
 * 
 * Comportamento:
 * 1. Injeta overlay opaco na página
 * 2. Aguarda Firebase Auth estar pronto
 * 3. Se NÃO há usuário logado → redireciona para login.html
 * 4. Se há usuário → remove overlay e deixa página carregar
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // 1. INJETA OVERLAY IMEDIATAMENTE (antes de qualquer conteúdo aparecer)
  // ─────────────────────────────────────────────────────────────────────────
  
  var overlay = document.createElement('div');
  overlay.id = 'g20-auth-guard-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: #090b0f;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 1;
    transition: opacity 0.3s ease;
  `;
  
  var spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 40px;
    height: 40px;
    border: 3px solid rgba(232, 184, 75, 0.2);
    border-top-color: #e8b84b;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  `;
  
  var style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  
  overlay.appendChild(spinner);
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. AGUARDA FIREBASE AUTH ESTAR PRONTO (com retry)
  // ─────────────────────────────────────────────────────────────────────────
  
  var attempts = 0;
  var maxAttempts = 50; // 5 segundos com 100ms de delay
  
  function checkAuth() {
    attempts++;
    
    // Aguarda Firebase estar disponível
    if (typeof firebase === 'undefined' || !firebase.auth) {
      if (attempts < maxAttempts) {
        setTimeout(checkAuth, 100);
      } else {
        // Firebase não respondeu em tempo - redireciona para segurança
        console.warn('[Auth Guard] Firebase não respondeu');
        window.location.href = 'login.html';
      }
      return;
    }

    var auth = firebase.auth();
    
    // Aguarda estado de autenticação estar resolvido
    auth.onAuthStateChanged(function(user) {
      if (!user) {
        // ✗ NÃO está autenticado → redireciona para login
        window.location.href = 'login.html';
        return;
      }
      
      // ✓ ESTÁ autenticado → remove overlay e deixa página carregar
      overlay.style.opacity = '0';
      setTimeout(function() {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    });
  }

  // Inicia verificação quando documento estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }

})();
