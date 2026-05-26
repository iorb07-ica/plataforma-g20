/* G20 — Sistema compartilhado de notificações + tema (dark/light)
 * Expõe helpers globais (mostrarNotificacoes, toggleTheme, etc.) e um
 * G20Topbar.init() que injeta o painel de notificações no body se ainda
 * não existir e aplica o tema salvo.
 *
 * Dependências opcionais (se existirem na página, são usadas):
 *   _patSnapLoad(), _sliceRange(), window._dashRVCot, window.IND
 * Caso não existam, as notificações associadas simplesmente não disparam.
 */
(function(){
  'use strict';

  // ═══════════════ CONSTANTES ═══════════════
  window.NOTIFS_KEY = 'g20_notifications';
  window.NOTIFS_READ_KEY = 'g20_notifs_read';
  window.NOTIFS_LOG_KEY = 'g20_notifs_log';
  window.NOTIFS_MAX = 12;
  window.NOTIFS_LOG_MAX = 100;
  window._notifsHistoryMode = false;
  // Último episódio do G20Flix (mantém sincronia com o card do dashboard)
  // FLIX_CURRENT_EP — lido dinamicamente do Firestore g20flix/videos/items
  // Fallback para o valor hardcoded se Firebase não estiver disponível
  if(typeof window.FLIX_CURRENT_EP === 'undefined') window.FLIX_CURRENT_EP = 84;
  if(typeof window.FLIX_CURRENT_TITLE === 'undefined') window.FLIX_CURRENT_TITLE = '';

  // Busca o episódio mais recente do Firestore (roda uma vez por sessão)
  (function _fetchFlixEp(){
    try{
      if(!window.firebase || !window.firebase.firestore) return;
      var db = window.firebase.firestore();
      db.collection('g20flix').doc('videos').collection('items')
        .orderBy('ep', 'desc')
        .limit(1)
        .get()
        .then(function(snap){
          if(snap.empty) return;
          var data = snap.docs[0].data();
          var ep    = parseInt(data.ep || 0, 10);
          var title = data.title || data.titulo || '';
          if(ep > 0){
            window.FLIX_CURRENT_EP    = ep;
            window.FLIX_CURRENT_TITLE = '#' + ep + (title ? ' – ' + title : '');
          }
        })
        .catch(function(){});
    }catch(e){}
  })();

  // ═══════════════ UTIL ═══════════════
  if(typeof window._todayISO !== 'function'){
    window._todayISO = function(){
      var d=new Date();
      return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    };
  }

  // Fallback para _patSnapLoad (dashboard o define; outras páginas leem direto do storage)
  if(typeof window._patSnapLoad !== 'function'){
    window._patSnapLoad = function(){
      try{
        var a = JSON.parse(localStorage.getItem('g20_patSnapshots')||'[]');
        return Array.isArray(a) ? a : [];
      }catch(e){ return []; }
    };
  }

  // Fallback para _sliceRange (aceita número em dias, 'ytd' ou 'max')
  if(typeof window._sliceRange !== 'function'){
    window._sliceRange = function(arr, code){
      if(!arr || !arr.length) return arr||[];
      if(code==='max') return arr.slice();
      var cutoffISO;
      if(code==='ytd'){
        cutoffISO = (new Date()).getFullYear()+'-01-01';
      } else {
        var dias = parseInt(code,10) || 30;
        var cutoff = new Date(); cutoff.setDate(cutoff.getDate()-dias);
        cutoffISO = cutoff.getFullYear()+'-'+String(cutoff.getMonth()+1).padStart(2,'0')+'-'+String(cutoff.getDate()).padStart(2,'0');
      }
      var out = arr.filter(function(s){return s.d>=cutoffISO;});
      if(out.length<2 && arr.length>=2) out = arr.slice(-Math.min(arr.length, 2));
      return out;
    };
  }

  function _fmtBRLshort(v){ return 'R$ '+Math.round(v).toLocaleString('pt-BR'); }

  // Lê indicadores BCB do cache quando IND global não existir
  function _getIND(){
    if(typeof window.IND === 'object' && window.IND && window.IND.selic) return window.IND;
    try{
      var c=JSON.parse(localStorage.getItem('g20_indBCB_cache')||'null');
      if(c && c.data) return c.data;
    }catch(e){}
    return null;
  }

  // ═══════════════ GERADOR DINÂMICO ═══════════════
  window.gerarNotifsDinamicas = function(){
    var notifs = [];
    var hoje = _todayISO();
    // Lê preferências do aluno (default: tudo ativo)
    var prefs = {};
    try{ prefs = JSON.parse(localStorage.getItem('g20_notifPrefs')||'{}'); }catch(e){}
    var p = {
      patrimonio:  prefs.patrimonio  !== false,
      benchmarks:  prefs.benchmarks  !== false,
      mercado:     prefs.mercado     !== false,
      conteudo:    prefs.conteudo    !== false,
      macro:       prefs.macro       !== false,
      conquistas:  prefs.conquistas  !== false
    };
    var arr = (typeof _patSnapLoad==='function') ? _patSnapLoad() : [];
    // Se _dashRVCot não existe (outras páginas), tenta o cache salvo pelo dashboard
    if(!window._dashRVCot){
      try{
        var cached = localStorage.getItem('g20_dashRVCot_cache');
        if(cached){
          var cacheObj = JSON.parse(cached);
          // Só usa se o cache for de hoje (evita dados velhos)
          if(cacheObj && cacheObj._cacheDate === _todayISO()){
            window._dashRVCot = cacheObj.data;
          }
        }
      }catch(e){}
    }

    // 1) Novo topo de patrimônio em 60d
    if(arr.length >= 5){
      var last = arr[arr.length-1];
      var prev60 = arr.slice(Math.max(0, arr.length-61), arr.length-1);
      if(prev60.length){
        var maxPrev = prev60.reduce(function(m,s){return s.t>m?s.t:m;},0);
        if(last.t > maxPrev){
          notifs.push({id:'dyn-topo-'+hoje, ico:'🏆', bg:'rgba(232,184,75,.20)', titulo:'Novo topo de patrimônio!', desc:_fmtBRLshort(last.t)+' — maior valor em 60 dias.', ts: Date.now(), link:'gestao-patrimonial.html'});
        }
      }
    }

    // 2) Bateu CDI em 30d (cruzou hoje)
    if(arr.length >= 2 && typeof _sliceRange==='function'){
      var slice30 = _sliceRange(arr, '30');
      var slice30Ontem = arr.slice(0,-1);
      var slice30On = slice30Ontem.length>=2 ? _sliceRange(slice30Ontem, '30') : [];
      if(slice30.length>=2 && slice30On.length>=2){
        var pNow = (slice30[slice30.length-1].t/slice30[0].t)-1;
        var cNow = (slice30[slice30.length-1].c/slice30[0].c)-1;
        var pYes = (slice30On[slice30On.length-1].t/slice30On[0].t)-1;
        var cYes = (slice30On[slice30On.length-1].c/slice30On[0].c)-1;
        if(pNow > cNow && pYes <= cYes){
          notifs.push({id:'dyn-cdi30-'+hoje, ico:'🎯', bg:'rgba(46,204,113,.20)', titulo:'Você bateu o CDI!', desc:'Patrimônio supera o CDI em 30 dias pela 1ª vez.', ts: Date.now(), link:'gestao-patrimonial.html'});
        }
      }
    }

    // 3) Ativos em queda forte hoje (agrupados)
    if(p.mercado) try{
      if(window._dashRVCot){
        var quedas=[];
        Object.keys(window._dashRVCot).forEach(function(t){
          var c=window._dashRVCot[t];
          if(c && typeof c.varPct==='number' && c.varPct < -5) quedas.push({ticker:t, pct:c.varPct});
        });
        if(quedas.length){
          quedas.sort(function(a,b){return a.pct-b.pct;});
          var top=quedas.slice(0,3);
          var desc = quedas.length===1
            ? top[0].ticker+' caiu '+top[0].pct.toFixed(1)+'% hoje.'
            : quedas.length+' ativos em queda forte: '+top.map(function(q){return q.ticker+' ('+q.pct.toFixed(1)+'%)';}).join(', ')+(quedas.length>3?'…':'.');
          notifs.push({id:'dyn-quedas-'+hoje, ico:'🔻', bg:'rgba(239,68,68,.18)', titulo:'Ativos em queda forte', desc:desc, ts:Date.now(), link:'carteira.html'});
        }
      }
    }catch(e){}

    // 4) Novidades no G20Flix desde última visita
    if(p.conteudo) try{
      var lastSeen = parseInt(localStorage.getItem('g20_lastSeenFlix')||'0',10);
      if(!lastSeen){
        localStorage.setItem('g20_lastSeenFlix', String(window.FLIX_CURRENT_EP));
      } else if(window.FLIX_CURRENT_EP > lastSeen){
        var diff = window.FLIX_CURRENT_EP - lastSeen;
        notifs.push({id:'dyn-flix-'+window.FLIX_CURRENT_EP, ico:'🎬', bg:'rgba(230,57,70,.18)', titulo:(diff===1?'1 episódio novo':diff+' episódios novos')+' no G20Flix', desc:'Último: '+window.FLIX_CURRENT_TITLE, ts:Date.now(), link:'g20flix.html'});
      }
    }catch(e){}

    // 5) Pulso diário do patrimônio
    if(arr.length >= 2){
      var today = arr[arr.length-1];
      var yday  = arr[arr.length-2];
      if(today.t>0 && yday.t>0){
        var deltaPct = ((today.t/yday.t)-1)*100;
        var deltaBRL = today.t - yday.t;
        var seta = deltaPct>=0 ? '▲' : '▼';
        var ico  = deltaPct>=0.5 ? '🚀' : deltaPct<=-0.5 ? '⚠️' : '📊';
        var bg   = deltaPct>=0.3 ? 'rgba(46,204,113,.15)' : deltaPct<=-0.3 ? 'rgba(239,68,68,.15)' : 'rgba(139,92,246,.12)';
        notifs.push({id:'dyn-pulso-'+hoje, ico:ico, bg:bg, titulo:'Pulso de hoje · '+seta+' '+(deltaPct>=0?'+':'')+deltaPct.toFixed(2)+'%', desc:'Patrimônio '+(deltaBRL>=0?'ganhou ':'recuou ')+_fmtBRLshort(Math.abs(deltaBRL))+' desde ontem.', ts:Date.now(), link:'gestao-patrimonial.html'});
      }
    }

    // 6a) Status patrimônio vs CDI em 30d
    if(arr.length >= 2 && typeof _sliceRange==='function'){
      var s30 = _sliceRange(arr,'30');
      if(s30.length>=2){
        var pPct = ((s30[s30.length-1].t/s30[0].t)-1)*100;
        var cPct = ((s30[s30.length-1].c/s30[0].c)-1)*100;
        var diff30 = pPct-cPct;
        var bat = diff30>=0;
        notifs.push({id:'dyn-vscdi-'+hoje, ico:bat?'📈':'📉', bg:bat?'rgba(46,204,113,.14)':'rgba(239,68,68,.14)', titulo:'Patrimônio vs CDI · 30d · '+(diff30>=0?'+':'')+diff30.toFixed(2)+'%', desc: bat ? 'Você está batendo o CDI em 30d (patrim. '+(pPct>=0?'+':'')+pPct.toFixed(2)+'% · CDI '+cPct.toFixed(2)+'%).' : 'Patrimônio abaixo do CDI em 30d (patrim. '+(pPct>=0?'+':'')+pPct.toFixed(2)+'% · CDI '+cPct.toFixed(2)+'%).', ts:Date.now(), link:'gestao-patrimonial.html'});
      }
    }

    // 6b) Alocação atual
    if(arr.length >= 1){
      var t0 = arr[arr.length-1];
      if(t0.t>0 && (t0.rf>0 || t0.rv>0)){
        var pctRF = (t0.rf/t0.t)*100;
        var pctRV = (t0.rv/t0.t)*100;
        var pctOutros = Math.max(0, 100-pctRF-pctRV);
        notifs.push({id:'dyn-aloc-'+hoje, ico:'🧭', bg:'rgba(139,92,246,.15)', titulo:'Sua alocação hoje', desc:'RF '+pctRF.toFixed(0)+'% · RV '+pctRV.toFixed(0)+'%'+(pctOutros>1?' · Outros '+pctOutros.toFixed(0)+'%':''), ts:Date.now(), link:'gestao-patrimonial.html'});
      }
    }

    // 6c) Melhor e pior ativo do dia
    if(p.mercado) try{
      if(window._dashRVCot){
        var tickers = Object.keys(window._dashRVCot).map(function(t){return {ticker:t, pct:window._dashRVCot[t].varPct};}).filter(function(x){return typeof x.pct==='number' && !isNaN(x.pct);});
        if(tickers.length>=2){
          tickers.sort(function(a,b){return b.pct-a.pct;});
          var best=tickers[0], worst=tickers[tickers.length-1];
          notifs.push({id:'dyn-destaques-'+hoje, ico:'⭐', bg:'rgba(232,184,75,.15)', titulo:'Destaques do dia', desc:'🔝 '+best.ticker+' '+(best.pct>=0?'+':'')+best.pct.toFixed(1)+'% · 🔻 '+worst.ticker+' '+(worst.pct>=0?'+':'')+worst.pct.toFixed(1)+'%', ts:Date.now(), link:'carteira.html'});
        }
      }
    }catch(e){}

    // 6d) Streak de alta (3+ dias)
    if(arr.length>=4){
      var streak=0;
      for(var k=arr.length-1;k>0;k--){
        if(arr[k].t>arr[k-1].t) streak++;
        else break;
      }
      if(streak>=3){
        notifs.push({id:'dyn-streak-'+streak+'-'+hoje, ico: streak>=7?'🔥': streak>=5?'✨':'📈', bg:'rgba(249,115,22,.14)', titulo:streak+' dias de alta consecutiva', desc:'Seu patrimônio sobe há '+streak+' dias seguidos.', ts:Date.now(), link:'gestao-patrimonial.html'});
      }
    }

    // 6e) Panorama macro
    if(p.macro) try{
      var ind = _getIND();
      if(ind && ind.selic){
        notifs.push({id:'dyn-macro-'+hoje, ico:'🏦', bg:'rgba(59,130,246,.14)', titulo:'Panorama macro', desc:'Selic '+ind.selic.toFixed(2)+'% · CDI '+(ind.cdi||0).toFixed(2)+'% · IPCA '+(ind.ipca||0).toFixed(2)+'%', ts:Date.now(), link:'gestao-patrimonial.html'});
      }
    }catch(e){}

    // 7) Semana em revisão (segundas)
    if(p.benchmarks) try{
      var dow = new Date().getDay();
      var lastReview = localStorage.getItem('g20_lastWeekReview')||'';
      if(dow===1 && lastReview!==hoje && arr.length>=8){
        var todayW = arr[arr.length-1];
        var weekAgoIdx = Math.max(0, arr.length-8);
        var weekAgo = arr[weekAgoIdx];
        if(todayW.t>0 && weekAgo.t>0){
          var wPct = ((todayW.t/weekAgo.t)-1)*100;
          notifs.push({id:'dyn-semana-'+hoje, ico:'📅', bg:'rgba(59,130,246,.15)', titulo:'Semana em revisão · '+(wPct>=0?'+':'')+wPct.toFixed(2)+'%', desc:'Seu patrimônio nos últimos 7 dias.', ts:Date.now(), link:'gestao-patrimonial.html'});
          localStorage.setItem('g20_lastWeekReview', hoje);
        }
      }
    }catch(e){}

    // 8) Live de aportes CG20 — agrupa múltiplos aportes do mesmo dia em uma única notificação
    if(p.conteudo) try{
      var db = window.firebase && window.firebase.firestore ? window.firebase.firestore() : null;
      if(db){
        var lastLiveId = localStorage.getItem('g20_notifs_lastLive')||'';
        db.collection('g20_aportes')
          .orderBy('data','desc')
          .limit(20)
          .get()
          .then(function(snap){
            if(snap.empty) return;
            // Agrupa por data (campo 'data' é string YYYY-MM-DD ou Timestamp)
            var groups = {};
            snap.forEach(function(doc){
              var d = doc.data();
              var rawDate = d.data || d.date || d.dt || '';
              var dateKey = '';
              if(rawDate && rawDate.toDate){
                var dd = rawDate.toDate();
                dateKey = dd.getFullYear()+'-'+String(dd.getMonth()+1).padStart(2,'0')+'-'+String(dd.getDate()).padStart(2,'0');
              } else {
                dateKey = String(rawDate).slice(0,10);
              }
              if(!dateKey) return;
              if(!groups[dateKey]) groups[dateKey] = [];
              groups[dateKey].push(d.ticker || d.ativo || '');
            });
            // Pega o grupo mais recente
            var dates = Object.keys(groups).sort().reverse();
            if(!dates.length) return;
            var latestDate = dates[0];
            var tickers = groups[latestDate].filter(Boolean);
            var liveId = 'dyn-live-'+latestDate;
            // Só notifica se for novo (não visto antes) e tiver 2+ aportes
            if(tickers.length >= 2 && liveId !== lastLiveId){
              var mes = (function(){
                var meses=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
                var parts = latestDate.split('-');
                return meses[parseInt(parts[1],10)-1]+'/'+(parts[0]||'');
              })();
              var log = JSON.parse(localStorage.getItem(window.NOTIFS_LOG_KEY)||'[]');
              var jaViu = log.some(function(n){ return n.id===liveId; });
              if(!jaViu){
                localStorage.setItem('g20_notifs_lastLive', liveId);
                // Injeta na fila global de notificações via saveNotif
                if(typeof window.saveNotif==='function'){
                  window.saveNotif({
                    id: liveId,
                    ico: '📊',
                    bg: 'rgba(201,169,97,.20)',
                    titulo: 'Live de aportes realizada',
                    desc: tickers.length+' novos aportes na Carteira G20 · '+mes,
                    ts: Date.now(),
                    link: 'carteira.html'
                  });
                  if(typeof renderNotifBadge==='function') renderNotifBadge();
                }
              }
            }
          }).catch(function(){});
      }
    }catch(e){}

    // 9) Meta IF — alerta quando patrimônio cruza marcos (10/25/50/75/90/100%)
    if(p.conquistas) try{
      var metaIFraw = localStorage.getItem('g20_metaIF_cache') || localStorage.getItem('g20_metaIF');
      var metaIF = 0;
      try{ var mObj = JSON.parse(metaIFraw||'{}'); metaIF = parseFloat(mObj.valor || mObj.alvo || '0'); }catch(e){};
      if(metaIF > 0 && arr.length > 0){
        var patAtual = arr[arr.length-1].t;
        var pct = (patAtual / metaIF) * 100;
        var marcos = [10,25,50,75,90,100];
        marcos.forEach(function(marco){
          if(pct >= marco){
            var midIF = 'dyn-metaif-'+marco;
            var log = JSON.parse(localStorage.getItem(window.NOTIFS_LOG_KEY)||'[]');
            var jaDisparou = log.some(function(n){ return n.id===midIF; });
            if(!jaDisparou){
              var ico = marco===100 ? '🏆' : marco>=75 ? '🎯' : marco>=50 ? '🚀' : '📈';
              var bg  = marco===100 ? 'rgba(232,184,75,.25)' : 'rgba(46,204,113,.18)';
              var titulo = marco===100
                ? 'Você atingiu sua Meta IF! 🏆'
                : 'Você atingiu '+marco+'% da sua Meta IF!';
              var desc = 'Patrimônio '+_fmtBRLshort(patAtual)+' · Meta '+_fmtBRLshort(metaIF);
              notifs.push({id:midIF, ico:ico, bg:bg, titulo:titulo, desc:desc, ts:Date.now(), link:'gestao-patrimonial.html'});
            }
          }
        });
      }
    }catch(e){}

    // Filtra por preferências do aluno
    var prefMap = {
      'dyn-topo':'patrimonio','dyn-cdi30':'patrimonio','dyn-pulso':'patrimonio','dyn-streak':'patrimonio',
      'dyn-vscdi':'benchmarks','dyn-aloc':'benchmarks','dyn-semana':'benchmarks',
      'dyn-quedas':'mercado','dyn-destaques':'mercado',
      'dyn-flix':'conteudo','dyn-live':'conteudo','admin-live':'conteudo',
      'dyn-macro':'macro',
      'dyn-metaif':'conquistas'
    };
    notifs = notifs.filter(function(n){
      var cat = null;
      Object.keys(prefMap).forEach(function(pfx){ if(n.id && n.id.indexOf(pfx)===0) cat=prefMap[pfx]; });
      if(!cat) return true;
      return p[cat] !== false;
    });

    return notifs;
  };
  window._fetchAdminNotifs = function(){
    try{
      if(!window.firebase || !window.firebase.firestore) return;
      var db    = window.firebase.firestore();
      var agora = Date.now();
      var turmaAluno = (function(){
        try{ return JSON.parse(localStorage.getItem('g20_user_profile')||'{}').turma||''; }catch(e){ return ''; }
      })();

      db.collection('g20_admin_notificacoes')
        .orderBy('ts','desc')
        .limit(10)
        .get()
        .then(function(snap){
          if(snap.empty) return;
          var injected = [];
          snap.forEach(function(doc){
            var n = doc.data();
            // Filtra por turma
            if(n.turma && n.turma !== 'all' && n.turma !== turmaAluno) return;
            // Filtra por expiração
            if(n.expiresAt && n.expiresAt < agora) return;
            injected.push({
              id:     n.id || doc.id,
              ico:    n.ico || '📡',
              bg:     n.bg  || 'rgba(201,169,97,.22)',
              titulo: n.titulo || '',
              desc:   n.desc   || '',
              ts:     n.ts     || agora,
              link:   n.link   || 'dashboard.html'
            });
          });
          if(!injected.length) return;
          // Salva no log e atualiza badge
          if(typeof window.saveNotif==='function'){
            injected.forEach(function(n){ window.saveNotif(n); });
          }
          if(typeof renderNotifBadge==='function') renderNotifBadge();
          if(typeof renderNotifList==='function'){ try{ renderNotifList(); }catch(e){} }
        })
        .catch(function(){});
    }catch(e){}
  };

  // Busca respostas de feedback endereçadas a este aluno (collection feedback_respostas)
  window._fetchFeedbackRespostas = function(){
    try{
      if(!window.firebase || !window.firebase.firestore) return;
      var user = window.firebase.auth && window.firebase.auth().currentUser;
      if(!user) return;
      var db = window.firebase.firestore();
      db.collection('feedback_respostas')
        .where('uid','==',user.uid)
        .limit(20)
        .get()
        .then(function(snap){
          if(snap.empty) return;
          var injected = [];
          snap.forEach(function(doc){
            var n = doc.data() || {};
            var ts = (n.criadoEm && n.criadoEm.toMillis) ? n.criadoEm.toMillis() : (n.ts || Date.now());
            injected.push({
              id:     'fbresp-' + doc.id,
              ico:    '💬',
              bg:     'rgba(201,169,97,.22)',
              titulo: 'Resposta ao seu feedback',
              desc:   n.resposta || '',
              ts:     ts,
              link:   'dashboard.html'
            });
          });
          if(!injected.length) return;
          if(typeof window.saveNotif==='function'){
            injected.forEach(function(n){ window.saveNotif(n); });
          }
          if(typeof renderNotifBadge==='function') renderNotifBadge();
          if(typeof renderNotifList==='function'){ try{ renderNotifList(); }catch(e){} }
        })
        .catch(function(){});
    }catch(e){}
  };

  // Fallback quando nada dinâmico dispara
  window.NOTIFS_FALLBACK = [{id:'fb-calm-'+_todayISO(), ico:'✨', bg:'rgba(139,92,246,.12)', titulo:'Tudo tranquilo por aqui', desc:'Nenhum evento relevante hoje. Continue sua jornada.', ts: Date.now(), link:'dashboard.html'}];

  // ═══════════════ STORAGE / LEITURA ═══════════════
  window._appendNotifLog = function(novos){
    try{
      var log = JSON.parse(localStorage.getItem(NOTIFS_LOG_KEY)||'[]');
      var map = {};
      log.forEach(function(n){map[n.id]=n;});
      novos.forEach(function(n){ if(!map[n.id]) map[n.id]=n; });
      var arr = Object.keys(map).map(function(k){return map[k];});
      arr.sort(function(a,b){return (b.ts||0)-(a.ts||0);});
      if(arr.length>NOTIFS_LOG_MAX) arr=arr.slice(0,NOTIFS_LOG_MAX);
      localStorage.setItem(NOTIFS_LOG_KEY, JSON.stringify(arr));
    }catch(e){}
  };

  // saveNotif — injeta uma notificação avulsa no localStorage (usado por admin lives e live de aportes)
  window.saveNotif = function(n){
    try{
      var saved = [];
      try{ saved = JSON.parse(localStorage.getItem(NOTIFS_KEY)||'[]'); }catch(e){}
      var map = {};
      saved.forEach(function(x){ map[x.id]=x; });
      if(!map[n.id]) map[n.id] = n; // não sobrescreve se já existe
      var arr = Object.keys(map).map(function(k){ return map[k]; });
      arr.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
      localStorage.setItem(NOTIFS_KEY, JSON.stringify(arr.slice(0, NOTIFS_MAX)));
      _appendNotifLog([n]);
    }catch(e){}
  };

  window.getNotifs = function(){
    var saved=[];
    try{
      var raw=localStorage.getItem(NOTIFS_KEY);
      if(raw) saved=JSON.parse(raw);
    }catch(e){}
    var dynamicas = gerarNotifsDinamicas();
    _appendNotifLog(dynamicas);
    var map={};
    saved.forEach(function(n){map[n.id]=n;});
    dynamicas.forEach(function(n){
      if(map[n.id] && map[n.id].ts) n.ts = map[n.id].ts;
      map[n.id]=n;
    });
    var merged = Object.keys(map).map(function(k){return map[k];});
    if(!merged.length) merged = NOTIFS_FALLBACK;
    merged.sort(function(a,b){return (b.ts||0)-(a.ts||0);});
    try{ localStorage.setItem(NOTIFS_KEY, JSON.stringify(merged)); }catch(e){}
    return merged.slice(0, NOTIFS_MAX);
  };

  window.getNotifsHistorico = function(){
    var map={};
    try{
      var log=JSON.parse(localStorage.getItem(NOTIFS_LOG_KEY)||'[]');
      log.forEach(function(n){map[n.id]=n;});
    }catch(e){}
    try{
      var raw=localStorage.getItem(NOTIFS_KEY);
      if(raw) JSON.parse(raw).forEach(function(n){ if(!map[n.id]) map[n.id]=n; });
    }catch(e){}
    gerarNotifsDinamicas().forEach(function(n){ if(!map[n.id]) map[n.id]=n; else if(!map[n.id].ts) map[n.id].ts=n.ts; });
    var arr = Object.keys(map).map(function(k){return map[k];});
    arr.sort(function(a,b){return (b.ts||0)-(a.ts||0);});
    return arr;
  };

  window.getReadIds = function(){
    try{
      var saved=localStorage.getItem(NOTIFS_READ_KEY);
      return saved?JSON.parse(saved):[];
    }catch(e){ return []; }
  };

  window.marcarLida = function(id){
    var readIds=getReadIds();
    if(!readIds.includes(id)) readIds.push(id);
    try{localStorage.setItem(NOTIFS_READ_KEY,JSON.stringify(readIds));}catch(e){}
  };

  window.marcarTodasLidas = function(){
    var notifs=getNotifs();
    var ids=notifs.map(function(n){return n.id;});
    try{localStorage.setItem(NOTIFS_READ_KEY,JSON.stringify(ids));}catch(e){}
    renderNotifBadge();
    renderNotifList();
  };

  window.fmtTimeAgo = function(ts){
    if(!ts) return '';
    var diff = Date.now() - ts;
    var seg = Math.floor(diff / 1000);
    var min = Math.floor(diff / 60000);
    var h   = Math.floor(diff / 3600000);
    var d   = Math.floor(diff / 86400000);
    if(seg < 60)  return 'Agora';
    if(min === 1) return 'Há 1 minuto';
    if(min < 60)  return 'Há ' + min + ' minutos';
    if(h === 1)   return 'Há 1 hora';
    if(h < 24)    return 'Há ' + h + ' horas';
    if(d === 1)   return 'Ontem';
    if(d < 7)     return 'Há ' + d + ' dias';
    if(d < 14)    return 'Há 1 semana';
    if(d < 30)    return 'Há ' + Math.floor(d / 7) + ' semanas';
    if(d < 60)    return 'Há 1 mês';
    return 'Há ' + Math.floor(d / 30) + ' meses';
  };

  // ═══════════════ RENDER ═══════════════
  window.renderNotifBadge = function(){
    var notifs=getNotifs();
    var readIds=getReadIds();
    var unread=notifs.filter(function(n){return !readIds.includes(n.id);}).length;
    var showClass = 'notif-dot' + (unread>0?' show':'');

    // Prioridade: atualizar só o span #notifDot existente (preserva ícone Lucide SVG)
    var dot = document.getElementById('notifDot');
    if(dot){
      dot.className = showClass;
    } else {
      // Fallback: botão sem span (páginas antigas) — recria o innerHTML
      var btn = document.querySelector('[onclick*="mostrarNotificacoes"]');
      if(btn) btn.innerHTML = '🔔<span class="' + showClass + '" id="notifDot"></span>';
    }

  };

  window.renderNotifList = function(){
    var notifs = _notifsHistoryMode ? getNotifsHistorico() : getNotifs();
    var readIds=getReadIds();
    var list=document.getElementById('notifList');
    if(!list) return;

    var titleEl = document.querySelector('.notif-title');
    if(titleEl){
      titleEl.innerHTML = _notifsHistoryMode
        ? '🗂️ Histórico <span class="notif-history-badge">'+notifs.length+'</span>'
        : '🔔 Notificações';
    }
    var footerLink = document.querySelector('.notif-footer a');
    if(footerLink){
      footerLink.textContent = _notifsHistoryMode ? '← Voltar para recentes' : 'Ver histórico completo';
    }

    if(!notifs.length){
      list.innerHTML='<div class="notif-empty"><div class="notif-empty-ico">'+(_notifsHistoryMode?'🗂️':'🔔')+'</div>'+(_notifsHistoryMode?'Nenhum histórico ainda.':'Nenhuma notificação')+'</div>';
      return;
    }

    list.innerHTML=notifs.map(function(n){
      var unread=!readIds.includes(n.id);
      var idEsc = String(n.id).replace(/'/g,"\\'");
      var linkEsc = String(n.link||'').replace(/'/g,"\\'");
      return '<div class="notif-item'+(unread?' unread':'')+'" onclick="clicouNotif(\''+idEsc+'\',\''+linkEsc+'\')">'+
        '<div class="notif-ico" style="background:'+n.bg+'">'+n.ico+'</div>'+
        '<div class="notif-body">'+
          '<div class="notif-body-title">'+n.titulo+'</div>'+
          '<div class="notif-body-desc">'+n.desc+'</div>'+
          '<div class="notif-body-time">'+fmtTimeAgo(n.ts)+'</div>'+
        '</div>'+
        '<button class="notif-toggle" onclick="toggleLidaNotif(event,\''+idEsc+'\')" title="'+(unread?'Marcar como lida':'Marcar como não lida')+'" aria-label="'+(unread?'Marcar como lida':'Marcar como não lida')+'"><span class="notif-toggle-dot"></span></button>'+
      '</div>';
    }).join('');
  };

  window.toggleLidaNotif = function(ev, id){
    if(ev){ ev.stopPropagation(); ev.preventDefault(); }
    var readIds = getReadIds();
    if(readIds.indexOf(id)>=0){
      readIds = readIds.filter(function(x){return x!==id;});
    } else {
      readIds.push(id);
    }
    try{localStorage.setItem(NOTIFS_READ_KEY, JSON.stringify(readIds));}catch(e){}
    renderNotifBadge();
    renderNotifList();
  };

  window.toggleHistoricoNotifs = function(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    window._notifsHistoryMode = !window._notifsHistoryMode;
    renderNotifList();
    var list=document.getElementById('notifList');
    if(list) list.scrollTop=0;
  };

  window.clicouNotif = function(id, link){
    marcarLida(id);
    if(id && id.indexOf('dyn-flix-')===0){
      try{localStorage.setItem('g20_lastSeenFlix', String(window.FLIX_CURRENT_EP));}catch(e){}
    }
    renderNotifBadge();
    fecharNotif();
    if(link) setTimeout(function(){ location.href=link; },100);
  };

  window.mostrarNotificacoes = function(){
    var panel=document.getElementById('notifPanel');
    if(!panel) return;
    var isOpen=panel.classList.contains('show');
    if(isOpen){ fecharNotif(); return; }
    window._notifsHistoryMode = false;
    renderNotifList();
    panel.classList.add('show');
    setTimeout(function(){
      document.addEventListener('click', fecharNotifOutside);
    },50);
  };

  window.fecharNotif = function(){
    var panel=document.getElementById('notifPanel');
    if(panel) panel.classList.remove('show');
    document.removeEventListener('click', fecharNotifOutside);
  };

  window.fecharNotifOutside = function(e){
    var panel=document.getElementById('notifPanel');
    var btn=document.querySelector('[onclick*="mostrarNotificacoes"]');
    if(panel&&!panel.contains(e.target)&&(!btn||!btn.contains(e.target))){
      fecharNotif();
    }
  };

  // ═══════════════ TEMA DARK/LIGHT ═══════════════
  window.toggleTheme = function(){
    var l=document.body.classList.toggle('light');
    var btnEl=document.getElementById('themeBtn');
    var iconEl=document.getElementById('themeIcon');
    var lblEl=document.getElementById('themeLabel');
    if(btnEl) btnEl.textContent = l ? '☀️' : '🌙';
    if(iconEl) iconEl.textContent = l ? '☀️' : '🌙';
    if(lblEl) lblEl.textContent = l ? 'Modo Claro' : 'Modo Escuro';
    try{localStorage.setItem('g20-theme',l?'light':'dark');}catch(e){}
  };

  function applySavedTheme(){
    try{
      if(localStorage.getItem('g20-theme')==='light'){
        document.body.classList.add('light');
        var btnEl=document.getElementById('themeBtn');
        var iconEl=document.getElementById('themeIcon');
        var lblEl=document.getElementById('themeLabel');
        if(btnEl) btnEl.textContent='☀️';
        if(iconEl) iconEl.textContent='☀️';
        if(lblEl) lblEl.textContent='Modo Claro';
      }
    }catch(e){}
  }

  // ═══════════════ PAINEL HTML (auto-inject) ═══════════════
  var PANEL_HTML =
    '<div class="notif-panel" id="notifPanel">'+
      '<div class="notif-header">'+
        '<span class="notif-title">🔔 Notificações</span>'+
        '<div class="notif-actions">'+
          '<button class="notif-mark-all" onclick="marcarTodasLidas()">Marcar todas como lidas</button>'+
          '<button class="notif-close" onclick="fecharNotif()">✕</button>'+
        '</div>'+
      '</div>'+
      '<div class="notif-list" id="notifList"></div>'+
      '<div class="notif-footer"><a onclick="toggleHistoricoNotifs(event)">Ver histórico completo</a></div>'+
    '</div>';

  function injectPanelIfMissing(){
    if(!document.getElementById('notifPanel')){
      var d=document.createElement('div');
      d.innerHTML=PANEL_HTML;
      document.body.appendChild(d.firstChild);
    }
  }

  // Botões bell + tema (HTML usado pelo G20Topbar.injectButtons)
  window.G20Topbar = {
    bellButtonHTML: '<button class="btn-icon" title="Notificações" onclick="mostrarNotificacoes()" aria-label="Notificações">🔔<span class="notif-dot" id="notifDot"></span></button>',
    themeButtonHTML: '<button class="btn-icon" id="themeBtn" onclick="toggleTheme()" aria-label="Alternar tema">🌙</button>',

    // Injeta os botões em um container (seletor CSS ou elemento)
    injectButtons: function(target){
      var el = (typeof target==='string') ? document.querySelector(target) : target;
      if(!el) return;
      // Evita duplicar se já existirem
      if(!el.querySelector('[onclick*="mostrarNotificacoes"]')){
        el.insertAdjacentHTML('beforeend', this.bellButtonHTML);
      }
      if(!el.querySelector('#themeBtn')){
        el.insertAdjacentHTML('beforeend', this.themeButtonHTML);
      }
    },

    _inited: false,
    // Init completo: injeta painel, aplica tema, binda pulse, renderiza badge
    init: function(opts){
      if(this._inited) return;
      this._inited = true;
      opts = opts || {};
      injectPanelIfMissing();
      if(opts.buttonsInto) this.injectButtons(opts.buttonsInto);
      applySavedTheme();
      // Animação pulse ao clicar em qualquer btn-icon da topbar
      document.addEventListener('click', function(e){
        var btn = e.target.closest('.topbar .btn-icon');
        if(!btn) return;
        btn.classList.remove('pressed');
        void btn.offsetWidth;
        btn.classList.add('pressed');
        setTimeout(function(){ btn.classList.remove('pressed'); }, 520);
      });
      // Primeiro render do badge
      if(typeof renderNotifBadge==='function') try{ renderNotifBadge(); }catch(e){}
      // Busca notificações admin (lives, avisos) do Firestore
      setTimeout(function(){ if(typeof window._fetchAdminNotifs==='function') window._fetchAdminNotifs(); }, 4000);
      // Busca respostas de feedback endereçadas a este aluno
      setTimeout(function(){ if(typeof window._fetchFeedbackRespostas==='function') window._fetchFeedbackRespostas(); }, 4500);
      // Refresh automático do badge a cada 5 min — funciona em qualquer página
      setInterval(function(){
        if(typeof renderNotifBadge==='function') try{ renderNotifBadge(); }catch(e){}
      }, 5 * 60 * 1000);
      // Web Push: registra service worker e solicita permissão após login
      if('serviceWorker' in navigator && 'PushManager' in window){
        navigator.serviceWorker.register('/plataforma-g20/service-worker.js')
          .then(function(reg){
            window._g20SwReg = reg;
            // Só solicita permissão se o aluno já fez login (uid disponível)
            setTimeout(function(){ window.G20Push && window.G20Push.initPermission(reg); }, 3000);
          })
          .catch(function(e){ console.warn('[G20Push] SW register failed:', e.message); });
      }
    }
  };

  // ─── Web Push — gerencia permissão e subscription ─────────────────────────
  window.G20Push = {
    VAPID_PUBLIC: 'BJCftOYlNUNRkSXBlsNwj4wu9yF9TjKfflqMq6dggv-LSg1Opxf6gyaDWMB-pIYmiVaE_qS78L0aMCaXJYSA3Uo',
    PROXY:        'https://g20-proxy.vercel.app',

    // Converte base64url → Uint8Array (requerido pela API do browser)
    urlBase64ToUint8Array: function(base64String){
      var padding = '='.repeat((4 - base64String.length % 4) % 4);
      var base64  = (base64String + padding).replace(/-/g,'+').replace(/_/g,'/');
      var raw     = atob(base64);
      var out     = new Uint8Array(raw.length);
      for(var i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i);
      return out;
    },

    // Chamado 3s após login — solicita permissão se ainda não foi decidida
    initPermission: function(reg){
      var self = this;
      // Não pede se já foi negado ou se o aluno não fez login
      if(Notification.permission === 'denied') return;
      // Pega uid do Firebase Auth (se disponível)
      var uid = (window.firebase && window.firebase.auth().currentUser)
              ? window.firebase.auth().currentUser.uid
              : null;
      if(!uid) return;

      // Verifica se já tem subscription salva e válida
      reg.pushManager.getSubscription().then(function(existing){
        if(existing){
          // Já inscrito — garante que está salvo no Firestore
          self._saveSubToFirestore(uid, existing);
          return;
        }
        // Primeira vez — só pede permissão se ainda não decidiu
        if(Notification.permission === 'default'){
          self._requestAndSubscribe(reg, uid);
        }
      }).catch(function(){});
    },

    // Pede permissão e cria subscription
    _requestAndSubscribe: function(reg, uid){
      var self = this;
      Notification.requestPermission().then(function(perm){
        if(perm !== 'granted') return;
        reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: self.urlBase64ToUint8Array(self.VAPID_PUBLIC)
        }).then(function(sub){
          self._saveSubToFirestore(uid, sub);
        }).catch(function(e){ console.warn('[G20Push] Subscribe failed:', e.message); });
      });
    },

    // Salva subscription no Firestore users/{uid}
    _saveSubToFirestore: function(uid, sub){
      try{
        if(!window.firebase || !window.firebase.firestore) return;
        var db = window.firebase.firestore();
        db.collection('users').doc(uid).update({
          pushSubscription: sub.toJSON(),
          pushEnabled:      true,
          pushUpdatedAt:    new Date().toISOString()
        }).catch(function(){});
      }catch(e){}
    },

    // Envia push para UID específico ou '__all__' (chamado pelo dashboard)
    send: function(uid, title, body, url, tag){
      var payload = { uid: uid, title: title, body: body, url: url, tag: tag };
      fetch(this.PROXY + '/api/push-notify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      }).catch(function(){});
    }
  };

  // Auto-init quando o DOM estiver pronto (para páginas que não chamam init manualmente)
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ window.G20Topbar.init(); });
  } else {
    window.G20Topbar.init();
  }
})();
