/* ═══════════════════════════════════════════════════════════════════
   G20 PASSKEY — Entrar com Face ID / Touch ID / digital / Windows Hello
   Usado por login.html (entrar) e perfil.html (ativar / remover).
   Conversa com g20-proxy.vercel.app/api/passkey, que confere a
   assinatura e devolve o token do Firebase.

   Nada de senha ou biometria sai do aparelho: o aparelho guarda uma
   chave privada protegida pela biometria e só assina desafios.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.G20Passkey) return;

  var API = 'https://g20-proxy.vercel.app/api/passkey';
  var FLAG = 'g20_passkey_ativo';          // este aparelho já tem Face ID ativo
  var VALIDADE_CACHE = 4 * 60 * 1000;      // o desafio vale 5 min; renovamos antes

  // ─── base64url <-> ArrayBuffer ─────────────────────────────────────
  function b64urlParaBuf(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), buf = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf.buffer;
  }
  function bufParaB64url(buf) {
    var bytes = new Uint8Array(buf), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // ─── Suporte do aparelho ───────────────────────────────────────────
  function suportado() {
    return !!(window.PublicKeyCredential && navigator.credentials &&
              navigator.credentials.create && navigator.credentials.get && window.isSecureContext);
  }
  function biometriaDisponivel() {
    if (!suportado() || !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      return Promise.resolve(false);
    }
    return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(function () { return false; });
  }
  function ativoNesteAparelho() {
    try { return localStorage.getItem(FLAG) === '1'; } catch (e) { return false; }
  }
  function marcarAtivo(sim) {
    try { if (sim) localStorage.setItem(FLAG, '1'); else localStorage.removeItem(FLAG); } catch (e) {}
  }

  // Nome amigável do recurso de biometria do aparelho
  function rotulo() {
    var ua = navigator.userAgent || '';
    var mac = /Macintosh/.test(ua) && !('ontouchend' in document);
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) return 'Face ID';
    if (mac) return 'Touch ID';
    if (/Android/.test(ua)) return 'biometria';
    if (/Windows/.test(ua)) return 'Windows Hello';
    return 'biometria';
  }
  function nomeAparelho() {
    var ua = navigator.userAgent || '';
    var so = /iPhone/.test(ua) ? 'iPhone'
           : (/iPad/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) ? 'iPad'
           : /Android/.test(ua) ? 'Android'
           : /Macintosh/.test(ua) ? 'Mac'
           : /Windows/.test(ua) ? 'Windows'
           : /Linux/.test(ua) ? 'Linux' : 'Aparelho';
    var nav = /Edg\//.test(ua) ? 'Edge'
            : /OPR\//.test(ua) ? 'Opera'
            : /Firefox\//.test(ua) ? 'Firefox'
            : /CriOS|Chrome\//.test(ua) ? 'Chrome'
            : /Safari\//.test(ua) ? 'Safari' : '';
    var app = (window.navigator.standalone === true ||
               (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)) ? 'app' : nav;
    return app ? so + ' · ' + app : so;
  }

  // ─── Chamada ao servidor ───────────────────────────────────────────
  function chamar(acao, dados, idToken) {
    var headers = { 'Content-Type': 'application/json' };
    if (idToken) headers.Authorization = 'Bearer ' + idToken;
    var corpo = Object.assign({ acao: acao }, dados || {});
    return fetch(API, { method: 'POST', headers: headers, body: JSON.stringify(corpo) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) {
            var e = new Error(j.error || ('Erro ' + r.status));
            e.status = r.status;
            throw e;
          }
          return j;
        });
      });
  }

  // ─── Conversões para a API do navegador ────────────────────────────
  function opcoesCriacao(o) {
    var p = Object.assign({}, o);
    p.challenge = b64urlParaBuf(o.challenge);
    p.user = Object.assign({}, o.user, { id: b64urlParaBuf(o.user.id) });
    p.excludeCredentials = (o.excludeCredentials || []).map(function (c) {
      return Object.assign({}, c, { id: b64urlParaBuf(c.id) });
    });
    delete p.hints;
    return p;
  }
  function opcoesLogin(o) {
    var p = Object.assign({}, o);
    p.challenge = b64urlParaBuf(o.challenge);
    p.allowCredentials = (o.allowCredentials || []).map(function (c) {
      return Object.assign({}, c, { id: b64urlParaBuf(c.id) });
    });
    delete p.hints;
    return p;
  }
  function respostaCriacao(cred) {
    var r = cred.response;
    return {
      id: cred.id,
      rawId: bufParaB64url(cred.rawId),
      type: cred.type,
      authenticatorAttachment: cred.authenticatorAttachment || undefined,
      clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : {},
      response: {
        clientDataJSON: bufParaB64url(r.clientDataJSON),
        attestationObject: bufParaB64url(r.attestationObject),
        transports: r.getTransports ? r.getTransports() : []
      }
    };
  }
  function respostaLogin(cred) {
    var r = cred.response;
    return {
      id: cred.id,
      rawId: bufParaB64url(cred.rawId),
      type: cred.type,
      authenticatorAttachment: cred.authenticatorAttachment || undefined,
      clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : {},
      response: {
        clientDataJSON: bufParaB64url(r.clientDataJSON),
        authenticatorData: bufParaB64url(r.authenticatorData),
        signature: bufParaB64url(r.signature),
        userHandle: r.userHandle ? bufParaB64url(r.userHandle) : undefined
      }
    };
  }

  // Traduz erros do navegador para mensagens claras
  function mensagemErro(e) {
    var n = e && e.name;
    if (n === 'NotAllowedError' || n === 'AbortError') return 'Autenticação cancelada.';
    if (n === 'InvalidStateError') return 'Este aparelho já está ativo na sua conta.';
    if (n === 'NotSupportedError') return 'Este aparelho não suporta ' + rotulo() + '.';
    if (n === 'SecurityError') return 'Recurso bloqueado por segurança neste navegador.';
    return (e && e.message) || 'Não foi possível concluir.';
  }

  // ─── Pré-carregamento dos desafios ─────────────────────────────────
  // O Safari exige que o Face ID seja chamado logo depois do toque do aluno.
  // Por isso buscamos o desafio ANTES do toque e deixamos pronto.
  var _cacheLogin = null;     // { em, dados }
  var _cacheRegistro = null;  // { em, uid, dados }

  function prepararLogin() {
    if (_cacheLogin && Date.now() - _cacheLogin.em < VALIDADE_CACHE) return Promise.resolve(_cacheLogin.dados);
    return chamar('login-opcoes').then(function (d) {
      _cacheLogin = { em: Date.now(), dados: d };
      return d;
    });
  }
  function prepararRegistro(user) {
    if (_cacheRegistro && _cacheRegistro.uid === user.uid && Date.now() - _cacheRegistro.em < VALIDADE_CACHE) {
      return Promise.resolve(_cacheRegistro.dados);
    }
    return user.getIdToken().then(function (tk) {
      return chamar('registro-opcoes', {}, tk);
    }).then(function (d) {
      _cacheRegistro = { em: Date.now(), uid: user.uid, dados: d };
      return d;
    });
  }

  // A janela do Face ID é do sistema e tira o foco da página: não é saída
  // do app, então a cortina de privacidade fica pausada enquanto ela aparece.
  function comCortinaPausada(fn) {
    if (window.G20Cortina) G20Cortina.pausar(120000);
    var p;
    try { p = fn(); } catch (e) { if (window.G20Cortina) G20Cortina.retomar(); throw e; }
    return Promise.resolve(p).finally(function () { if (window.G20Cortina) G20Cortina.retomar(); });
  }

  // ─── Ações ─────────────────────────────────────────────────────────
  // Entrar: devolve o token do Firebase para signInWithCustomToken
  async function entrar() {
    var d = _cacheLogin && Date.now() - _cacheLogin.em < VALIDADE_CACHE ? _cacheLogin.dados : await prepararLogin();
    _cacheLogin = null; // desafio é de uso único
    var cred = await comCortinaPausada(function(){ return navigator.credentials.get({ publicKey: opcoesLogin(d.options) }); });
    try {
      var r = await chamar('login-verificar', { desafio: d.desafio, resposta: respostaLogin(cred) });
      marcarAtivo(true);
      prepararLogin().catch(function () {});
      return r.token;
    } catch (e) {
      if (e.status === 404) marcarAtivo(false);
      prepararLogin().catch(function () {});
      throw e;
    }
  }

  // Ativar neste aparelho (aluno já logado)
  async function ativar(user, nome) {
    var d = _cacheRegistro && _cacheRegistro.uid === user.uid && Date.now() - _cacheRegistro.em < VALIDADE_CACHE
      ? _cacheRegistro.dados : await prepararRegistro(user);
    _cacheRegistro = null;
    var cred = await comCortinaPausada(function(){ return navigator.credentials.create({ publicKey: opcoesCriacao(d.options) }); });
    var tk = await user.getIdToken();
    await chamar('registro-verificar', {
      desafio: d.desafio,
      resposta: respostaCriacao(cred),
      nome: nome || nomeAparelho()
    }, tk);
    marcarAtivo(true);
    prepararRegistro(user).catch(function () {});
    return true;
  }

  async function listar(user) {
    var tk = await user.getIdToken();
    var r = await chamar('listar', {}, tk);
    return r.lista || [];
  }

  async function remover(user, id) {
    var tk = await user.getIdToken();
    await chamar('remover', { id: id }, tk);
    return true;
  }

  window.G20Passkey = {
    suportado: suportado,
    biometriaDisponivel: biometriaDisponivel,
    ativoNesteAparelho: ativoNesteAparelho,
    marcarAtivo: marcarAtivo,
    rotulo: rotulo,
    nomeAparelho: nomeAparelho,
    prepararLogin: prepararLogin,
    prepararRegistro: prepararRegistro,
    entrar: entrar,
    ativar: ativar,
    listar: listar,
    remover: remover,
    mensagemErro: mensagemErro
  };
})();
