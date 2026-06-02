/* ============================================================
   G20 — Base de informações de ativos (nome + classe)
   Usado por: g20flix.html, admin-g20flix.html
   Estrutura extensível: 'TICKER': ['Nome da empresa','Classe']
   Classes: Ação BR | Fundo Imobiliário | Fiagro | ETF BR |
            Stock | REIT | ETF Internacional | Cripto | BDR | Outro
   ============================================================ */
(function(){
  var ATIVOS_INFO={
// ── Internacional (Stocks) ──
'INTR':['Inter & Co','Stock'],'NU':['Nubank','Stock'],'LULU':['Lululemon','Stock'],
'DPZ':["Domino's Pizza",'Stock'],'ANF':['Abercrombie & Fitch','Stock'],'AAPL':['Apple','Stock'],
'MSFT':['Microsoft','Stock'],'NVDA':['Nvidia','Stock'],'GOOGL':['Alphabet','Stock'],'AMZN':['Amazon','Stock'],
'META':['Meta Platforms','Stock'],'MELI':['MercadoLibre','Stock'],'BRK.B':['Berkshire Hathaway','Stock'],
'ACN':['Accenture','Stock'],'ADBE':['Adobe','Stock'],'ORCL':['Oracle','Stock'],'DUOL':['Duolingo','Stock'],
'KO':['Coca-Cola','Stock'],'PEP':['PepsiCo','Stock'],'V':['Visa','Stock'],'MA':['Mastercard','Stock'],'XP':['XP Inc','Stock'],
// ── REITs ──
'NNN':['National Retail Properties','REIT'],'IIPR':['Innovative Industrial Properties','REIT'],'O':['Realty Income','REIT'],
// ── ETFs Internacionais ──
'NOBL':['ProShares Dividend Aristocrats','ETF Internacional'],'HERO':['Global X Video Games & Esports','ETF Internacional'],
// ── Ações BR ──
'PETR4':['Petrobras','Ação BR'],'PETR3':['Petrobras','Ação BR'],'VALE3':['Vale','Ação BR'],'ITUB4':['Itaú Unibanco','Ação BR'],
'BBDC4':['Bradesco','Ação BR'],'BBAS3':['Banco do Brasil','Ação BR'],'ABEV3':['Ambev','Ação BR'],'B3SA3':['B3','Ação BR'],
'WEGE3':['WEG','Ação BR'],'EGIE3':['Engie Brasil','Ação BR'],'EQTL3':['Equatorial','Ação BR'],'SBSP3':['Sabesp','Ação BR'],
'TOTS3':['Totvs','Ação BR'],'RADL3':['Raia Drogasil','Ação BR'],'RENT3':['Localiza','Ação BR'],'PRIO3':['PRIO','Ação BR'],
'SUZB3':['Suzano','Ação BR'],'EMBR3':['Embraer','Ação BR'],'BBSE3':['BB Seguridade','Ação BR'],'VIVT3':['Vivo','Ação BR'],
'KLBN11':['Klabin','Ação BR'],'BPAC11':['BTG Pactual','Ação BR'],'SAPR11':['Sanepar','Ação BR'],'GGBR4':['Gerdau','Ação BR'],
'CMIG4':['Cemig','Ação BR'],'MGLU3':['Magazine Luiza','Ação BR'],'LREN3':['Lojas Renner','Ação BR'],'MULT3':['Multiplan','Ação BR'],
'HAPV3':['Hapvida','Ação BR'],'ENEV3':['Eneva','Ação BR'],'QUAL3':['Qualicorp','Ação BR'],'BRKM5':['Braskem','Ação BR'],
'NATU3':['Natura','Ação BR'],'CVCB3':['CVC','Ação BR'],
// ── Fiagros ──
'KNCA11':['Kinea Crédito Agro','Fiagro'],'SNAG11':['Suno Agro','Fiagro'],'CPTR11':['Capitânia Agro','Fiagro'],'XPCA11':['XP Crédito Agro','Fiagro'],
// ── Fundos Imobiliários ──
'HGLG11':['CSHG Logística','Fundo Imobiliário'],'KNRI11':['Kinea Renda Imobiliária','Fundo Imobiliário'],
'XPLG11':['XP Log','Fundo Imobiliário'],'VISC11':['Vinci Shopping Centers','Fundo Imobiliário'],
'RBRR11':['RBR Rendimento High Grade','Fundo Imobiliário'],'HCTR11':['Hectare CE','Fundo Imobiliário'],
'BCRI11':['Banestes Recebíveis Imob.','Fundo Imobiliário'],
// ── Cripto ──
'BTC':['Bitcoin','Cripto'],'ETH':['Ethereum','Cripto'],'SOL':['Solana','Cripto'],'LINK':['Chainlink','Cripto']
  };

  // classes disponíveis (para o seletor no admin)
  var CLASSES=['Ação BR','Fundo Imobiliário','Fiagro','ETF BR','Stock','REIT','ETF Internacional','Cripto','BDR','Outro'];

  function _norm(tk){ return String(tk||'').toUpperCase().trim().replace(/\.SA$/,''); }

  // deriva o nome a partir do slug do TradingView (mesmo arquivo dos logos)
  // ex.: 'berkshire-hathaway' -> 'Berkshire Hathaway'
  function _nomeDoSlug(slug){
    if(!slug || /^crypto\//.test(slug)) return '';
    slug=String(slug).replace(/^.*\//,'').replace(/--big$/,'');
    return slug.split('-').map(function(w){ return w ? w.charAt(0).toUpperCase()+w.slice(1) : w; }).join(' ');
  }
  function _slugDe(tk){
    return (window.TV_LOGOS && window.TV_LOGOS.map) ? (window.TV_LOGOS.map[tk]||'') : '';
  }

  // palpite de classe pelo formato do ticker (não usa getInfo p/ evitar recursão)
  function palpiteClasse(tk){
    tk=_norm(tk);
    if(/^crypto\//.test(_slugDe(tk))) return 'Cripto';
    if(ATIVOS_INFO[tk]) return ATIVOS_INFO[tk][1];
    if(/^[A-Z]{4}11$/.test(tk)) return 'Fundo Imobiliário';      // FII/Fiagro/ETF BR/Unit (palpite)
    if(/^[A-Z]{4}\d{1,2}$/.test(tk)) return 'Ação BR';
    return 'Stock';
  }

  // retorna {nome,classe}: 1º mapa curado (perfeito) -> 2º nome derivado do TradingView
  function getInfo(tk){
    tk=_norm(tk);
    var i=ATIVOS_INFO[tk];
    if(i) return {nome:i[0], classe:i[1]};            // curado: nome + classe certos
    return {nome:_nomeDoSlug(_slugDe(tk)), classe:palpiteClasse(tk)};  // derivado do TradingView
  }

  // resolve o nome de qualquer ticker (curado ou derivado do TradingView)
  function resolverNome(tk){ return getInfo(tk).nome; }

  window.G20_ATIVOS={
    map: ATIVOS_INFO,
    getInfo: getInfo,
    palpiteClasse: palpiteClasse,
    resolverNome: resolverNome,
    classes: CLASSES,
    count: Object.keys(ATIVOS_INFO).length
  };
})();
