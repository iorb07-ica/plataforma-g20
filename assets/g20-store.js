/* ═══════════════════════════════════════════════════════════════════════
   G20Store — armazenamento local escalável (sessão 51)

   PROBLEMA QUE RESOLVE:
   O localStorage tem só ~5-10MB por site. Numa carteira grande (115+ ativos,
   série diária de rentabilidade com milhares de pontos, proventos, preços),
   a cota estoura. Quando estoura, os setItem falham em silêncio e os cards
   aparecem ZERADOS sem aviso. Já acontecia na conta admin.

   SOLUÇÃO:
   IndexedDB tem centenas de MB (não 5-10). Este módulo guarda os dados
   PESADOS lá, e mantém o localStorage só para flags leves (uid, tema, etc).
   Se o IndexedDB falhar por qualquer motivo, cai para localStorage — nunca
   quebra, só fica mais apertado.

   API (assíncrona, baseada em Promise):
     await G20Store.set(chave, valor)   // valor pode ser objeto/array grande
     await G20Store.get(chave)          // devolve o objeto, ou null
     await G20Store.del(chave)
     G20Store.setSync(chave, valor)     // grava também no localStorage (leves)
     G20Store.getSync(chave)            // leitura síncrona do localStorage (leves)

   As chaves pesadas usam set/get (IndexedDB). As leves seguem no localStorage.
   ═══════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var DB_NAME = 'g20-store';
  var STORE = 'kv';
  var _dbPromise = null;
  var _idbOk = (typeof indexedDB !== 'undefined');

  function openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise(function (resolve, reject) {
      if (!_idbOk) return reject(new Error('IndexedDB indisponível'));
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return _dbPromise;
  }

  function idbSet(key, val) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(val, key);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function idbGet(key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readonly');
        var r = tx.objectStore(STORE).get(key);
        r.onsuccess = function () { resolve(r.result === undefined ? null : r.result); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }

  function idbDel(key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  // ── API pública ──
  var G20Store = {
    /* Grava dado PESADO. Tenta IndexedDB; se falhar, cai no localStorage. */
    set: function (key, val) {
      return idbSet(key, val).catch(function () {
        // fallback: localStorage (pode estourar, mas é melhor que perder)
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
        return false;
      });
    },

    /* Lê dado PESADO. Tenta IndexedDB; se vazio, tenta migrar do localStorage. */
    get: function (key) {
      return idbGet(key).then(function (v) {
        if (v !== null && v !== undefined) return v;
        // Migração transparente: se o dado ainda está no localStorage (versão
        // antiga), lê de lá, move pro IndexedDB e limpa o localStorage.
        try {
          var raw = localStorage.getItem(key);
          if (raw != null) {
            var parsed = JSON.parse(raw);
            idbSet(key, parsed).then(function () {
              try { localStorage.removeItem(key); } catch (e) {}
            });
            return parsed;
          }
        } catch (e) {}
        return null;
      }).catch(function () {
        // IndexedDB falhou: lê do localStorage
        try { var raw = localStorage.getItem(key); return raw != null ? JSON.parse(raw) : null; }
        catch (e) { return null; }
      });
    },

    del: function (key) {
      try { localStorage.removeItem(key); } catch (e) {}
      return idbDel(key).catch(function () { return false; });
    },

    /* Flags LEVES continuam no localStorage (síncrono, rápido). */
    setSync: function (key, val) {
      try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); return true; }
      catch (e) { return false; }
    },
    getSync: function (key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },

    /* Limpa TUDO (IndexedDB + localStorage) — usado em logout ou reset geral. */
    clearAll: function () {
      try { localStorage.clear(); } catch (e) {}
      return openDB().then(function (db) {
        return new Promise(function (resolve) {
          var tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).clear();
          tx.oncomplete = function () { resolve(true); };
          tx.onerror = function () { resolve(false); };
        });
      }).catch(function () { return false; });
    },

    disponivel: function () { return _idbOk; }
  };

  global.G20Store = G20Store;
})(window);
