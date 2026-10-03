/* ═══════════════════════════════════════════════════════════════════════
   CENTRAL DE AJUDA · CONTEÚDO
   Todo o texto e a lista de prints da ajuda.html moram aqui.

   COMO ATUALIZAR
   - Mudou o visual de uma página: troque só os prints da pasta
     assets/ajuda/<secao>/ mantendo os mesmos nomes. Este arquivo nem muda.
   - Mudou um passo ou entrou função nova: edite o passo da seção aqui.
   - Página nova: acrescente uma seção na lista SECOES.
   - Recursos "Em breve" (com cadeado) NÃO entram aqui até serem lançados.

   Cada passo: { img, titulo, texto }   (img é opcional)
   Celular × computador: imgPc = print do computador (sem ele, usa o do celular);
   pc = { titulo, texto, img } troca o passo inteiro no computador;
   so: 'cel' ou so: 'pc' = o passo só aparece naquela versão.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  var P = 'assets/ajuda/';

  window.G20_AJUDA = {
    versao: '2026-10-03c',

    secoes: [

      /* ── PRIMEIROS PASSOS ─────────────────────────────────────────── */
      {
        id: 'primeiros-passos', ico: '🚀', titulo: 'Primeiros passos',
        resumo: 'Do primeiro acesso até a plataforma liberada, em poucos minutos.',
        passos: [
          { img: P+'primeiros-passos/ini01-boas-vindas.webp', titulo: 'A mensagem de boas-vindas',
            texto: 'No primeiro acesso aparece uma mensagem do Israel. Leia com calma e toque em <b>“Conhecer a Plataforma G20”</b>. Ela aparece uma vez só.' },
          { img: P+'primeiros-passos/ini02-termos.webp', titulo: 'Os Termos de Uso',
            texto: 'Leia os termos, marque as <b>duas caixinhas</b> e toque em <b>“Aceitar e continuar”</b>. Sem o aceite não é possível usar a plataforma.' },
          { img: P+'primeiros-passos/ini03-tipo-aluno.webp', titulo: 'Já era aluno ou está chegando agora?',
            texto: 'Conte se você já estudava no G20 antes desta plataforma ou se está entrando agora. A plataforma te recebe do jeito certo para cada caso.' },
          { img: P+'primeiros-passos/ini04-boas-vindas-perfil.webp', titulo: 'Hora de montar o seu perfil',
            texto: 'O Israel explica por que o perfil importa. Toque em <b>“Bora começar”</b> (ou “Vamos lá”, se você já era aluno).' },
          { img: P+'primeiros-passos/ini05-dica-israel.webp', titulo: 'As dicas do Israel',
            texto: 'Em cada parte do perfil aparece uma dica explicando o que pedir e por quê. Leia e toque no botão para seguir.' },
          { img: P+'primeiros-passos/ini06-campos-obrigatorios.webp', titulo: 'Os campos obrigatórios (★)',
            texto: 'Os campos com <b>★</b> liberam a plataforma. São eles: nome completo, data de nascimento, cidade, estado, renda mensal, patrimônio atual, quanto investe por mês, experiência em investimentos, meta financeira, disponibilidade semanal, o que você espera da jornada no G20, profissão, área de atuação e WhatsApp.<br><br>No campo <b>“O que você espera da jornada no G20”</b>, escreva pelo menos 60 caracteres. É onde muita gente trava.' },
          { img: P+'primeiros-passos/ini07-perfil-completo.webp', titulo: 'Perfil completo!',
            texto: 'Quando todos os campos com ★ estiverem preenchidos e você salvar, aparece esta tela. Toque em <b>“Acessar a Plataforma G20”</b> e pronto: a plataforma inteira está liberada.' }
        ]
      },

      /* ── INSTALAR O APP ───────────────────────────────────────────── */
      {
        id: 'app', ico: '📱', titulo: 'Instalar o app no celular',
        resumo: 'A plataforma vira um app na tela inicial, sem loja de aplicativos.',
        passos: [
          { titulo: 'No iPhone',
            texto: 'Abra a plataforma no <b>Safari</b>, toque no botão <b>Compartilhar</b> (o quadrado com a seta para cima) e escolha <b>“Adicionar à Tela de Início”</b>.' },
          { titulo: 'No Android',
            texto: 'Abra a plataforma no <b>Chrome</b>, toque nos <b>três pontinhos</b> no canto de cima e escolha <b>“Instalar app”</b> (ou “Adicionar à tela inicial”).' },
          { titulo: 'Abriu pelo WhatsApp ou Instagram?',
            texto: 'Links abertos dentro desses apps usam um navegador limitado, que pode travar o login. Toque nos três pontinhos e escolha <b>“Abrir no navegador”</b> antes de instalar.' }
        ]
      },

      /* ── MEU PERFIL ───────────────────────────────────────────────── */
      {
        id: 'meu-perfil', ico: '👤', titulo: 'Meu Perfil',
        resumo: 'Sua nota de 0 a 100, como melhorar, os alertas e o Face ID.',
        passos: [
          { img: P+'meu-perfil/perf01-pontuacao.webp', titulo: 'A nota do seu perfil',
            texto: 'No topo do Meu Perfil fica a <b>nota do seu perfil, de 0 a 100</b>, com estrelas. Ela mede a qualidade do perfil, e não só se os campos obrigatórios estão preenchidos. Só você vê a sua nota. No celular, o cartão da nota aparece logo no início da página.' },
          { img: P+'meu-perfil/perf02-como-melhorar.webp', titulo: 'Como chegar a 100',
            texto: 'Embaixo da nota aparecem as <b>dicas que mais sobem a sua nota</b>, cada uma com os pontos que vale (ex.: “Adicione uma foto de perfil +10”). Toque na dica para ir direto à parte certa.<br><br>Contam ponto: a foto, os dados pessoais, a Vida Financeira completa (inclusive os campos opcionais), o “O que você espera do G20” e o “Sobre mim” escritos de verdade (algumas frases), a profissão, pelo menos uma rede social, hobbies, o cartão do Networking ativado e o login com Face ID.' },
          { img: P+'meu-perfil/perf04-dividas.webp', titulo: 'Suas dívidas',
            texto: 'Em <b>Vida Financeira</b>, a pergunta “Como estão suas dívidas hoje?” tem opções para cada situação, de <b>“Não tenho nenhuma dívida”</b> até “As dívidas são meu maior problema hoje”. Dívidas caras são as de cartão de crédito, cheque especial e empréstimo pessoal. Essa resposta é só sua e do Israel: não aparece no Networking.' },
          { img: P+'meu-perfil/perf05-alertas.webp', titulo: 'Os alertas do sino',
            texto: 'Em <b>Acesso e Alertas</b> você escolhe quais avisos quer receber no sino. O alerta <b>🧾 Finanças</b> avisa das contas que vencem hoje ou amanhã e quando uma categoria do orçamento chega a 80% ou estoura. Desligou, ele para de avisar.' },
          { img: P+'meu-perfil/perf03-face-id.webp', titulo: 'Entrar com Face ID',
            texto: 'Em <b>Acesso e Alertas</b>, toque em <b>“Ativar Face ID neste aparelho”</b> (no computador com Windows aparece “Windows Hello”). Nos próximos acessos é só tocar em “Entrar com Face ID” na tela de login. Sua biometria nunca sai do aparelho, e cada aparelho é ativado separadamente.' }
        ]
      },

      /* ── DASHBOARD ────────────────────────────────────────────────── */
      {
        id: 'dashboard', ico: '🏠', titulo: 'Dashboard',
        resumo: 'O painel inicial: o tour guiado e o resumo de tudo num lugar só.',
        passos: [
          { img: P+'dashboard/tour01.webp', titulo: 'O tour guiado',
            texto: 'No primeiro acesso ao Dashboard começa um <b>tour guiado</b> pela plataforma. Leia com atenção e toque em <b>“Próximo”</b> a cada passo.' },
          { img: P+'dashboard/tour02.webp', titulo: 'Card por card',
            texto: 'Cada passo do tour destaca um card e explica para que ele serve.' },
          { img: P+'dashboard/tour03-rever.webp', titulo: 'Rever o tour',
            texto: 'Quer ver de novo? Toque no <b>“?”</b> no topo do Dashboard.' },
          { img: P+'dashboard/dash01-navegacao.webp', imgPc: P+'dashboard/pc/dash01-navegacao.webp', titulo: 'Como navegar',
            texto: 'No celular, use a <b>barra de baixo</b> para as páginas principais ou o menu <b>☰</b> no canto de cima para ver todas.' },
          { img: P+'dashboard/dash02-cardgp.webp', imgPc: P+'dashboard/pc/dash02-cardgp.webp', titulo: 'Minha Carteira',
            texto: 'O seu patrimônio total e a evolução nos últimos dias.' },
          { img: P+'dashboard/dash03-carddesempenho.webp', imgPc: P+'dashboard/pc/dash03-carddesempenho.webp', titulo: 'Desempenho',
            texto: 'Quanto a sua carteira rendeu hoje, na semana, no mês, no ano e em 5 anos.' },
          { img: P+'dashboard/dash04-cardagenda.webp', imgPc: P+'dashboard/pc/dash04-cardagenda.webp', titulo: 'Agenda de proventos',
            texto: 'O que você tem para receber nos próximos dias, ativo por ativo.' },
          { img: P+'dashboard/dash05-metaif.webp', imgPc: P+'dashboard/pc/dash05-metaif.webp', titulo: 'Independência financeira',
            texto: 'Toque no <b>lápis</b> e defina a sua meta. O card passa a mostrar quanto você já percorreu.' },
          { img: P+'dashboard/dash06-gfcard.webp', imgPc: P+'dashboard/pc/dash06-gfcard.webp', titulo: 'Gestão Financeira',
            texto: 'O resumo do seu mês: quanto entrou, quanto saiu e quanto sobrou para investir.' },
          { img: P+'dashboard/dash08-gamecard.webp', imgPc: P+'dashboard/pc/dash08-gamecard.webp', titulo: 'Game G20',
            texto: 'A sua posição no ranking da turma, direto no Dashboard.' },
          { img: P+'dashboard/dash07-castcard.webp', imgPc: P+'dashboard/pc/dash07-castcard.webp', titulo: 'G20Cast',
            texto: 'O episódio do dia a um toque.' }
        ]
      },

      /* ── MINHA CARTEIRA ───────────────────────────────────────────── */
      {
        id: 'minha-carteira', ico: '💰', titulo: 'Minha Carteira',
        resumo: 'Traga a sua carteira da plataforma antiga e acompanhe tudo num lugar só.',
        passos: [
          { img: P+'minha-carteira/cart01-importar.webp', imgPc: P+'minha-carteira/pc/cart01-importar.webp', titulo: 'Importar a carteira',
            texto: 'Na Minha Carteira, toque em <b>“Importar”</b>. Se não aparecer, arraste a barra de abas para o lado.' },
          { img: P+'minha-carteira/cart02-plataforma-antiga.webp', imgPc: P+'minha-carteira/pc/cart02-plataforma-antiga.webp', titulo: 'Escolha a origem',
            texto: 'Usava a plataforma antiga do G20? Escolha <b>“Plataforma antiga”</b>. Usa Status Invest ou MyProfit? Escolha a sua opção e siga o passo a passo da tela.' },
          { img: P+'minha-carteira/cart10-status-invest.webp', imgPc: P+'minha-carteira/pc/cart10-status-invest.webp', titulo: 'Vindo do Status Invest',
            texto: 'No <b>computador</b>, abra o Status Invest, entre em <b>Carteira › Transações</b> e, embaixo da tabela, troque o <b>10</b> por <b>Todos</b>. Clique em qualquer parte da página, aperte <b>Ctrl + A</b> e depois <b>Ctrl + C</b>. Volte para a plataforma, clique no quadro e aperte <b>Ctrl + V</b>.<br><br>Não tem acesso à aba Transações? Faça o mesmo na tela <b>Posição na Carteira</b>: cada ativo entra como uma compra pelo preço médio, com a data de hoje (sem o histórico de compras e vendas).<br><br>Colou de novo depois? A plataforma avisa que você já importou e traz só o que for novo, sem duplicar.' },
          { img: P+'minha-carteira/cart03-login-antigo.webp', titulo: 'O login da plataforma antiga',
            texto: 'Digite o <b>e-mail e a senha que você usava na plataforma ANTIGA</b> e toque em “Buscar minha carteira”. Essa senha é usada só para buscar a carteira e <b>não fica gravada</b> em lugar nenhum.' },
          { img: P+'minha-carteira/cart04-previa.webp', titulo: 'Confira e importe',
            texto: 'Aparece uma prévia com todas as compras e vendas. Confira e toque em <b>“Importar”</b>. O que já existir na sua carteira não é duplicado. Desdobramentos, grupamentos e proventos a Minha Carteira calcula sozinha.' },
          { img: P+'minha-carteira/cart05-visao-geral.webp', imgPc: P+'minha-carteira/pc/cart05-visao-geral.webp', titulo: 'Visão Geral',
            texto: 'O seu patrimônio total, a variação do dia e a divisão entre renda variável, renda fixa e bens.' },
          { img: P+'minha-carteira/cart06-renda-passiva.webp', imgPc: P+'minha-carteira/pc/cart06-renda-passiva.webp', titulo: 'Renda passiva',
            texto: 'Os proventos dos últimos 12 meses, mês a mês, e os próximos pagamentos.' },
          { img: P+'minha-carteira/cart07-transacoes.webp', imgPc: P+'minha-carteira/pc/cart07-transacoes.webp', titulo: 'Transações',
            texto: 'Todas as suas compras e vendas. Depois de importar, <b>confira se as quantidades e o preço médio batem com a sua corretora</b>.' },
          { img: P+'minha-carteira/cart08-proventos.webp', imgPc: P+'minha-carteira/pc/cart08-proventos.webp', titulo: 'Proventos',
            texto: 'Dividendos, JCP e rendimentos recebidos e a receber, com totais e média mensal.' },
          { img: P+'minha-carteira/cart11-quem-pagou.webp', imgPc: P+'minha-carteira/pc/cart11-quem-pagou.webp', titulo: 'Quem pagou em cada mês',
            texto: 'Na aba Proventos, a tabela <b>Quem pagou</b> mostra cada ativo mês a mês. Busque um ativo pelo nome, ordene por maior total ou de A a Z, e toque em <b>Todos</b> para ver, ano a ano, quanto cada ativo já pagou desde o início.' },
          { img: P+'minha-carteira/cart09-adicionar.webp', imgPc: P+'minha-carteira/pc/cart09-adicionar.webp', titulo: 'Lançar algo novo',
            texto: 'Comprou ou recebeu algo? Toque no <b>“+”</b> e escolha: aporte em ações e FIIs, renda fixa, bem patrimonial ou provento.' }
        ]
      },

      /* ── GESTÃO FINANCEIRA ────────────────────────────────────────── */
      {
        id: 'gestao-financeira', ico: '🧾', titulo: 'Gestão Financeira',
        resumo: 'Receitas, despesas, cartão de crédito, orçamento e o saldo real da sua conta.',
        passos: [
          { img: P+'gestao-financeira/gf08-primeiros-passos.webp', imgPc: P+'gestao-financeira/pc/gf08-primeiros-passos.webp', titulo: 'Primeiros passos',
            texto: 'Começando agora? O cartão <b>Primeiros passos</b> mostra o que falta para a Gestão Financeira ficar pronta: definir o saldo inicial, cadastrar os cartões, lançar a primeira receita, a primeira despesa e criar o primeiro orçamento. Cada passo se marca sozinho quando você faz. Não se aplica a você? Use <b>“Não tenho saldo agora”</b>, <b>“Não uso cartão”</b> ou <b>“Depois”</b>. Quando tudo estiver pronto, o cartão some.' },
          { img: P+'gestao-financeira/gf01-periodo.webp', imgPc: P+'gestao-financeira/pc/gf01-periodo.webp', titulo: 'Escolha o período',
            texto: 'A página sempre abre no <b>mês atual</b>. Toque em outro mês, nos atalhos (últimos 3 ou 6 meses, ano todo) ou, no celular, <b>toque e segure</b> um mês para escolher vários.' },
          { img: P+'gestao-financeira/gf02-resumo.webp', imgPc: P+'gestao-financeira/pc/gf02-resumo.webp', titulo: 'Saldo, Receitas e Despesas',
            texto: '<b>Saldo do mês</b>: receitas menos despesas, com o anel da sua taxa de economia e a comparação com o mês anterior. <b>Receitas</b>: com uma barra mostrando como o mês está em relação à sua média. <b>Despesas</b>: quanto da receita foi gasto e quanto do orçamento já foi usado.' },
          { img: P+'gestao-financeira/gf09-saldo-inicial.webp', imgPc: P+'gestao-financeira/pc/gf09-saldo-inicial.webp', titulo: 'Saldo da conta (saldo inicial)',
            texto: 'No card do Saldo, toque em <b>“Definir saldo inicial”</b> e informe quanto você tinha na conta no dia em que começou a registrar (aceita zero e valor negativo). Ele <b>não conta como receita</b>: serve para a plataforma mostrar <b>“Na conta”</b>, o saldo real de hoje, e para o gráfico da evolução do saldo partir do valor certo.' },
          { img: P+'gestao-financeira/gf10-a-vencer.webp', imgPc: P+'gestao-financeira/pc/gf10-a-vencer.webp', titulo: 'Contas a vencer',
            texto: 'No card das Despesas, <b>“A vencer 7d”</b> mostra quanto sai da conta nos próximos 7 dias. Toque para ver a lista. As compras no cartão aparecem juntas como uma conta só, a <b>fatura</b>, no dia do vencimento. O sino também avisa na véspera e no dia.' },
          { img: P+'gestao-financeira/gf04-lancar.webp', imgPc: P+'gestao-financeira/pc/gf04-lancar.webp', titulo: 'Lançar uma entrada ou saída',
            texto: 'Preencha a data, a descrição, o valor, toque em <b>− Saída</b> ou <b>+ Entrada</b>, escolha a forma de pagamento e a categoria, e toque em <b>“Lançar”</b>. Lançou a mesma descrição antes? A categoria e a forma de pagamento vêm sozinhas. Gasto que se repete ou parcelado? Marque <b>“Repetir / parcelar”</b>.<br><br>No celular, o botão dourado <b>＋</b> no canto da tela leva direto ao lançamento.' },
          { img: P+'gestao-financeira/gf11-cartao.webp', imgPc: P+'gestao-financeira/pc/gf11-cartao.webp', titulo: 'Cartão de crédito',
            texto: 'Toque na engrenagem ao lado de <b>Forma de pagamento</b> e no <b>💳</b> do seu cartão para informar o <b>dia do fechamento</b> e o <b>dia do vencimento</b>. A partir daí, cada compra no cartão conta no dia da compra (no orçamento e nas categorias), mas só <b>sai da sua conta no vencimento da fatura</b>. Ao escolher o cartão no lançamento, a plataforma mostra em que dia ele sai da conta.' },
          { img: P+'gestao-financeira/gf12-pago-em-outra-data.webp', imgPc: P+'gestao-financeira/pc/gf12-pago-em-outra-data.webp', titulo: 'Pago em outra data?',
            texto: 'Boleto pago depois, Pix agendado ou conta que só vai sair da conta em outro dia? Ao lançar, toque em <b>“Pago em outra data?”</b> e informe o dia em que o dinheiro sai da conta.' },
          { img: P+'gestao-financeira/gf05-inteligencia.webp', imgPc: P+'gestao-financeira/pc/gf05-inteligencia.webp', titulo: 'Inteligência financeira',
            texto: 'Gráficos que mostram para onde o seu dinheiro está indo. A <b>Evolução do saldo</b> mostra o fluxo de caixa: o saldo da sua conta dia a dia, com o cartão entrando no vencimento. No celular aparecem os 2 principais; toque em <b>“Ver todos os gráficos”</b> para abrir os outros.' },
          { img: P+'gestao-financeira/gf06-orcamento.webp', imgPc: P+'gestao-financeira/pc/gf06-orcamento.webp', titulo: 'Orçamento',
            texto: 'Defina um limite por categoria (ou por tag) e acompanhe quanto já gastou. Com o ano inteiro selecionado, aparece também o limite <b>até o mês atual</b>, para você saber se está dentro do ritmo.' },
          { img: P+'gestao-financeira/gf07-extrato.webp', imgPc: P+'gestao-financeira/pc/gf07-extrato.webp', titulo: 'Extrato',
            texto: 'Todos os lançamentos. A busca encontra por descrição, valor, <b>#tag</b>, categoria ou <b>cartão</b> (ex.: “nubank” mostra tudo o que foi pago no Nubank). O selo <b>∞</b> marca o que se repete sem data de término, e <b>2/10</b> marca a parcela. Toque na linha para ver os detalhes: cartão, quando vence a fatura e quando o dinheiro sai da conta.' },
          { so: 'cel', img: P+'gestao-financeira/gf13-atalhos.webp', titulo: 'Atalhos no celular',
            texto: 'Logo abaixo dos filtros, os atalhos <b>＋ Lançar · Extrato · Gráficos · Orçamento</b> levam direto para cada parte da página, sem precisar rolar.' }
        ]
      },

      /* ── SALA DE AULA ─────────────────────────────────────────────── */
      {
        id: 'sala-de-aula', ico: '🎓', titulo: 'Sala de Aula',
        resumo: 'Os módulos do curso, em ordem, com o seu progresso.',
        passos: [
          { img: P+'sala-de-aula/sa01-modulos.webp', titulo: 'Os módulos',
            texto: 'Os módulos do curso, em ordem. Arraste para o lado para ver todos. A barra mostra quanto você já concluiu.' },
          { img: P+'sala-de-aula/sa02-busca.webp', titulo: 'Busca',
            texto: 'Procure uma aula pelo título ou pelo assunto.' },
          { img: P+'sala-de-aula/sa03-aulas-do-modulo.webp', titulo: 'As aulas do módulo',
            texto: 'Dentro do módulo fica a lista de aulas. As concluídas aparecem com o <b>✓</b>.' },
          { img: P+'sala-de-aula/sa04-concluir.webp', titulo: 'Concluir a aula',
            texto: 'Assista à aula e toque em <b>“Marcar como concluída”</b>. O seu progresso é o mesmo no celular e no computador. Embaixo, a discussão da aula com a turma.' }
        ]
      },

      /* ── G20FLIX ──────────────────────────────────────────────────── */
      {
        id: 'g20flix', ico: '🎬', titulo: 'G20Flix',
        resumo: 'Os vídeos e as lives do G20, por categoria e temporada.',
        passos: [
          { img: P+'g20flix/fx01-destaque.webp', titulo: 'O vídeo em destaque',
            texto: 'O vídeo mais recente fica no topo. Toque para assistir.' },
          { img: P+'g20flix/fx02-categorias.webp', titulo: 'Categorias',
            texto: 'Escolha a categoria no topo: Carteira G20, Mentalidade, LIVEs especiais e outras.' },
          { img: P+'g20flix/fx03-temporadas.webp', titulo: 'Temporadas',
            texto: 'Filtre por temporada (ano) e escolha o episódio.' }
        ]
      },

      /* ── G20CAST ──────────────────────────────────────────────────── */
      {
        id: 'g20cast', ico: '🎧', titulo: 'G20Cast',
        resumo: 'O podcast diário do G20, para ouvir aqui dentro da plataforma.',
        passos: [
          { img: P+'g20cast/cast01-episodio-do-dia.webp', imgPc: P+'g20cast/pc/cast01-episodio-do-dia.webp', titulo: 'O episódio de hoje',
            texto: 'O episódio mais recente fica em destaque no topo. Toque no play para ouvir.' },
          { img: P+'g20cast/cast02-lista.webp', imgPc: P+'g20cast/pc/cast02-lista.webp', titulo: 'A lista de episódios',
            texto: 'Todos os episódios, do mais novo para o mais antigo. A lista mostra onde você <b>parou</b> (ex.: “parou em 9:40”) e os que você já <b>ouviu</b> (✓). Ao voltar para um episódio, ele continua de onde você parou.' },
          { img: P+'g20cast/cast03-busca.webp', imgPc: P+'g20cast/pc/cast03-busca.webp', titulo: 'Busca de episódios',
            texto: 'Procure um episódio por tema ou palavra.' },
          { img: P+'g20cast/cast04-mini-player.webp', titulo: 'O mini player',
            pc: { img: P+'g20cast/pc/cast04-player-pc.webp', titulo: 'O player no episódio',
                  texto: 'No computador, ao clicar num episódio, o player abre dentro dele: play e pausa, a barra de progresso (clique para ir a qualquer ponto), voltar e avançar 10 segundos e a velocidade. Ao voltar para um episódio, ele continua de onde você parou.' },
            texto: 'No celular, enquanto o episódio toca, o <b>mini player</b> fica logo acima da barra de baixo: pausa, voltar e avançar 10 segundos e velocidade. Pode rolar a página à vontade que ele continua ali. Toque no título para abrir o player grande.' },
          { so: 'cel', img: P+'g20cast/cast05-player-grande.webp', titulo: 'O player grande',
            texto: 'A capa, o título e a barra de progresso (arraste para ir a qualquer ponto). No centro, a <b>velocidade</b> (1x, 1.5x ou 2x). Embaixo, voltar e avançar 10 segundos e os botões <b>⏮ episódio anterior</b> e <b>⏭ próximo</b>. Quando um episódio termina, o anterior começa sozinho. Para minimizar, toque na setinha ou arraste para baixo.' },
          { so: 'cel', titulo: 'Com a tela bloqueada',
            texto: 'O áudio continua tocando com a tela bloqueada, e os botões de pausa e de voltar e avançar 10 segundos aparecem na tela de bloqueio. No computador, o player aparece dentro do próprio episódio.' }
        ]
      },

      /* ── BIBLIOTECA ───────────────────────────────────────────────── */
      {
        id: 'biblioteca', ico: '📖', titulo: 'Biblioteca G20',
        resumo: 'Os livros da curadoria do Israel e o seu hábito de leitura.',
        passos: [
          { img: P+'biblioteca/bib01-leitura.webp', titulo: 'Leitura em andamento',
            texto: 'O livro que você está lendo agora e a página em que parou.' },
          { img: P+'biblioteca/bib02-registrar.webp', titulo: 'Registrar leitura',
            texto: 'Leu hoje? Toque em <b>“Registrar leitura”</b> e informe a página. Terminou o livro? Toque em <b>“Marcar como lido”</b>.' },
          { img: P+'biblioteca/bib03-estatisticas.webp', titulo: 'Suas estatísticas',
            texto: 'O seu nível de leitor, a sequência de dias lendo (🔥) e quantos livros você já leu.' }
        ]
      },

      /* ── CARTEIRA G20 ─────────────────────────────────────────────── */
      {
        id: 'carteira-g20', ico: '📊', titulo: 'Carteira G20',
        resumo: 'A carteira educativa do Israel, para acompanhar e aprender.',
        passos: [
          { img: P+'carteira-g20/cg01-resumo.webp', titulo: 'O resumo da carteira',
            texto: 'A Carteira G20 é a carteira <b>educativa</b> do Israel. Aqui você acompanha o patrimônio, o resultado e os proventos dela. Não é recomendação de investimento.' },
          { img: P+'carteira-g20/cg02-abas.webp', titulo: 'Posições, gráficos e transações',
            texto: 'Use as abas para ver as posições, os gráficos e as transações da carteira.' }
        ]
      },

      /* ── GAME G20 ─────────────────────────────────────────────────── */
      {
        id: 'game-g20', ico: '🏆', titulo: 'Game G20',
        resumo: 'Monte uma carteira e dispute o ranking com a turma.',
        passos: [
          { img: P+'game-g20/game01-posicao.webp', titulo: 'Sua posição',
            texto: 'A sua posição nos três rankings: mensal, trimestral e anual.' },
          { img: P+'game-g20/game02-ranking.webp', titulo: 'O ranking',
            texto: 'O ranking da turma, com a sua linha destacada. Toque num nome para ver a carteira da pessoa.' },
          { img: P+'game-g20/game03-como-jogar.webp', titulo: 'Como jogar',
            texto: 'Primeira vez? Toque em <b>“Como jogar”</b> e veja as regras, os ciclos e como o ranking funciona.' },
          { img: P+'game-g20/game04-regras.webp', titulo: 'As regras da carteira',
            texto: 'Na aba <b>Minha Carteira</b>, escolha <b>10 ativos</b>, com pelo menos <b>1 Ação BR, 1 FII, 1 Stock, 1 ETF e 1 REIT</b>, e no máximo 3 criptos. O quadro de regras avisa quando está tudo certo.' },
          { img: P+'game-g20/game05-salvar.webp', titulo: 'Salvar a carteira',
            texto: 'Toque em <b>“Salvar Carteira”</b>. A carteira salva disputa o <b>próximo ciclo</b>, e dá para alterar até o prazo, que aparece na tela.' },
          { img: P+'game-g20/game06-hall-da-fama.webp', titulo: 'Hall da Fama',
            texto: 'Os campeões de cada ciclo e as suas conquistas no Game.' }
        ]
      },

      /* ── NETWORKING ───────────────────────────────────────────────── */
      {
        id: 'networking', ico: '🤝', titulo: 'Networking',
        resumo: 'Encontre colegas da turma e divulgue o seu negócio.',
        passos: [
          { img: P+'networking/nw01-busca.webp', titulo: 'Encontre colegas',
            texto: 'Busque alunos por nome, profissão, negócio, cidade ou interesse, ou filtre pela área de atuação.' },
          { img: P+'networking/nw02-cartao.webp', titulo: 'O cartão de cada aluno',
            texto: 'O negócio e os contatos que cada um escolheu mostrar. Para aparecer aqui, ative o <b>Perfil Público</b> no Meu Perfil. Só aparece quem quer.' }
        ]
      }
    ],

    /* ── FAQ ────────────────────────────────────────────────────────── */
    faq: [
      { p: 'Fiz o cadastro e não consigo entrar.',
        r: 'Todo acesso é aprovado pelo Israel, um por um. Enquanto isso, a plataforma mostra a tela de aguardando aprovação. Assim que for liberado, é só entrar com o mesmo e-mail e senha.' },
      { p: 'A página fica voltando para o início, em looping.',
        r: 'Quase sempre é o link aberto dentro do WhatsApp ou do Instagram. Toque nos três pontinhos e escolha “Abrir no navegador” (Chrome ou Safari). No computador, recarregue com <b>Ctrl + F5</b>. No app, feche e abra de novo.' },
      { p: 'Esqueci minha senha.',
        r: 'Na tela de login, toque em <b>“Esqueci minha senha”</b> e digite o seu e-mail. O link chega por e-mail; se não aparecer em alguns minutos, olhe a caixa de <b>spam</b>.' },
      { p: 'Não consigo usar a plataforma, ela sempre volta para o Meu Perfil.',
        r: 'Faltam campos obrigatórios (★) no seu perfil. O aviso no topo do Meu Perfil diz quantos faltam e em quais partes. Veja a seção <a href="#primeiros-passos">Primeiros passos</a>.' },
      { p: 'O botão do Face ID não aparece.',
        r: 'Primeiro ative em <b>Meu Perfil › Acesso e Alertas</b>, no aparelho que você vai usar. Cada aparelho é ativado separadamente. Aparelhos sem biometria não mostram a opção, e o login com e-mail e senha continua funcionando normalmente.' },
      { p: 'Importei a carteira e algum número não bateu.',
        r: 'Confira na aba <b>Transações</b> as quantidades e os preços de cada compra e venda. Desdobramentos, grupamentos e proventos a Minha Carteira calcula sozinha, então eles podem levar alguns instantes para aparecer. Se faltou alguma operação, lance pelo botão <b>“+”</b>.' },
      { p: 'Meus proventos não apareceram.',
        r: 'A Minha Carteira busca os proventos de todos os seus ativos automaticamente, e isso pode levar um tempo depois da importação. Se quiser, lance um provento na mão pelo botão <b>“+” › Lançar Provento</b>.' },
      { p: 'Por que os valores dos meus ativos americanos estão em dólar?',
        r: 'Stocks, REITs e ETFs são cotados em dólar, então o preço médio, o custo e a rentabilidade deles ficam em dólar, sem a variação do câmbio misturada. No patrimônio total, tudo é convertido para reais.' },
      { p: 'No Game, posso mudar a minha carteira?',
        r: 'Sim, até o prazo do ciclo, que aparece na tela. A carteira que você salva agora disputa o próximo ciclo.' },
      { p: 'Por que eu não apareço no Networking?',
        r: 'Só aparece quem ativou o <b>Perfil Público</b> no Meu Perfil. É uma escolha sua, e você pode desativar quando quiser.' },
      { p: 'Os meus dados estão seguros?',
        r: 'Os seus dados financeiros e o seu perfil completo são visíveis só para você. No Networking aparece apenas o que você escolher mostrar. A senha da plataforma antiga, usada na importação, não fica gravada em lugar nenhum.' },
      { p: 'Comprei no cartão e o saldo da conta não diminuiu.',
        r: 'É assim mesmo: a compra conta como despesa no dia da compra, mas só sai da conta no <b>vencimento da fatura</b>. Para isso funcionar, cadastre o fechamento e o vencimento do cartão (veja <a href="#gestao-financeira">Gestão Financeira › Cartão de crédito</a>).' },
      { p: 'O que é o saldo inicial? Ele conta como receita?',
        r: 'Não conta como receita. É quanto você tinha na conta quando começou a usar a Gestão Financeira. Com ele, a plataforma mostra o saldo real da conta (“Na conta”) e o gráfico da evolução do saldo parte do valor certo.' },
      { p: 'Colei a carteira do Status Invest e apareceu uma mensagem vermelha.',
        r: 'Confira se você estava na aba <b>Transações</b> do Status Invest, com <b>Todos</b> selecionado embaixo da tabela, e copiou a página inteira (Ctrl + A e Ctrl + C). Se mesmo assim não der, mande pelo <a href="#" onclick="ajFeedback(\'bug\');return false">Feedback</a> um print da mensagem: ela traz um “detalhe técnico” que ajuda a resolver rápido.' },
      { p: 'Alguns botões do topo sumiram quando aumentei o zoom.',
        r: 'Com zoom maior, o topo se ajusta: os atalhos do meio viram só ícones (o nome aparece ao passar o mouse) e a busca vira uma lupa. Nada é cortado. Para voltar ao tamanho normal, aperte <b>Ctrl + 0</b>.' },
      { p: 'A tela está um pouco diferente do print da ajuda.',
        r: 'A plataforma está sempre evoluindo, e os prints podem levar alguns dias para acompanhar uma mudança. O caminho costuma ser o mesmo.' },
      { p: 'Não achei a resposta aqui. Como peço ajuda?',
        r: 'Registre pelo <a href="#" onclick="ajFeedback(\'duvida\');return false">Feedback</a>, aqui mesmo na plataforma. Escolha se é uma dúvida, uma sugestão ou um problema, conte em que <b>página</b> você estava, se é <b>celular ou computador</b> e o que tentou fazer. Se puder, <b>anexe um print</b> da tela: isso acelera muito a resposta.' }
    ]
  };
})();
