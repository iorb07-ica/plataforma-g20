#!/usr/bin/env node
/* ==========================================================================
   fetch-tradingview-logos.js  ·  Coletor de logos do TradingView
   Plataforma G20
   --------------------------------------------------------------------------
   O QUE FAZ:
     Lê a lista de tickers de  tickers-source.js  (mesma pasta), consulta a
     API publica de busca de simbolos do TradingView para cada um, captura o
     "logoid" REAL de cada empresa e gera um  tradingview-logos.js  novo,
     pronto para substituir o de assets/.

   COMO RODAR:
     node fetch-tradingview-logos.js

   REQUISITOS:
     - Node.js instalado (qualquer versao recente). Confira: node --version
     - Internet (acessa symbol-search.tradingview.com)
     - Sem dependencias / sem npm install — usa so modulos nativos do Node.

   SAIDA:
     Gera  tradingview-logos.js  NESTA pasta. Revise e suba para
     assets/tradingview-logos.js no GitHub.
   ========================================================================== */
'use strict';

var fs    = require('fs');
var path  = require('path');
var https = require('https');

/* ---- Configuracao ------------------------------------------------------- */
var DELAY_MS    = 450;   // pausa entre requisicoes (evita bloqueio do TradingView)
var MAX_RETRIES = 2;     // tentativas extras em caso de erro de rede
var TIMEOUT_MS  = 12000; // timeout por requisicao
var OUT_PATH    = path.join(__dirname, 'tradingview-logos.js');

/* Criptos: logoids fixos do TradingView (nao vem da busca padrao).
   Preservados sempre. Adicione aqui se usar outras criptos.            */
var CRYPTO = {
  'BTC':'crypto/XTVCBTC', 'ETH':'crypto/XTVCETH', 'SOL':'crypto/XTVCSOL',
  'BNB':'crypto/XTVCBNB', 'LINK':'crypto/XTVCLINK','HNT':'crypto/XTVCHNT',
  'DOT':'crypto/XTVCDOT', 'MANA':'crypto/XTVCMANA','SAND':'crypto/XTVCSAND'
};

/* Overrides manuais: SEMPRE vencem o resultado da busca.
   Use para corrigir um logoid que o TradingView retornou errado.
   Ex:  'PETR4':'brasileiro-petrobras'                                  */
var OVERRIDES = {
  // 'TICKER':'logoid-correto',
};

/* ---- Carrega a lista de tickers ----------------------------------------- */
var TICKERS;
try {
  TICKERS = require('./tickers-source.js');
} catch (e) {
  console.error('ERRO: nao encontrei tickers-source.js nesta pasta.');
  console.error('Coloque os dois arquivos na mesma pasta e tente de novo.');
  process.exit(1);
}
if (!Array.isArray(TICKERS)) {
  console.error('ERRO: tickers-source.js precisa exportar um array (module.exports = [...]).');
  process.exit(1);
}

/* ---- Utilitarios -------------------------------------------------------- */
function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

function stripTags(s){ return String(s||'').replace(/<\/?[^>]+>/g,''); }

function normaliza(t){
  return String(t||'').toUpperCase().trim()
    .replace(/\.SA$/i,'')
    .replace(/-(USD|USDT|USDC|BRL|EUR)$/i,'');
}

function ehBR(t){ return /\d$/.test(t); }

/* GET JSON com headers de navegador (o TradingView exige) */
function httpGetJson(url){
  return new Promise(function(resolve, reject){
    var req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.tradingview.com',
        'Referer': 'https://www.tradingview.com/'
      }
    }, function(res){
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      var data = '';
      res.setEncoding('utf8');
      res.on('data', function(c){ data += c; });
      res.on('end', function(){
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('resposta nao e JSON valido')); }
      });
    });
    req.setTimeout(TIMEOUT_MS, function(){ req.destroy(new Error('timeout')); });
    req.on('error', reject);
  });
}

/* Busca o logoid de UM ticker no TradingView */
function buscarLogoid(ticker){
  var t = ticker;
  var url = 'https://symbol-search.tradingview.com/symbol_search/?text=' +
            encodeURIComponent(t) +
            '&hl=0&exchange=&lang=en&type=&domain=production';
  return httpGetJson(url).then(function(resp){
    var list = Array.isArray(resp) ? resp
             : (resp && Array.isArray(resp.symbols) ? resp.symbols : []);
    var comLogo = list.filter(function(r){ return r && r.logoid; });
    if (!comLogo.length) return null;

    // 1) match exato de simbolo tem prioridade
    var exato = comLogo.filter(function(r){
      return stripTags(r.symbol).toUpperCase().trim() === t;
    });
    var pool = exato.length ? exato : comLogo;

    // 2) preferencia de bolsa (BR vs US) conforme o formato do ticker
    var BR = ['BMFBOVESPA','BVMF'];
    var US = ['NASDAQ','NYSE','AMEX','NYSE ARCA','BATS','OTC'];
    var querBR = ehBR(t);
    var pref = pool.filter(function(r){
      var ex = String(r.exchange||'').toUpperCase();
      return querBR ? (BR.indexOf(ex) >= 0) : (US.indexOf(ex) >= 0);
    });

    var escolhido = (pref.length ? pref : pool)[0];
    return escolhido ? escolhido.logoid : null;
  });
}

/* Busca com retry em caso de erro de rede */
function buscarComRetry(ticker){
  var tentativa = 0;
  function tentar(){
    return buscarLogoid(ticker).catch(function(err){
      if (tentativa < MAX_RETRIES) {
        tentativa++;
        return sleep(DELAY_MS * 3).then(tentar);
      }
      return { _erro: err.message };
    });
  }
  return tentar();
}

/* ---- Gera o arquivo final ----------------------------------------------- */
function gerarArquivo(logos){
  var cryptoKeys = Object.keys(CRYPTO);
  var restKeys = Object.keys(logos).filter(function(k){
    return cryptoKeys.indexOf(k) < 0;
  }).sort();

  var linhas = [];
  linhas.push('    // CRIPTOS');
  cryptoKeys.forEach(function(k){
    if (logos[k]) linhas.push("    '" + k + "': '" + logos[k] + "',");
  });
  linhas.push('');
  linhas.push('    // ATIVOS (logoids coletados automaticamente do TradingView)');
  restKeys.forEach(function(k, i){
    linhas.push("    '" + k + "': '" + logos[k] + "'" + (i < restKeys.length-1 ? ',' : ''));
  });

  var total = cryptoKeys.length + restKeys.length;
  var hoje  = new Date().toLocaleDateString('pt-BR');
  var ver   = '2.0.0-' + new Date().toISOString().slice(0,10).replace(/-/g,'');

  return [
'// ==========================================================================',
'// tradingview-logos.js',
'// Mapa de tickers -> logoids do TradingView.',
'// Carregado globalmente como window.TV_LOGOS em todas as paginas.',
'//',
'// Gerado em: ' + hoje + ' via scripts/fetch-tradingview-logos.js',
'// Total: ' + total + ' ativos',
'//',
'// Para atualizar: edite scripts/tickers-source.js e rode',
'//   node scripts/fetch-tradingview-logos.js',
'// ==========================================================================',
'',
'(function(){',
"  'use strict';",
'',
"  var S3_BASE = 'https://s3-symbol-logo.tradingview.com';",
'',
'  var LOGOS = {',
linhas.join('\n'),
'  };',
'',
'  window.TV_LOGOS = {',
'    map: LOGOS,',
'    _normalize: function(ticker){',
"      return String(ticker || '').toUpperCase().trim()",
"        .replace(/\\.SA$/i, '')",
"        .replace(/-(USD|USDT|USDC|BRL|EUR)$/i, '');",
'    },',
'    getUrl: function(ticker, opts){',
'      if(!ticker) return null;',
'      var key = this._normalize(ticker);',
'      var logoid = LOGOS[key];',
'      if(!logoid) return null;',
"      var size = (opts && opts.size) || 'big';",
"      var suffix = size === 'big' ? '--big.svg' : '.svg';",
"      return S3_BASE + '/' + logoid + suffix;",
'    },',
'    has: function(ticker){',
'      if(!ticker) return false;',
'      return !!LOGOS[this._normalize(ticker)];',
'    },',
'    count: Object.keys(LOGOS).length,',
"    version: '" + ver + "'",
'  };',
'',
'})();',
''
  ].join('\n');
}

/* ---- Execucao principal ------------------------------------------------- */
function main(){
  // dedup + normaliza a lista
  var seen = {};
  var lista = [];
  TICKERS.forEach(function(raw){
    var t = normaliza(raw);
    if (t && !seen[t]) { seen[t] = 1; lista.push(t); }
  });

  console.log('=== Coletor de logos TradingView ===');
  console.log(lista.length + ' tickers unicos a processar.');
  console.log('Tempo estimado: ~' + Math.ceil(lista.length * DELAY_MS / 1000 / 60) + ' min.\n');

  var logos = Object.assign({}, CRYPTO);
  var achados = [], faltando = [], erros = [];

  // processa em sequencia (uma de cada vez, com pausa)
  var i = 0;
  function proximo(){
    if (i >= lista.length) return finalizar();
    var t = lista[i];
    var tag = '[' + (i+1) + '/' + lista.length + '] ' + t;

    if (CRYPTO[t]) {
      console.log(tag + ' -> (cripto, preservado)');
      i++; return proximo();
    }

    return buscarComRetry(t).then(function(r){
      if (r && r._erro) {
        erros.push(t);
        console.log(tag + ' -> ERRO DE REDE: ' + r._erro);
      } else if (r) {
        logos[t] = r; achados.push(t);
        console.log(tag + ' -> ' + r + '  OK');
      } else {
        faltando.push(t);
        console.log(tag + ' -> nao encontrado');
      }
      i++;
      return sleep(DELAY_MS).then(proximo);
    });
  }

  function finalizar(){
    // overrides manuais vencem
    Object.keys(OVERRIDES).forEach(function(k){
      logos[normaliza(k)] = OVERRIDES[k];
    });

    var conteudo = gerarArquivo(logos);
    fs.writeFileSync(OUT_PATH, conteudo, 'utf8');

    console.log('\n=== RESUMO ===');
    console.log('Encontrados : ' + achados.length);
    console.log('Nao achados : ' + faltando.length +
      (faltando.length ? '\n   -> ' + faltando.join(', ') : ''));
    console.log('Erros rede  : ' + erros.length +
      (erros.length ? '\n   -> ' + erros.join(', ') : ''));
    console.log('\nArquivo gerado em:\n  ' + OUT_PATH);
    console.log('\nProximo passo: revise o arquivo e suba para');
    console.log('assets/tradingview-logos.js no GitHub.');
    if (erros.length) {
      console.log('\nDica: os "Erros de rede" podem ter sido bloqueios temporarios.');
      console.log('Rode o script de novo — tickers ja achados sao reprocessados rapido.');
    }
  }

  return proximo();
}

main();
