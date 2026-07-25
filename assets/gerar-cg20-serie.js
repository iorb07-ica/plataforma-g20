/* ═══════════════════════════════════════════════════════════════════════════
   GERADOR DA SÉRIE CONGELADA DA CARTEIRA G20  —  sessão 51.0

   PARA QUE SERVE
   Produz o arquivo assets/cg20-serie.json, que alimenta o modo demonstração
   do tour do primeiro acesso. É um retrato da Carteira G20: fica estático,
   serve só como exemplo pro aluno ver como o dashboard dele vai parecer
   quando ele cadastrar os aportes.

   ═══════════════════════════════════════════════════════════════════════════
   ATENÇÃO — RODE EM ABA ANÔNIMA (Ctrl+Shift+N)
   ═══════════════════════════════════════════════════════════════════════════
   O motor G20Rent grava a série que calcula no IndexedDB. Se você rodar isto
   na sua aba normal, a série da CG20 sobrescreve a série da SUA carteira
   pessoal, e o seu dashboard passa a mostrar números da CG20 até reconstruir.

   Em aba anônima o IndexedDB é separado e some quando você fecha a janela.
   Nada seu é tocado.

   COMO USAR
   1. Ctrl+Shift+N (aba anônima)
   2. Entre na plataforma com iorb@hotmail.com
   3. Abra a Carteira G20 e espere carregar (é ela que traz os aportes da CG20)
   4. Vá para o dashboard e espere os cards preencherem
   5. F12 -> Console -> cole este arquivo inteiro -> Enter
   6. Aguarde (pode levar 1-3 min: busca preço histórico de cada ativo)
   7. O download de cg20-serie.json começa sozinho
   8. Salve em assets/ do repositório e suba pro GitHub
   9. FECHE a aba anônima
   ═══════════════════════════════════════════════════════════════════════════ */

(async function gerarSerieCG20() {
  'use strict';

  var log = function (msg, cor) {
    console.log('%c[CG20] ' + msg, 'color:' + (cor || '#e8b84b') + ';font-weight:bold');
  };

  // ── 1. Confere se está tudo no lugar ──────────────────────────────────────
  if (!window.G20Rent || typeof G20Rent.calcular !== 'function') {
    log('G20Rent não encontrado. Você está no dashboard?', '#f87171');
    return;
  }

  var aportes = [];
  try { aportes = JSON.parse(localStorage.getItem('g20_aportes') || '[]'); } catch (e) {}

  if (!Array.isArray(aportes) || aportes.length === 0) {
    log('Nenhum aporte da CG20 encontrado em g20_aportes.', '#f87171');
    log('Abra a página Carteira G20 primeiro, espere carregar, e volte aqui.', '#f87171');
    return;
  }

  var tickers = {};
  aportes.forEach(function (a) { if (a && a.ticker) tickers[a.ticker] = 1; });
  var nTickers = Object.keys(tickers).length;

  log(aportes.length + ' aportes da CG20, ' + nTickers + ' ativos distintos.');
  log('Calculando a série histórica. Isso demora — não feche a aba.');

  // ── 2. Índices macro (mesmos valores que o dashboard usa) ────────────────
  var indices = {
    cdi:   (typeof IND !== 'undefined' && IND.cdi)   ? IND.cdi   : 14.15,
    selic: (typeof IND !== 'undefined' && IND.selic) ? IND.selic : 14.25,
    ipca:  (typeof IND !== 'undefined' && IND.ipca)  ? IND.ipca  : 4.64,
    igpm:  (typeof IND !== 'undefined' && IND.igpm)  ? IND.igpm  : 3.18
  };

  var t0 = Date.now();
  var serie = null;
  try {
    serie = await G20Rent.calcular({ aportes: aportes, rendaFixa: [], indices: indices });
  } catch (e) {
    log('Falha no cálculo: ' + (e && e.message ? e.message : e), '#f87171');
    return;
  }

  if (!serie || serie.length < 2) {
    log('A série voltou vazia. Provável falta de preços históricos.', '#f87171');
    return;
  }

  var seg = Math.round((Date.now() - t0) / 1000);
  log('Série pronta: ' + serie.length + ' dias (' + serie[0].d + ' -> ' +
      serie[serie.length - 1].d + ') em ' + seg + 's.', '#4ade80');

  // ── 3. Enxuga: o tour não precisa de todos os campos ─────────────────────
  // Mantemos só o que os cards leem. Corta o arquivo pela metade, e nada
  // aqui é dado sensível — é a carteira educacional, que o aluno já vê.
  var enxuta = serie.map(function (p) {
    return {
      d:  p.d,
      patrimonio: Math.round(p.patrimonio * 100) / 100,
      rv: Math.round((p.rv || 0) * 100) / 100,
      rf: Math.round((p.rf || 0) * 100) / 100,
      fluxo: Math.round((p.fluxo || 0) * 100) / 100
    };
  });

  var ultimo = enxuta[enxuta.length - 1];

  var payload = {
    _leiaMe: 'Retrato estático da Carteira G20 para o modo demonstração do tour ' +
             'do primeiro acesso. Não é dado de nenhum aluno. Regenere quando quiser ' +
             'com assets/gerar-cg20-serie.js.',
    geradoEm: new Date().toISOString(),
    dias: enxuta.length,
    de: enxuta[0].d,
    ate: ultimo.d,
    ativos: nTickers,
    patrimonioFinal: ultimo.patrimonio,
    indices: indices,
    serie: enxuta
  };

  var json = JSON.stringify(payload);
  var kb = Math.round(json.length / 1024);
  log('Arquivo: ' + kb + ' KB  |  patrimônio final R$ ' +
      ultimo.patrimonio.toLocaleString('pt-BR', { maximumFractionDigits: 0 }));

  if (kb > 900) {
    log('Ficou grande (>900KB). Vou amostrar 1 ponto a cada 2 dias.', '#e8b84b');
    payload.serie = enxuta.filter(function (_, i) { return i % 2 === 0 || i === enxuta.length - 1; });
    payload.dias = payload.serie.length;
    payload.amostrado = '1 ponto a cada 2 dias';
    json = JSON.stringify(payload);
    log('Agora: ' + Math.round(json.length / 1024) + ' KB, ' + payload.dias + ' pontos.');
  }

  // ── 4. Baixa ─────────────────────────────────────────────────────────────
  var blob = new Blob([json], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cg20-serie.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    URL.revokeObjectURL(a.href);
    if (a.parentNode) a.parentNode.removeChild(a);
  }, 2000);

  log('Download iniciado. Salve em assets/cg20-serie.json e FECHE a aba anônima.', '#4ade80');
})();
