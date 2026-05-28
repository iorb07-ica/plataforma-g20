/* ════════════════════════════════════════════════════════════
 * G20 SEARCH — Componente compartilhado de busca universal
 * ════════════════════════════════════════════════════════════
 * - Auto-injeta o HTML do overlay no body (se não existir)
 * - Atalhos: Cmd+K / Ctrl+K para abrir, Esc para fechar
 * - Setas ↑/↓ para navegar, Enter para selecionar
 * ════════════════════════════════════════════════════════════ */

(function(){
  // Auto-injetar HTML do overlay se ainda não existir na página
  function injectOverlay(){
    if(document.getElementById('gsearchOverlay')) return;
    var html = ''
      + '<div class="gsearch-overlay" id="gsearchOverlay" onclick="if(event.target===this)gsearchFechar()">'
      +   '<div class="gsearch-modal" role="dialog" aria-label="Busca universal">'
      +     '<div class="gsearch-header">'
      +       '<span class="gs-ico">🔍</span>'
      +       '<input type="text" id="gsearchInput" class="gsearch-input" placeholder="Busque páginas, ativos, episódios, termos…" autocomplete="off">'
      +       '<span class="gsearch-kbd">Esc</span>'
      +     '</div>'
      +     '<div class="gsearch-list" id="gsearchList"></div>'
      +     '<div class="gsearch-hint">'
      +       '<span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>'
      +       '<span><kbd>Enter</kbd> abrir</span>'
      +       '<span><kbd>Esc</kbd> fechar</span>'
      +     '</div>'
      +   '</div>'
      + '</div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', injectOverlay);
  } else {
    injectOverlay();
  }
})();

var GSEARCH_INDEX = [
  // P ginas
  {g:'Páginas', ico:'🏠', t:'Dashboard', s:'Painel principal', link:'dashboard.html'},
  {g:'Páginas', ico:'🎓', t:'Sala de Aula', s:'Todos os módulos e aulas', link:'sala-de-aula.html'},
  {g:'Páginas', ico:'🎬', t:'G20Flix', s:'80 episódios · lives mensais', link:'g20flix.html'},
  {g:'Páginas', ico:'🎧', t:'G20Cast', s:'Podcast diário', link:'g20cast.html'},
  {g:'Páginas', ico:'📈', t:'Carteira G20', s:'116 ativos · carteira educacional', link:'carteira.html'},
  {g:'Páginas', ico:'💼', t:'Gestão Patrimonial', s:'Seu patrimônio real', link:'gestao-patrimonial.html'},
  {g:'Páginas', ico:'🏆', t:'Game G20', s:'Monte sua carteira e concorra a prêmios', link:'game.html'},
  {g:'Páginas', ico:'👤', t:'Meu Perfil', s:'Editar dados pessoais', link:'perfil.html'},
  // A  es
  {g:'Ações', ico:'➕', t:'Registrar aporte', s:'Gestão Patrimonial', link:'gestao-patrimonial.html'},
  {g:'Ações', ico:'📊', t:'Ver carteira de ações', s:'Sua RV na Gestão Patrimonial', link:'gestao-patrimonial.html'},
  {g:'Ações', ico:'💰', t:'Ver renda fixa', s:'CDB, LCI, Tesouro...', link:'gestao-patrimonial.html'},
  {g:'Ações', ico:'🏠', t:'Ver imóveis e bens', s:'Patrimônio Total', link:'gestao-patrimonial.html'},
  // G20Flix — itens dinâmicos gerados em _gsearchFlixDinamico() a partir de window.FLIX_CURRENT_EP
  // Cursos   Sala de Aula
  {g:'Cursos', ico:'🎓', t:'Mercado de Capitais do Zero', s:'12 aulas · 3h20 · Fundamentos', link:'sala-de-aula.html'},
  {g:'Cursos', ico:'🎓', t:'Análise Fundamentalista Completa', s:'18 aulas · 5h45 · Análise', link:'sala-de-aula.html'},
  {g:'Cursos', ico:'🎓', t:'Fundos Imobiliários na Prática', s:'14 aulas · 4h10 · FIIs', link:'sala-de-aula.html'},
  {g:'Cursos', ico:'🎓', t:'Investimentos no Exterior', s:'16 aulas · 4h55 · Internacional', link:'sala-de-aula.html'},
  {g:'Cursos', ico:'🎓', t:'Gestão de Carteira & Rebalanceamento', s:'10 aulas · 3h00 · Estratégia', link:'sala-de-aula.html'},
  {g:'Cursos', ico:'🎓', t:'Criptomoedas no Portfólio', s:'8 aulas · 2h30 · Cripto', link:'sala-de-aula.html'},
  // Aulas individuais
  {g:'Aulas', ico:'📹', t:'O que é uma ação e como funciona o mercado', s:'Fundamentos · 22min', link:'sala-de-aula.html'},
  {g:'Aulas', ico:'📹', t:'P/L, P/VP e os múltiplos essenciais', s:'Fundamentos · 34min', link:'sala-de-aula.html'},
  {g:'Aulas', ico:'📹', t:'Como ler DRE e Balanço Patrimonial', s:'Fundamentos · 41min', link:'sala-de-aula.html'},
  {g:'Aulas', ico:'📹', t:'Dividendos: yield e como avaliar', s:'Fundamentos · 28min', link:'sala-de-aula.html'},
  {g:'Aulas', ico:'📹', t:'Candlesticks: leitura e padrões', s:'Análise Técnica · 35min', link:'sala-de-aula.html'},
  {g:'Aulas', ico:'📹', t:'Médias móveis e Bandas de Bollinger', s:'Análise Técnica · 29min', link:'sala-de-aula.html'},
  {g:'Aulas', ico:'📹', t:'Como investir em ações americanas', s:'Stocks US · 48min', link:'sala-de-aula.html'},
  {g:'Aulas', ico:'📹', t:'REITs: fundos imobiliários americanos', s:'REITs · 36min', link:'sala-de-aula.html'},
  {g:'Aulas', ico:'📹', t:'ETFs globais: IWDA, VWCE, CSPX', s:'ETFs · 42min', link:'sala-de-aula.html'},
  // Termos / gloss rio r pidos
  {g:'Termos', ico:'📘', t:'CDI', s:'Certificado de Depósito Interbancário · taxa base da RF', link:'gestao-patrimonial.html'},
  {g:'Termos', ico:'📘', t:'Selic', s:'Taxa básica de juros do Brasil', link:'gestao-patrimonial.html'},
  {g:'Termos', ico:'📘', t:'IPCA', s:'Índice oficial de inflação', link:'gestao-patrimonial.html'},
  {g:'Termos', ico:'📘', t:'Dividend Yield', s:'Proventos / preço da ação', link:'carteira.html'},
  {g:'Termos', ico:'📘', t:'Renda Fixa', s:'Ativos com rendimento pré-definido', link:'gestao-patrimonial.html'},
  {g:'Termos', ico:'📘', t:'Renda Variável', s:'Ações, FIIs, ETFs etc', link:'carteira.html'},
  {g:'Termos', ico:'📘', t:'FII', s:'Fundo de Investimento Imobiliário', link:'carteira.html'},
  {g:'Termos', ico:'📘', t:'ETF', s:'Exchange Traded Fund · fundo negociado em bolsa', link:'carteira.html'},
  {g:'Termos', ico:'📘', t:'REIT', s:'Real Estate Investment Trust · FII americano', link:'carteira.html'},
  {g:'Termos', ico:'📘', t:'Preço Médio', s:'Custo médio ponderado dos aportes', link:'gestao-patrimonial.html'},
  {g:'Termos', ico:'📘', t:'Rebalanceamento', s:'Ajustar pesos da carteira periodicamente', link:'carteira.html'},
];

// Adiciona ativos da carteira do usu rio ao  ndice
function _gsearchTickersUser(){
  try{
    var aportes = JSON.parse(localStorage.getItem('g20_rvAportes')||'[]');
    if(!Array.isArray(aportes)) return [];
    var pos={};
    aportes.sort(function(a,b){return (a.data||'').localeCompare(b.data||'');}).forEach(function(a){
      if(!a||!a.ticker) return;
      if(!pos[a.ticker]) pos[a.ticker]={qtd:0, tipo:a.tipo||''};
      pos[a.ticker].qtd += (a.op==='C'?1:-1)*(a.qtd||0);
    });
    return Object.keys(pos).filter(function(t){return pos[t].qtd>0.001;}).map(function(t){
      return {g:'Meus Ativos', ico:'📊', t:t, s:pos[t].tipo||'Ativo da sua carteira', link:'gestao-patrimonial.html'};
    });
  }catch(e){ return []; }
}

// G20Flix dinâmico — gera item do último episódio a partir de window.FLIX_CURRENT_EP
// (variável mantida atualizada pelo g20-notifications.js)
function _gsearchFlixDinamico(){
  var ep    = window.FLIX_CURRENT_EP || 0;
  var title = (window.FLIX_CURRENT_TITLE || '').trim();
  if(!ep) return [];
  // Se o título já vier com "#N", evita duplicar o número
  var nome = (title && title.indexOf('#'+ep) === 0) ? title : ('#'+ep + (title ? ' ' + title : ''));
  return [
    {g:'G20Flix', ico:'🎬', t:'Último episódio · '+nome, s:'Mais recente no G20Flix', link:'g20flix.html'}
  ];
}

function _gsearchFullIndex(){
  // Patch dinâmico do subtítulo da página G20Flix com o número atual de episódios
  var ep  = window.FLIX_CURRENT_EP || 0;
  var idx = GSEARCH_INDEX.map(function(it){
    if(ep && it.g==='Páginas' && it.t==='G20Flix'){
      return Object.assign({}, it, {s: ep+' episódios · lives mensais'});
    }
    return it;
  });
  return idx.concat(_gsearchFlixDinamico()).concat(_gsearchTickersUser());
}

var _gsActive=0, _gsResults=[];

function gsearchAbrir(){
  var ov=document.getElementById('gsearchOverlay');
  if(!ov) return;
  ov.classList.add('show');
  document.body.style.overflow='hidden';
  var inp=document.getElementById('gsearchInput');
  if(inp){ inp.value=''; setTimeout(function(){inp.focus();},50); }
  gsearchRender('');
}
function gsearchFechar(){
  var ov=document.getElementById('gsearchOverlay');
  if(ov) ov.classList.remove('show');
  document.body.style.overflow='';
}
function _gsEscape(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function _gsScore(q, it){
  if(!q) return 0;
  var hay=(it.t+' '+(it.s||'')+' '+(it.g||'')).toLowerCase();
  var pts=0, ql=q.length;
  if(hay.indexOf(q)>=0) pts += 10;
  // bonus se come a com
  if(it.t.toLowerCase().indexOf(q)===0) pts += 20;
  // fuzzy basic
  var last=-1, all=true;
  for(var i=0;i<ql;i++){
    var idx=hay.indexOf(q[i], last+1);
    if(idx<0){ all=false; break; }
    last=idx;
  }
  if(all) pts += 3;
  return pts;
}
function gsearchRender(q){
  var list=document.getElementById('gsearchList');
  if(!list) return;
  q=(q||'').toLowerCase().trim();
  var idx=_gsearchFullIndex();
  var scored = idx.map(function(it){return {it:it, sc:_gsScore(q,it)};}).filter(function(x){return !q || x.sc>0;});
  if(!q){
    // Sem busca: mostra recentes (localStorage) + p ginas + sugest es
    var recent = [];
    try {
      var rk = JSON.parse(localStorage.getItem('g20_gsearch_recent') || '[]');
      recent = rk.map(function(title){ return idx.find(function(it){ return it.t === title; }); }).filter(Boolean);
    } catch(e){}
    var paginas = idx.filter(function(it){ return it.g==='Páginas'; });
    var sugestoes = idx.filter(function(it){ return it.g==='G20Flix' || it.g==='Cursos'; }).slice(0,5);
    var combined = [];
    if(recent.length) recent.forEach(function(it){ combined.push({it:{g:'Recentes',ico:'🕐',t:it.t,s:it.s,link:it.link}, sc:100}); });
    paginas.forEach(function(it){ combined.push({it:it, sc:50}); });
    sugestoes.forEach(function(it){ combined.push({it:it, sc:10}); });
    scored = combined;
  }
  scored.sort(function(a,b){return b.sc-a.sc;});
  scored = scored.slice(0, 25);
  _gsResults = scored.map(function(x){return x.it;});
  _gsActive = 0;
  if(!_gsResults.length){
    list.innerHTML='<div class="gsearch-empty">Nada encontrado para <strong>"'+q+'"</strong></div>';
    return;
  }
  // Agrupa
  var html='', lastGroup='';
  _gsResults.forEach(function(it, i){
    if(it.g !== lastGroup){
      html += '<div class="gsearch-group-label">'+it.g+'</div>';
      lastGroup = it.g;
    }
    html += '<div class="gsearch-item'+(i===0?' active':'')+'" data-idx="'+i+'" onclick="gsearchIr('+i+')">'+
      '<div class="gs-it-ico">'+it.ico+'</div>'+
      '<div class="gs-it-body">'+
        '<div class="gs-it-title">'+it.t+'</div>'+
        '<div class="gs-it-sub">'+(it.s||'')+'</div>'+
      '</div>'+
      '<div class="gs-it-arrow">→</div>'+
    '</div>';
  });
  list.innerHTML=html;
}
function gsearchIr(i){
  var it=_gsResults[i!==undefined ? i : _gsActive];
  if(!it) return;
  try {
    var rk = JSON.parse(localStorage.getItem('g20_gsearch_recent') || '[]');
    rk = rk.filter(function(t){ return t !== it.t; });
    rk.unshift(it.t);
    if(rk.length > 5) rk = rk.slice(0, 5);
    localStorage.setItem('g20_gsearch_recent', JSON.stringify(rk));
  } catch(e){}
  gsearchFechar();
  if(it.link) setTimeout(function(){ location.href=it.link; }, 80);
}
function _gsSetActive(i){
  _gsActive=Math.max(0, Math.min(_gsResults.length-1, i));
  var items=document.querySelectorAll('.gsearch-item');
  items.forEach(function(el){ el.classList.remove('active'); });
  var tgt=items[_gsActive];
  if(tgt){ tgt.classList.add('active'); tgt.scrollIntoView({block:'nearest'}); }
}
// Keyboard global
document.addEventListener('keydown', function(e){
  var isK = (e.key==='k' || e.key==='K');
  if((e.ctrlKey || e.metaKey) && isK){
    e.preventDefault();
    var ov=document.getElementById('gsearchOverlay');
    if(ov && ov.classList.contains('show')) gsearchFechar();
    else gsearchAbrir();
    return;
  }
  var ov2=document.getElementById('gsearchOverlay');
  if(!ov2 || !ov2.classList.contains('show')) return;
  if(e.key==='Escape'){ e.preventDefault(); gsearchFechar(); }
  else if(e.key==='ArrowDown'){ e.preventDefault(); _gsSetActive(_gsActive+1); }
  else if(e.key==='ArrowUp'){ e.preventDefault(); _gsSetActive(_gsActive-1); }
  else if(e.key==='Enter'){ e.preventDefault(); gsearchIr(); }
});




document.addEventListener('DOMContentLoaded', function(){
  var inp=document.getElementById('gsearchInput');
  if(inp) inp.addEventListener('input', function(){ gsearchRender(this.value); });
  // Detecta Mac para mostrar   no lugar de Ctrl
  if(navigator.platform && /Mac|iPhone|iPod|iPad/.test(navigator.platform)){
    var kbd=document.getElementById('gsKbd');
    if(kbd) kbd.textContent='⌘ K';
  }
});
