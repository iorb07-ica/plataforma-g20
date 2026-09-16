/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTH GUARD — G20 Masterclass
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  var overlay = null;
  var spinner = null;
  
  // Função para criar e injetar overlay
  function injetarOverlay() {
    if (!document.body) {
      setTimeout(injetarOverlay, 100);
      return;
    }
    
    overlay = document.createElement('div');
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
    
    spinner = document.createElement('div');
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
  }

  // Função para remover overlay
  function removerOverlay() {
    if (!overlay) return;
    overlay.style.opacity = '0';
    setTimeout(function() {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 300);
  }

  // Aguarda Firebase
  var attempts = 0;
  var maxAttempts = 50;
  
  function checkAuth() {
    attempts++;
    
    if (typeof firebase === 'undefined' || !firebase.auth) {
      if (attempts < maxAttempts) {
        setTimeout(checkAuth, 100);
      } else {
        console.warn('[Auth Guard] Firebase não respondeu');
        window.location.href = 'login.html';
      }
      return;
    }

    var auth = firebase.auth();
    
    // Injeta overlay quando Firebase tá pronto
    injetarOverlay();
    
    // Aguarda estado de auth
    auth.onAuthStateChanged(function(user) {
      if (!user) {
        window.location.href = 'login.html';
        return;
      }
      
      removerOverlay();
    });
  }

  // Inicia quando DOM tá pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }

})();
