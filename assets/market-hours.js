// ============================================================
// G20 MARKET HOURS v1.0
// Biblioteca de horários das bolsas B3 (Brasil) e NYSE/NASDAQ (EUA)
// Zero dependências, cálculo 100% local
// ============================================================
//
// Uso:
//   MarketHours.isB3Open()        → { open, status, motivo, ... }
//   MarketHours.isNYSEOpen()      → { open, status, motivo, ... }
//   MarketHours.getHolidayToday() → { b3: {...}, nyse: {...} }
//
// Feriados cobertos: 2025, 2026, 2027 (fixos + móveis calculados)
// Horário de verão EUA: calculado automaticamente (DST)
// Horário de verão BR: NÃO aplicável (abolido desde 2019)
// ============================================================

(function(global) {
  'use strict';

  // ============================================================
  // UTILITÁRIOS DE DATA
  // ============================================================

  // Páscoa (algoritmo de Gauss/Meeus)
  function getPascoa(ano) {
    var a = ano % 19;
    var b = Math.floor(ano / 100);
    var c = ano % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19*a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var l = (32 + 2*e + 2*i - h - k) % 7;
    var m = Math.floor((a + 11*h + 22*l) / 451);
    var mes = Math.floor((h + l - 7*m + 114) / 31);
    var dia = ((h + l - 7*m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
  }

  function fmtISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth()+1).padStart(2,'0');
    var dd = String(d.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+dd;
  }

  function addDays(d, n) {
    var x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  // Nth weekday do mês (ex: 3ª segunda de janeiro)
  function nthWeekdayOfMonth(ano, mes, diaSem, n) {
    // mes: 1-12, diaSem: 0=dom...6=sab, n: 1,2,3,4
    var d = new Date(ano, mes-1, 1);
    var count = 0;
    while (d.getMonth() === mes-1) {
      if (d.getDay() === diaSem) {
        count++;
        if (count === n) return new Date(d);
      }
      d.setDate(d.getDate()+1);
    }
    return null;
  }

  // Última ocorrência de weekday no mês (ex: última segunda de maio)
  function lastWeekdayOfMonth(ano, mes, diaSem) {
    var d = new Date(ano, mes, 0); // último dia do mês
    while (d.getDay() !== diaSem) {
      d.setDate(d.getDate()-1);
    }
    return d;
  }

  // ============================================================
  // DST EUA
  // Regra: 2º domingo de março (entra DST) até 1º domingo de novembro (sai DST)
  // ============================================================
  function isDST_US(date) {
    var ano = date.getFullYear();
    var dstStart = nthWeekdayOfMonth(ano, 3, 0, 2); // 2º domingo março, 02:00
    var dstEnd = nthWeekdayOfMonth(ano, 11, 0, 1);  // 1º domingo novembro, 02:00
    var t = date.getTime();
    return t >= dstStart.getTime() && t < dstEnd.getTime();
  }

  // ============================================================
  // FERIADOS B3 (Brasil)
  // ============================================================
  function getB3Holidays(ano) {
    var pascoa = getPascoa(ano);
    var carnavalSeg = addDays(pascoa, -48);
    var carnavalTer = addDays(pascoa, -47);
    var sextaSanta = addDays(pascoa, -2);
    var corpus = addDays(pascoa, 60);

    return [
      {data: ano+'-01-01', motivo: 'Confraternização Universal'},
      {data: fmtISO(carnavalSeg), motivo: 'Carnaval'},
      {data: fmtISO(carnavalTer), motivo: 'Carnaval'},
      {data: fmtISO(sextaSanta), motivo: 'Sexta-feira Santa'},
      {data: ano+'-04-21', motivo: 'Tiradentes'},
      {data: ano+'-05-01', motivo: 'Dia do Trabalho'},
      {data: fmtISO(corpus), motivo: 'Corpus Christi'},
      {data: ano+'-09-07', motivo: 'Independência do Brasil'},
      {data: ano+'-10-12', motivo: 'Nossa Senhora Aparecida'},
      {data: ano+'-11-02', motivo: 'Finados'},
      {data: ano+'-11-15', motivo: 'Proclamação da República'},
      {data: ano+'-11-20', motivo: 'Consciência Negra'},
      {data: ano+'-12-25', motivo: 'Natal'}
    ];
  }

  // Meio-expediente B3 (pregão só até 14h)
  function getB3HalfDays(ano) {
    return [
      {data: ano+'-12-24', motivo: 'Véspera de Natal'},
      {data: ano+'-12-31', motivo: 'Véspera de Ano Novo'}
    ];
  }

  // ============================================================
  // FERIADOS NYSE/NASDAQ (EUA)
  // ============================================================
  function getNYSEHolidays(ano) {
    var pascoa = getPascoa(ano);
    var goodFriday = addDays(pascoa, -2);

    // Feriados fixos com regra de "observado" (se cai no sábado, move pra sexta; no domingo, pra segunda)
    function observed(d, motivo) {
      var dw = d.getDay();
      if (dw === 6) return {data: fmtISO(addDays(d,-1)), motivo: motivo + ' (observado)'};
      if (dw === 0) return {data: fmtISO(addDays(d,1)), motivo: motivo + ' (observado)'};
      return {data: fmtISO(d), motivo: motivo};
    }

    return [
      observed(new Date(ano,0,1), "New Year's Day"),
      {data: fmtISO(nthWeekdayOfMonth(ano,1,1,3)), motivo: "Martin Luther King Jr. Day"},
      {data: fmtISO(nthWeekdayOfMonth(ano,2,1,3)), motivo: "Presidents' Day"},
      {data: fmtISO(goodFriday), motivo: 'Good Friday'},
      {data: fmtISO(lastWeekdayOfMonth(ano,5,1)), motivo: 'Memorial Day'},
      observed(new Date(ano,5,19), 'Juneteenth'),
      observed(new Date(ano,6,4), 'Independence Day'),
      {data: fmtISO(nthWeekdayOfMonth(ano,9,1,1)), motivo: 'Labor Day'},
      {data: fmtISO(nthWeekdayOfMonth(ano,11,4,4)), motivo: 'Thanksgiving'},
      observed(new Date(ano,11,25), 'Christmas Day')
    ];
  }

  // Meio-expediente NYSE (fecha 13:00 ET)
  function getNYSEHalfDays(ano) {
    var pascoa = getPascoa(ano);
    var goodFriday = addDays(pascoa, -2);
    var blackFriday = addDays(nthWeekdayOfMonth(ano,11,4,4), 1); // dia após Thanksgiving
    return [
      {data: ano+'-07-03', motivo: 'Day before Independence Day'},
      {data: fmtISO(blackFriday), motivo: 'Black Friday'},
      {data: ano+'-12-24', motivo: 'Christmas Eve'}
    ];
  }

  // ============================================================
  // B3: isB3Open
  // Horário: seg-sex 10:00-18:00 (pregão regular); meio-expediente 10:00-14:00
  // Timezone: BRT (UTC-3), sem DST desde 2019
  // ============================================================
  function isB3Open(date) {
    date = date || new Date();
    var hoje = fmtISO(date);
    var dow = date.getDay();
    var hora = date.getHours();
    var min = date.getMinutes();
    var minTotal = hora*60 + min;
    var ano = date.getFullYear();

    // Feriado?
    var feriados = getB3Holidays(ano);
    var feriadoHoje = feriados.find(function(f){ return f.data === hoje; });
    if (feriadoHoje) {
      return {
        open: false,
        status: 'FERIADO',
        motivo: feriadoHoje.motivo,
        mercado: 'B3',
        label: 'B3 FECHADA · '+feriadoHoje.motivo
      };
    }

    // Meio-expediente?
    var halfDays = getB3HalfDays(ano);
    var halfHoje = halfDays.find(function(h){ return h.data === hoje; });
    if (halfHoje) {
      var abertura = 10*60;
      var fechamentoMeia = 14*60;
      if (dow >= 1 && dow <= 5 && minTotal >= abertura && minTotal < fechamentoMeia) {
        return {
          open: true,
          status: 'MEIA SESSÃO',
          motivo: halfHoje.motivo,
          mercado: 'B3',
          label: 'B3 MEIA SESSÃO · até 14h'
        };
      } else {
        return {
          open: false,
          status: 'FECHADA',
          motivo: halfHoje.motivo,
          mercado: 'B3',
          label: 'B3 FECHADA · '+halfHoje.motivo
        };
      }
    }

    // Fim de semana?
    if (dow === 0 || dow === 6) {
      return {
        open: false,
        status: 'FIM DE SEMANA',
        mercado: 'B3',
        label: 'B3 FECHADA · Fim de semana'
      };
    }

    // Pregão regular: 10:00 - 18:00 BRT
    var abertura = 10*60;     // 10:00
    var fechamento = 18*60;   // 18:00 (nova regra B3, era 17:55)
    if (minTotal >= abertura && minTotal < fechamento) {
      return {
        open: true,
        status: 'ABERTA',
        mercado: 'B3',
        label: 'B3 ABERTA'
      };
    }

    // Fora do pregão (pré-abertura, after-hours, overnight)
    if (minTotal < abertura) {
      return {
        open: false,
        status: 'FECHADA',
        motivo: 'Abre às 10h',
        mercado: 'B3',
        label: 'B3 FECHADA · Abre às 10h'
      };
    }
    return {
      open: false,
      status: 'FECHADA',
      motivo: 'Fechou às 18h',
      mercado: 'B3',
      label: 'B3 FECHADA · Fechou às 18h'
    };
  }

  // ============================================================
  // NYSE/NASDAQ: isNYSEOpen
  // Horário: seg-sex 9:30-16:00 ET (Eastern Time)
  //   EST (padrão): UTC-5 → 11:30-18:00 BRT
  //   EDT (verão):  UTC-4 → 10:30-17:00 BRT
  // Meio-expediente: fecha 13:00 ET = 14:00 EST ou 14:00 EDT
  // ============================================================
  function isNYSEOpen(date) {
    date = date || new Date();

    // Calcula hora atual em ET (Eastern Time)
    // Assume que o browser está em BRT (UTC-3)
    // ET = BRT -1h (EDT verão) ou BRT -2h (EST padrão)
    var dst = isDST_US(date);
    var offsetHoras = dst ? -1 : -2; // diferença ET - BRT

    var dateET = new Date(date.getTime() + offsetHoras*60*60*1000);
    var dow = dateET.getDay();
    var hora = dateET.getHours();
    var min = dateET.getMinutes();
    var minTotal = hora*60 + min;
    var hojeET = fmtISO(dateET);
    var ano = dateET.getFullYear();

    // Feriado?
    var feriados = getNYSEHolidays(ano);
    var feriadoHoje = feriados.find(function(f){ return f.data === hojeET; });
    if (feriadoHoje) {
      return {
        open: false,
        status: 'FERIADO',
        motivo: feriadoHoje.motivo,
        mercado: 'NYSE',
        label: 'NYSE FECHADA · '+feriadoHoje.motivo
      };
    }

    // Meio-expediente? (fecha 13:00 ET)
    var halfDays = getNYSEHalfDays(ano);
    var halfHoje = halfDays.find(function(h){ return h.data === hojeET; });
    if (halfHoje) {
      var aberturaNY = 9*60 + 30;
      var fechamentoMeia = 13*60;
      if (dow >= 1 && dow <= 5 && minTotal >= aberturaNY && minTotal < fechamentoMeia) {
        return {
          open: true,
          status: 'MEIA SESSÃO',
          motivo: halfHoje.motivo,
          mercado: 'NYSE',
          label: 'NYSE MEIA SESSÃO · até 13h ET'
        };
      } else {
        return {
          open: false,
          status: 'FECHADA',
          motivo: halfHoje.motivo,
          mercado: 'NYSE',
          label: 'NYSE FECHADA · '+halfHoje.motivo
        };
      }
    }

    // Fim de semana?
    if (dow === 0 || dow === 6) {
      return {
        open: false,
        status: 'FIM DE SEMANA',
        mercado: 'NYSE',
        label: 'NYSE FECHADA · Fim de semana'
      };
    }

    // Pregão regular: 9:30 - 16:00 ET
    var aberturaNY = 9*60 + 30;
    var fechamentoNY = 16*60;
    if (minTotal >= aberturaNY && minTotal < fechamentoNY) {
      return {
        open: true,
        status: 'ABERTA',
        mercado: 'NYSE',
        label: 'NYSE ABERTA'
      };
    }

    if (minTotal < aberturaNY) {
      return {
        open: false,
        status: 'FECHADA',
        motivo: 'Abre '+(dst?'10:30':'11:30')+' BRT',
        mercado: 'NYSE',
        label: 'NYSE FECHADA · Abre '+(dst?'10:30':'11:30')
      };
    }
    return {
      open: false,
      status: 'FECHADA',
      motivo: 'Fechou '+(dst?'17h':'18h')+' BRT',
      mercado: 'NYSE',
      label: 'NYSE FECHADA · Fechou '+(dst?'17h':'18h')
    };
  }

  // ============================================================
  // API PÚBLICA
  // ============================================================
  global.MarketHours = {
    isB3Open: isB3Open,
    isNYSEOpen: isNYSEOpen,
    getB3Holidays: getB3Holidays,
    getNYSEHolidays: getNYSEHolidays,
    getB3HalfDays: getB3HalfDays,
    getNYSEHalfDays: getNYSEHalfDays,
    isDST_US: isDST_US,
    getPascoa: getPascoa,
    version: '1.0'
  };

})(typeof window !== 'undefined' ? window : this);
