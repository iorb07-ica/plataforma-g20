/* ═══════════════════════════════════════════════════════════════════════════
   TURMAS G20 — tabela oficial e regras de acesso
   assets/turmas-g20.js

   O QUE É
   A relação das turmas do G20 Masterclass com a data de início de cada uma.
   Dela saem duas coisas que a plataforma precisa:

     1. o "G20 desde 2021" que aparece no perfil, no Networking e na Arena
     2. o vencimento do acesso — um ano contado do início da turma

   POR QUE UMA TABELA E NÃO UM CAMPO POR ALUNO
   A turma é imutável: quem entra na 9 é da 9 para sempre. E a data de início
   é a mesma para todos os alunos de uma turma. Guardar a data em cada aluno
   seria repetir 300 vezes a mesma informação, com 300 chances de divergir.

   REGRA DE ACESSO — combinada com o Israel
       admin ......................... entra sempre
       infinite === true ............. entra sempre (vitalício)
       turma vazia ................... entra (dado ainda não preenchido)
       turma preenchida .............. entra até 1 ano do início da turma

   O caso da turma vazia é importante: o campo era autodeclarado e a maioria
   dos alunos está sem ele. Bloquear por falta de dado trancaria gente que
   tem direito de estar aqui. Conforme o Israel for preenchendo na aprovação,
   a regra passa a valer para cada um.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* Datas de início. Onde só havia mês, usamos o dia 1º — a diferença de
     dias não muda nada num prazo de um ano. */
  var TURMAS = {
    1:  '2018-01-01',   // 2018 — mês não registrado; ver observação abaixo
    2:  '2019-03-01',
    3:  '2019-05-01',
    4:  '2019-08-01',
    5:  '2019-11-01',
    6:  '2020-04-01',
    7:  '2020-08-01',
    8:  '2020-11-01',
    9:  '2021-03-01',
    10: '2021-06-01',
    11: '2021-09-01',
    12: '2022-03-01',
    13: '2022-06-01',
    14: '2022-09-01',
    15: '2023-02-01',
    16: '2023-06-01',
    17: '2024-02-01',
    18: '2024-09-01',
    19: '2025-03-01',
    20: '2025-10-01',
    21: '2026-09-08'    // data exata confirmada
  };

  /* A Turma 1 ficou registrada apenas como "2018". Usamos janeiro por ser o
     começo do ano — se aparecer o mês certo, é só corrigir aqui. O efeito
     prático é nulo: a turma venceu em 2019 de qualquer forma. */

  var MESES = ['janeiro','fevereiro','março','abril','maio','junho',
               'julho','agosto','setembro','outubro','novembro','dezembro'];

  /* Aceita 'Turma 9', 'turma9', '9', 9 — o campo foi autodeclarado por anos
     e chegou em vários formatos. */
  function numero(turma) {
    if (turma === null || turma === undefined) return null;
    if (typeof turma === 'number') return TURMAS[turma] ? turma : null;
    var m = String(turma).match(/(\d+)/);
    if (!m) return null;
    var n = parseInt(m[1], 10);
    return TURMAS[n] ? n : null;
  }

  function inicio(turma) {
    var n = numero(turma);
    return n ? TURMAS[n] : null;
  }

  function data(turma) {
    var s = inicio(turma);
    return s ? new Date(s + 'T12:00:00') : null;
  }

  /* Um ano a partir do início. */
  function vencimento(turma) {
    var d = data(turma);
    if (!d) return null;
    var v = new Date(d);
    v.setFullYear(v.getFullYear() + 1);
    return v;
  }

  function ano(turma) {
    var d = data(turma);
    return d ? d.getFullYear() : null;
  }

  /* "março de 2021" */
  function mesAno(turma) {
    var d = data(turma);
    return d ? (MESES[d.getMonth()] + ' de ' + d.getFullYear()) : null;
  }

  /* "G20 desde 2021" — a frase antes do número.
     Qualquer um entende "desde 2021"; "Turma 9" só quem já está há tempo
     suficiente para saber que 9 é antigo. */
  function desde(turma) {
    var a = ano(turma);
    return a ? ('G20 desde ' + a) : null;
  }

  /* Linha completa para o Networking e a Arena:
       "G20 desde 2021 · Turma 9"            aluno comum
       "G20 desde 2021 · Turma 9 · ∞"        Infinity  */
  function credencial(turma, infinite) {
    var n = numero(turma);
    if (!n) return infinite ? 'G20 Infinity ∞' : '';
    var txt = desde(turma) + ' · Turma ' + n;
    return infinite ? (txt + ' · ∞') : txt;
  }

  function diasRestantes(turma) {
    var v = vencimento(turma);
    if (!v) return null;
    return Math.ceil((v - new Date()) / 86400000);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     A DECISÃO DE ACESSO

     Devolve sempre um objeto explicando o porquê — nunca um booleano solto.
     Quem chama precisa saber se liberou por ser Infinity, por não ter turma
     ou por estar dentro do prazo, para dar a mensagem certa ao aluno.
     ═══════════════════════════════════════════════════════════════════════ */
  function avaliar(user) {
    user = user || {};

    if (user.role === 'admin') {
      return { libera: true, motivo: 'admin' };
    }
    if (user.infinite === true) {
      return { libera: true, motivo: 'infinity' };
    }

    var n = numero(user.turma);
    if (!n) {
      /* Sem turma cadastrada: libera. O campo era autodeclarado e a maioria
         está vazia — bloquear por falta de dado trancaria quem tem direito. */
      return { libera: true, motivo: 'sem-turma' };
    }

    var v = vencimento(n);
    var dias = diasRestantes(n);

    if (dias > 0) {
      return {
        libera: true,
        motivo: 'dentro-do-prazo',
        turma: n,
        vence: v,
        diasRestantes: dias,
        /* Sinaliza a reta final para a plataforma poder avisar antes —
           é a melhor hora de oferecer o Infinity. */
        avisar: dias <= 30
      };
    }

    return {
      libera: false,
      motivo: 'vencido',
      turma: n,
      vence: v,
      diasRestantes: dias,
      inicio: mesAno(n)
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PRÉVIA — quem seria bloqueado se a regra entrasse em vigor hoje

     Existe porque ligar a expiração sem olhar antes é arriscado: das 21
     turmas, só a 20 e a 21 ainda estão no prazo. Todo aluno das turmas 1 a
     19 que não for Infinity perde o acesso no instante em que alguém marcar
     a turma dele.

     Passe a lista de usuários (do painel admin, por exemplo) e veja o
     impacto antes de decidir.
     ═══════════════════════════════════════════════════════════════════════ */
  function previa(usuarios) {
    if (!Array.isArray(usuarios)) {
      console.warn('[Turmas] passe a lista de usuários: G20Turmas.previa(lista)');
      return;
    }
    var r = { libera: 0, bloqueia: 0, semTurma: 0, infinity: 0, admin: 0, bloqueados: [] };
    usuarios.forEach(function (u) {
      var d = avaliar(u);
      if (d.motivo === 'admin') r.admin++;
      else if (d.motivo === 'infinity') r.infinity++;
      else if (d.motivo === 'sem-turma') r.semTurma++;
      if (d.libera) r.libera++;
      else {
        r.bloqueia++;
        r.bloqueados.push({
          nome: u.name || u.nome || u.email || '?',
          turma: d.turma,
          venceuEm: d.vence ? d.vence.toISOString().substring(0, 10) : '?'
        });
      }
    });
    console.log('%c[Turmas] prévia da regra de acesso', 'color:#c9a961;font-weight:bold');
    console.log('  liberados     : ' + r.libera);
    console.log('    · admin     : ' + r.admin);
    console.log('    · Infinity  : ' + r.infinity);
    console.log('    · sem turma : ' + r.semTurma);
    console.log('  BLOQUEADOS    : ' + r.bloqueia);
    if (r.bloqueados.length) console.table(r.bloqueados.slice(0, 50));
    return r;
  }

  /* Situação de cada turma hoje — útil para conferir a tabela. */
  function situacao() {
    var linhas = Object.keys(TURMAS).map(function (k) {
      var n = parseInt(k, 10);
      var d = diasRestantes(n);
      var ini = data(n);
      return {
        turma: n,
        inicio: mesAno(n),
        vence: vencimento(n).toISOString().substring(0, 10),
        situacao: (ini > new Date()) ? 'ainda não começou'
                : (d > 0 ? 'ativa (' + d + ' dias)' : 'encerrada')
      };
    });
    console.log('%c[Turmas] situação de cada turma', 'color:#c9a961;font-weight:bold');
    console.table(linhas);
    return linhas;
  }

  global.G20Turmas = {
    TURMAS: TURMAS,
    numero: numero,
    inicio: inicio,
    data: data,
    vencimento: vencimento,
    ano: ano,
    mesAno: mesAno,
    desde: desde,
    credencial: credencial,
    diasRestantes: diasRestantes,
    avaliar: avaliar,
    previa: previa,
    situacao: situacao
  };

  try { global.G20DiagTurmas = situacao; } catch (e) {}
})(window);
