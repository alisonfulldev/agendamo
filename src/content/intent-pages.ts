import { PRICE_TEXT, SITE_PRICE_TEXT, TRIAL_DAYS } from "@/lib/plans";

import type { FaqItem, GuideSection } from "./niche-guides/types";

/**
 * Cross-niche intent pages (/agendamento/<slug>, D3 2026-10-16): one search intent each, for any
 * business with appointments. Niche versions (/barbearia/reduzir-faltas…) are linked from here.
 * Only real features; "grátis" always with its limit (D1).
 */
export interface IntentPage {
  slug: string;
  /** Short name (breadcrumb, links). */
  label: string;
  title: string;
  description: string;
  h1: string;
  /** Direct answer in the first lines. */
  answer: string;
  sections: GuideSection[];
  faq?: FaqItem[];
  /** Other intent pages to link (slugs). */
  related: string[];
  /** Niche subpage topic with the same intent, linked per pilot niche. */
  nicheTopic?: "reduzir-faltas" | "agendar-pelo-whatsapp" | "agendar-pelo-instagram";
  updatedAt: string;
}

export const INTENT_PAGES: readonly IntentPage[] = [
  {
    slug: "link-na-bio",
    label: "Link de agendamento na bio",
    title: "Link de agendamento para a bio do Instagram | MeetChat",
    description:
      "Um link na bio do Instagram que abre um chat de agendamento: o cliente escolhe serviço, dia e horário livre e marca sem mandar direct. Veja como montar.",
    h1: "Link de agendamento para a bio do Instagram",
    answer:
      "Um link de agendamento na bio é um endereço que, ao ser tocado, abre uma página onde o cliente escolhe o serviço, o dia e um horário livre e confirma sozinho. No MeetChat esse link abre como uma conversa, no navegador do celular, sem aplicativo e sem cadastro.",
    sections: [
      {
        title: "O que muda quando a bio tem um link de agendamento",
        paragraphs: [
          "Sem link, a bio diz “agende pelo direct” e cada interessado vira uma conversa que você precisa responder. Com o link, quem decidiu marcar resolve na hora, inclusive à noite e no fim de semana.",
          "Você continua recebendo mensagens, mas as de “tem horário?” deixam de ser a maioria.",
        ],
      },
      {
        title: "Como montar em poucos minutos",
        ordered: true,
        list: [
          "Crie sua conta no MeetChat: o link já vem com serviços do seu ramo.",
          "Ajuste serviços, duração, preços e horários de atendimento pelo celular.",
          "No Instagram, edite o perfil e coloque o link como primeiro link da bio.",
          "Use a figurinha de link nos stories e crie um destaque “Agendar”.",
        ],
      },
      {
        title: "O que o cliente vê ao tocar no link",
        list: [
          "Uma conversa que pergunta o serviço, o profissional (se houver mais de um) e o dia.",
          "Só os horários em que o serviço cabe inteiro, fora de pausas e de outros agendamentos.",
          "Seu perfil ao tocar na foto: serviços, preços (se você mostrar), fotos e avaliações.",
        ],
      },
    ],
    faq: [
      {
        question: "Posso usar o mesmo link no WhatsApp e no site?",
        answer:
          "Pode. É um link só, para colocar no Instagram, no WhatsApp, no Google e no seu site.",
      },
      {
        question: "O link tem o nome do meu negócio?",
        answer:
          "Tem. O endereço fica no formato meetchat.com.br/seu-negocio, e você pode trocar a parte do nome nas configurações.",
      },
    ],
    related: ["pelo-whatsapp", "sem-app", "lembrete-automatico"],
    nicheTopic: "agendar-pelo-instagram",
    updatedAt: "2026-10-16",
  },
  {
    slug: "pelo-whatsapp",
    label: "Agendamento pelo WhatsApp",
    title: "Agendamento pelo WhatsApp sem responder mensagem | MeetChat",
    description:
      "Coloque um link de agendamento no WhatsApp Business: o cliente marca sozinho, e você para de combinar horário por mensagem. Sem integração e sem robô.",
    h1: "Agendamento pelo WhatsApp sem ficar respondendo mensagem",
    answer:
      "Para receber agendamentos pelo WhatsApp sem combinar horário por mensagem, use um link de agendamento no perfil comercial, na mensagem de ausência e em respostas rápidas. O cliente toca, escolhe o serviço e um horário livre e confirma. O MeetChat não se conecta ao seu WhatsApp: ele só recebe o link que você divulga.",
    sections: [
      {
        title: "Por que não combinar horário pela conversa",
        paragraphs: [
          "Combinar horário por mensagem é uma negociação: você oferece, o cliente não pode, você oferece outro. Cada agendamento leva várias mensagens, e quem chama à noite só recebe resposta no dia seguinte.",
        ],
      },
      {
        title: "Onde o link entra no WhatsApp Business",
        list: [
          "Perfil comercial, no campo de site.",
          "Mensagem de saudação, para o primeiro contato.",
          "Mensagem de ausência, para quem chama fora do horário.",
          "Respostas rápidas, para mandar o link em dois toques.",
          "Status, com a arte dos horários livres que o painel gera.",
        ],
      },
      {
        title: "E quando o cliente quer conversar?",
        paragraphs: [
          "Ele continua chamando você normalmente. Em cada agendamento você recebe o nome e o WhatsApp do cliente, para falar com ele quando precisar.",
        ],
      },
    ],
    faq: [
      {
        question: "O MeetChat é um robô de WhatsApp?",
        answer:
          "Não. O MeetChat é um chat de agendamento que abre pelo link. Ele não lê nem envia mensagens no seu WhatsApp.",
      },
      {
        question: "O cliente recebe confirmação pelo WhatsApp?",
        answer:
          "A confirmação e o lembrete automáticos vão por e-mail, para quem informar o e-mail ao agendar.",
      },
    ],
    related: ["link-na-bio", "lembrete-automatico", "sem-app"],
    nicheTopic: "agendar-pelo-whatsapp",
    updatedAt: "2026-10-16",
  },
  {
    slug: "lembrete-automatico",
    label: "Lembrete automático",
    title: "Lembrete automático de agendamento para clientes | MeetChat",
    description:
      "Como funciona o lembrete automático do MeetChat: e-mail um dia antes, com botões para remarcar ou cancelar, para o cliente não esquecer o horário.",
    h1: "Lembrete automático de agendamento: como funciona",
    answer:
      "No MeetChat, o lembrete automático é um e-mail enviado um dia antes do horário para o cliente que informou o e-mail ao agendar. Ele traz o serviço, o dia e a hora e dois botões: “Preciso remarcar” e “Cancelar horário”. O lembrete faz parte do plano pago.",
    sections: [
      {
        title: "O que o cliente recebe",
        ordered: true,
        list: [
          "Na hora do agendamento: a confirmação por e-mail, com os detalhes do horário.",
          "Um dia antes: o lembrete, com os botões para remarcar ou cancelar.",
          "Se remarcar: escolhe outro horário livre, e a agenda se ajusta sozinha.",
        ],
      },
      {
        title: "Por que o botão de remarcar importa",
        paragraphs: [
          "Muita falta acontece porque avisar dá trabalho ou constrangimento. Quando remarcar é um toque, o cliente avisa, e o horário volta para a agenda a tempo de outra pessoa marcar.",
          "Se houver lista de espera para aquele dia e serviço, quem está nela recebe um e-mail quando o horário é liberado.",
        ],
      },
      {
        title: "O que o lembrete não faz",
        list: [
          "Não vai por WhatsApp nem por SMS.",
          "Não chega para quem não informou o e-mail (o e-mail é opcional no agendamento).",
          "Não funciona no modo grátis (modo WhatsApp), em que nenhum horário é reservado automaticamente.",
        ],
      },
    ],
    faq: [
      {
        question: "Posso mudar o texto do lembrete?",
        answer:
          "O texto é padrão e usa o nome do seu negócio e do serviço. O que você controla é o nome dos serviços e as informações do seu perfil.",
      },
      {
        question: "E eu, sou avisado?",
        answer:
          "Sim. Você recebe aviso no celular (notificação) e por e-mail a cada agendamento novo.",
      },
    ],
    related: ["reduzir-faltas", "pelo-whatsapp", "agenda-gratis"],
    updatedAt: "2026-10-16",
  },
  {
    slug: "reduzir-faltas",
    label: "Reduzir faltas (no-show)",
    title: "Como reduzir faltas de clientes agendados (no-show) | MeetChat",
    description:
      "Quatro formas práticas de reduzir faltas em negócios com hora marcada: lembrete, remarcação fácil, sinal pelo Pix e lista de espera para o horário liberado.",
    h1: "Como reduzir faltas de clientes agendados",
    answer:
      "Faltas (no-show) diminuem quando o cliente lembra do horário, consegue remarcar com facilidade e, nos serviços mais longos, assume um compromisso, como um sinal. Para o horário liberado não ficar vazio, ajuda ter uma lista de espera.",
    sections: [
      {
        title: "1. Lembrar o cliente antes do horário",
        paragraphs: [
          "O esquecimento é a causa mais simples de falta. No MeetChat, quem informa o e-mail recebe um lembrete um dia antes, com os detalhes do horário.",
        ],
      },
      {
        title: "2. Facilitar a remarcação",
        paragraphs: [
          "Quem não pode ir precisa de um caminho fácil para avisar. O lembrete traz o botão “Preciso remarcar”, que mostra os horários livres e troca o agendamento sem mensagem.",
        ],
      },
      {
        title: "3. Pedir sinal onde a falta pesa mais",
        paragraphs: [
          "Em serviços longos ou disputados, um sinal pelo Pix aumenta o compromisso. No MeetChat, o cliente paga direto na sua chave, você confere e confirma. O MeetChat não recebe esse dinheiro.",
        ],
      },
      {
        title: "4. Reaproveitar o horário liberado",
        paragraphs: [
          "Com a lista de espera, quem queria aquele dia e serviço recebe um e-mail quando alguém cancela; o primeiro a confirmar fica com o horário.",
        ],
      },
      {
        title: "Uma regra clara, combinada antes",
        paragraphs: [
          "Diga no seu perfil com quanto tempo de antecedência o cliente deve avisar e o que acontece com o sinal em caso de falta. Regra conhecida evita discussão depois.",
        ],
      },
    ],
    faq: [
      {
        question: "Quanto dá para reduzir as faltas?",
        answer:
          "Depende do seu público e da sua regra. Para ter uma ideia do que as faltas custam hoje, use a calculadora de prejuízo com faltas.",
      },
    ],
    related: ["lembrete-automatico", "multiagenda", "agenda-gratis"],
    nicheTopic: "reduzir-faltas",
    updatedAt: "2026-10-16",
  },
  {
    slug: "agenda-gratis",
    label: "Agenda online grátis",
    title: "Agenda online grátis: o que dá para fazer sem pagar | MeetChat",
    description:
      "O que a agenda online grátis do MeetChat faz e o que fica no plano pago: link no ar com pedidos pelo WhatsApp de graça; lembretes e agenda completa no pago.",
    h1: "Agenda online grátis: o que está incluso",
    answer: `No MeetChat, o grátis é o modo WhatsApp: seu link e o chat ficam no ar, e o cliente escolhe serviço, dia e turno e chama você no WhatsApp com a mensagem pronta. Horário reservado automaticamente, lembretes e a agenda completa no painel são do plano pago (${PRICE_TEXT.monthly}). Todo cadastro começa com ${TRIAL_DAYS} dias do plano pago, sem cartão.`,
    sections: [
      {
        title: "O que funciona de graça",
        list: [
          "Seu link de agendamento e o chat, no Instagram, no WhatsApp e no site.",
          "O cliente escolhe o serviço, o dia e o turno e informa o nome.",
          "O pedido abre o seu WhatsApp com a mensagem pronta para você confirmar.",
          "O selo “Agende também com o MeetChat” aparece no rodapé.",
        ],
      },
      {
        title: "O que é do plano pago",
        list: [
          "Horário reservado na hora, sem conflito entre clientes.",
          "Confirmação e lembrete automáticos por e-mail.",
          "Agenda, clientes e financeiro no painel; equipe e salas.",
          "Sinal pelo Pix, pacotes, combos, cupons e lista de espera.",
        ],
      },
      {
        title: "Para quem o grátis basta",
        paragraphs: [
          "Se você atende poucas pessoas por semana e prefere confirmar cada horário pessoalmente, o modo WhatsApp já organiza os pedidos. Quando o volume cresce, o plano pago tira de você a parte de confirmar e lembrar.",
        ],
      },
    ],
    faq: [
      {
        question: "Preciso de cartão para começar?",
        answer: `Não. O teste de ${TRIAL_DAYS} dias e o modo WhatsApp não pedem cartão.`,
      },
      {
        question: "O que acontece com meus dados se eu não assinar?",
        answer:
          "Nada é apagado. A conta passa para o modo WhatsApp, e ao assinar tudo volta como estava.",
      },
    ],
    related: ["autonomo", "lembrete-automatico", "link-na-bio"],
    updatedAt: "2026-10-16",
  },
  {
    slug: "autonomo",
    label: "Agenda para autônomo",
    title: "Agenda online para profissional autônomo | MeetChat",
    description:
      "Para quem trabalha sozinho e atende com hora marcada: agenda online pelo celular, link para o cliente marcar e aviso a cada horário, sem secretária.",
    h1: "Agenda online para profissional autônomo",
    answer:
      "Para o profissional autônomo, uma agenda online resolve duas coisas: o cliente marca sozinho pelo link, sem você parar o atendimento, e você vê e ajusta tudo pelo celular. No MeetChat você configura serviços, horários e pausas uma vez, e o chat só oferece os horários que cabem.",
    sections: [
      {
        title: "Quando você é a recepção e o atendimento",
        paragraphs: [
          "Quem trabalha sozinho atende, cobra, divulga e ainda responde mensagens. Cada pausa para combinar horário atrasa o cliente que está na sua frente.",
          "O link de agendamento faz o papel da recepção: o cliente vê os horários livres e marca, e você recebe o aviso no celular.",
        ],
      },
      {
        title: "O que configurar no primeiro dia",
        ordered: true,
        list: [
          "Seus serviços, com duração e preço (o preço pode ficar escondido).",
          "Seus dias e horários de atendimento, com as pausas.",
          "Antecedência mínima para marcar e até quantos dias à frente.",
          "Folgas e bloqueios, para dias em que você não atende.",
        ],
      },
      {
        title: "O que fica organizado sem esforço",
        list: [
          "Histórico de cada cliente, com os horários já marcados.",
          "Financeiro simples: o que entrou com os atendimentos no mês.",
          "Integração com o Google Agenda, para não marcar em cima de compromissos pessoais.",
        ],
      },
    ],
    faq: [
      {
        question: "Funciona só pelo celular?",
        answer: "Funciona. O painel foi feito para o celular, e também abre no computador.",
      },
      {
        question: "E se eu crescer e contratar alguém?",
        answer:
          "Você adiciona profissionais à equipe, cada um com a própria agenda, e o cliente escolhe com quem quer marcar.",
      },
    ],
    related: ["agenda-gratis", "link-na-bio", "multiagenda"],
    updatedAt: "2026-10-16",
  },
  {
    slug: "multiagenda",
    label: "Agenda para equipe",
    title: "Agenda para salão e clínica com várias profissionais | MeetChat",
    description:
      "Uma agenda por profissional, salas e aparelhos sem conflito e o cliente escolhendo com quem marcar: agenda online para salão, clínica e estúdio com equipe.",
    h1: "Agenda para salão e clínica com várias profissionais",
    answer:
      "Em um negócio com equipe, cada profissional precisa da própria agenda, e salas ou aparelhos não podem ser marcados duas vezes. No MeetChat, o cliente escolhe com quem quer ser atendido (ou o primeiro livre) e só vê horários em que a profissional e o recurso estão livres juntos.",
    sections: [
      {
        title: "Uma agenda por profissional",
        paragraphs: [
          "Cada profissional tem horários, pausas e serviços próprios. Quem faz só manicure não aparece para corte; quem folga na segunda não recebe agendamento na segunda.",
        ],
      },
      {
        title: "Salas, macas e aparelhos como recursos",
        paragraphs: [
          "Cadastre a sala ou o aparelho e ligue aos serviços que o usam. O chat só oferece o horário quando a profissional e o recurso estão livres, mesmo que outra profissional queira o mesmo aparelho.",
        ],
      },
      {
        title: "Quem vê o quê",
        list: [
          "A dona vê a agenda de todos, o financeiro e as configurações.",
          "Cada profissional recebe os avisos dos próprios horários.",
          "As permissões da equipe são definidas por você.",
        ],
      },
    ],
    faq: [
      {
        question: "Quantos profissionais posso ter?",
        answer: `O plano inclui 1 profissional; cada profissional a mais custa ${PRICE_TEXT.extraProfessional}. No teste de ${TRIAL_DAYS} dias, dá para cadastrar até 10.`,
      },
      {
        question: "O cliente pode marcar com qualquer profissional livre?",
        answer:
          "Pode. Quando há mais de um profissional para o serviço, o chat oferece a opção de marcar com o primeiro livre.",
      },
    ],
    related: ["autonomo", "reduzir-faltas", "lembrete-automatico"],
    updatedAt: "2026-10-16",
  },
  {
    slug: "sem-app",
    label: "Agendamento sem aplicativo",
    title: "Agendamento online sem o cliente baixar aplicativo | MeetChat",
    description:
      "O cliente agenda pelo navegador do celular, numa conversa, sem baixar app e sem criar conta. Veja por que isso faz mais gente terminar o agendamento.",
    h1: "Agendamento online sem o cliente baixar aplicativo",
    answer:
      "Com o MeetChat, o cliente agenda pelo navegador do celular: toca no link, responde a uma conversa curta e confirma. Não precisa baixar aplicativo, criar conta nem lembrar senha. Ele informa só o nome e o WhatsApp; o e-mail é opcional.",
    sections: [
      {
        title: "Cada passo a mais é um cliente a menos",
        paragraphs: [
          "Pedir para baixar um aplicativo ou criar uma conta antes de marcar é um passo que muita gente não dá, principalmente quem chegou pelo Instagram e só quer ver se tem horário.",
          "Uma conversa no navegador é algo que todo mundo já sabe usar.",
        ],
      },
      {
        title: "Como é o agendamento para o cliente",
        ordered: true,
        list: [
          "Toca no seu link (Instagram, WhatsApp, Google ou site).",
          "Escolhe o serviço e, se houver, o profissional.",
          "Escolhe o dia e um dos horários livres.",
          "Informa nome e WhatsApp e confirma.",
        ],
      },
      {
        title: "E para você?",
        paragraphs: [
          "Você também não precisa instalar nada: o painel abre no navegador e pode ser adicionado à tela inicial do celular, com aviso a cada agendamento.",
        ],
      },
    ],
    faq: [
      {
        question: "Funciona em qualquer celular?",
        answer: "Funciona em qualquer celular com navegador atualizado, Android ou iPhone.",
      },
      {
        question: "O cliente consegue remarcar depois?",
        answer:
          "Consegue, pelo link que vem no e-mail de confirmação e no lembrete (para quem informou o e-mail).",
      },
    ],
    related: ["link-na-bio", "pelo-whatsapp", "autonomo"],
    updatedAt: "2026-10-16",
  },
  {
    slug: "parar-de-responder-tem-horario",
    label: "Parar de responder “tem horário?”",
    title: "Como parar de responder “tem horário?” no WhatsApp | MeetChat",
    description:
      "Um link onde o cliente vê os horários livres e marca sozinho tira do seu WhatsApp as conversas de “tem horário?”. Veja como montar e o que dizer aos clientes.",
    h1: "Como parar de responder “tem horário?” no WhatsApp",
    answer:
      "A forma mais simples de parar de responder “tem horário?” é deixar o cliente ver a agenda e marcar sozinho. Você coloca um link de agendamento na saudação do WhatsApp Business, na bio e nas respostas rápidas; quem pergunta recebe o link, escolhe o serviço e um horário livre e confirma, e você só recebe o aviso.",
    sections: [
      {
        title: "Por que essa pergunta toma tanto tempo",
        paragraphs: [
          "Cada “tem horário?” vira uma troca de mensagens: você olha a agenda, oferece dois horários, o cliente não pode, você oferece outros. Muitas vezes a conversa acontece enquanto você está atendendo.",
          "Quando o cliente vê os horários livres sozinho, a troca acaba numa mensagem: o link.",
        ],
      },
      {
        title: "Onde colocar o link",
        ordered: true,
        list: [
          "Na mensagem de saudação do WhatsApp Business, que chega sozinha para quem escreve pela primeira vez.",
          "Numa resposta rápida (por exemplo, /agenda), para mandar o link em dois toques.",
          "Na bio do Instagram e nos stories, para quem chega por lá.",
          "No seu Perfil da Empresa no Google, no campo de agendamento.",
        ],
      },
      {
        title: "Uma mensagem pronta para a saudação",
        paragraphs: [
          "“Oi! Para ver os horários livres e marcar na hora, é só tocar aqui: [seu link]. Se tiver alguma dúvida, me escreve que eu respondo assim que puder.”",
          "O cliente que quer marcar resolve sozinho, e as mensagens que sobram para você são as que precisam de você.",
        ],
      },
      {
        title: "O que o link faz por você",
        list: [
          "Mostra só horários em que o serviço cabe inteiro, fora das pausas e de outros agendamentos.",
          "Avisa você no celular a cada agendamento, cancelamento ou remarcação.",
          "Manda confirmação e lembrete ao cliente que informou o e-mail.",
        ],
      },
    ],
    faq: [
      {
        question: "O cliente vai estranhar receber um link?",
        answer:
          "Em geral, não: o link abre como uma conversa no navegador, sem aplicativo e sem cadastro. Ele informa só o nome e o WhatsApp.",
      },
      {
        question: "E quem prefere falar comigo?",
        answer:
          "Continua falando. O link não substitui o seu WhatsApp; ele só tira dali as conversas de marcar horário.",
      },
    ],
    related: ["pelo-whatsapp", "link-na-bio", "sem-app"],
    nicheTopic: "agendar-pelo-whatsapp",
    updatedAt: "2026-11-06",
  },
  {
    slug: "sinal-pelo-pix",
    label: "Sinal pelo Pix no agendamento",
    title: "Como cobrar sinal pelo Pix no agendamento online | MeetChat",
    description:
      "Peça sinal (ou o valor total) pelo Pix na hora em que o cliente marca, direto na sua chave. Veja como conferir e o que fazer quando o Pix não chega.",
    h1: "Como cobrar sinal pelo Pix no agendamento online",
    answer:
      "Para cobrar sinal pelo Pix, o agendamento online mostra o valor e a sua chave Pix na hora em que o cliente escolhe o horário. No MeetChat, o cliente paga direto para você, toca em “Já fiz o Pix” (o comprovante é opcional) e o horário fica reservado até você conferir no seu extrato e confirmar.",
    sections: [
      {
        title: "Quando vale pedir sinal",
        list: [
          "Serviços longos ou caros, em que uma falta pesa no mês.",
          "Horários muito disputados, como sábado e fim de tarde.",
          "Clientes novos, que ainda não conhecem você.",
        ],
      },
      {
        title: "Como funciona para o cliente",
        ordered: true,
        list: [
          "Escolhe o serviço, o dia e o horário no chat.",
          "Vê o valor do sinal e a sua política de cancelamento, e aceita.",
          "Paga pelo Pix copia e cola ou pelo QR code, direto na sua chave.",
          "Toca em “Já fiz o Pix” e pode anexar o comprovante.",
        ],
      },
      {
        title: "Como funciona para você",
        paragraphs: [
          "O dinheiro cai direto na sua conta: o MeetChat não recebe nem repassa o pagamento. Você confere no extrato pelo valor e pelo nome de quem pagou e confirma no painel.",
          "Se o Pix não chegou, você marca “Não recebi”. A partir daí, aquele cliente precisa anexar o comprovante nos próximos agendamentos.",
        ],
      },
      {
        title: "O que você configura",
        list: [
          "Valor fixo, porcentagem do preço ou pagamento total, por serviço.",
          "Quanto tempo o horário fica reservado esperando o Pix.",
          "O texto da sua política de cancelamento, que o cliente aceita antes de pagar.",
        ],
      },
    ],
    faq: [
      {
        question: "Tem taxa sobre o Pix?",
        answer:
          "Não. O Pix vai direto da conta do cliente para a sua chave, sem intermediário e sem taxa do MeetChat.",
      },
      {
        question: "O sistema confere o Pix sozinho?",
        answer:
          "Não. Quem confirma é você, olhando o seu extrato. O MeetChat avisa quando há Pix esperando conferência.",
      },
    ],
    related: ["reduzir-faltas", "lembrete-automatico", "pelo-whatsapp"],
    nicheTopic: "reduzir-faltas",
    updatedAt: "2026-11-06",
  },
  {
    slug: "quanto-custa",
    label: "Quanto custa um sistema de agendamento",
    title: "Quanto custa um sistema de agendamento online? | MeetChat",
    description: `Os modelos de cobrança mais comuns de sistemas de agendamento e o preço do MeetChat: ${PRICE_TEXT.monthly}, ou ${SITE_PRICE_TEXT.monthly} com site, e ${TRIAL_DAYS} dias de teste sem cartão.`,
    h1: "Quanto custa um sistema de agendamento online?",
    answer: `Sistemas de agendamento online costumam cobrar uma mensalidade fixa, um valor por profissional ou uma taxa por agendamento. O MeetChat cobra ${PRICE_TEXT.summary}, com agendamentos ilimitados e 1 profissional incluso; cada profissional a mais custa ${PRICE_TEXT.extraProfessional}. Com site profissional junto, o plano Site + Agenda sai ${SITE_PRICE_TEXT.summary}.`,
    sections: [
      {
        title: "Os modelos de cobrança mais comuns",
        list: [
          "Mensalidade fixa: o mesmo valor todo mês, com ou sem limite de agendamentos.",
          "Por profissional: o valor cresce com a equipe.",
          "Por agendamento ou com taxa sobre o pagamento: barato no começo, caro quando a agenda enche.",
          "Grátis com limite: funciona até um número de agendamentos ou com recursos travados.",
        ],
      },
      {
        title: "O que olhar além do preço",
        list: [
          "Se há limite de agendamentos por mês.",
          "Se os lembretes automáticos estão incluídos ou são cobrados à parte.",
          "Se o sistema cobra taxa sobre o sinal ou o pagamento do cliente.",
          "Se dá para cancelar quando quiser, sem multa.",
        ],
      },
      {
        title: "O que está incluso no MeetChat",
        list: [
          "Agendamentos ilimitados pelo chat, 24 horas.",
          "Lembretes automáticos, agenda, clientes e financeiro.",
          "Sinal ou pagamento total pelo Pix, direto na sua conta, sem taxa.",
          "Equipe e integração com o Google Agenda.",
        ],
      },
      {
        title: "Como começar sem gastar",
        paragraphs: [
          `Todo cadastro começa com ${PRICE_TEXT.trial}. Se você não assinar, o link continua no ar no modo WhatsApp: o cliente escolhe serviço, dia e turno e o pedido chega no seu WhatsApp. Lembretes automáticos e agenda completa ficam no plano pago.`,
        ],
      },
    ],
    faq: [
      {
        question: "Tem fidelidade ou multa?",
        answer:
          "Não. Você cancela quando quiser e o plano continua valendo até o fim do período já pago.",
      },
      {
        question: "Como é o pagamento da assinatura?",
        answer:
          "Pelo Pix Automático: você paga a primeira mensalidade pelo QR code e autoriza o débito das próximas no app do seu banco.",
      },
    ],
    related: ["agenda-gratis", "autonomo", "multiagenda"],
    updatedAt: "2026-11-06",
  },
  {
    slug: "agenda-de-papel",
    label: "Trocar a agenda de papel",
    title: "Como trocar a agenda de papel por uma agenda online | MeetChat",
    description:
      "Passo a passo para sair do caderno ou da agenda de papel sem perder os horários já marcados: o que cadastrar primeiro, como passar os clientes e como avisar.",
    h1: "Como trocar a agenda de papel por uma agenda online",
    answer:
      "Para trocar a agenda de papel por uma online sem bagunça, cadastre primeiro seus serviços e horários de atendimento, passe para o sistema os horários já marcados das próximas semanas e só então divulgue o link. No MeetChat dá para fazer tudo pelo celular, e os clientes que você já tem podem ser importados por planilha.",
    sections: [
      {
        title: "Por que a agenda de papel começa a atrapalhar",
        list: [
          "Ela só está onde você está: longe dela, não dá para responder se tem horário.",
          "Remarcar vira rabisco, e um horário duplicado só aparece quando os dois clientes chegam.",
          "Não avisa ninguém: o lembrete depende de você mandar mensagem um por um.",
        ],
      },
      {
        title: "A troca em quatro passos",
        ordered: true,
        list: [
          "Cadastre os serviços, com a duração real de cada um.",
          "Configure os dias, horários e pausas de atendimento.",
          "Lance na agenda online os horários já marcados das próximas semanas.",
          "Divulgue o link no WhatsApp e no Instagram para os novos agendamentos.",
        ],
      },
      {
        title: "E os clientes que já estão no caderno?",
        paragraphs: [
          "Você pode cadastrar aos poucos, conforme eles voltam, ou importar uma planilha com nome e telefone. Quem marcar pelo link entra sozinho na lista de clientes.",
        ],
      },
      {
        title: "Uma semana com as duas agendas",
        paragraphs: [
          "Na primeira semana, vale manter o caderno ao lado e conferir os dois no fim do dia. Depois disso, a agenda online passa a ser a única, e o caderno fica para anotações.",
        ],
      },
    ],
    faq: [
      {
        question: "Preciso de computador?",
        answer: "Não. O painel foi feito para o celular, e também abre no computador.",
      },
      {
        question: "E se um cliente marcar pelo WhatsApp como antes?",
        answer:
          "Você lança o horário na agenda pelo painel em poucos toques, e ele fica protegido contra marcação duplicada como os outros.",
      },
    ],
    related: ["autonomo", "agenda-gratis", "sem-app"],
    updatedAt: "2026-11-06",
  },
  {
    slug: "pacotes-de-sessoes",
    label: "Controle de pacotes de sessões",
    title: "Como controlar pacotes de sessões na agenda | MeetChat",
    description:
      "Registre pacotes de sessões e veja o saldo de cada cliente sem planilha: cada atendimento concluído desconta uma sessão, e o histórico fica na ficha do cliente.",
    h1: "Como controlar pacotes de sessões na agenda",
    answer:
      "Para controlar pacotes de sessões sem planilha, registre o pacote na ficha do cliente e deixe a agenda descontar uma sessão a cada atendimento concluído. No MeetChat você cria o pacote (serviço, número de sessões e preço), associa ao cliente quando ele paga e acompanha o saldo na ficha.",
    sections: [
      {
        title: "Onde os pacotes costumam se perder",
        list: [
          "O saldo fica no caderno ou na memória, e cliente e profissional lembram números diferentes.",
          "A sessão é descontada no dia errado, ou não é descontada.",
          "Não fica claro quantas sessões ainda faltam.",
        ],
      },
      {
        title: "Como funciona no MeetChat",
        ordered: true,
        list: [
          "Crie o pacote: serviço, quantidade de sessões e preço.",
          "Quando o cliente pagar (fora da plataforma), registre o pacote na ficha dele.",
          "Ao marcar o horário, escolha usar o pacote.",
          "Ao concluir o atendimento, uma sessão é descontada do saldo.",
        ],
      },
      {
        title: "Para que tipo de negócio serve",
        paragraphs: [
          "Funciona para qualquer serviço feito em sessões: tratamentos estéticos, depilação, fisioterapia, pilates, aulas e massagem, por exemplo.",
        ],
      },
    ],
    faq: [
      {
        question: "O pagamento do pacote passa pelo MeetChat?",
        answer:
          "Não. O pagamento é combinado entre você e o cliente, fora da plataforma; o MeetChat controla as sessões.",
      },
      {
        question: "Onde vejo o saldo?",
        answer: "O saldo de cada pacote fica na ficha do cliente, no seu painel.",
      },
    ],
    related: ["multiagenda", "reduzir-faltas", "autonomo"],
    updatedAt: "2026-11-06",
  },
  {
    slug: "lista-de-espera",
    label: "Lista de espera para encaixe",
    title: "Lista de espera automática para encaixe de horário | MeetChat",
    description:
      "Quando um horário é cancelado, quem está na lista de espera daquele dia recebe um e-mail e o primeiro a confirmar fica com a vaga. Veja como funciona.",
    h1: "Lista de espera automática para encaixe de horário",
    answer:
      "Uma lista de espera automática preenche horários cancelados sem você mandar mensagem para ninguém. No MeetChat, quando não há horário no dia que o cliente quer, ele pode entrar na lista; se um horário daquele dia e serviço for cancelado, a lista recebe um e-mail na ordem de chegada e quem confirmar primeiro fica com a vaga.",
    sections: [
      {
        title: "O problema do horário que vaga em cima da hora",
        paragraphs: [
          "Um cancelamento de última hora quase sempre vira horário vazio: até você lembrar quem queria aquele dia e mandar mensagem, já passou.",
        ],
      },
      {
        title: "Como funciona",
        ordered: true,
        list: [
          "O cliente procura um dia sem horário livre e entra na lista de espera pelo chat.",
          "Um horário daquele dia e serviço é cancelado.",
          "Quem está na lista recebe um e-mail, na ordem de chegada.",
          "O primeiro a confirmar fica com o horário, e você recebe o aviso.",
        ],
      },
      {
        title: "O que você acompanha",
        paragraphs: [
          "No painel você vê quem está na lista, de qual dia e serviço, e pode marcar quem já foi atendido.",
        ],
      },
    ],
    faq: [
      {
        question: "Preciso fazer alguma coisa quando alguém cancela?",
        answer: "Não. O aviso para a lista sai sozinho; você só recebe o novo agendamento.",
      },
      {
        question: "Está em qual plano?",
        answer: `No plano Completo (${PRICE_TEXT.monthly}), junto com as outras ferramentas.`,
      },
    ],
    related: ["reduzir-faltas", "lembrete-automatico", "multiagenda"],
    updatedAt: "2026-11-06",
  },
];

export function getIntentPage(slug: string): IntentPage | null {
  return INTENT_PAGES.find((p) => p.slug === slug) ?? null;
}

/** Index page of the section (/agendamento). */
export const INTENT_INDEX = {
  title: "Guias de agendamento online | MeetChat",
  description:
    "Guias práticos sobre agendamento online: link na bio, WhatsApp, lembretes, faltas, sinal pelo Pix, preços, pacotes, lista de espera e equipe.",
  h1: "Guias de agendamento online",
  intro:
    "Respostas diretas para quem trabalha com hora marcada e quer que o cliente agende sozinho. Cada guia explica o que funciona e o que o MeetChat faz, sem promessa.",
  updatedAt: "2026-10-16",
};
