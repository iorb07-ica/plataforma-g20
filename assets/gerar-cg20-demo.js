/* ═══════════════════════════════════════════════════════════════════════════
   GERADOR DO PACOTE DE DEMONSTRAÇÃO DA CARTEIRA G20  —  v3, sessão 51.0

   POR QUE A v1 SÓ TROUXE 11 PREÇOS
   Não era culpa da aba anônima. O dashboard busca cotação apenas dos ativos
   da CARTEIRA PESSOAL (loadPatStrip lê g20_rvAportes) e grava em g20_precos.
   Os 11 que apareciam eram simplesmente a interseção entre a CG20 e a
   carteira pessoal do Israel — PRIO3, PETR4, VALE3, MSFT, AAPL e companhia.
   Os outros 104 ativos da CG20 nunca passam por ali.

   Quem cota os 115 é a página CARTEIRA G20, e ela guarda o resultado em
   g20_cotacoesCache (chave própria, TTL de 15 min), não em g20_precos.

   Esta versão lê as três fontes, na ordem: g20_cotacoesCache (a boa),
   g20_precos (complemento) e g20_dashRVCot_cache (reserva). E normaliza tudo
   para o formato que o dashboard espera: {preco, var1d, varPct, isUS}.

   PROTEÇÃO
   Roda na aba NORMAL. Antes de calcular, congela tudo que grava série
   (G20Store.set + localStorage) e guarda o que está em memória; devolve no
   fim, inclusive se der erro. Sua carteira pessoal não é tocada.

   COMO USAR
   1. Aba NORMAL, logado como admin
   2. Abra a CARTEIRA G20 e ESPERE a tabela encher com as cotações
      (é o passo que mais importa — sem ele não há preço nenhum)
   3. Vá pro DASHBOARD
   4. F12 -> Console -> cole este arquivo inteiro -> Enter
   5. Ele confere a cobertura ANTES de calcular. Se estiver baixa, aborta e diz
      o que fazer, sem gastar seu tempo.
   6. Salve como cg20-demo.json em assets/ e suba pro GitHub
   7. Dê F5 na página
   ═══════════════════════════════════════════════════════════════════════════ */

(async function gerarPacoteCG20v3() {
  'use strict';

  var ok   = function (m) { console.log('%c[CG20] ' + m, 'color:#4ade80;font-weight:bold'); };
  var info = function (m) { console.log('%c[CG20] ' + m, 'color:#e8b84b;font-weight:bold'); };
  var err  = function (m) { console.log('%c[CG20] ' + m, 'color:#f87171;font-weight:bold'); };
  var ler  = function (k, p) {
    try { return JSON.parse(localStorage.getItem(k) || p); } catch (e) { return JSON.parse(p); }
  };

  if (!window.G20Rent || typeof G20Rent.calcular !== 'function') {
    err('G20Rent não encontrado. Você está no dashboard?');
    return;
  }

  var aportes = ler('g20_aportes', '[]');
  if (!Array.isArray(aportes) || aportes.length === 0) {
    err('Nenhum aporte da CG20 em g20_aportes.');
    err('Abra a Carteira G20, espere carregar, e rode de novo.');
    return;
  }

  // ── Posições abertas ─────────────────────────────────────────────────────
  var pos = {};
  aportes.slice().sort(function (a, b) {
    return (a.data || '').localeCompare(b.data || '');
  }).forEach(function (a) {
    if (!a || !a.ticker) return;
    if (!pos[a.ticker]) pos[a.ticker] = 0;
    pos[a.ticker] += (a.op === 'C' ? 1 : -1) * (a.qtd || 0);
  });
  var abertos = Object.keys(pos).filter(function (t) { return pos[t] > 0.001; });
  info(aportes.length + ' aportes, ' + abertos.length + ' posições abertas.');

  // Tipo de cada ticker (pra saber quem é ativo em dólar)
  var tipoDe = {};
  aportes.forEach(function (a) { if (a && a.ticker && a.tipo) tipoDe[a.ticker] = a.tipo; });
  var US_TIPOS = { 'Stock': 1, 'REIT': 1, 'ETF': 1, 'Cripto': 1, 'UCITs': 1, 'ETF US': 1 };

  /* ═══════════════════════════════════════════════════════════════════════
     COTAÇÕES — as três fontes, da melhor para a pior
     1) g20_cotacoesCache : gravado pela página Carteira G20, cobre os 115
     2) g20_precos        : gravado pelo dashboard, cobre só a carteira pessoal
     3) g20_dashRVCot_cache : reserva do dashboard
     ═══════════════════════════════════════════════════════════════════════ */
  var precos = {};
  var usdBRL = 0;
  var fontes = [];

  function normalizar(t, c) {
    if (!c) return;
    var p = parseFloat(c.preco || c.price || (typeof c === 'number' ? c : 0)) || 0;
    if (p <= 0) return;
    if (precos[t]) return;                      // primeira fonte vence
    precos[t] = {
      preco:  p,
      var1d:  parseFloat(c.var1d || c.change || 0) || 0,
      varPct: parseFloat(c.varPct || c.var || c.changePercent || 0) || 0,
      isUS:   (c.isUS !== undefined) ? !!c.isUS : !!US_TIPOS[tipoDe[t]],
      ts:     Date.now()
    };
  }

  var cc = ler('g20_cotacoesCache', 'null');
  if (cc && cc.cotacoes) {
    Object.keys(cc.cotacoes).forEach(function (t) { normalizar(t, cc.cotacoes[t]); });
    if (cc.usdBRL) usdBRL = parseFloat(cc.usdBRL) || 0;
    var idade = cc.ts ? Math.round((Date.now() - cc.ts) / 60000) : null;
    fontes.push('cotacoesCache (' + Object.keys(cc.cotacoes).length + ' ativos' +
                (idade !== null ? ', ' + idade + ' min atrás' : '') + ')');
  }

  var gp = ler('g20_precos', '{}') || {};
  var antes = Object.keys(precos).length;
  Object.keys(gp).forEach(function (t) { normalizar(t, gp[t]); });
  if (Object.keys(precos).length > antes) {
    fontes.push('g20_precos (+' + (Object.keys(precos).length - antes) + ')');
  }

  var dc = ler('g20_dashRVCot_cache', 'null');
  if (dc && dc.data) {
    antes = Object.keys(precos).length;
    Object.keys(dc.data).forEach(function (t) { normalizar(t, dc.data[t]); });
    if (Object.keys(precos).length > antes) {
      fontes.push('dashRVCot_cache (+' + (Object.keys(precos).length - antes) + ')');
    }
  }

  info('Fontes de cotação: ' + (fontes.length ? fontes.join(' | ') : 'nenhuma'));

  // Câmbio
  if (!usdBRL) {
    var fx = gp['USDBRL=X'] || gp['USD'] || gp['USDBRL'];
    if (fx) usdBRL = parseFloat(fx.preco || fx.price || fx) || 0;
  }
  if (!usdBRL && typeof _dashUsdBRL !== 'undefined') usdBRL = parseFloat(_dashUsdBRL) || 0;
  if (usdBRL > 0) {
    precos['USDBRL=X'] = { preco: usdBRL, var1d: 0, varPct: 0, isUS: false, ts: Date.now() };
    precos['USD']      = precos['USDBRL=X'];
    ok('Câmbio USD/BRL: ' + usdBRL.toFixed(4));
  } else {
    err('Sem câmbio USD/BRL. Os ativos em dólar ficariam sem conversão.');
    err('Abra a Carteira G20, espere carregar, e rode de novo. Abortado.');
    return;
  }

  // ── Cobertura: checa ANTES de gastar tempo calculando ────────────────────
  var comPreco = abertos.filter(function (t) { return precos[t]; });
  var cobertura = abertos.length ? Math.round(comPreco.length / abertos.length * 100) : 0;
  info('Cobertura de preços: ' + comPreco.length + '/' + abertos.length + ' (' + cobertura + '%)');

  if (cobertura < 80) {
    var faltam = abertos.filter(function (t) { return !precos[t]; });
    err('Cobertura baixa. Composição, Top Movers e Insights ficariam vazios.');
    err('Faltam ' + faltam.length + ': ' + faltam.slice(0, 15).join(', ') +
        (faltam.length > 15 ? '…' : ''));
    err('Abra a CARTEIRA G20, espere a tabela encher com as cotações, volte');
    err('ao dashboard e rode de novo. Abortado — nada foi calculado.');
    return;
  }
  if (cobertura < 100) {
    var f2 = abertos.filter(function (t) { return !precos[t]; });
    info('Sem cotação (' + f2.length + '): ' + f2.slice(0, 12).join(', ') +
         (f2.length > 12 ? '…' : ''));
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PROTEÇÃO DA CARTEIRA PESSOAL
     G20Rent.calcular() grava em memória, IndexedDB e localStorage. Sem trava,
     a série da CG20 tomaria o lugar da sua até reconstruir.
     ═══════════════════════════════════════════════════════════════════════ */
  var SERIE_KEY  = 'g20_serieReal';
  var _memAntes  = G20Rent._serieMem;
  var _uidAntes  = G20Rent._serieUid;
  var _histAntes = window._g20HistPronto;
  var _storeSet  = (window.G20Store && G20Store.set) || null;
  var _lsSet     = localStorage.setItem.bind(localStorage);
  var congelado  = false;

  function congelar() {
    if (window.G20Store) G20Store.set = function () { return Promise.resolve(true); };
    localStorage.setItem = function (k, v) {
      if (k === SERIE_KEY) return;
      return _lsSet(k, v);
    };
    congelado = true;
    info('Sua série pessoal está protegida durante o cálculo.');
  }
  function descongelar() {
    if (!congelado) return;
    if (_storeSet && window.G20Store) G20Store.set = _storeSet;
    localStorage.setItem = _lsSet;
    G20Rent._serieMem = _memAntes;
    G20Rent._serieUid = _uidAntes;
    window._g20HistPronto = _histAntes;
    congelado = false;
    ok('Sua série pessoal foi restaurada.');
  }

  var indices = {
    cdi:   (typeof IND !== 'undefined' && IND.cdi)   ? IND.cdi   : 14.15,
    selic: (typeof IND !== 'undefined' && IND.selic) ? IND.selic : 14.25,
    ipca:  (typeof IND !== 'undefined' && IND.ipca)  ? IND.ipca  : 4.64,
    igpm:  (typeof IND !== 'undefined' && IND.igpm)  ? IND.igpm  : 3.18
  };

  var serie = null;
  try {
    congelar();
    info('Calculando a série histórica. Não feche a aba.');
    var t0 = Date.now();
    serie = await G20Rent.calcular({ aportes: aportes, rendaFixa: [], indices: indices });
    if (!serie || serie.length < 2) { err('Série vazia.'); return; }
    ok('Série: ' + serie.length + ' dias (' + serie[0].d + ' -> ' +
       serie[serie.length - 1].d + ') em ' + Math.round((Date.now() - t0) / 1000) + 's.');
  } catch (e) {
    err('Falha no cálculo: ' + (e && e.message ? e.message : e));
    return;
  } finally {
    descongelar();
  }

  var serieEnxuta = serie.map(function (p) {
    return {
      d: p.d,
      patrimonio: Math.round((p.patrimonio || 0) * 100) / 100,
      rv:    Math.round((p.rv || 0) * 100) / 100,
      rf:    Math.round((p.rf || 0) * 100) / 100,
      fluxo: Math.round((p.fluxo || 0) * 100) / 100
    };
  });

  // ── Proventos: só da CG20, últimos 14 meses + futuros ────────────────────
  var todosDivs = [];
  try {
    todosDivs = (window._divsCarregar ? _divsCarregar() : ler('g20_dividendos', '[]'));
  } catch (e) { todosDivs = ler('g20_dividendos', '[]'); }
  if (!Array.isArray(todosDivs)) todosDivs = [];

  var setT = {};
  Object.keys(pos).forEach(function (t) { setT[t] = 1; });

  var corte = new Date();
  corte.setMonth(corte.getMonth() - 14);
  var corteStr = corte.toISOString().substring(0, 10);

  var dividendos = todosDivs.filter(function (d) {
    if (!d || !d.ticker || !setT[d.ticker]) return false;
    var dt = (d.data_pagamento || d.dataPagamento || d.data || '').substring(0, 10);
    return dt >= corteStr;   // 9999-12-31 = ainda não anunciado; a Agenda trata
  });
  info('Proventos: ' + dividendos.length + ' registros.');

  // Só os preços dos ativos da CG20 (+ câmbio)
  var precosPacote = {};
  Object.keys(precos).forEach(function (t) {
    if (setT[t] || t === 'USDBRL=X' || t === 'USD') precosPacote[t] = precos[t];
  });
  ok('Preços no pacote: ' + Object.keys(precosPacote).length);

  // ── Monta ────────────────────────────────────────────────────────────────
  var ultimo = serieEnxuta[serieEnxuta.length - 1];
  var pacote = {
    _leiaMe: 'Retrato ESTÁTICO da Carteira G20 para o modo demonstração do tour ' +
             'de primeiro acesso. Não pertence a nenhum aluno e não é atualizado ' +
             'automaticamente. Para regerar: assets/gerar-cg20-demo.js.',
    versao: 3,
    geradoEm: new Date().toISOString(),
    resumo: {
      dias: serieEnxuta.length,
      de: serieEnxuta[0].d,
      ate: ultimo.d,
      posicoesAbertas: abertos.length,
      precosNoPacote: Object.keys(precosPacote).length,
      coberturaPrecos: cobertura + '%',
      usdBRL: usdBRL,
      patrimonioFinal: ultimo.patrimonio
    },
    indices: indices,
    serie: serieEnxuta,
    aportes: aportes,
    dividendos: dividendos,
    precos: precosPacote
  };

  var json = JSON.stringify(pacote);
  info('Pacote: ' + Math.round(json.length / 1024) + ' KB | patrimônio final R$ ' +
       ultimo.patrimonio.toLocaleString('pt-BR', { maximumFractionDigits: 0 }));

  var passo = 1;
  while (json.length / 1024 > 700 && passo < 8) {
    passo++;
    pacote.serie = serieEnxuta.filter(function (_, i) {
      return i % passo === 0 || i === serieEnxuta.length - 1;
    });
    pacote.resumo.dias = pacote.serie.length;
    pacote.resumo.amostragem = '1 ponto a cada ' + passo + ' dias';
    json = JSON.stringify(pacote);
  }
  if (passo > 1) {
    info('Reduzido para ' + Math.round(json.length / 1024) + ' KB (' +
         pacote.resumo.dias + ' pontos).');
  }

  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = 'cg20-demo.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    URL.revokeObjectURL(a.href);
    if (a.parentNode) a.parentNode.removeChild(a);
  }, 2000);

  ok('Download iniciado. Salve como cg20-demo.json em assets/.');
  console.log('%c[CG20] Confira antes de subir:', 'color:#e8b84b', pacote.resumo);
  info('Agora dê F5 na página.');
})();
