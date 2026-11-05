/**
 * Panel help chat (2026-11-03): ready answers, no AI. The owner (or staff) types a question or taps
 * a suggestion; the answer says where it is and "Ir para lá" opens the screen and highlights the
 * section (its title) or the field (its name). Keep paths in sync with the panel screens.
 */

export interface SupportTarget {
  /** Field name attribute on the destination screen (highlighted). */
  field?: string;
  /** Exact title of the section on the destination screen (highlighted). */
  section?: string;
  /** data-tour id (menu items, "view-chat"). */
  tour?: string;
}

export interface SupportItem {
  id: string;
  question: string;
  answer: string;
  /** Words and synonyms people type (accents and case do not matter). */
  keywords: string[];
  /** Screen of "Ir para lá". */
  href?: string;
  target?: SupportTarget;
  /** Screens (path prefixes) where it shows as a suggestion. */
  suggestOn?: string[];
  /** Staff members see it too (others are owner-only). */
  staff?: boolean;
  /** Full article in the help center. */
  article?: string;
}

export const SUPPORT_EMAIL = "contato@brandcodesolutions.com.br";

export const SUPPORT_COPY = {
  title: "Ajuda",
  subtitle: "Escreva do seu jeito",
  greeting:
    "Oi! Me conta, com as suas palavras, o que você quer fazer no painel. Por exemplo: “mudar o nome”, “bloquear sábado” ou “cobrar sinal no Pix”.",
  placeholder: "Escreva sua dúvida…",
  hello: "Oi! 😊 Me conta o que você quer fazer que eu te mostro onde fica.",
  thanks: "Por nada! Se precisar de mais alguma coisa, é só escrever.",
  vague:
    "Me conta um pouco mais: o que você quer mudar ou encontrar? Por exemplo, o nome, a foto, um horário ou um serviço.",
  choose: "Você quis dizer:",
  go: "Ir para lá",
  article: "Ver passo a passo",
  notFound: "Não encontrei essa. Tente com outras palavras ou veja estas:",
  contact: "Falar com o suporte por e-mail",
  contactHint: "Respondemos por e-mail, normalmente no mesmo dia útil.",
  waiting: "Essa parte volta assim que você assinar.",
  related: "Também pode ajudar:",
  more: "Outras dúvidas",
} as const;

export const SUPPORT_ITEMS: SupportItem[] = [
  // Link, chat and sharing
  {
    id: "link",
    question: "Onde está o meu link de agendamento?",
    answer:
      "Fica no Início, em “Seu link de agendamento”, com o botão de copiar. É ele que você cola na bio do Instagram, no WhatsApp e no Google.",
    keywords: [
      "link",
      "meu link",
      "copiar link",
      "endereco",
      "url",
      "divulgar",
      "compartilhar",
      "bio",
    ],
    href: "/painel",
    suggestOn: ["/painel"],
  },
  {
    id: "view-chat",
    question: "Como vejo o chat como o meu cliente vê?",
    answer: "Toque em “Ver chat”, no topo do painel. Abre o seu link do jeito que o cliente vê.",
    keywords: ["ver chat", "testar", "como cliente ve", "previa", "simular", "visualizar"],
    href: "/painel",
    target: { tour: "view-chat" },
    staff: true,
  },
  {
    id: "change-link",
    question: "Como mudo o endereço do meu link?",
    answer:
      "Em Configurações › Negócio e agendamento, campo “Seu link”. Atenção: o endereço antigo deixa de funcionar, então troque também onde já divulgou.",
    keywords: ["mudar link", "trocar link", "endereco", "slug", "url", "nome do link"],
    href: "/painel/configuracoes",
    target: { field: "slug" },
    suggestOn: ["/painel/configuracoes"],
  },
  {
    id: "instagram-bio",
    question: "Como coloco o link no Instagram?",
    answer:
      "Copie o link no Início e, no Instagram, vá em Editar perfil › Links › Adicionar link externo. Cole e salve. No WhatsApp Business, cole no perfil, em “Site”.",
    keywords: [
      "instagram",
      "bio",
      "whatsapp business",
      "colocar link",
      "perfil instagram",
      "story",
      "stories",
    ],
    href: "/painel",
  },
  {
    id: "arts",
    question: "Tem arte pronta para divulgar nos stories?",
    answer: "Tem. Em Vendas › Artes para divulgar, escolha o modelo e baixe a arte com o seu link.",
    keywords: ["arte", "artes", "stories", "post", "divulgar", "imagem", "banner", "story"],
    href: "/painel/vendas",
    target: { section: "Artes prontas para os stories" },
    suggestOn: ["/painel/vendas", "/painel"],
  },

  // Business name and profile
  {
    id: "business-name",
    question: "Como mudo o nome do negócio?",
    answer:
      "Em Configurações › Negócio e agendamento, campo “Nome do negócio”. Depois toque em Salvar.",
    keywords: [
      "nome",
      "mudar nome",
      "trocar nome",
      "nome errado",
      "corrigir nome",
      "nome do negocio",
      "razao",
    ],
    href: "/painel/configuracoes",
    target: { field: "name" },
    suggestOn: ["/painel/configuracoes", "/painel/pagina"],
  },
  {
    id: "site",
    question: "Como edito o meu site?",
    answer:
      "Em Meu site (no menu). Ali você muda as cores, a foto do topo, os textos e as seções, e vê como está no ar. Fotos, serviços e endereço vêm do Meu perfil. O site faz parte do teste e do plano Site + Agenda.",
    keywords: [
      "site",
      "meu site",
      "editar site",
      "mudar site",
      "pagina do negocio",
      "landing",
      "cor do site",
      "foto do site",
      "google",
    ],
    href: "/painel/site",
    suggestOn: ["/painel/site", "/painel"],
  },
  {
    id: "photo",
    question: "Como coloco foto de perfil e capa?",
    answer:
      "Em Meu perfil › Foto e capa. Toque em Foto de perfil ou Capa e escolha a imagem do celular.",
    keywords: ["foto", "foto de perfil", "capa", "logo", "logotipo", "imagem", "avatar"],
    href: "/painel/pagina",
    target: { section: "Foto e capa" },
    suggestOn: ["/painel/pagina", "/painel"],
  },
  {
    id: "gallery",
    question: "Como coloco fotos dos meus trabalhos?",
    answer:
      "Em Meu perfil › Fotos dos seus trabalhos. Cabem até 20 fotos, e você pode mudar a ordem.",
    keywords: ["galeria", "fotos", "trabalhos", "portfolio", "antes e depois", "album"],
    href: "/painel/pagina",
    target: { section: "Fotos dos seus trabalhos" },
    suggestOn: ["/painel/pagina"],
  },
  {
    id: "bio-address",
    question: "Onde coloco endereço, bio, Instagram e WhatsApp?",
    answer:
      "Em Meu perfil › Informações. Ali ficam bio, endereço, bairro, cidade, Instagram e WhatsApp.",
    keywords: [
      "endereco",
      "bio",
      "descricao",
      "sobre",
      "instagram",
      "whatsapp",
      "telefone",
      "bairro",
      "cidade",
      "localizacao",
    ],
    href: "/painel/pagina",
    target: { section: "Informações" },
    suggestOn: ["/painel/pagina"],
  },
  {
    id: "color",
    question: "Como mudo a cor do meu chat?",
    answer:
      "Em Meu perfil › Informações, campo “Cor principal”. A prévia no fim da tela mostra como fica.",
    keywords: ["cor", "cores", "mudar cor", "tema", "visual", "personalizar"],
    href: "/painel/pagina",
    target: { section: "Informações" },
  },
  {
    id: "links",
    question: "Como adiciono outros links no meu perfil?",
    answer:
      "Em Meu perfil › Links. Dá para colocar site, cardápio de serviços, localização e outros.",
    keywords: ["links", "outros links", "site", "botao", "linktree"],
    href: "/painel/pagina",
    target: { section: "Links" },
  },
  {
    id: "google-review",
    question: "Como peço avaliação no Google?",
    answer:
      "Em Meu perfil › Informações, cole o “Link para avaliar no Google”. Quem avaliar o atendimento pelo MeetChat é convidado a avaliar no Google também.",
    keywords: ["avaliacao google", "google", "estrelas", "review", "nota google"],
    href: "/painel/pagina",
    target: { section: "Informações" },
  },

  // Services
  {
    id: "add-service",
    question: "Como cadastro ou edito um serviço?",
    answer:
      "Em Meu perfil › Serviços. Toque no serviço para editar ou adicione um novo com nome, duração e preço. Depois toque em Salvar serviço.",
    keywords: [
      "servico",
      "servicos",
      "cadastrar servico",
      "novo servico",
      "editar servico",
      "procedimento",
      "tratamento",
    ],
    href: "/painel/pagina",
    target: { section: "Serviços" },
    suggestOn: ["/painel/pagina", "/painel"],
  },
  {
    id: "price",
    question: "Como mudo o preço ou escondo os preços?",
    answer:
      "Em Meu perfil › Serviços, abra o serviço e mude o Preço. Para não mostrar preços no chat, desligue “Mostrar preços” na mesma seção.",
    keywords: [
      "preco",
      "valor",
      "esconder preco",
      "mostrar preco",
      "promocao",
      "preco promocional",
      "desconto",
    ],
    href: "/painel/pagina",
    target: { section: "Serviços" },
  },
  {
    id: "duration",
    question: "Como mudo a duração e o intervalo entre atendimentos?",
    answer:
      "Em Meu perfil › Serviços, abra o serviço e ajuste “Duração (min)” e “Intervalo depois (min)”. O chat só oferece horários em que o serviço cabe inteiro.",
    keywords: ["duracao", "tempo", "intervalo", "minutos", "pausa entre", "limpeza", "demora"],
    href: "/painel/pagina",
    target: { section: "Serviços" },
  },
  {
    id: "hide-service",
    question: "Como tiro um serviço do chat sem apagar?",
    answer:
      "Em Meu perfil › Serviços, abra o serviço e marque como Inativo. Ele some do chat e pode voltar quando quiser.",
    keywords: [
      "desativar servico",
      "esconder servico",
      "inativo",
      "pausar servico",
      "tirar servico",
      "apagar servico",
      "excluir servico",
    ],
    href: "/painel/pagina",
    target: { section: "Serviços" },
  },
  {
    id: "combos",
    question: "Como crio um combo de serviços?",
    answer:
      "Em Meu perfil › Combos. Junte dois ou mais serviços num só agendamento, com preço próprio.",
    keywords: ["combo", "combos", "juntar servicos", "kit", "dois servicos"],
    href: "/painel/pagina",
    target: { section: "Combos" },
  },

  // Hours and rules
  {
    id: "hours",
    question: "Como mudo meus horários de atendimento?",
    answer:
      "Em Configurações › Expediente. Escolha os dias e os horários de cada um, incluindo pausa de almoço. Com equipe, cada profissional tem o seu.",
    keywords: [
      "horario",
      "horarios",
      "horario de funcionamento",
      "horario de atendimento",
      "expediente",
      "dias",
      "funcionamento",
      "abrir",
      "fechar",
      "almoco",
      "pausa",
      "sabado",
      "domingo",
    ],
    href: "/painel/configuracoes",
    target: { section: "Expediente" },
    suggestOn: ["/painel/configuracoes", "/painel/agenda", "/painel"],
  },
  {
    id: "block",
    question: "Como bloqueio um dia ou horário (folga, férias)?",
    answer:
      "Na Agenda, toque em “Bloquear horário”, ou vá em Configurações › Bloqueios para folgas e férias. O chat não oferece esses horários.",
    keywords: [
      "bloquear",
      "bloqueio",
      "folga",
      "ferias",
      "feriado",
      "fechar dia",
      "nao atender",
      "viagem",
      "viajar",
      "indisponivel",
      "dia de folga",
    ],
    href: "/painel/configuracoes",
    target: { section: "Bloqueios" },
    suggestOn: ["/painel/agenda", "/painel/configuracoes"],
    staff: true,
  },
  {
    id: "notice",
    question: "Como evito agendamentos em cima da hora?",
    answer:
      "Em Configurações › Negócio e agendamento, ajuste a “Antecedência mínima”. No mesmo lugar, “Agendar até quantos dias à frente” limita o futuro.",
    keywords: [
      "antecedencia",
      "em cima da hora",
      "ultima hora",
      "mesmo dia",
      "quantos dias",
      "limite",
      "futuro",
      "com antecedencia",
    ],
    href: "/painel/configuracoes",
    target: { section: "Negócio e agendamento" },
  },
  {
    id: "grid",
    question: "Como mudo o intervalo dos horários (15, 30 ou 60 min)?",
    answer: "Em Configurações › Negócio e agendamento, campo “Grade de horários”.",
    keywords: [
      "grade",
      "de 30 em 30",
      "de hora em hora",
      "15 minutos",
      "intervalo dos horarios",
      "horarios quebrados",
    ],
    href: "/painel/configuracoes",
    target: { section: "Negócio e agendamento" },
  },
  {
    id: "approve-mode",
    question: "Quero aprovar cada agendamento antes de confirmar",
    answer:
      "Em Configurações › Negócio e agendamento, mude “Confirmação dos agendamentos” para aprovar cada um. Os pedidos aparecem em Pedidos de horário.",
    keywords: [
      "aprovar",
      "aprovacao",
      "confirmar manual",
      "confirmacao",
      "pedido",
      "autorizar",
      "aceitar agendamento",
    ],
    href: "/painel/configuracoes",
    target: { section: "Negócio e agendamento" },
  },
  {
    id: "niche",
    question: "Como mudo o ramo do meu negócio?",
    answer: "Em Configurações › Seu ramo. O ramo muda os textos e exemplos do seu chat.",
    keywords: ["ramo", "nicho", "area", "categoria", "segmento", "tipo de negocio"],
    href: "/painel/configuracoes",
    target: { section: "Seu ramo" },
  },
  {
    id: "no-show-limit",
    question: "Como limito clientes que faltam muito?",
    answer:
      "Em Configurações › Negócio e agendamento, campo “Limite de faltas”. Quem passar do limite não consegue mais agendar sozinho.",
    keywords: [
      "faltas",
      "falta muito",
      "limite de faltas",
      "bloquear cliente",
      "cliente que falta",
      "no show",
    ],
    href: "/painel/configuracoes",
    target: { section: "Negócio e agendamento" },
  },

  // Agenda
  {
    id: "new-appointment",
    question: "Como marco um horário pelo painel?",
    answer: "Na Agenda, toque em “Novo agendamento”, escolha cliente, serviço e horário livre.",
    keywords: [
      "marcar",
      "agendar",
      "novo agendamento",
      "lancar horario",
      "encaixe",
      "adicionar horario",
      "marcar cliente",
    ],
    href: "/painel/agenda",
    suggestOn: ["/painel/agenda", "/painel"],
    staff: true,
  },
  {
    id: "reschedule",
    question: "Como remarco um agendamento?",
    answer:
      "Na Agenda, toque no agendamento e depois em Remarcar. O cliente recebe um e-mail, e você pode avisar pelo WhatsApp com a mensagem pronta.",
    keywords: [
      "remarcar",
      "remarcar cliente",
      "mudar horario",
      "trocar horario",
      "adiar",
      "reagendar",
      "mudar dia",
      "remarcacao",
    ],
    href: "/painel/agenda",
    suggestOn: ["/painel/agenda"],
    staff: true,
  },
  {
    id: "cancel-appointment",
    question: "Como cancelo um agendamento?",
    answer: "Na Agenda, toque no agendamento e em Cancelar. O horário volta a ficar livre no chat.",
    keywords: [
      "cancelar",
      "desmarcar",
      "cancelamento",
      "excluir agendamento",
      "apagar agendamento",
      "tirar da agenda",
    ],
    href: "/painel/agenda",
    suggestOn: ["/painel/agenda"],
    staff: true,
  },
  {
    id: "no-show",
    question: "Como marco falta ou atendimento concluído?",
    answer:
      "Na Agenda, toque no agendamento e escolha Concluir ou Falta. Isso alimenta o financeiro e o histórico do cliente.",
    keywords: ["falta", "faltou", "concluir", "concluido", "atendido", "nao veio", "finalizar"],
    href: "/painel/agenda",
    suggestOn: ["/painel/agenda"],
    staff: true,
  },
  {
    id: "requests",
    question: "Onde aprovo os agendamentos pendentes?",
    answer:
      "Na Agenda: os pendentes aparecem destacados. Toque no agendamento e escolha Aprovar ou Recusar. O cliente é avisado por e-mail.",
    keywords: ["pedidos", "pendente", "aprovar", "recusar", "aguardando aprovacao", "solicitacao"],
    href: "/painel/agenda",
    staff: true,
  },
  {
    id: "notify-customer",
    question: "O cliente recebe confirmação e lembrete?",
    answer:
      "Sim, por e-mail: confirmação ao marcar e lembrete antes do horário, com botão para remarcar ou cancelar. O MeetChat não manda WhatsApp pelo sistema.",
    keywords: [
      "lembrete",
      "confirmacao",
      "avisar cliente",
      "email cliente",
      "notificar cliente",
      "whatsapp automatico",
      "mensagem automatica",
    ],
    staff: true,
  },

  // Customers
  {
    id: "customers",
    question: "Onde vejo meus clientes e o histórico?",
    answer: "Em Clientes. Toque no cliente para ver histórico, pacotes e observações.",
    keywords: [
      "clientes",
      "historico",
      "ficha",
      "cadastro de cliente",
      "lista de clientes",
      "contatos",
    ],
    href: "/painel/clientes",
    suggestOn: ["/painel/clientes", "/painel"],
    staff: true,
  },
  {
    id: "import",
    question: "Como importo meus clientes de outra agenda?",
    answer:
      "Em Clientes, toque em “Importar clientes” e envie a planilha (arquivo CSV) com nome e telefone.",
    keywords: [
      "importar",
      "planilha",
      "csv",
      "excel",
      "trazer clientes",
      "migrar",
      "outro sistema",
    ],
    href: "/painel/clientes",
    suggestOn: ["/painel/clientes"],
  },
  {
    id: "notes",
    question: "Como anoto algo sobre um cliente?",
    answer: "Em Clientes, abra o cliente e use “Observações”. Só a sua equipe vê.",
    keywords: ["observacao", "anotar", "nota", "lembrete cliente", "preferencia", "alergia"],
    href: "/painel/clientes",
    staff: true,
  },

  // Money
  {
    id: "finance",
    question: "Como lanço uma receita ou um custo?",
    answer:
      "Em Financeiro, preencha Tipo (receita ou custo), Valor, Descrição e Forma de pagamento. O lucro do mês aparece no topo.",
    keywords: [
      "financeiro",
      "lancar",
      "receita",
      "quanto ganhei",
      "ganhei no mes",
      "mes",
      "custo",
      "despesa",
      "gasto",
      "caixa",
      "lucro",
      "faturamento",
      "entrada",
      "saida",
    ],
    href: "/painel/financeiro",
    suggestOn: ["/painel/financeiro", "/painel"],
  },
  {
    id: "deposit-setup",
    question: "Como cobro sinal pelo Pix?",
    answer:
      "Em Configurações › Sinal pelo Pix: cadastre a chave Pix, ligue “Pedir sinal pelo Pix ao agendar” e escolha o valor de cada serviço. O dinheiro vai direto para a sua conta.",
    keywords: [
      "sinal",
      "pix",
      "adiantamento",
      "entrada",
      "cobrar sinal",
      "chave pix",
      "reserva",
      "deposito",
      "pagamento antecipado",
    ],
    href: "/painel/configuracoes",
    target: { section: "Sinal pelo Pix" },
    suggestOn: ["/painel/configuracoes", "/painel/sinais"],
  },
  {
    id: "deposit-check",
    question: "Onde confiro os Pix de sinal que recebi?",
    answer:
      "Em Sinais pelo Pix › Pix para conferir. Compare com o seu extrato e toque em Confirmar ou Não recebi.",
    keywords: ["conferir pix", "comprovante", "confirmar sinal", "nao recebi", "extrato", "sinais"],
    href: "/painel/sinais",
    target: { section: "Pix para conferir" },
    suggestOn: ["/painel/sinais"],
  },

  // Sales tools
  {
    id: "coupons",
    question: "Como crio um cupom de desconto?",
    answer: "Em Vendas › Cupons, preencha código, desconto, validade e usos máximos.",
    keywords: ["cupom", "desconto", "promocao", "codigo promocional", "voucher"],
    href: "/painel/vendas",
    target: { section: "Cupons" },
    suggestOn: ["/painel/vendas"],
  },
  {
    id: "packages",
    question: "Como vendo pacotes de sessões?",
    answer:
      "Em Vendas › Pacotes, crie o pacote (serviço, sessões e preço). Depois associe ao cliente em Clientes.",
    keywords: ["pacote", "pacotes", "sessoes", "plano de sessoes", "mensalidade", "credito"],
    href: "/painel/vendas",
    target: { section: "Pacotes" },
    suggestOn: ["/painel/vendas"],
  },
  {
    id: "referrals",
    question: "Como funciona a indicação de clientes?",
    answer:
      "Em Vendas › Indicações, escolha a recompensa para quem indicar. As indicações recebidas aparecem ali.",
    keywords: ["indicacao", "indicar", "recompensa", "amiga", "convidar cliente"],
    href: "/painel/vendas",
    target: { section: "Indicações" },
  },
  {
    id: "waitlist",
    question: "Como funciona a lista de espera?",
    answer:
      "Quando um horário é cancelado, quem está na lista de espera daquele dia recebe um e-mail, e o primeiro a confirmar fica com a vaga. Veja em Vendas › Lista de espera.",
    keywords: ["lista de espera", "espera", "vaga", "desistencia", "encaixe"],
    href: "/painel/vendas",
    target: { section: "Lista de espera" },
  },

  // Team
  {
    id: "team",
    question: "Como adiciono outro profissional?",
    answer:
      "Em Equipe › Monte sua equipe, adicione o nome do profissional. Para ele ver a própria agenda, envie o convite por e-mail.",
    keywords: [
      "profissional",
      "equipe",
      "funcionario",
      "colaborador",
      "adicionar profissional",
      "manicure",
      "barbeiro",
      "convidar",
    ],
    href: "/painel/equipe",
    target: { section: "Monte sua equipe" },
    suggestOn: ["/painel/equipe"],
  },
  {
    id: "rooms",
    question: "Como cadastro salas ou macas?",
    answer:
      "Em Equipe › Salas e macas. Assim dois atendimentos não usam a mesma sala ao mesmo tempo.",
    keywords: ["sala", "salas", "maca", "macas", "cadeira", "recurso", "equipamento", "aparelho"],
    href: "/painel/equipe",
    target: { section: "Salas e macas" },
  },

  // Integrations, notifications, stats
  {
    id: "google-calendar",
    question: "Como conecto o Google Agenda?",
    answer:
      "Em Integrações › Google Agenda, toque em “Conectar Google Agenda”. Seus compromissos de lá bloqueiam horários aqui.",
    keywords: ["google agenda", "google calendar", "sincronizar", "integrar", "calendario"],
    href: "/painel/integracoes",
    suggestOn: ["/painel/integracoes"],
  },
  {
    id: "push",
    question: "Como recebo aviso no celular a cada agendamento?",
    answer:
      "Em Notificações › Notificações no celular, ative e permita as notificações no navegador.",
    keywords: [
      "notificacao",
      "aviso",
      "celular",
      "push",
      "alerta",
      "receber aviso",
      "nao chega aviso",
    ],
    href: "/painel/notificacoes",
    target: { section: "Notificações no celular" },
    suggestOn: ["/painel/notificacoes", "/painel"],
    staff: true,
  },
  {
    id: "emails",
    question: "Como escolho quais e-mails recebo?",
    answer: "Em Notificações › O que você quer receber, ligue ou desligue cada aviso.",
    keywords: [
      "email",
      "emails",
      "parar email",
      "muitos emails",
      "avisos por email",
      "desligar aviso",
    ],
    href: "/painel/notificacoes",
    target: { section: "O que você quer receber" },
    staff: true,
  },
  {
    id: "stats",
    question: "Onde vejo quantas pessoas visitaram meu link?",
    answer: "Em Estatísticas: visitas, cliques e agendamentos do seu link.",
    keywords: [
      "estatisticas",
      "visitas",
      "acessos",
      "quantas pessoas",
      "numeros",
      "relatorio",
      "metricas",
    ],
    href: "/painel/estatisticas",
  },
  {
    id: "reviews",
    question: "Como respondo as avaliações dos clientes?",
    answer: "Em Avaliações. Toque na avaliação e escreva a resposta pública.",
    keywords: ["avaliacoes", "avaliacao", "comentario", "estrelas", "responder avaliacao", "nota"],
    href: "/painel/avaliacoes",
  },

  // Subscription and account
  {
    id: "subscribe",
    question: "Como assino o plano?",
    answer:
      "Em Assinatura, escolha mensal ou anual e o número de profissionais, informe nome e CPF/CNPJ e pague o Pix. As próximas mensalidades são debitadas pelo Pix Automático.",
    keywords: [
      "assinar",
      "assinatura",
      "plano",
      "pagar",
      "preco do plano",
      "mensalidade",
      "teste gratis",
      "acabou o teste",
    ],
    href: "/painel/plano",
    suggestOn: ["/painel/plano"],
  },
  {
    id: "pix-automatic",
    question: "Como funciona o Pix Automático da assinatura?",
    answer:
      "Você paga a primeira mensalidade pelo QR e confirma o Pix Automático no app do banco. As próximas são debitadas sozinhas, e você pode cancelar pelo banco quando quiser.",
    keywords: [
      "pix automatico",
      "debito automatico",
      "cobranca",
      "renovacao",
      "mensalidade",
      "debitar",
    ],
    href: "/painel/plano",
    target: { section: "Minha assinatura" },
    suggestOn: ["/painel/plano"],
  },
  {
    id: "cancel-plan",
    question: "Como cancelo a assinatura?",
    answer:
      "Em Assinatura › Minha assinatura, toque em “Cancelar assinatura”. Tudo continua até o fim do período pago; depois o link segue no ar com os pedidos indo para o seu WhatsApp.",
    keywords: ["cancelar assinatura", "cancelar plano", "parar de pagar", "desistir", "encerrar"],
    href: "/painel/plano",
    target: { section: "Minha assinatura" },
  },
  {
    id: "seats",
    question: "Como mudo o número de profissionais do plano?",
    answer:
      "Em Assinatura, use os botões + e − em Profissionais e salve. O novo valor vale a partir da próxima cobrança.",
    keywords: [
      "profissionais",
      "mais profissional",
      "adicionar vaga",
      "aumentar plano",
      "quantidade",
    ],
    href: "/painel/plano",
  },
  {
    id: "password",
    question: "Como crio ou troco minha senha?",
    answer:
      "Em Conta, na parte de Senha. Se entrou só pelo código do e-mail, aparece “Criar senha”.",
    keywords: ["senha", "trocar senha", "criar senha", "esqueci senha", "mudar senha", "login"],
    href: "/painel/conta",
    staff: true,
  },
  {
    id: "export",
    question: "Como baixo meus dados?",
    answer:
      "Em Conta › Exportar dados. Baixe tudo de uma vez ou só clientes, agendamentos, serviços, pedidos ou avaliações em planilha (CSV).",
    keywords: ["exportar", "baixar dados", "backup", "planilha", "download"],
    href: "/painel/conta",
    target: { section: "Exportar dados" },
  },
  {
    id: "delete-account",
    question: "Como excluo minha conta?",
    answer: "Em Conta › Excluir conta. Isso apaga o negócio e os dados de vez, sem volta.",
    keywords: ["excluir conta", "apagar conta", "deletar", "remover conta", "encerrar conta"],
    href: "/painel/conta",
    target: { section: "Excluir conta" },
  },
  {
    id: "sign-out",
    question: "Como saio da conta?",
    answer:
      "No computador, toque em “Sair” no topo. No celular, abra “Mais” no menu de baixo e toque em Sair.",
    keywords: ["sair", "deslogar", "logout", "trocar de conta"],
    staff: true,
  },
  {
    id: "app",
    question: "Tem aplicativo para baixar?",
    answer:
      "Não precisa. O painel funciona no navegador do celular. Para abrir como app, use “Adicionar à tela de início” no menu do navegador.",
    keywords: [
      "aplicativo",
      "app",
      "baixar",
      "play store",
      "app store",
      "instalar",
      "tela inicial",
    ],
    staff: true,
  },
  {
    id: "customer-app",
    question: "Meu cliente precisa baixar algo ou criar conta?",
    answer: "Não. Ele toca no seu link, conversa no chat e informa nome e contato. Pronto.",
    keywords: [
      "cliente baixar",
      "cliente cadastro",
      "cliente conta",
      "cliente app",
      "como o cliente agenda",
    ],
    staff: true,
  },
];
