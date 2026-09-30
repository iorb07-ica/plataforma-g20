/* ════════════════════════════════════════════════════════════════════
   G20Seletor · seletor em menu para o celular (v1 · set/2026)

   Transforma um grupo de botões (ex.: 1M 6M YTD 1A 5A Max) num único botão
   que abre a lista de opções, SÓ em telas estreitas. No desktop o grupo
   original continua igual.

   Não duplica regra de negócio: ao escolher uma opção, ele CLICA o botão
   original correspondente, então o comportamento é exatamente o mesmo.
   Acompanha o estado do grupo (se o período mudar por outro caminho, o
   rótulo atualiza) e lembra a última escolha por grupo (localStorage).

   Uso:
     G20Seletor.transformar(elementoDoGrupo, {
       itens: '.v21-chart-period',   // seletor das opções dentro do grupo
       attr: 'data-period',          // atributo com o valor da opção
       ativo: 'active',              // classe da opção ativa
       chave: 'g20_sel_rent',        // chave para lembrar a escolha
       titulo: 'Período',            // título do menu
       rotulos: { '1m': '1 mês', ... },
       larguraMax: 600               // até que largura vira menu
     });
   ════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.G20Seletor) return;

  var CSS = '' +
    '.g20sel-wrap{position:relative;display:none;flex:0 0 auto}' +
    '.g20sel-btn{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 12px 0 14px;border-radius:10px;' +
      'border:1px solid rgba(201,169,97,.35);background:rgba(201,169,97,.1);color:var(--gold,#c9a961);' +
      'font:700 13px "DM Sans",system-ui,sans-serif;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent}' +
    '.g20sel-btn:focus-visible{outline:2px solid var(--gold,#c9a961);outline-offset:2px}' +
    '.g20sel-seta{width:14px;height:14px;transition:transform .15s}' +
    '.g20sel-wrap.aberto .g20sel-seta{transform:rotate(180deg)}' +
    '.g20sel-menu{position:absolute;top:calc(100% + 6px);right:0;min-width:180px;max-width:calc(100vw - 24px);z-index:9000;' +
      'background:#1f1e22;border:1px solid rgba(201,169,97,.3);border-radius:12px;padding:6px;box-shadow:0 14px 34px rgba(0,0,0,.45);' +
      'display:none}' +
    '.g20sel-wrap.aberto .g20sel-menu{display:block}' +
    '.g20sel-tit{font:800 10.5px "DM Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#9a958e;padding:6px 10px 4px}' +
    '.g20sel-op{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:42px;padding:0 10px;' +
      'border:0;border-radius:8px;background:transparent;color:#e8e6e3;font:600 14px "DM Sans",sans-serif;text-align:left;cursor:pointer}' +
    '.g20sel-op:hover,.g20sel-op:focus-visible{background:rgba(201,169,97,.1);outline:none}' +
    '.g20sel-op[aria-selected="true"]{color:var(--gold,#c9a961)}' +
    '.g20sel-op[aria-selected="true"]::after{content:"✓";font-weight:800}' +
    '.light .g20sel-menu{background:#fff;border-color:rgba(0,0,0,.1)}' +
    '.light .g20sel-op{color:#1a191e}';

  function injetarCss(){
    if (document.getElementById('g20-seletor-css')) return;
    var st = document.createElement('style'); st.id = 'g20-seletor-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  var instancias = [];
  var SETA = '<svg class="g20sel-seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  function transformar(grupo, o){
    if (!grupo || grupo.__g20sel) return null;
    injetarCss();
    o = o || {};
    var itensSel = o.itens || 'button', attr = o.attr || 'data-value', ativo = o.ativo || 'active';
    var larguraMax = o.larguraMax || 600, rotulos = o.rotulos || {};
    var id = 'g20sel-' + (instancias.length + 1);

    // regra de exibição por largura: esconde o grupo e mostra o botão
    var st = document.createElement('style');
    st.textContent = '@media (max-width:' + larguraMax + 'px){[data-g20sel="' + id + '"]{display:none!important}' +
      '[data-g20sel-wrap="' + id + '"]{display:inline-flex!important}}';
    document.head.appendChild(st);
    grupo.setAttribute('data-g20sel', id);

    var wrap = document.createElement('div');
    wrap.className = 'g20sel-wrap'; wrap.setAttribute('data-g20sel-wrap', id);
    wrap.innerHTML = '<button type="button" class="g20sel-btn" aria-haspopup="listbox" aria-expanded="false">' +
      '<span class="g20sel-rot"></span>' + SETA + '</button>' +
      '<div class="g20sel-menu" role="listbox" tabindex="-1">' + (o.titulo ? '<div class="g20sel-tit">' + o.titulo + '</div>' : '') + '</div>';
    grupo.parentNode.insertBefore(wrap, grupo.nextSibling);
    var btn = wrap.querySelector('.g20sel-btn'), menu = wrap.querySelector('.g20sel-menu'), rot = wrap.querySelector('.g20sel-rot');

    function itens(){ return Array.prototype.slice.call(grupo.querySelectorAll(itensSel)); }
    function valorDe(el){ return el.getAttribute(attr); }
    function nomeDe(el){ var v = valorDe(el); return rotulos[v] || (el.textContent || '').trim(); }
    function atual(){ return itens().filter(function(el){ return el.classList.contains(ativo); })[0] || null; }

    function montarMenu(){
      menu.querySelectorAll('.g20sel-op').forEach(function(x){ x.remove(); });
      var at = atual();
      itens().forEach(function(el){
        var op = document.createElement('button');
        op.type = 'button'; op.className = 'g20sel-op'; op.setAttribute('role', 'option');
        op.setAttribute('aria-selected', el === at ? 'true' : 'false');
        op.setAttribute('data-v', valorDe(el));
        op.textContent = nomeDe(el);
        op.addEventListener('click', function(){ escolher(valorDe(el)); });
        menu.appendChild(op);
      });
    }
    function sincronizar(){
      var at = atual();
      rot.textContent = at ? nomeDe(at) : (o.titulo || 'Selecionar');
      btn.setAttribute('aria-label', (o.titulo ? o.titulo + ': ' : '') + rot.textContent);
      menu.querySelectorAll('.g20sel-op').forEach(function(op){ op.setAttribute('aria-selected', at && op.getAttribute('data-v') === valorDe(at) ? 'true' : 'false'); });
    }
    function abrir(){ montarMenu(); wrap.classList.add('aberto'); btn.setAttribute('aria-expanded', 'true');
      var s = menu.querySelector('[aria-selected="true"]') || menu.querySelector('.g20sel-op'); if (s) s.focus({ preventScroll: true });
      // mantém o menu dentro da tela
      menu.style.right = '0'; menu.style.left = 'auto';
      var r = menu.getBoundingClientRect(); if (r.left < 8) { menu.style.right = 'auto'; menu.style.left = '0'; }
    }
    function fechar(){ wrap.classList.remove('aberto'); btn.setAttribute('aria-expanded', 'false'); }
    function escolher(v){
      var el = itens().filter(function(x){ return valorDe(x) === v; })[0];
      fechar();
      if (el && !el.classList.contains(ativo)) el.click();   // mesma lógica do botão original
      btn.focus({ preventScroll: true });
    }

    btn.addEventListener('click', function(e){ e.stopPropagation(); wrap.classList.contains('aberto') ? fechar() : abrir(); });
    document.addEventListener('click', function(e){ if (!wrap.contains(e.target)) fechar(); });
    wrap.addEventListener('keydown', function(e){
      if (e.key === 'Escape') { fechar(); btn.focus(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var ops = Array.prototype.slice.call(menu.querySelectorAll('.g20sel-op')); if (!ops.length) return;
        if (!wrap.classList.contains('aberto')) { abrir(); e.preventDefault(); return; }
        var i = ops.indexOf(document.activeElement); i = (i + (e.key === 'ArrowDown' ? 1 : -1) + ops.length) % ops.length;
        ops[i].focus(); e.preventDefault();
      }
    });

    // lembra a escolha feita por qualquer caminho
    if (o.chave) grupo.addEventListener('click', function(e){
      var el = e.target.closest && e.target.closest(itensSel);
      if (el && grupo.contains(el)) { try { localStorage.setItem(o.chave, valorDe(el)); } catch(err){} }
    }, true);

    // acompanha mudanças de estado vindas do próprio card
    try { new MutationObserver(sincronizar).observe(grupo, { subtree: true, attributes: true, attributeFilter: ['class'] }); } catch(e){}
    sincronizar();

    var inst = {
      grupo: grupo, sincronizar: sincronizar,
      restaurar: function(){
        if (!o.chave) return;
        var v = null; try { v = localStorage.getItem(o.chave); } catch(e){}
        if (!v) return;
        var el = itens().filter(function(x){ return valorDe(x) === v; })[0];
        if (el && !el.classList.contains(ativo)) el.click();
      }
    };
    grupo.__g20sel = inst; instancias.push(inst);
    return inst;
  }

  window.G20Seletor = { transformar: transformar, versao: 1 };
})();
