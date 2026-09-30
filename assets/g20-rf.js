/* ════════════════════════════════════════════════════════════════════
   G20RF · MOTOR ÚNICO DE RENDA FIXA DA PLATAFORMA G20   (v1 · set/2026)
   Usado pela Minha Carteira (gestao-patrimonial.html) e pelo Dashboard.
   Mesmo título = mesmo número em qualquer tela.

   O QUE ELE FAZ
   - Índices HISTÓRICOS do Banco Central (API SGS, gratuita, sem chave):
       CDI diário (12), Selic diária (11), IPCA mensal (433),
       IGP-M mensal (189), Poupança por aniversário (195).
     Cache local, atualização diária, busca incremental. Sem série
     disponível, usa a taxa atual e marca o resultado como "estimado".
   - Dias úteis REAIS: fins de semana + feriados nacionais (ANBIMA),
     inclusive Carnaval, Sexta-feira Santa, Corpus Christi e 20/11 (desde 2024).
   - Fórmulas de mercado:
       % do CDI      Π (1 + CDI_dia × pct)
       Selic + x     Π (1 + Selic_dia) × (1 + x)^(du/252)
       IPCA/IGP-M +x Π (1 + índice_mês)^(fração de dias úteis) × (1 + x)^(du/252)
       Prefixado     (1 + taxa)^(du/252)
       Poupança      Π (1 + rendimento do mês) a cada aniversário completo
   - Para de capitalizar no VENCIMENTO.
   - Tributação: IOF regressivo (< 30 dias), IR regressivo por prazo,
     isenções de IR para pessoa física (LCI, LCA, LCD, LIG, CRI, CRA,
     debênture incentivada, poupança; regra vigente em 2026, após a
     caducidade da MP 1.303/2025), custódia B3 do Tesouro Direto
     (0,20% a.a.; Tesouro Selic isento até R$ 10 mil por CPF, cobrança
     só sobre o excedente; Educa+ e Renda+ isentos se mantidos até o
     vencimento).
   - Cupons semestrais (Tesouro Prefixado com juros e IPCA+ com juros):
     estimados e informados à parte, fora do saldo.
   Valores "na curva" (não a mercado).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.G20RF && window.G20RF.versao >= 1) return;

  var CACHE_KEY = 'g20rf_series_v1';
  var API = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.';
  var SERIES = { cdi: 12, selic: 11, ipca: 433, igpm: 189, poup: 195 };
  var MENSAIS = { ipca: 1, igpm: 1 };

  /* ───────────────────────────── datas ───────────────────────────── */
  function pad(n){ return n < 10 ? '0' + n : '' + n; }
  function isoDe(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dataDe(s){ var p = String(s).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function hojeISO(){ return isoDe(new Date()); }
  function addDias(d, n){ var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function addMeses(d, n){ var x = new Date(d.getFullYear(), d.getMonth() + n, 1, 12); var ult = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); x.setDate(Math.min(d.getDate(), ult)); return x; }
  function diasCorridos(a, b){ return Math.max(0, Math.round((dataDe(b) - dataDe(a)) / 86400000)); }
  function menorISO(a, b){ return (!a) ? b : (!b) ? a : (a < b ? a : b); }

  /* ─────────────────────── feriados e dias úteis ─────────────────────── */
  function pascoa(y){
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mes - 1, dia, 12);
  }
  var _fer = {};
  function feriados(y){
    if (_fer[y]) return _fer[y];
    var s = {};
    ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'].forEach(function(md){ s[y + '-' + md] = 1; });
    if (y >= 2024) s[y + '-11-20'] = 1;
    var p = pascoa(y);
    [-48, -47, -2, 60].forEach(function(n){ s[isoDe(addDias(p, n))] = 1; });
    return (_fer[y] = s);
  }
  function ehDiaUtil(d){ var w = d.getDay(); return w !== 0 && w !== 6 && !feriados(d.getFullYear())[isoDe(d)]; }

  // Contagem acumulada de dias úteis por dia de calendário: du(a,b) = C[b] - C[a]
  var BASE = new Date(2000, 0, 1, 12), _cum = [0], _cumAte = BASE;
  function idxDia(iso){ return Math.round((dataDe(iso) - BASE) / 86400000); }
  function garantirCum(i){
    while (_cum.length <= i) {
      var d = _cumAte; _cum.push(_cum[_cum.length - 1] + (ehDiaUtil(d) ? 1 : 0)); _cumAte = addDias(d, 1);
    }
  }
  // dias úteis no intervalo [a, b)
  function diasUteis(a, b){
    if (!a || !b || b <= a) return 0;
    var ia = Math.max(0, idxDia(a)), ib = Math.max(0, idxDia(b));
    garantirCum(ib); return _cum[ib] - _cum[ia];
  }
  function diaUtilAnterior(iso){ var d = addDias(dataDe(iso), -1); while (!ehDiaUtil(d)) d = addDias(d, -1); return isoDe(d); }

  /* ───────────────────────────── séries ───────────────────────────── */
  // Diárias: { d:[ 'YYYY-MM-DD' ], v:[ % no dia ] }. Mensais: { m:{ 'YYYY-MM': % no mês }, ult:'YYYY-MM' }
  var S = { cdi: null, selic: null, ipca: null, igpm: null, poup: null, atualizado: '' };
  (function lerCache(){
    try { var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); if (c && c.cdi) S = c; } catch(e){}
  })();
  function gravarCache(){ try { localStorage.setItem(CACHE_KEY, JSON.stringify(S)); } catch(e){} }

  function brData(iso){ var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function isoDeBR(br){ var p = br.split('/'); return p[2] + '-' + p[1] + '-' + p[0]; }

  function buscarSerie(nome, desdeISO){
    var cod = SERIES[nome], fim = hojeISO(), blocos = [], ini = desdeISO;
    // A API limita janelas longas para séries diárias: busca em blocos de 5 anos.
    while (ini <= fim) {
      var fimBloco = menorISO(isoDe(addDias(addMeses(dataDe(ini), 60), -1)), fim);
      blocos.push([ini, fimBloco]);
      ini = isoDe(addDias(dataDe(fimBloco), 1));
    }
    return Promise.all(blocos.map(function(b){
      var url = API + cod + '/dados?formato=json&dataInicial=' + brData(b[0]) + '&dataFinal=' + brData(b[1]);
      return fetch(url).then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .catch(function(){ return null; });
    })).then(function(partes){
      var ok = partes.some(function(p){ return Array.isArray(p); });
      if (!ok) return null;
      var linhas = [];
      partes.forEach(function(p){ if (Array.isArray(p)) linhas = linhas.concat(p); });
      return linhas.map(function(x){ return [isoDeBR(x.data), parseFloat(String(x.valor).replace(',', '.'))]; })
                   .filter(function(x){ return isFinite(x[1]); });
    });
  }

  function mesclarDiaria(nome, linhas){
    var atual = S[nome] || { d: [], v: [] }, mapa = {};
    atual.d.forEach(function(d, i){ mapa[d] = atual.v[i]; });
    linhas.forEach(function(x){ mapa[x[0]] = x[1]; });
    var datas = Object.keys(mapa).sort();
    S[nome] = { d: datas, v: datas.map(function(d){ return mapa[d]; }) };
    delete _prefixo[nome];
  }
  function mesclarMensal(nome, linhas){
    var atual = S[nome] || { m: {}, ult: '' };
    linhas.forEach(function(x){ atual.m[x[0].slice(0, 7)] = x[1]; });
    atual.ult = Object.keys(atual.m).sort().pop() || '';
    S[nome] = atual;
  }

  var _carregando = null, _ouvintes = [];
  function carregar(desdeISO){
    if (_carregando) return _carregando;
    var hoje = hojeISO();
    var _folga = function(iso){ return isoDe(addDias(dataDe(iso), 7)); };
    if (S.atualizado === hoje && S.cdi && S.cdi.d.length && (!desdeISO || S.cdi.d[0] <= _folga(desdeISO))) return Promise.resolve(false);
    var desde = desdeISO || '2015-01-01';
    var jobs = Object.keys(SERIES).map(function(nome){
      /* Busca incremental: se o cache já cobre o período pedido, traz só os
         últimos dias (com folga de 10 dias para revisões); senão, busca tudo
         desde a data mais antiga necessária. */
      var inicio = desde, c = S[nome];
      if (c) {
        if (MENSAIS[nome]) {
          var meses = Object.keys(c.m || {}).sort();
          if (meses.length && meses[0] <= desde.slice(0, 7) && c.ult) inicio = c.ult + '-01';
        } else if (c.d && c.d.length && c.d[0] <= isoDe(addDias(dataDe(desde), 7))) {
          inicio = isoDe(addDias(dataDe(c.d[c.d.length - 1]), -10));
        }
      }
      return buscarSerie(nome, inicio).then(function(linhas){
        if (!linhas || !linhas.length) return false;
        if (MENSAIS[nome]) mesclarMensal(nome, linhas); else mesclarDiaria(nome, linhas);
        return true;
      });
    });
    _carregando = Promise.all(jobs).then(function(res){
      _carregando = null;
      var algum = res.some(Boolean);
      if (algum) { S.atualizado = hoje; gravarCache(); _memo = {}; }
      if (algum) _ouvintes.forEach(function(cb){ try { cb(); } catch(e){} });
      try { window.dispatchEvent(new CustomEvent('g20rf:atualizado')); } catch(e){}
      return algum;
    }).catch(function(){ _carregando = null; return false; });
    return _carregando;
  }

  /* ─────────────────── taxas atuais (fallback e dicas) ─────────────────── */
  function ultimoDiario(nome){ var s = S[nome]; return (s && s.v.length) ? s.v[s.v.length - 1] : null; }
  function ind(){ return window.IND || {}; }
  function taxaAnual(nome){
    if (nome === 'cdi' || nome === 'selic') {
      var v = ultimoDiario(nome);
      if (v !== null) return (Math.pow(1 + v / 100, 252) - 1) * 100;
      return ind()[nome] || (nome === 'cdi' ? 14.65 : 14.75);
    }
    if (nome === 'ipca' || nome === 'igpm') {
      var s = S[nome];
      if (s && s.ult) {
        var ks = Object.keys(s.m).sort().slice(-12), f = 1;
        ks.forEach(function(k){ f *= 1 + s.m[k] / 100; });
        if (ks.length === 12) return (f - 1) * 100;
      }
      return ind()[nome] || (nome === 'ipca' ? 4.8 : 4.0);
    }
    return null;
  }
  function diarioFallback(nome){ return (Math.pow(1 + taxaAnual(nome) / 100, 1 / 252) - 1) * 100; }

  /* ─────────────────────────── fatores ─────────────────────────── */
  var _memo = {}, _prefixo = {};
  function busca(arr, iso){ var lo = 0, hi = arr.length; while (lo < hi) { var m = (lo + hi) >> 1; if (arr[m] < iso) lo = m + 1; else hi = m; } return lo; }

  // Prefixo de log para séries diárias com um multiplicador (pct): fator(a,b) em O(log n)
  function prefixo(nome, pct){
    var chave = pct.toFixed(6); _prefixo[nome] = _prefixo[nome] || {};
    if (_prefixo[nome][chave]) return _prefixo[nome][chave];
    var s = S[nome], acc = [0];
    for (var i = 0; i < s.v.length; i++) acc.push(acc[i] + Math.log(1 + (s.v[i] / 100) * pct));
    return (_prefixo[nome][chave] = acc);
  }
  // Fator de série diária no intervalo [a, b). Dias sem dado usam a última taxa.
  function fatorDiario(nome, a, b, pct){
    var du = diasUteis(a, b);
    if (du <= 0) return { f: 1, estimado: false };
    var s = S[nome];
    if (!s || !s.d.length) return { f: Math.pow(1 + (diarioFallback(nome) / 100) * pct, du), estimado: true };
    var ia = busca(s.d, a), ib = busca(s.d, b), acc = prefixo(nome, pct);
    var comDado = ib - ia, faltam = Math.max(0, du - comDado);
    var f = Math.exp(acc[ib] - acc[ia]);
    if (faltam) f *= Math.pow(1 + (ultimoDiario(nome) / 100) * pct, faltam);
    return { f: f, estimado: faltam > 3 };
  }
  // Fator de índice mensal com pró-rata por dias úteis no intervalo [a, b)
  function fatorMensal(nome, a, b){
    if (b <= a) return { f: 1, estimado: false };
    var s = S[nome], f = 1, estimado = !s || !s.ult, mensalFb = Math.pow(1 + taxaAnual(nome) / 100, 1 / 12) - 1;
    var d = new Date(dataDe(a).getFullYear(), dataDe(a).getMonth(), 1, 12);
    while (isoDe(d) < b) {
      var ini = isoDe(d), prox = new Date(d.getFullYear(), d.getMonth() + 1, 1, 12), fim = isoDe(prox);
      var duMes = diasUteis(ini, fim), duIn = diasUteis(a > ini ? a : ini, b < fim ? b : fim);
      if (duMes > 0 && duIn > 0) {
        var k = ini.slice(0, 7), v;
        if (s && s.m[k] !== undefined) v = s.m[k] / 100;
        else if (s && s.ult) { v = s.m[s.ult] / 100; if (k < s.ult) estimado = true; }
        else v = mensalFb;
        f *= Math.pow(1 + v, duIn / duMes);
      }
      d = prox;
    }
    return { f: f, estimado: estimado };
  }
  // Poupança: rende a cada aniversário mensal completo
  function fatorPoupanca(a, b){
    var ini = dataDe(a);
    if (ini.getDate() > 28) ini = new Date(ini.getFullYear(), ini.getMonth() + 1, 1, 12);
    var s = S.poup, f = 1, estimado = !s || !s.d.length, k = 1;
    var fb = (taxaAnual('selic') > 8.5) ? 0.6 : (taxaAnual('selic') * 0.7 / 12 + 0.1);
    while (true) {
      var aniv = addMeses(ini, k); if (isoDe(aniv) > b) break;
      var periodo = isoDe(addMeses(ini, k - 1)), v;
      if (s && s.d.length) { var i = busca(s.d, periodo); v = (s.d[i] === periodo) ? s.v[i] : s.v[Math.min(i, s.v.length - 1)]; if (s.d[i] !== periodo) estimado = true; }
      else v = fb;
      f *= 1 + v / 100; k++;
    }
    return { f: f, estimado: estimado };
  }

  /* ──────────────────────── produtos e regras ──────────────────────── */
  var ISENTO_IR  = { LCI: 1, LCA: 1, LCD: 1, LIG: 1, CRI: 1, CRA: 1, DEBI: 1, POUP: 1 };
  var ISENTO_IOF = { LCI: 1, LCA: 1, POUP: 1 };
  var TD_INDEXADOR = { selic: 'Selic', prefixado: 'Prefixado', prefixado_juros: 'Prefixado',
                       ipca: 'IPCA', ipca_juros: 'IPCA', rendamais: 'IPCA', educa: 'IPCA' };
  function indexadorDe(rf){
    if (rf.tipo === 'POUP') return 'POUP';
    if (rf.tipo === 'TD' && TD_INDEXADOR[rf.tdSubtipo]) return TD_INDEXADOR[rf.tdSubtipo];
    return rf.indexador || 'CDI';
  }
  function aliqIR(dc){ return dc <= 180 ? 22.5 : dc <= 360 ? 20 : dc <= 720 ? 17.5 : 15; }
  var IOF_TAB = [96,93,90,86,83,80,76,73,70,66,63,60,56,53,50,46,43,40,36,33,30,26,23,20,16,13,10,6,3,0];
  function aliqIOF(dc){ return dc >= 30 ? 0 : (dc <= 0 ? 96 : IOF_TAB[dc - 1]); }

  // Fator do indexador no intervalo [a, b)
  function fatorEntre(rf, a, b){
    var ix = indexadorDe(rf), t = parseFloat(rf.taxa) || 0;
    if (ix === 'CDI')       return fatorDiario('cdi', a, b, t / 100);
    if (ix === 'Selic')   { var r = fatorDiario('selic', a, b, 1); r.f *= Math.pow(1 + t / 100, diasUteis(a, b) / 252); return r; }
    if (ix === 'IPCA' || ix === 'IGPM') { var m = fatorMensal(ix === 'IPCA' ? 'ipca' : 'igpm', a, b); m.f *= Math.pow(1 + t / 100, diasUteis(a, b) / 252); return m; }
    if (ix === 'Prefixado') return { f: Math.pow(1 + t / 100, diasUteis(a, b) / 252), estimado: false };
    if (ix === 'POUP')      return fatorPoupanca(a, b);
    return { f: 1, estimado: false };
  }

  // Datas de cupom entre (a, b]
  function datasCupom(rf, a, b){
    var sub = rf.tdSubtipo, meses;
    if (rf.tipo !== 'TD') return [];
    if (sub === 'prefixado_juros') meses = [[0, 1], [6, 1]];                       // 01/jan e 01/jul
    else if (sub === 'ipca_juros') {
      var mv = rf.vencimento ? dataDe(rf.vencimento).getMonth() : 4;
      meses = (mv === 1 || mv === 7) ? [[1, 15], [7, 15]] : [[4, 15], [10, 15]];  // fev/ago ou mai/nov
    } else return [];
    var out = [], y0 = dataDe(a).getFullYear(), y1 = dataDe(b).getFullYear();
    for (var y = y0; y <= y1; y++) meses.forEach(function(m){
      var iso = isoDe(new Date(y, m[0], m[1], 12)); if (iso > a && iso <= b) out.push(iso);
    });
    return out.sort();
  }
  var CUPOM_SEM = { prefixado_juros: Math.pow(1.10, 0.5) - 1, ipca_juros: Math.pow(1.06, 0.5) - 1 };

  /* ─────────────────────────── cálculo ─────────────────────────── */
  function fimDoCalculo(rf, ateISO){
    var ate = ateISO || hojeISO();
    return (rf.vencimento && rf.vencimento < ate) ? rf.vencimento : ate;
  }

  // Valor bruto na curva (sem impostos) em ateISO (padrão: hoje), limitado ao vencimento
  function bruto(rf, ateISO){
    var vi = parseFloat(rf.valorInv) || 0, ini = String(rf.dataInicio || '').slice(0, 10);
    if (!(vi > 0) || !ini) return { valor: vi, estimado: false, cupons: [] };
    var fim = fimDoCalculo(rf, ateISO);
    if (fim <= ini) return { valor: vi, estimado: false, cupons: [] };
    var chave = [vi, ini, fim, indexadorDe(rf), rf.taxa, rf.tipo, rf.tdSubtipo, rf.vencimento, S.atualizado].join('|');
    if (_memo[chave]) return _memo[chave];
    var W = vi, ultimo = ini, estimado = false, cupons = [], c = CUPOM_SEM[rf.tdSubtipo];
    if (c) datasCupom(rf, ini, fim).forEach(function(dc){
      var r = fatorEntre(rf, ultimo, dc); W *= r.f; estimado = estimado || r.estimado;
      var cup = W * c / (1 + c); W -= cup; ultimo = dc;
      cupons.push({ data: dc, bruto: cup });
    });
    var rF = fatorEntre(rf, ultimo, fim); W *= rF.f; estimado = estimado || rF.estimado;
    return (_memo[chave] = { valor: W, estimado: estimado, cupons: cupons, fim: fim });
  }

  // Fração do Tesouro Selic sujeita à custódia (só o que passa de R$ 10 mil por CPF)
  var _selicCache = { t: 0, frac: 1 };
  function fracaoCustodiaSelic(){
    if (Date.now() - _selicCache.t < 2000) return _selicCache.frac;
    var total = 0;
    try {
      (JSON.parse(localStorage.getItem('g20_rendaFixa') || '[]') || []).forEach(function(r){
        if (r && !r.encerrado && r.tipo === 'TD' && r.tdSubtipo === 'selic') total += bruto(r).valor;
      });
    } catch(e){}
    var frac = total > 10000 ? (total - 10000) / total : 0;
    _selicCache = { t: Date.now(), frac: frac };
    return frac;
  }

  // Detalhe completo: bruto, custódia, IOF, IR, líquido, cupons, status
  function liquido(rf, opts){
    opts = opts || {};
    var vi = parseFloat(rf.valorInv) || 0, ini = String(rf.dataInicio || '').slice(0, 10);
    var b = bruto(rf, opts.ate), fim = b.fim || fimDoCalculo(rf, opts.ate), dc = ini ? diasCorridos(ini, fim) : 0;
    var out = { bruto: b.valor, custodia: 0, iof: 0, ir: 0, liquido: b.valor, estimado: b.estimado,
                vencido: !!(rf.vencimento && rf.vencimento <= (opts.ate || hojeISO())), cupons: [], cuponsLiquido: 0 };
    if (rf.tipo === 'TD' && rf.tdSubtipo !== 'rendamais' && rf.tdSubtipo !== 'educa') {
      var baseMedia = (vi + b.valor) / 2, custo = baseMedia * 0.002 * (dc / 365);
      if (rf.tdSubtipo === 'selic') custo *= fracaoCustodiaSelic();
      out.custodia = custo;
    }
    var rend = b.valor - vi - out.custodia;
    if (rend > 0) {
      if (!ISENTO_IOF[rf.tipo] && dc < 30) out.iof = rend * aliqIOF(dc) / 100;
      if (!ISENTO_IR[rf.tipo]) out.ir = (rend - out.iof) * aliqIR(dc) / 100;
    }
    out.liquido = b.valor - out.custodia - out.iof - out.ir;
    b.cupons.forEach(function(cp){
      var ir = ISENTO_IR[rf.tipo] ? 0 : cp.bruto * aliqIR(diasCorridos(ini, cp.data)) / 100;
      out.cupons.push({ data: cp.data, bruto: cp.bruto, ir: ir, liquido: cp.bruto - ir });
      out.cuponsLiquido += cp.bruto - ir;
    });
    return out;
  }

  // Rendimento bruto do último dia útil (para a "variação do dia")
  function varDia(rf){
    var hoje = hojeISO(), ontem = diaUtilAnterior(hoje);
    return bruto(rf, hoje).valor - bruto(rf, ontem).valor;
  }

  window.G20RF = {
    versao: 1,
    carregar: carregar,
    aoAtualizar: function(cb){ if (typeof cb === 'function') _ouvintes.push(cb); },
    bruto: bruto, liquido: liquido, varDia: varDia,
    taxaAnual: taxaAnual, diasUteis: diasUteis, ehDiaUtil: ehDiaUtil, diaUtilAnterior: diaUtilAnterior,
    indexadorDe: indexadorDe, isentoIR: function(t){ return !!ISENTO_IR[t]; }, isentoIOF: function(t){ return !!ISENTO_IOF[t]; },
    aliquotaIR: aliqIR, aliquotaIOF: aliqIOF,
    series: function(){ return S; }
  };
})();
