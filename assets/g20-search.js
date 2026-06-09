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
  {g:'Páginas', ico:'🎬', t:'G20Flix', s:'84 episódios · lives mensais', link:'g20flix.html'},
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
  // G20Flix — 84 episódios (atualizar quando publicar novos via modal admin)
  {g:'G20Flix', ico:'🎬', t:"#82 - Aporte Carteira G20", s:"Maio 2026 · 2026 · NOVO", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#81 - Aporte Carteira G20", s:"Abril 2026 · 2026", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#80 - Aporte Carteira G20", s:"Março 2026 · 2026", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#79 - Aporte Carteira G20", s:"Fevereiro 2026 · 2026", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#78 - Aporte Carteira G20", s:"Janeiro 2026 · 2026", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#77 - Aporte Carteira G20", s:"Dezembro 2025 · 2025", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#76 - Aporte Carteira G20", s:"Novembro 2025 · 2025", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#75 - Aporte Carteira G20", s:"Outubro 2025 · 2025", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#74 - Aporte Carteira G20", s:"Setembro 2025 · 2025", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#73 - Aporte Carteira G20", s:"Agosto 2025 · 2025", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#72 - Aporte Carteira G20", s:"Julho 2025 · 2025", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#71 - Aporte Carteira G20", s:"Junho 2025 · 2025", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#70 - Aporte Carteira G20", s:"Maio 2025 · 2025", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#69 - Aporte Carteira G20", s:"Abril 2025 · 2025", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#68 - Aporte Carteira G20", s:"Março 2025 · 2025", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#67 - Aporte Carteira G20", s:"Fevereiro 2025 · 2025", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#66 - Aporte Carteira G20", s:"Janeiro 2025 · 2025", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#65 - Aporte Carteira G20", s:"Dezembro 2024 · 2024", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#64 - Aporte Carteira G20", s:"Novembro 2024 · 2024", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#63 - Aporte Carteira G20", s:"Outubro 2024 · 2024", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#62 - Aporte Carteira G20", s:"Setembro 2024 · 2024", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#61 - Aporte Carteira G20", s:"Agosto 2024 · 2024", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#60 - Aporte Carteira G20", s:"Julho 2024 · 2024", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#59 - Aporte Carteira G20", s:"Junho 2024 · 2024", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#58 - Aporte Carteira G20", s:"Maio 2024 · 2024", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#57 - Aporte Carteira G20", s:"Abril 2024 · 2024", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#56 - Aporte Carteira G20", s:"Março 2024 · 2024", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#55 - Aporte Carteira G20", s:"Fevereiro 2024 · 2024", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#54 - Aporte Carteira G20", s:"Janeiro 2024 · 2024", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#53 - Aporte Carteira G20", s:"Dezembro 2023 · 2023", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#52 - Aporte Carteira G20", s:"Novembro 2023 · 2023", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#51 - Aporte Carteira G20", s:"Outubro 2023 · 2023", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#50 - Aporte Carteira G20", s:"Setembro 2023 · 2023", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#49 - Aporte Carteira G20", s:"Agosto 2023 · 2023", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#48 - Aporte Carteira G20", s:"Julho 2023 · 2023", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#47 - Aporte Carteira G20", s:"Junho 2023 · 2023", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#46 - Aporte Carteira G20", s:"Maio 2023 · 2023", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#45 - Aporte Carteira G20", s:"Abril 2023 · 2023", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#44 - Aporte Carteira G20", s:"Março 2023 · 2023", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#43 - Aporte Carteira G20", s:"Fevereiro 2023 · 2023", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#42 - Aporte Carteira G20", s:"Janeiro 2023 · 2023", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#41 - Aporte Carteira G20", s:"Dezembro 2022 · 2022", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#40 - Aporte Carteira G20", s:"Novembro 2022 · 2022", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#39 - Aporte Carteira G20", s:"Outubro 2022 · 2022", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#38 - Aporte Carteira G20", s:"Setembro 2022 · 2022", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#37 - Aporte Carteira G20", s:"Agosto 2022 · 2022", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#36 - Aporte Carteira G20", s:"Julho 2022 · 2022", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#35 - Aporte Carteira G20", s:"Junho 2022 · 2022", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#34 - Aporte Carteira G20", s:"Maio 2022 · 2022", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#33 - Aporte Carteira G20", s:"Abril 2022 · 2022", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#32 - Aporte Carteira G20", s:"Março 2022 · 2022", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#31 - Aporte Carteira G20", s:"Fevereiro 2022 · 2022", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#30 - Aporte Carteira G20", s:"Janeiro 2022 · 2022", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#29 - Aporte Carteira G20", s:"Dezembro 2021 · 2021", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#28 - Aporte Carteira G20", s:"Novembro 2021 · 2021", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#27 - Aporte Carteira G20", s:"Outubro 2021 · 2021", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#26 - Aporte Carteira G20", s:"Setembro 2021 · 2021", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#25 - Aporte Carteira G20", s:"Agosto 2021 · 2021", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#24 - Aporte Carteira G20", s:"Julho 2021 · 2021", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#23 - Aporte Carteira G20", s:"Junho 2021 · 2021", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#22 - Aporte Carteira G20", s:"Maio 2021 · 2021", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#21 - Aporte Carteira G20", s:"Abril 2021 · 2021", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#20 - Aporte Carteira G20", s:"Março 2021 · 2021", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#19 - Aporte Carteira G20", s:"Fevereiro 2021 · 2021", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#18 - Aporte Carteira G20", s:"Janeiro 2021 · 2021", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#17 - Aporte Carteira G20", s:"Dezembro 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#16 - Aporte Carteira G20", s:"Novembro 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#15 - Aporte Carteira G20", s:"Outubro 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#14 - Aporte Carteira G20", s:"Setembro 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#13 - Aporte Carteira G20", s:"Agosto 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#12 - Aporte Carteira G20", s:"Julho 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#11 - Aporte Carteira G20", s:"Junho 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#10 - Aporte Carteira G20", s:"Maio 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#9 - Aporte Carteira G20", s:"Abril 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#8 - Aporte Carteira G20", s:"Março 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#7 - Aporte Carteira G20", s:"Fevereiro 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#6 - Aporte Carteira G20 (Parte 2)", s:"Janeiro 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#6 - Aporte Carteira G20 (Parte 1)", s:"Janeiro 2020 · 2020", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#5 - Aporte Carteira G20", s:"Dezembro 2019 · 2019", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#4 - Aporte Carteira G20", s:"Novembro 2019 · 2019", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#3 - Aporte Carteira G20", s:"Outubro 2019 · 2019", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#2 - Aporte Carteira G20", s:"Setembro 2019 · 2019", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#1 - Aporte Carteira G20 (Parte 2)", s:"Agosto 2019 · 2019", link:'g20flix.html'},
  {g:'G20Flix', ico:'🎬', t:"#1 - Aporte Carteira G20 (Parte 1)", s:"Agosto 2019 · 2019", link:'g20flix.html'},
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

// Networking — alunos lidos do Firestore com cache em sessionStorage.
// 1-2 leituras por sessão de navegação; resultado fica em memória + cache.
var _gsAlunos = [];
var _gsAlunosLoaded = false;
var _gsAlunosLoading = false;

function _gsearchLoadAlunos(){
  if(_gsAlunosLoaded || _gsAlunosLoading) return;
  // 1) tenta cache da sessão (instantâneo)
  try {
    var cached = sessionStorage.getItem('g20_search_networking');
    if(cached){
      _gsAlunos = JSON.parse(cached) || [];
      _gsAlunosLoaded = true;
      return;
    }
  } catch(e){}
  // 2) precisa do firebase inicializado na página
  if(!window.firebase || !firebase.apps || !firebase.apps.length) return;
  var db;
  try { db = firebase.firestore(); } catch(e){ return; }
  _gsAlunosLoading = true;
  db.collection('users').where('aprovado','==',true).get().then(function(snap){
    var lista = [];
    snap.forEach(function(doc){
      var d = doc.data() || {};
      var p = d.perfil || {};
      if(p.perfilPublico !== true) return; // só alunos com perfil público
      lista.push({
        uid: doc.id,
        nome: p.nome || d.name || 'Aluno G20',
        profissao: p.profissao || '',
        empresa: p.empresa || '',
        negocio: p.negocio || '',
        categoria: p.negocioCategoria || ''
      });
    });
    _gsAlunos = lista;
    _gsAlunosLoaded = true;
    _gsAlunosLoading = false;
    try { sessionStorage.setItem('g20_search_networking', JSON.stringify(lista)); } catch(e){}
    // se a busca está aberta, re-renderiza pra incluir os alunos recém-carregados
    var ov = document.getElementById('gsearchOverlay');
    if(ov && ov.classList.contains('show')){
      var inp = document.getElementById('gsearchInput');
      if(inp) gsearchRender(inp.value);
    }
  }).catch(function(){ _gsAlunosLoading = false; });
}

function _gsearchNetworkingItems(){
  return _gsAlunos.map(function(a){
    var sub = [a.profissao, a.empresa, a.negocio].filter(Boolean).join(' · ') || 'Aluno G20';
    return {
      g:'Networking',
      ico:'🤝',
      t: a.nome,
      s: sub,
      link: 'networking.html#aluno-' + a.uid
    };
  });
}

// Adiciona ativos da carteira do usuário ao índice
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

// G20Flix — episódios lidos do Firestore (sempre atualizado), cache de sessão.
// Substitui o seed estático quando carregado; cai no seed se Firestore indisponível.
var _gsFlix = [];
var _gsFlixLoaded = false;
var _gsFlixLoading = false;

function _gsearchLoadFlix(){
  if(_gsFlixLoaded || _gsFlixLoading) return;
  try {
    var cached = sessionStorage.getItem('g20_search_flix_v2');
    if(cached){ _gsFlix = JSON.parse(cached) || []; _gsFlixLoaded = true; return; }
  } catch(e){}
  if(!window.firebase || !firebase.apps || !firebase.apps.length) return;
  var db;
  try { db = firebase.firestore(); } catch(e){ return; }
  _gsFlixLoading = true;
  db.collection('g20flix').doc('videos').collection('items').get().then(function(snap){
    var lista = [];
    snap.forEach(function(doc){
      var d = doc.data() || {};
      if(!d.title && !d.id) return;
      lista.push({ id:d.id||d.docId||'', ep:d.ep, title:d.title||'', cat:d.cat||'', season:d.season||'', date:d.date||'' });
    });
    // mais recentes primeiro (por episódio) para boas sugestões
    lista.sort(function(a,b){ return (Number(b.ep)||0) - (Number(a.ep)||0); });
    _gsFlix = lista;
    _gsFlixLoaded = true;
    _gsFlixLoading = false;
    try { sessionStorage.setItem('g20_search_flix_v2', JSON.stringify(lista)); } catch(e){}
    var ov = document.getElementById('gsearchOverlay');
    if(ov && ov.classList.contains('show')){
      var inp = document.getElementById('gsearchInput');
      if(inp) gsearchRender(inp.value);
    }
  }).catch(function(){ _gsFlixLoading = false; });
}

function _gsearchFlixItems(){
  return _gsFlix.map(function(v){
    var hasEp = (v.ep !== undefined && v.ep !== null && String(v.ep) !== '' && Number(v.ep) > 0);
    var t = (hasEp ? ('#' + v.ep + ' - ') : '') + (v.title || 'Episódio G20Flix');
    var s = (v.date || v.season || '') ? (String(v.date || v.season)) : 'G20Flix';
    var link = v.id ? ('g20flix.html#v=' + encodeURIComponent(v.id)) : 'g20flix.html';
    return { g:'G20Flix', ico:'🎬', t:t, s:s, link:link };
  });
}

// Sala de Aula — módulos + aulas. Reaproveita o cache que a própria página cria
// (localStorage 'g20_sa_modulos_v2'); se não houver, lê do Firestore. Deep-link por aula.
var _gsAulas = [];
var _gsAulasLoaded = false;
var _gsAulasLoading = false;
function _gsBuildAulas(mods){
  var items = [];
  (mods||[]).forEach(function(m){
    var nAulas = (typeof m.aulas === 'number') ? m.aulas : ((m.aulas_list||[]).length);
    items.push({ g:'Cursos', ico:'🎓', t:(m.titulo||'Módulo'),
      s:(nAulas+' aulas'+(m.duracao?(' · '+m.duracao):'')),
      link:'sala-de-aula.html#modulo='+encodeURIComponent(m.id) });
    (m.aulas_list||[]).forEach(function(a){
      items.push({ g:'Aulas', ico:'📹', t:(a.titulo||'Aula'),
        s:((m.titulo||'')+(a.duracao?(' · '+a.duracao):'')),
        link:'sala-de-aula.html#aula='+encodeURIComponent(m.id)+'~'+encodeURIComponent(a.id) });
    });
  });
  _gsAulas = items;
}
function _gsearchLoadAulas(){
  if(_gsAulasLoaded || _gsAulasLoading) return;
  try {
    var raw = localStorage.getItem('g20_sa_modulos_v2');
    if(raw){
      var mods = JSON.parse(raw);
      if(Array.isArray(mods) && mods.length){ _gsBuildAulas(mods); _gsAulasLoaded = true; return; }
    }
  } catch(e){}
  if(!window.firebase || !firebase.apps || !firebase.apps.length) return;
  var db;
  try { db = firebase.firestore(); } catch(e){ return; }
  _gsAulasLoading = true;
  db.collection('cursos').doc('g20-masterclass').collection('modulos').orderBy('ordem').get().then(function(modsSnap){
    var mods = [], promises = [];
    modsSnap.forEach(function(modDoc){
      var mod = modDoc.data(); mod.id = modDoc.id; mod.aulas_list = [];
      var p = db.collection('cursos').doc('g20-masterclass').collection('modulos').doc(modDoc.id)
        .collection('aulas').orderBy('ordem').get().then(function(aSnap){
          aSnap.forEach(function(aDoc){ var a = aDoc.data(); a.id = aDoc.id; if(a.publicada !== false) mod.aulas_list.push(a); });
          mod.aulas = mod.aulas_list.length;
        });
      promises.push(p); mods.push(mod);
    });
    Promise.all(promises).then(function(){
      _gsBuildAulas(mods);
      _gsAulasLoaded = true; _gsAulasLoading = false;
      var ov = document.getElementById('gsearchOverlay');
      if(ov && ov.classList.contains('show')){ var inp = document.getElementById('gsearchInput'); if(inp) gsearchRender(inp.value); }
    });
  }).catch(function(){ _gsAulasLoading = false; });
}
function _gsearchAulasItems(){ return _gsAulas; }

function _gsearchFullIndex(){
  var base = (_gsFlixLoaded && _gsFlix.length)
    ? GSEARCH_INDEX.filter(function(it){ return it.g !== 'G20Flix'; }).concat(_gsearchFlixItems())
    : GSEARCH_INDEX;
  if(_gsAulasLoaded && _gsAulas.length){
    base = base.filter(function(it){ return it.g !== 'Aulas' && it.g !== 'Cursos'; }).concat(_gsearchAulasItems());
  }
  return base.concat(_gsearchTickersUser()).concat(_gsearchNetworkingItems());
}

var _gsActive=0, _gsResults=[];

function gsearchAbrir(){
  _gsearchLoadAlunos(); // garante alunos carregados (lazy, 1× por sessão)
  _gsearchLoadFlix();   // garante episódios G20Flix do Firestore (lazy, 1× por sessão)
  _gsearchLoadAulas();  // garante módulos+aulas da Sala de Aula (cache local ou Firestore)
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
// minúsculas + remove acentos (ex.: "Quântica" → "quantica"), pra busca ignorar acentuação
function _gsNorm(s){ return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function _gsScore(q, it){
  q = _gsNorm(q);
  if(!q) return 0;
  var hayT=_gsNorm(it.t);
  var hay=_gsNorm((it.t||'')+' '+(it.s||'')+' '+(it.g||''));
  // cada termo (separado por espaço) precisa aparecer como BLOCO no texto
  var terms=q.split(/\s+/).filter(Boolean);
  var pts=0;
  for(var i=0;i<terms.length;i++){
    var term=terms[i];
    var inTitle=hayT.indexOf(term);
    var inHay=hay.indexOf(term);
    if(inHay<0) return 0;            // termo não aparece em lugar nenhum → descarta
    pts += 5;                        // base por termo encontrado
    if(inTitle>=0) pts += 5;         // bônus se está no título (mais relevante que subtítulo)
    if(hayT.indexOf(term)===0) pts += 10; // bônus extra se o título começa com o termo
  }
  if(hayT.indexOf(q)===0) pts += 20; // título começa exatamente com a busca inteira
  else if(hayT.indexOf(q)>=0) pts += 8; // busca inteira aparece junta no título
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
