// assets/frases-diarias.js
// Banco de frases rotativas para o Dashboard G20
// Rotação baseada em dayOfYear (1-365/366)
// Cada frase = { texto, autor, contexto (opcional) }

window.FRASES_G20 = [
  // MESTRES DO VALOR
  { texto: "O tempo no mercado vale mais que o tempo do mercado.", autor: "Warren Buffett", contexto: "Carta anual, 1996" },
  { texto: "Regra nº 1: nunca perca dinheiro. Regra nº 2: nunca se esqueça da regra nº 1.", autor: "Warren Buffett" },
  { texto: "Seja temeroso quando os outros forem gananciosos, e ganancioso quando os outros forem temerosos.", autor: "Warren Buffett", contexto: "Carta, 2004" },
  { texto: "O mercado é um dispositivo para transferir dinheiro do impaciente para o paciente.", autor: "Warren Buffett" },
  { texto: "Investir é simples, mas não é fácil.", autor: "Warren Buffett" },
  { texto: "Risco vem de não saber o que você está fazendo.", autor: "Warren Buffett" },
  { texto: "O mercado de ações é um lugar onde as pessoas transferem dinheiro dos ativos para os pacientes.", autor: "Warren Buffett" },
  { texto: "Preço é o que você paga. Valor é o que você leva.", autor: "Warren Buffett", contexto: "Parafraseando Graham" },

  // CHARLIE MUNGER
  { texto: "Uma grande empresa comprada a um preço justo é muito melhor do que uma empresa justa comprada a um preço excelente.", autor: "Charlie Munger" },
  { texto: "A grande vantagem de investir é que o tempo trabalha a seu favor se você for paciente o suficiente.", autor: "Charlie Munger" },
  { texto: "O grande dinheiro não está na compra ou na venda, mas na espera.", autor: "Charlie Munger" },
  { texto: "Mostre-me os incentivos e eu te mostro o resultado.", autor: "Charlie Munger", contexto: "Poor Charlie's Almanack" },

  // BENJAMIN GRAHAM
  { texto: "O investidor inteligente é um realista que vende para otimistas e compra de pessimistas.", autor: "Benjamin Graham", contexto: "O Investidor Inteligente" },
  { texto: "Na maioria das vezes, as ações estão sujeitas a flutuações irracionais e excessivas de preço.", autor: "Benjamin Graham" },
  { texto: "A inteligência humana é frequentemente desarmada pela emoção.", autor: "Benjamin Graham" },
  { texto: "O investidor defensivo deve contentar-se com um retorno medíocre, mas seguro.", autor: "Benjamin Graham" },

  // PETER LYNCH
  { texto: "Nas ações, como no amor, é preciso primeiro entender, depois se comprometer.", autor: "Peter Lynch" },
  { texto: "O órgão mais importante para investir não é o cérebro, é o estômago.", autor: "Peter Lynch" },
  { texto: "Muito dinheiro se perde em antecipação a correções do que nas próprias correções.", autor: "Peter Lynch" },
  { texto: "Invista no que você conhece.", autor: "Peter Lynch", contexto: "One Up on Wall Street" },

  // BRASILEIROS
  { texto: "Não invista para ficar rico. Invista para não ficar pobre quando ficar velho.", autor: "Luiz Barsi" },
  { texto: "O segredo é comprar boas empresas pagadoras de dividendos e nunca vender.", autor: "Luiz Barsi" },
  { texto: "Quem não sabe onde quer chegar, qualquer caminho serve.", autor: "Luiz Barsi" },
  { texto: "Viver de dividendos não é sorte. É consequência de décadas de disciplina.", autor: "Luiz Barsi" },
  { texto: "Todo investidor sério precisa entender que o mercado recompensa a paciência e pune a pressa.", autor: "Florian Bartunek", contexto: "Constellation Investimentos" },
  { texto: "A melhor forma de prever o futuro é construí-lo. Investir é construir seu futuro financeiro.", autor: "Luis Stuhlberger", contexto: "Verde Asset" },

  // MACRO / TRADING
  { texto: "O mercado pode permanecer irracional por mais tempo do que você pode permanecer solvente.", autor: "John Maynard Keynes" },
  { texto: "Não é o que você ganha, é o que você mantém.", autor: "Robert Kiyosaki" },
  { texto: "Assuma grandes riscos só quando as probabilidades estão a seu favor.", autor: "George Soros" },
  { texto: "Não se trata de estar certo ou errado, mas de quanto você ganha quando está certo e quanto perde quando está errado.", autor: "George Soros" },
  { texto: "Diversifique bem. Não coloque todos os ovos numa cesta só.", autor: "Ray Dalio", contexto: "Principles" },
  { texto: "Dor mais reflexão é igual a progresso.", autor: "Ray Dalio", contexto: "Principles" },
  { texto: "O risco vem de não saber o que você está fazendo. Se você sabe, não há risco.", autor: "Howard Marks", contexto: "Oaktree Memo" },
  { texto: "O preço é o que você paga. O retorno depende do preço que você pagou.", autor: "Howard Marks" },

  // FILOSOFIA
  { texto: "A simplicidade é a sofisticação máxima.", autor: "John Bogle", contexto: "Vanguard Group" },
  { texto: "Não procure a agulha no palheiro. Compre o palheiro inteiro.", autor: "John Bogle", contexto: "Sobre ETFs indexados" },
  { texto: "A ausência de evidência não é evidência de ausência.", autor: "Nassim Taleb", contexto: "Antifrágil" },
  { texto: "Os cisnes negros são imprevisíveis, mas o que não é imprevisível é a sua existência.", autor: "Nassim Taleb" },

  // JORNADA / DISCIPLINA
  { texto: "Juros compostos são a oitava maravilha do mundo. Quem entende, ganha. Quem não entende, paga.", autor: "Albert Einstein", contexto: "Atribuída" },
  { texto: "O melhor momento para plantar uma árvore foi há 20 anos. O segundo melhor momento é agora.", autor: "Provérbio chinês" },
  { texto: "Não se preocupe com o preço das ações no dia-a-dia. Preocupe-se com o negócio por trás delas.", autor: "Warren Buffett" }
];

/**
 * Retorna a frase do dia baseado no dia do ano (1-365/366).
 * Usa módulo pra caso tenha menos frases que dias no ano.
 */
window.getFraseDoDia = function() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const idx = dayOfYear % window.FRASES_G20.length;
  return window.FRASES_G20[idx];
};
