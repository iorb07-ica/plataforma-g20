// ==========================================================================
// tradingview-logos.js
// Mapa de tickers da CG20/GP para logoids do TradingView.
// Carregado globalmente como window.TV_LOGOS em todas as paginas.
//
// Gerado em: 19/04/2026 via scripts/fetch-tradingview-logos.js
// Total: 116 ativos (9 criptos + 30 acoes BR + 10 FIIs + 4 FIAGROs +
//                     40 stocks US + 9 REITs + 14 ETFs)
//
// Para atualizar quando adicionar/remover ativos:
//   1. Edita scripts/tickers-source.js
//   2. Roda: node scripts/fetch-tradingview-logos.js
//   3. Substitui este arquivo pelo novo gerado
// ==========================================================================

(function(){
  'use strict';

  // URL templates oficiais do S3 do TradingView
  var S3_BASE = 'https://s3-symbol-logo.tradingview.com';

  // Mapa ticker -> logoid (sem extensao)
  var LOGOS = {
    // CRIPTOS
    'BTC': 'crypto/XTVCBTC',
    'ETH': 'crypto/XTVCETH',
    'SOL': 'crypto/XTVCSOL',
    'BNB': 'crypto/XTVCBNB',
    'LINK': 'crypto/XTVCLINK',
    'HNT': 'crypto/XTVCHNT',
    'DOT': 'crypto/XTVCDOT',
    'MANA': 'crypto/XTVCMANA',
    'SAND': 'crypto/XTVCSAND',

    // ACOES BR — slugs confirmados funcionando no TradingView
    'ITUB4': 'itau-unibanco',
    'BBDC4': 'bradesco',
    'BBAS3': 'banco-do-brasil',
    'ABEV3': 'ambev',
    'B3SA3': 'b3-on-nm',
    'GGBR4': 'gerdau',
    'BBSE3': 'bb-seguridade',
    'EQTL3': 'equatorial',
    'SBSP3': 'sabesp',
    'KLBN11': 'klabin',
    'VIVT3': 'telefonica-brasil',
    'MULT3': 'multiplan',
    'HAPV3': 'hapvida',
    'TOTS3': 'totvs',
    'EMBR3': 'embraer',
    'PETR3': 'brasileiro-petrobras',
    // RAIL3, SANB11, ENGI11, CYRE3 — sem slug válido no TradingView, usa icones-b3

    // STOCKS US — adicionadas (NOT FOUND no console)
    'GOOGL': 'alphabet',
    'JPM': 'jpmorgan-chase',
    'BAC': 'bank-of-america',
    'COST': 'costco-wholesale',
    'STNE': 'stoneco',
    'WMT': 'walmart',
    'HD': 'home-depot',
    'AVGO': 'broadcom',
    'KO': 'coca-cola',
    'V': 'visa',
    'MA': 'mastercard',
    'XOM': 'exxon-mobil',
    'CVX': 'chevron',
    'PFE': 'pfizer',
    'ABBV': 'abbvie',
    'MRK': 'merck',
    'TXN': 'texas-instruments',
    'QCOM': 'qualcomm',
    'BKNG': 'booking-holdings',
    'GE': 'ge-aerospace',
    'INTC': 'intel',
    'AMD': 'advanced-micro-devices',
    'CRM': 'salesforce',
    'BAC': 'bank-of-america',
    'TSMC': 'taiwan-semiconductor',

    // ACOES BR
    'PRIO3': 'petrorio-on-nm',
    'VALE3': 'vale',
    'EMBJ3': 'embraer',
    'PETR4': 'brasileiro-petrobras',
    'BPAC11': 'btgp',
    'SBFG3': 'grupo-sbf-on-nm',
    'RENT3': 'localiza',
    'VIVA3': 'vivara-sa-on-nm',
    'INTB3': 'intelbras-on-nm',
    'BMOB3': 'bemobi-tech-on-nm',
    'LREN3': 'lojas-renner',
    'WEGE3': 'weg',
    'SAPR11': 'sanepar',
    'RADL3': 'raiadrogasilon',
    'VULC3': 'vulcabras',
    'AZZA3': 'arezzo',
    'MGLU3': 'magaz-luiza-on-nm',
    'CVCB3': 'cvc-brasil-on-nm',
    'ENEV3': 'eneva',
    'WIZC3': 'wiz-s-a',
    'BRAV3': 'brava-on-nm',
    'AUAU3': 'uniao-pet-participacoes-sa',
    'QUAL3': 'qualicorp-on-nm',
    'BRKM5': 'braskem',
    'EGIE3': 'engie-brasilon-nm',
    'GMAT3': 'grupo-mateuson-nm',
    'SUZB3': 'suzano',
    'CMIG4': 'cemig',
    'TRIS3': 'trisul',
    'NATU3': 'natura-and-co',

    // STOCKS US
    'AMZN': 'amazon',
    'META': 'meta-platforms',
    'INTR': 'inter-and-co',
    'NVDA': 'nvidia',
    'COIN': 'coinbase',
    'BRK.B': 'berkshire-hathaway',
    'TSM': 'taiwan-semiconductor',
    'GOOG': 'alphabet',
    'MSFT': 'microsoft',
    'DELL': 'dell',
    'AAPL': 'apple',
    'ASML': 'asml',
    'NFLX': 'netflix',
    'PYPL': 'paypal',
    'XP': 'xp',
    'MELI': 'mercadolibre',
    'CEG': 'constellation-energy-cad-hedged-cibc-cdr',
    'UNH': 'unitedhealth',
    'BABA': 'alibaba',
    'FTNT': 'fortinet',
    'NKE': 'nike',
    'ENPH': 'enphase-energy',
    'VST': 'vistra-energy',
    'ORCL': 'oracle',
    'ADBE': 'adobe',
    'LULU': 'lululemon-athletica',
    'ACN': 'accenture',
    'NU': 'nu-holdings',
    'CROX': 'crocs',
    'NVO': 'novo-nordisk',
    'DIS': 'walt-disney',
    'QBTS': 'd-wave-quantum',
    'RGTI': 'rigetti-computing-redeemable',
    'ANF': 'abercrombie-and-fitch',
    'DUOL': 'duolingo',
    'MNST': 'monster-beverage',
    'BLK': 'blackrock',
    'TSLA': 'tesla',
    'DPZ': 'dominos-pizza',
    'ROL': 'rollins',

    // REITs
    'EQIX': 'equinix',
    'SKT': 'tanger-factory-outlet-centers',
    'O': 'realty-income',
    'SLG': 'sl-green-realty',
    'IIPR': 'innovative-industrial-properties',
    'DOC': 'healthpeak-properties',
    'PLD': 'prologis',
    'ESS': 'essex-property-trust',
    'NNN': 'national-retail-properties',

    // ETFs (alguns com logo da gestora, nao do ETF especifico)
    'QYLD': 'global-x',
    'XYLD': 'global-x',
    'URA': 'global-x',
    'MCHI': 'ishares',
    'SCHA': 'schwab',
    'XLU': 'sector/utilities',
    'XBI': 'sector/biotech-etf',
    'QQQ': 'invesco',
    'ARGT': 'global-x',
    'CIBR': 'first-trust',
    'IEUR': 'ishares',
    'NOBL': 'proshares',
    'HERO': 'global-x',
    'VNQ': 'vanguard',

    // FIIs e FIAGROs (maioria fallback generico "fii", aguardando logoids especificos)
    'VRTA11': 'fii',
    'BCRI11': 'fii',
    'TVRI11': 'fii',
    'BTHF11': 'fii',
    'HGLG11': 'fii',
    'VISC11': 'vinci',
    'KNRI11': 'fii',
    'XPLG11': 'fii',
    'RBRR11': 'fii',
    'HCTR11': 'fii',
    'KNCA11': 'fii',
    'CPTR11': 'fii',
    'SNAG11': 'fii',
    'XPCA11': 'fii'
  };

  // ---------------------------------------------------------------------------
  // API publica: window.TV_LOGOS
  // ---------------------------------------------------------------------------
  window.TV_LOGOS = {
    // Objeto raw (caso alguem precise)
    map: LOGOS,

    /**
     * Normaliza o ticker removendo sufixos comuns (.SA, -USD, -USDT, -USDC, -BRL).
     * Ex: "PETR4.SA" -> "PETR4", "BTC-USD" -> "BTC", "ETH-USDT" -> "ETH"
     */
    _normalize: function(ticker){
      return String(ticker || '').toUpperCase().trim()
        .replace(/\.SA$/i, '')
        .replace(/-(USD|USDT|USDC|BRL|EUR)$/i, '');
    },

    /**
     * Retorna URL do logo do TradingView para um ticker.
     * @param {string} ticker - Ex: "PETR4", "AAPL", "BTC", "BTC-USD"
     * @param {object} [opts] - { size: 'big'|'normal' } (default: 'big')
     * @returns {string|null} URL completa do SVG ou null se ticker desconhecido
     */
    getUrl: function(ticker, opts){
      if(!ticker) return null;
      var key = this._normalize(ticker);
      var logoid = LOGOS[key];
      if(!logoid) return null;
      var size = (opts && opts.size) || 'big';
      var suffix = size === 'big' ? '--big.svg' : '.svg';
      return S3_BASE + '/' + logoid + suffix;
    },

    /**
     * Verifica se um ticker esta mapeado.
     * @param {string} ticker
     * @returns {boolean}
     */
    has: function(ticker){
      if(!ticker) return false;
      return !!LOGOS[this._normalize(ticker)];
    },

    // Metadata
    count: Object.keys(LOGOS).length,
    version: '1.2.0-20260506'
  };

})();
