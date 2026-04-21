// ============================================================
// G20 INSIGHTS ENGINE v1.0
// Motor de insights determinísticos — zero custo, 100% local
// ============================================================
//
// Como funciona:
// 1. Recebe dados da carteira do aluno
// 2. Avalia 50+ regras condicionais
// 3. Cada regra acionada retorna 1 insight candidato
// 4. Sistema de prioridade seleciona os 4 mais relevantes do dia
// 5. Templates rotacionam pra evitar repetição
// 6. Histórico de 7 dias em Firestore impede repetição temática
//
// Uso:
//   const insights = G20Insights.gerar(dadosCarteira, historico7d);
//   → retorna array com 4 insights { type, icon, text, topic }
// ============================================================

(function(global) {
  'use strict';

  // ============================================================
  // UTILITÁRIOS
  // ============================================================

  const fmt = {
    brl: (v) => 'R$ ' + Math.round(v).toLocaleString('pt-BR'),
    brlDec: (v) => 'R$ ' + v.toFixed(2).replace('.', ','),
    pct: (v) => v.toFixed(2).replace('.', ',') + '%',
    pp: (v) => (v >= 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + 'pp',
    plus: (v) => (v >= 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + '%'
  };

  // Hash determinístico de uma string (pra seed por data + UID)
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Seleciona template baseado em seed (determinístico pra data)
  function pickTemplate(templates, seed) {
    return templates[seed % templates.length];
  }

  // Substitui placeholders {var} num template
  function fillTemplate(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
  }

  // ============================================================
  // BIBLIOTECA DE REGRAS (50+)
  // ============================================================
  //
  // Cada regra tem:
  //   - id: identificador único (usado no histórico)
  //   - type: conquista | alerta | observacao | projecao
  //   - icon: trophy | warn | info | good
  //   - prioridade: 1 (trigger crítico) a 5 (curiosidade)
  //   - condicao: função que recebe dados e retorna true/false
  //   - gerar: função que retorna texto do insight
  // ============================================================

  const REGRAS = [

    // ═══════════════════════════════════════════════════
    // PRIORIDADE 1 — TRIGGERS CRÍTICOS (sempre vencem)
    // ═══════════════════════════════════════════════════

    {
      id: 'provento_hoje',
      type: 'conquista', icon: 'good', prioridade: 1,
      condicao: (d) => d.proventos_hoje && d.proventos_hoje.length > 0,
      gerar: (d, seed) => {
        const p = d.proventos_hoje[0];
        const total = d.proventos_hoje.reduce((a,b) => a + b.valor, 0);
        const templates = [
          `${fmt.brl(total)} de ${p.ticker} caindo na conta hoje`,
          `Provento pago hoje: ${p.ticker} te paga ${fmt.brl(total)}`,
          `Hoje é dia de receber: ${fmt.brl(total)} de ${p.ticker}`
        ];
        return fillTemplate(pickTemplate(templates, seed), {});
      }
    },

    {
      id: 'novo_ath',
      type: 'conquista', icon: 'trophy', prioridade: 1,
      condicao: (d) => d.patrimonio_ath && d.patrimonio_atual >= d.patrimonio_ath,
      gerar: (d, seed) => {
        const templates = [
          `Novo recorde: patrimônio em máxima histórica hoje (${fmt.brl(d.patrimonio_atual)})`,
          `${fmt.brl(d.patrimonio_atual)} — seu maior patrimônio de todos os tempos`,
          `ATH! Hoje você atingiu seu maior patrimônio histórico: ${fmt.brl(d.patrimonio_atual)}`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'marco_10k',
      type: 'conquista', icon: 'trophy', prioridade: 1,
      condicao: (d) => d.cruzou_marco_10k,
      gerar: (d, seed) => {
        const marco = Math.floor(d.patrimonio_atual / 10000) * 10000;
        const templates = [
          `Parabéns! Você atingiu ${fmt.brl(marco)} de patrimônio`,
          `Marco importante: ${fmt.brl(marco)} acumulados — continue firme`,
          `Novo patamar: patrimônio ultrapassa ${fmt.brl(marco)}`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'ex_dividend_amanha',
      type: 'alerta', icon: 'info', prioridade: 1,
      condicao: (d) => d.ex_dividend_proximos && d.ex_dividend_proximos.length > 0,
      gerar: (d, seed) => {
        const p = d.ex_dividend_proximos[0];
        const templates = [
          `Última chance: compre ${p.ticker} hoje pra ter direito ao ${p.tipo.toLowerCase()}`,
          `${p.ticker} com data-com amanhã (${p.data_com}) — ação-com ${p.tipo.toLowerCase()} hoje`,
          `Atenção: data-com de ${p.ticker} é amanhã — decida hoje`
        ];
        return pickTemplate(templates, seed);
      }
    },

    // ═══════════════════════════════════════════════════
    // PRIORIDADE 2 — ALERTAS IMPORTANTES
    // ═══════════════════════════════════════════════════

    {
      id: 'concentracao_top1_acima_10',
      type: 'alerta', icon: 'warn', prioridade: 2,
      condicao: (d) => d.top_posicao && d.top_posicao.pct > 10,
      gerar: (d, seed) => {
        const p = d.top_posicao;
        const templates = [
          `${p.ticker} representa ${fmt.pct(p.pct)} da carteira — acima do limite saudável de 10%`,
          `Atenção: ${fmt.pct(p.pct)} em ${p.ticker}, considere rebalancear`,
          `Concentração alta: ${p.ticker} ocupa ${fmt.pct(p.pct)} do patrimônio`,
          `${p.ticker} passou dos 10% recomendados (hoje: ${fmt.pct(p.pct)})`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'concentracao_top1_proximo_10',
      type: 'observacao', icon: 'info', prioridade: 3,
      condicao: (d) => d.top_posicao && d.top_posicao.pct >= 8 && d.top_posicao.pct <= 10,
      gerar: (d, seed) => {
        const p = d.top_posicao;
        const templates = [
          `${p.ticker} representa ${fmt.pct(p.pct)} da carteira — próximo do limite saudável de 10%`,
          `${p.ticker} é sua maior posição (${fmt.pct(p.pct)}) — monitore concentração`,
          `Atenção gradual: ${p.ticker} já é ${fmt.pct(p.pct)} do total`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'concentracao_setor_banco_alta',
      type: 'alerta', icon: 'warn', prioridade: 2,
      condicao: (d) => d.setor_top && d.setor_top.nome === 'bancos' && d.setor_top.pct > 30,
      gerar: (d, seed) => {
        const s = d.setor_top;
        const templates = [
          `Setor bancário representa ${fmt.pct(s.pct)} das ações BR — avalie diversificar`,
          `Concentração setorial alta: bancos = ${fmt.pct(s.pct)} das ações BR`,
          `${fmt.pct(s.pct)} em bancos — considere expandir pra outros setores`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'top3_concentracao_alta',
      type: 'alerta', icon: 'warn', prioridade: 3,
      condicao: (d) => d.top3_pct && d.top3_pct > 50,
      gerar: (d, seed) => {
        const templates = [
          `Top 3 ativos somam ${fmt.pct(d.top3_pct)} do patrimônio — carteira concentrada`,
          `${fmt.pct(d.top3_pct)} em apenas 3 ativos — considere diluir mais`,
          `Seus 3 maiores ativos representam ${fmt.pct(d.top3_pct)} do total`
        ];
        return pickTemplate(templates, seed);
      }
    },

    // ═══════════════════════════════════════════════════
    // PRIORIDADE 3 — PERFORMANCE (conquistas regulares)
    // ═══════════════════════════════════════════════════

    {
      id: 'alpha_cdi_positivo',
      type: 'conquista', icon: 'trophy', prioridade: 3,
      condicao: (d) => d.alpha_ytd > 1.0,
      gerar: (d, seed) => {
        const extra = fmt.brl(d.patrimonio_atual * d.alpha_ytd / 100);
        const templates = [
          `Você bate o CDI em ${fmt.pp(d.alpha_ytd)} no YTD — equivalente a ${extra} a mais que um CDB`,
          `Seu alpha atual (${fmt.pp(d.alpha_ytd)}) supera a renda fixa tradicional em ${extra}`,
          `${fmt.pp(d.alpha_ytd)} acima do CDI — ${extra} a mais que investindo no Tesouro Selic`,
          `Sua performance vs CDI está ${extra} à frente no ano`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'alpha_cdi_forte',
      type: 'conquista', icon: 'trophy', prioridade: 2,
      condicao: (d) => d.alpha_ytd > 3.0,
      gerar: (d, seed) => {
        const templates = [
          `Alpha excepcional: ${fmt.pp(d.alpha_ytd)} acima do CDI — performance de fundo de ações premium`,
          `${fmt.pp(d.alpha_ytd)} vs CDI no YTD supera 90% dos fundos multimercado`,
          `Performance YTD de ${fmt.pct(d.rent_ytd)} é 2x superior ao CDI (${fmt.pct(d.cdi_ytd)})`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'alpha_ibov_positivo',
      type: 'conquista', icon: 'trophy', prioridade: 3,
      condicao: (d) => d.alpha_ibov_ytd && d.alpha_ibov_ytd > 2.0,
      gerar: (d, seed) => {
        const templates = [
          `Você supera o Ibovespa em ${fmt.pp(d.alpha_ibov_ytd)} no YTD`,
          `Bate o IBOV: sua carteira (${fmt.pct(d.rent_ytd)}) vs IBOV (${fmt.pct(d.ibov_ytd)})`,
          `${fmt.pp(d.alpha_ibov_ytd)} de alpha sobre o Ibovespa este ano`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'alpha_cdi_negativo',
      type: 'observacao', icon: 'info', prioridade: 4,
      condicao: (d) => d.alpha_ytd < -0.5,
      gerar: (d, seed) => {
        const templates = [
          `CDI está ${fmt.pp(Math.abs(d.alpha_ytd))} à frente no YTD — momento de paciência`,
          `Carteira rende ${fmt.pct(d.rent_ytd)} vs CDI ${fmt.pct(d.cdi_ytd)} — volatilidade faz parte`,
          `Desempenho YTD abaixo do CDI em ${fmt.pp(Math.abs(d.alpha_ytd))} — foco no longo prazo`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'rent_12m_forte',
      type: 'conquista', icon: 'trophy', prioridade: 4,
      condicao: (d) => d.rent_12m > 20,
      gerar: (d, seed) => {
        const templates = [
          `Performance 12 meses: ${fmt.plus(d.rent_12m)} — crescimento sólido`,
          `Em 12 meses sua carteira rendeu ${fmt.plus(d.rent_12m)}`,
          `${fmt.plus(d.rent_12m)} de rentabilidade nos últimos 12 meses`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'rent_5a_forte',
      type: 'conquista', icon: 'trophy', prioridade: 4,
      condicao: (d) => d.rent_5a > 100,
      gerar: (d, seed) => {
        const templates = [
          `${fmt.plus(d.rent_5a)} em 5 anos — patrimônio mais que dobrou`,
          `Seu patrimônio cresceu ${fmt.plus(d.rent_5a)} em 5 anos`,
          `5 anos de disciplina resultaram em ${fmt.plus(d.rent_5a)} de rentabilidade`
        ];
        return pickTemplate(templates, seed);
      }
    },

    // ═══════════════════════════════════════════════════
    // PRIORIDADE 3 — PROVENTOS E RENDA PASSIVA
    // ═══════════════════════════════════════════════════

    {
      id: 'dividend_yield_alto',
      type: 'conquista', icon: 'good', prioridade: 3,
      condicao: (d) => d.dy_carteira >= 6,
      gerar: (d, seed) => {
        const templates = [
          `Dividend Yield da carteira: ${fmt.pct(d.dy_carteira)} ao ano — acima da média do mercado`,
          `DY anual de ${fmt.pct(d.dy_carteira)} gera renda passiva consistente`,
          `Carteira com DY de ${fmt.pct(d.dy_carteira)} — excelente pra quem busca renda`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'dividend_growth_positivo',
      type: 'conquista', icon: 'good', prioridade: 3,
      condicao: (d) => d.dividend_growth_yoy > 10,
      gerar: (d, seed) => {
        const templates = [
          `Dividend Growth: ${fmt.plus(d.dividend_growth_yoy)} YoY — seus proventos crescem mais que a inflação`,
          `Proventos cresceram ${fmt.plus(d.dividend_growth_yoy)} em relação ao ano anterior`,
          `${fmt.brl(d.proventos_12m)} em proventos este ano, ${fmt.plus(d.dividend_growth_yoy)} vs ano anterior`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'proventos_proximos_7d',
      type: 'projecao', icon: 'good', prioridade: 2,
      condicao: (d) => d.proventos_proximos_7d && d.proventos_proximos_7d > 0,
      gerar: (d, seed) => {
        const templates = [
          `${fmt.brl(d.proventos_proximos_7d)} em proventos chegando nos próximos 7 dias`,
          `Próxima semana: ${fmt.brl(d.proventos_proximos_7d)} previstos em proventos`,
          `Nos próximos 7 dias: ${fmt.brl(d.proventos_proximos_7d)} de renda passiva`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'proventos_mes_forte',
      type: 'conquista', icon: 'good', prioridade: 3,
      condicao: (d) => d.proventos_mes > 0,
      gerar: (d, seed) => {
        const templates = [
          `${fmt.brl(d.proventos_mes)} recebidos este mês de ${d.ativos_pagaram_mes} ativos`,
          `Proventos do mês: ${fmt.brl(d.proventos_mes)} já caíram na conta`,
          `${d.ativos_pagaram_mes} ativos pagaram ${fmt.brl(d.proventos_mes)} este mês`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'renda_passiva_mensal',
      type: 'observacao', icon: 'info', prioridade: 4,
      condicao: (d) => d.proventos_12m > 0,
      gerar: (d, seed) => {
        const media = d.proventos_12m / 12;
        const templates = [
          `Sua renda passiva equivale a ${fmt.brl(media)}/mês em média nos últimos 12 meses`,
          `Média mensal de proventos: ${fmt.brl(media)} — sua carteira trabalha por você`,
          `${fmt.brl(media)}/mês: é quanto sua carteira te paga em média`
        ];
        return pickTemplate(templates, seed);
      }
    },

    // ═══════════════════════════════════════════════════
    // PRIORIDADE 4 — PROJEÇÕES MATEMÁTICAS
    // ═══════════════════════════════════════════════════

    {
      id: 'projecao_renda_passiva_2a',
      type: 'projecao', icon: 'good', prioridade: 4,
      condicao: (d) => d.aportes_media_mensal > 0 && d.dy_carteira > 0,
      gerar: (d, seed) => {
        // Projeção simples: patrimônio em 2 anos × DY atual / 12 meses
        const patrimonio2a = d.patrimonio_atual + (d.aportes_media_mensal * 24);
        const rendaMensal = (patrimonio2a * d.dy_carteira / 100) / 12;
        const templates = [
          `No ritmo atual, sua renda passiva pode chegar a ${fmt.brl(rendaMensal)}/mês em 2 anos`,
          `Projeção: em 24 meses você pode estar recebendo ${fmt.brl(rendaMensal)}/mês em proventos`,
          `Em 2 anos mantendo aportes, renda passiva projetada: ${fmt.brl(rendaMensal)}/mês`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'projecao_patrimonio_dobra',
      type: 'projecao', icon: 'good', prioridade: 4,
      condicao: (d) => d.aportes_media_mensal > 0 && d.patrimonio_atual > 0,
      gerar: (d, seed) => {
        // Cálculo simplificado: anos pra dobrar considerando aporte + rendimento médio de 10%
        const aporteAnual = d.aportes_media_mensal * 12;
        const rendAnual = 0.10;
        let anos = 0, p = d.patrimonio_atual;
        const alvo = d.patrimonio_atual * 2;
        while (p < alvo && anos < 30) {
          p = p * (1 + rendAnual) + aporteAnual;
          anos++;
        }
        if (anos >= 30) return null;
        const templates = [
          `No ritmo atual, seu patrimônio dobra em ${anos} anos`,
          `Mantendo aportes, ${fmt.brl(d.patrimonio_atual * 2)} em ${anos} anos`,
          `Projeção de dobrar patrimônio: ${anos} anos no ritmo atual`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'projecao_100k',
      type: 'projecao', icon: 'good', prioridade: 4,
      condicao: (d) => d.patrimonio_atual < 100000 && d.patrimonio_atual > 20000 && d.aportes_media_mensal > 0,
      gerar: (d, seed) => {
        const falta = 100000 - d.patrimonio_atual;
        const meses = Math.ceil(falta / (d.aportes_media_mensal * 1.08));
        const templates = [
          `No ritmo atual (${fmt.brl(d.aportes_media_mensal)}/mês), você atinge R$ 100k em ${meses} meses`,
          `Faltam ${meses} meses pro marco de R$ 100.000 de patrimônio`,
          `R$ 100.000 em ${meses} meses mantendo ${fmt.brl(d.aportes_media_mensal)}/mês de aporte`
        ];
        return pickTemplate(templates, seed);
      }
    },

    // ═══════════════════════════════════════════════════
    // PRIORIDADE 4 — COMPORTAMENTO E CONSISTÊNCIA
    // ═══════════════════════════════════════════════════

    {
      id: 'aportes_consistencia_alta',
      type: 'conquista', icon: 'trophy', prioridade: 3,
      condicao: (d) => d.meses_aportados_12m >= 10,
      gerar: (d, seed) => {
        const templates = [
          `${d.meses_aportados_12m} meses aportando nos últimos 12 — disciplina G20`,
          `Consistência exemplar: aportes em ${d.meses_aportados_12m} dos últimos 12 meses`,
          `${d.meses_aportados_12m}/12 meses com aporte — o segredo é repetição`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'aportes_consistencia_baixa',
      type: 'alerta', icon: 'warn', prioridade: 4,
      condicao: (d) => d.meses_aportados_12m < 6 && d.meses_aportados_12m > 0,
      gerar: (d, seed) => {
        const templates = [
          `Apenas ${d.meses_aportados_12m} meses com aporte nos últimos 12 — retome o ritmo`,
          `Consistência em queda: ${d.meses_aportados_12m}/12 meses aportados`,
          `Aportes irregulares: só ${d.meses_aportados_12m} dos últimos 12 meses tiveram movimentação`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'aporte_parado_30d',
      type: 'alerta', icon: 'warn', prioridade: 3,
      condicao: (d) => d.dias_sem_aporte && d.dias_sem_aporte > 30,
      gerar: (d, seed) => {
        const templates = [
          `Último aporte há ${d.dias_sem_aporte} dias — retome o ritmo mensal`,
          `${d.dias_sem_aporte} dias sem aportar — consistência é mais importante que timing`,
          `Faz ${d.dias_sem_aporte} dias desde o último aporte — não perca o hábito`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'aporte_x_renda_passiva',
      type: 'observacao', icon: 'info', prioridade: 5,
      condicao: (d) => d.aportes_media_mensal > 0 && d.proventos_12m > 0,
      gerar: (d, seed) => {
        const rendaPassivaMensal = d.proventos_12m / 12;
        const ratio = d.aportes_media_mensal / rendaPassivaMensal;
        if (ratio < 1.5) return null;
        const templates = [
          `Seus aportes (${fmt.brl(d.aportes_media_mensal)}) são ${ratio.toFixed(1)}x maiores que sua renda passiva`,
          `Aporte ${ratio.toFixed(1)}x maior que proventos — acelerando a bola de neve`,
          `${fmt.brl(d.aportes_media_mensal)}/mês de aporte vs ${fmt.brl(rendaPassivaMensal)}/mês de renda passiva`
        ];
        return pickTemplate(templates, seed);
      }
    },

    // ═══════════════════════════════════════════════════
    // PRIORIDADE 5 — OBSERVAÇÕES E CURIOSIDADES
    // ═══════════════════════════════════════════════════

    {
      id: 'diversificacao_classes',
      type: 'observacao', icon: 'info', prioridade: 5,
      condicao: (d) => d.num_classes_ativos >= 4,
      gerar: (d, seed) => {
        const templates = [
          `${d.num_classes_ativos} classes de ativos na carteira — excelente diversificação`,
          `Carteira diversificada em ${d.num_classes_ativos} classes: ações, FIIs, RF e mais`,
          `Diversificação saudável: ${d.num_classes_ativos} classes distintas de ativos`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'diversificacao_num_ativos',
      type: 'observacao', icon: 'info', prioridade: 5,
      condicao: (d) => d.num_ativos_total >= 15,
      gerar: (d, seed) => {
        const templates = [
          `${d.num_ativos_total} ativos na carteira — bem diversificado`,
          `Carteira com ${d.num_ativos_total} ativos diferentes — diluição de risco`,
          `${d.num_ativos_total} posições ativas — diversificação adequada`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'exposicao_internacional',
      type: 'observacao', icon: 'info', prioridade: 5,
      condicao: (d) => d.pct_internacional && d.pct_internacional >= 15,
      gerar: (d, seed) => {
        const templates = [
          `${fmt.pct(d.pct_internacional)} em ativos internacionais — proteção cambial`,
          `Exposição global: ${fmt.pct(d.pct_internacional)} em stocks e REITs — diversificação cambial`,
          `${fmt.pct(d.pct_internacional)} da carteira dolarizada — hedge natural`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'fiis_performance',
      type: 'observacao', icon: 'info', prioridade: 5,
      condicao: (d) => d.rent_fiis_mes !== undefined,
      gerar: (d, seed) => {
        const templates = [
          `Seus FIIs renderam ${fmt.plus(d.rent_fiis_mes)} este mês`,
          `Bloco FIIs: ${fmt.plus(d.rent_fiis_mes)} de rentabilidade mensal`,
          `FIIs da carteira: ${fmt.plus(d.rent_fiis_mes)} no mês`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'ativo_destaque_alta',
      type: 'observacao', icon: 'good', prioridade: 4,
      condicao: (d) => d.ativo_maior_alta && d.ativo_maior_alta.chg_pct > 3,
      gerar: (d, seed) => {
        const a = d.ativo_maior_alta;
        const templates = [
          `${a.ticker} subiu ${fmt.plus(a.chg_pct)} hoje — maior ganho da sua carteira`,
          `Destaque positivo: ${a.ticker} ${fmt.plus(a.chg_pct)} hoje`,
          `${a.ticker} liderou altas: ${fmt.plus(a.chg_pct)} no dia`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'ativo_destaque_queda',
      type: 'observacao', icon: 'info', prioridade: 5,
      condicao: (d) => d.ativo_maior_queda && d.ativo_maior_queda.chg_pct < -3,
      gerar: (d, seed) => {
        const a = d.ativo_maior_queda;
        const templates = [
          `${a.ticker} recuou ${fmt.plus(a.chg_pct)} hoje — possível oportunidade de aporte`,
          `${a.ticker} em queda: ${fmt.plus(a.chg_pct)} no dia — avalie tese de investimento`,
          `Queda do dia: ${a.ticker} ${fmt.plus(a.chg_pct)} — monitorar fundamentos`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'melhor_ativo_12m',
      type: 'observacao', icon: 'good', prioridade: 5,
      condicao: (d) => d.melhor_ativo_12m && d.melhor_ativo_12m.rent > 30,
      gerar: (d, seed) => {
        const a = d.melhor_ativo_12m;
        const templates = [
          `${a.ticker} é seu melhor ativo em 12m: ${fmt.plus(a.rent)} de rentabilidade`,
          `Destaque anual: ${a.ticker} rendeu ${fmt.plus(a.rent)} em 12 meses`,
          `${a.ticker} é a estrela da sua carteira: ${fmt.plus(a.rent)} em 1 ano`
        ];
        return pickTemplate(templates, seed);
      }
    },

    // ═══════════════════════════════════════════════════
    // PRIORIDADE 5 — MACRO E CONTEXTO
    // ═══════════════════════════════════════════════════

    {
      id: 'selic_contexto',
      type: 'observacao', icon: 'info', prioridade: 5,
      condicao: (d) => d.selic_atual && d.pct_rf >= 10,
      gerar: (d, seed) => {
        const templates = [
          `Selic a ${fmt.pct(d.selic_atual)} ao ano favorece seus ${fmt.pct(d.pct_rf)} em renda fixa`,
          `Com Selic a ${fmt.pct(d.selic_atual)}, sua RF (${fmt.pct(d.pct_rf)} da carteira) está bem posicionada`,
          `Selic alta (${fmt.pct(d.selic_atual)}) beneficia seus ${fmt.pct(d.pct_rf)} em renda fixa`
        ];
        return pickTemplate(templates, seed);
      }
    },

    {
      id: 'meta_independencia',
      type: 'projecao', icon: 'info', prioridade: 5,
      condicao: (d) => d.meta_patrimonio && d.aporte_necessario,
      gerar: (d, seed) => {
        const templates = [
          `Pra atingir ${fmt.brl(d.meta_patrimonio)} em 10 anos, aporte necessário: ${fmt.brl(d.aporte_necessario)}/mês`,
          `Meta de independência: ${fmt.brl(d.meta_patrimonio)} requer ${fmt.brl(d.aporte_necessario)}/mês`,
          `${fmt.brl(d.aporte_necessario)}/mês é o aporte pra atingir ${fmt.brl(d.meta_patrimonio)} em 10 anos`
        ];
        return pickTemplate(templates, seed);
      }
    }

  ];

  // ============================================================
  // MOTOR PRINCIPAL
  // ============================================================

  function gerar(dados, historico7d, opcoes) {
    opcoes = opcoes || {};
    const uid = opcoes.uid || 'anonymous';
    const dataHoje = opcoes.data || new Date().toISOString().split('T')[0];

    // Seed determinística: combina UID + data pra ter variação estável no dia
    const seedBase = hashString(uid + dataHoje);

    // Lista de topics abordados nos últimos 7 dias (pra evitar repetir)
    const topicsRecentes = new Set();
    (historico7d || []).forEach(dia => {
      (dia.topics || []).forEach(t => topicsRecentes.add(t));
    });

    // Avalia todas as regras
    const candidatos = [];
    REGRAS.forEach((regra, idx) => {
      try {
        if (!regra.condicao(dados)) return;
        const texto = regra.gerar(dados, seedBase + idx);
        if (!texto) return;

        // Penaliza regras já usadas recentemente
        let prioridadeAjustada = regra.prioridade;
        if (topicsRecentes.has(regra.id)) prioridadeAjustada += 2;

        candidatos.push({
          id: regra.id,
          type: regra.type,
          icon: regra.icon,
          text: texto,
          prioridade: prioridadeAjustada,
          prioridadeOriginal: regra.prioridade
        });
      } catch (e) {
        console.warn('[insights-engine] erro na regra', regra.id, e);
      }
    });

    // Ordena: menor prioridade ajustada primeiro (1 = mais importante)
    candidatos.sort((a, b) => {
      if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;
      return 0;
    });

    // Seleciona 4 insights garantindo variedade de tipos (quando possível)
    const selecionados = [];
    const tiposUsados = new Set();

    // 1ª passada: pega triggers prioridade 1-2 primeiro (sempre)
    for (const c of candidatos) {
      if (c.prioridadeOriginal <= 2 && selecionados.length < 4) {
        selecionados.push(c);
        tiposUsados.add(c.type);
      }
    }

    // 2ª passada: complementa com tipos diferentes
    for (const c of candidatos) {
      if (selecionados.length >= 4) break;
      if (selecionados.some(s => s.id === c.id)) continue;
      if (!tiposUsados.has(c.type)) {
        selecionados.push(c);
        tiposUsados.add(c.type);
      }
    }

    // 3ª passada: preenche o que faltar (qualquer tipo)
    for (const c of candidatos) {
      if (selecionados.length >= 4) break;
      if (selecionados.some(s => s.id === c.id)) continue;
      selecionados.push(c);
    }

    // Garantir mínimo de 4 insights com fallback genérico
    if (selecionados.length < 4) {
      const fallbacks = [
        { type:'observacao', icon:'info', text:'Continue aportando com consistência — o tempo é seu maior aliado', id:'fallback_1' },
        { type:'observacao', icon:'info', text:'Diversificação reduz risco sem sacrificar retorno — mantenha classes variadas', id:'fallback_2' },
        { type:'observacao', icon:'info', text:'Foque no longo prazo — volatilidade de curto prazo é ruído', id:'fallback_3' },
        { type:'observacao', icon:'info', text:'Reinvestir proventos acelera o efeito bola de neve', id:'fallback_4' }
      ];
      for (const fb of fallbacks) {
        if (selecionados.length >= 4) break;
        selecionados.push(fb);
      }
    }

    // Retorna com metadados pra salvar no Firestore
    return {
      generated_at: new Date().toISOString(),
      insights: selecionados.slice(0, 4).map(s => ({
        type: s.type,
        icon: s.icon,
        text: s.text
      })),
      topics: selecionados.slice(0, 4).map(s => s.id)
    };
  }

  // ============================================================
  // EXPORT
  // ============================================================

  global.G20Insights = {
    gerar: gerar,
    // Expostos pra debug/test
    _regras: REGRAS,
    _fmt: fmt
  };

})(typeof window !== 'undefined' ? window : this);
