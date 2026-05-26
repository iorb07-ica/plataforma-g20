/* ============================================================
   b3-classificacao.js  ·  Classificação de ativos da B3
   Plataforma G20 — fonte ÚNICA de verdade.
   Carregado por: carteira.html e gestao-patrimonial.html
   ------------------------------------------------------------
   Tickers terminados em "11" podem ser 4 classes distintas:
     • Unit     → pacote de ações (ON+PN). Tratado como Ação.
     • FIAGRO   → Fundo de Inv. nas Cadeias Produtivas Agro.
     • FI-Infra → Fundo de Investimento em Infraestrutura.
     • FII      → Fundo de Investimento Imobiliário (PADRÃO).

   classificar11() decide pela lista. FII é o catch-all:
   só cai em FII o ticker "11" que não está em nenhuma lista.

   COMO MANTER: ao surgir fundo/Unit novo na B3, basta
   adicionar o ticker na lista correta abaixo. Nada mais muda.
   Listas compiladas da B3 / Funds Explorer / Mais Retorno — mai/2026.
   ============================================================ */

// --- UNITS (equity — classificadas como Ação) ---------------
var UNITS_CONHECIDAS = [
  'TAEE11','SANB11','BPAC11','KLBN11','ENGI11',
  'SAPR11','ALUP11','IGTI11','AZEV11'
];

// --- FIAGRO -------------------------------------------------
var FIAGROS_CONHECIDOS = [
  'AAGR11','AAZQ11','AGRX11','AMAZ11','BBGO11','BRFT11','BTAG11',
  'BTRA11','CAFE11','CAUT11','CCFA11','CPTA11','CPTR11','CRAA11',
  'CTEM11','DCRA11','EGAF11','EQIA11','FARM11','FGAA11','FLEM11',
  'FTCA11','FZDA11','FZDB11','GCRA11','GRWA11','HCRA11','HGAG11',
  'IAAG11','IAGR11','IDGO11','JGPX11','KDOL11','KNCA11','KOPA11',
  'LAFI11','LSAG11','MAVC11','NAGR11','NCRA11','NELO11','NEXG11',
  'OIAG11','PLCA11','RURA11','RZAG11','RZEO11','SNAG11','SNFZ11',
  'STMB11','VCRA11','VGIA11','VHFA11','XPCA11'
];

// --- FI-INFRA -----------------------------------------------
var FIINFRAS_CONHECIDOS = [
  'BODB11','BDIF11','BRZD11','CPTI11','INFB11','INFA11','VANG11',
  'BIDB11','IRIF11','IFRI11','JMBI11','IFRA11','KDIF11','NUIF11',
  'OGIN11','RBIF11','RIFF11','CDII11','JURO11','SNID11','XPID11'
];

/**
 * Classifica um ticker no padrão "4 letras + 11".
 * Aceita com ou sem sufixo .SA, maiúsculo ou minúsculo.
 * Retorna: 'Acao' | 'FIAGRO' | 'FIInfra' | 'FII'
 */
function classificar11(t){
  t = String(t || '').replace(/\.SA$/i, '').toUpperCase();
  if(UNITS_CONHECIDAS.includes(t))    return 'Acao';
  if(FIAGROS_CONHECIDOS.includes(t))  return 'FIAGRO';
  if(FIINFRAS_CONHECIDOS.includes(t)) return 'FIInfra';
  return 'FII';
}
