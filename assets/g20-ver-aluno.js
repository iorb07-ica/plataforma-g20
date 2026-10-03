/* ═══════════════════════════════════════════════════════════════════════════
   VER COMO O ALUNO · somente leitura · só para o admin (out/2026)
   Uso: gestao-patrimonial.html?ver=<uid>  ou  gestao-financeira.html?ver=<uid>

   Como funciona (carregar DEPOIS dos scripts do Firebase e ANTES do código
   da página):
   1) A página "acha" que o usuário logado é o aluno: o uid do login vira o
      do aluno (o token de acesso continua sendo o do admin, então as regras
      do Firestore deixam ler porque é admin).
   2) NENHUMA gravação sai: set, update, delete, add, batch e transações do
      Firestore viram "não faz nada" nesta aba.
   3) O cache local da página (localStorage) vira uma memória temporária
      desta aba: o cache do próprio admin não é tocado nem misturado.
   4) Quem não for admin é mandado de volta para a página normal (e as regras
      do Firestore já impedem um aluno de ler os dados de outro).
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var m = (location.search || '').match(/[?&]ver=([A-Za-z0-9_-]{6,64})/);
  if (!m || !window.firebase) return;
  var ALVO = m[1];
  window.G20_VER_ALUNO = ALVO;

  // ── 2) bloqueio total de gravação no Firestore ─────────────────────────
  function nada(){ console.info('[Ver como aluno] gravação bloqueada (somente leitura)'); return Promise.resolve(); }
  function travarFirestore(){
    try {
      var fs = firebase.firestore;
      if (!fs || fs.__travado) return;
      ['set', 'update', 'delete'].forEach(function(k){ if (fs.DocumentReference && fs.DocumentReference.prototype[k]) fs.DocumentReference.prototype[k] = nada; });
      if (fs.CollectionReference && fs.CollectionReference.prototype.add) fs.CollectionReference.prototype.add = function(){ nada(); return Promise.resolve(this.doc('somente-leitura')); };
      if (fs.WriteBatch && fs.WriteBatch.prototype.commit) fs.WriteBatch.prototype.commit = nada;
      if (fs.Firestore && fs.Firestore.prototype.runTransaction) fs.Firestore.prototype.runTransaction = function(){ return nada(); };
      fs.__travado = true;
    } catch(e){ console.warn('[Ver como aluno] trava', e); }
  }
  travarFirestore();

  // ── 3) cache local separado (memória desta aba) ────────────────────────
  var mem = {}, LS = Storage.prototype, oGet = LS.getItem, oSet = LS.setItem, oRem = LS.removeItem;
  function eLocal(s){ try { return s === window.localStorage; } catch(e){ return false; } }
  LS.getItem = function(k){
    if (!eLocal(this)) return oGet.call(this, k);
    if (k === 'g20_uid' || k === 'g20_dados_owner') return ALVO;
    if (k === 'g20_perfil_ok') return '1';   // a trava de perfil incompleto é do aluno, não do admin que está vendo
    if (Object.prototype.hasOwnProperty.call(mem, k)) return mem[k];
    // preferências visuais do admin (tema etc.) continuam valendo; dados do aluno não
    if (/^(g20-theme|g20_theme|g20_sidebar|g20_tour|firebase:|__)/.test(k)) return oGet.call(this, k);   // tema do admin e chaves internas do Firebase
    return null;
  };
  LS.setItem = function(k, v){ if (!eLocal(this)) return oSet.call(this, k, v); mem[k] = String(v); };
  LS.removeItem = function(k){ if (!eLocal(this)) return oRem.call(this, k); delete mem[k]; };

  // ── 1) o login "vira" o aluno nesta aba ───────────────────────────────
  var real = null, perfilAluno = null;
  function proxy(u){
    if (!u) return u;
    return new Proxy(u, { get: function(t, p){
      if (p === 'uid') return ALVO;
      if (p === 'email') return (perfilAluno && perfilAluno.email) || t.email;
      if (p === 'displayName') return (perfilAluno && (perfilAluno.name || perfilAluno.nome)) || t.displayName;
      var v = t[p]; return typeof v === 'function' ? v.bind(t) : v;
    } });
  }
  var oAuth = firebase.auth;
  firebase.auth = function(){
    var a = oAuth.apply(this, arguments);
    if (!a.__verAluno) {
      a.__verAluno = true;
      try { Object.defineProperty(a, 'currentUser', { configurable: true, get: function(){ var u = Object.getPrototypeOf(a) && Object.getOwnPropertyDescriptor(Object.getPrototypeOf(a), 'currentUser'); var r = u && u.get ? u.get.call(a) : real; return proxy(r); } }); } catch(e){}
      var oState = a.onAuthStateChanged.bind(a);
      a.__onAuthOrig = oState;
      a.onAuthStateChanged = function(cb, err){ return oState(function(u){ real = u; cb(proxy(u)); }, err); };
    }
    return a;
  };
  Object.keys(oAuth).forEach(function(k){ try { firebase.auth[k] = oAuth[k]; } catch(e){} });

  // ── 4) confere se quem está vendo é admin + faixa no topo ─────────────
  function sair(motivo){ console.warn('[Ver como aluno] saindo:', motivo); location.href = location.pathname; }
  function faixa(nome){
    var b = document.createElement('div');
    b.id = 'g20VerAlunoFaixa';
    b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:linear-gradient(90deg,#7c2d12,#9a3412);color:#fff;font:700 13.5px/1.3 "DM Sans",system-ui,sans-serif;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:10px;box-shadow:0 -6px 20px rgba(0,0,0,.35)';
    b.innerHTML = '<span style="font-size:18px">👁</span><span style="flex:1">Vendo como <b></b> · somente leitura: nada do que você fizer aqui é salvo</span><button type="button" style="border:1px solid rgba(255,255,255,.6);background:transparent;color:#fff;border-radius:999px;padding:6px 14px;font:inherit;cursor:pointer;white-space:nowrap">← Voltar aos alunos</button>';
    b.querySelector('b').textContent = nome || 'aluno';
    b.querySelector('button').onclick = function(){ location.href = 'admin-acompanhamento.html'; };   // volta para a lista de alunos
    document.body.appendChild(b);
    document.body.style.paddingBottom = '56px';
  }
  (function esperar(n){
    if (!(firebase.apps && firebase.apps.length)) { if (n > 0) setTimeout(function(){ esperar(n - 1); }, 100); return; }
    travarFirestore();
    var _a = firebase.auth();   // já com a troca; a conferência usa o login REAL
    (_a.__onAuthOrig || _a.onAuthStateChanged.bind(_a))(function(u){
    if (!u) return;
    var db = firebase.firestore();
    db.collection('users').doc(u.uid).get().then(function(d){
      var eu = d.exists ? d.data() : {};
      if (eu.role !== 'admin') { sair('não é admin'); return; }
      return db.collection('users').doc(ALVO).get().then(function(a){
        perfilAluno = a.exists ? a.data() : {};
        var nome = perfilAluno.name || perfilAluno.nome || perfilAluno.email || 'aluno';
        document.title = '👁 ' + nome + ' · ' + document.title;
        if (document.body) faixa(nome); else document.addEventListener('DOMContentLoaded', function(){ faixa(nome); });
      });
    }).catch(function(e){ sair(e && e.message); });
    });
  })(100);
})();
