import type { FaqItem, GuideSection } from "./niche-guides/types";

/**
 * Blog (/recursos/<slug>) and help center (/ajuda/<slug>) articles (Fase 7). Typed "frontmatter"
 * in TypeScript, like the rest of src/content (no MDX dependency). Only `published` articles get
 * a page, the sitemap and links. Real author and dates only; no invented numbers.
 */
export type ArticleSection = "recursos" | "ajuda";

export interface ArticleAuthor {
  name: string;
  type: "Person" | "Organization";
  url?: string;
}

export interface Article {
  slug: string;
  section: ArticleSection;
  status: "published" | "draft";
  title: string;
  description: string;
  h1: string;
  /** Direct answer in the first lines. */
  summary: string;
  author: ArticleAuthor;
  /** YYYY-MM-DD. */
  datePublished: string;
  dateModified: string;
  category: string;
  /** Niche brand key when the article is about one niche. */
  niche?: string;
  keywords: string[];
  sections: GuideSection[];
  faq?: FaqItem[];
  /** Public sources quoted in the text. */
  sources?: { label: string; url: string }[];
  /** Internal pages related to the article (paths). */
  related: string[];
  /** Call to action at the end (title of the box). */
  cta: string;
}

// TODO(conteúdo): trocar pela pessoa autora real (nome e página) quando houver.
const TEAM: ArticleAuthor = { name: "Equipe MeetChat", type: "Organization" };

export const ARTICLES: readonly Article[] = [
  {
    slug: "politica-de-faltas-e-cancelamento",
    section: "recursos",
    status: "published",
    title: "Política de faltas e cancelamento: como escrever a sua | MeetChat",
    description:
      "O que uma política de faltas e cancelamento precisa dizer, onde mostrar para o cliente e um modelo para adaptar ao seu negócio com hora marcada.",
    h1: "Política de faltas e cancelamento: como escrever a sua",
    summary:
      "Uma política de faltas e cancelamento diz ao cliente, antes de marcar, com quanta antecedência ele precisa avisar, o que acontece se faltar e como remarcar. Ela funciona quando é curta, aparece antes do agendamento e é aplicada do mesmo jeito para todos.",
    author: TEAM,
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
    category: "Faltas e cancelamentos",
    keywords: ["política de cancelamento", "política de faltas", "no-show", "sinal"],
    sections: [
      {
        title: "Por que escrever uma política",
        paragraphs: [
          "Sem regra combinada, cada falta vira uma conversa desconfortável: cobrar ou não cobrar, aceitar a desculpa ou não. Com a regra escrita e mostrada antes, a decisão já foi tomada, e o cliente sabe o que esperar.",
          "A política também ajuda quem quer cumprir: dizer até quando dá para remarcar sem problema é um convite para avisar em vez de sumir.",
        ],
      },
      {
        title: "O que a política precisa dizer",
        list: [
          "Até quando o cliente pode remarcar ou cancelar sem custo (por exemplo, até 24 horas antes).",
          "O que acontece com quem falta sem avisar: perde o sinal, paga uma parte, ou passa a precisar de sinal nos próximos horários.",
          "Como funciona o atraso: até quantos minutos o atendimento acontece no tempo que sobrar.",
          "Como remarcar: pelo link do lembrete, pelo WhatsApp ou outro caminho que você prefira.",
          "O que acontece se você precisar remarcar: como avisa e que opções oferece.",
        ],
      },
      {
        title: "Modelo para adaptar",
        paragraphs: [
          "Ajuste os prazos e valores ao seu negócio. Se tiver dúvida sobre cobrar por faltas na sua área, consulte o seu conselho profissional ou um profissional de direito.",
          "“Para remarcar ou cancelar sem custo, avise com pelo menos 24 horas de antecedência, pelo link do lembrete ou pelo WhatsApp. Faltas sem aviso perdem o sinal pago. Atrasos de até 15 minutos são atendidos no tempo restante do horário. Se eu precisar remarcar, aviso com antecedência e ofereço novos horários.”",
        ],
      },
      {
        title: "Onde mostrar a política",
        list: [
          "Na descrição do seu perfil, que o cliente vê antes de agendar.",
          "Na política do sinal pelo Pix, que o cliente aceita antes de pagar (no MeetChat, o texto e a data do aceite ficam registrados).",
          "Na mensagem de confirmação, se você confirma horários pelo WhatsApp.",
        ],
      },
      {
        title: "Aplique do mesmo jeito para todos",
        paragraphs: [
          "Uma regra que vale para uns e não para outros perde a força rápido. Se abrir exceção, que seja por um motivo claro, como um imprevisto de saúde. No MeetChat, quem você marcou como “não recebi o Pix” passa a ter de anexar o comprovante nos próximos agendamentos, sem você precisar repetir a regra.",
        ],
      },
    ],
    faq: [
      {
        question: "Preciso cobrar sinal para ter uma política de faltas?",
        answer:
          "Não. A política pode ser só sobre avisar com antecedência. O sinal é uma ferramenta a mais para os serviços em que a falta pesa mais.",
      },
      {
        question: "Quanto tempo de antecedência pedir?",
        answer:
          "Depende de quanto tempo você leva para preencher um horário liberado. Se costuma encaixar alguém no mesmo dia, um prazo curto basta; se não, peça mais antecedência.",
      },
    ],
    related: ["/agendamento/reduzir-faltas", "/ferramentas/calculadora-de-faltas"],
    cta: "Mostre sua política no perfil e peça sinal pelo Pix onde fizer sentido.",
  },
  {
    slug: "link-de-agendamento-no-google",
    section: "recursos",
    status: "published",
    title: "Como colocar o link de agendamento no Google (Perfil da Empresa)",
    description:
      "Passo a passo para adicionar o seu link de agendamento ao Perfil da Empresa no Google, pela Pesquisa ou pelo Maps, segundo a ajuda oficial do Google.",
    h1: "Como colocar o link de agendamento no seu Perfil da Empresa no Google",
    summary:
      "Pelo Perfil da Empresa no Google você pode adicionar um link de agendamento que aparece para quem encontra o seu negócio na Pesquisa e no Maps. Na Pesquisa, abra o seu perfil, selecione Agendamento, depois Adicionar link, cole o seu link e salve.",
    author: TEAM,
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
    category: "Divulgação",
    keywords: ["Perfil da Empresa no Google", "Google Meu Negócio", "link de agendamento"],
    sections: [
      {
        title: "Antes de começar",
        list: [
          "Você precisa gerenciar o Perfil da Empresa do seu negócio no Google.",
          "Tenha o seu link de agendamento em mãos (no MeetChat, ele fica no formato meetchat.com.br/seu-negocio).",
        ],
      },
      {
        title: "Pela Pesquisa Google",
        ordered: true,
        list: [
          "Abra o seu Perfil da Empresa na Pesquisa Google.",
          "Selecione Agendamento.",
          "Selecione Adicionar link (ou Adicionar outro link, se já houver algum).",
          "Cole o seu link de agendamento.",
          "Selecione Salvar.",
        ],
      },
      {
        title: "Pelo Google Maps",
        ordered: true,
        list: [
          "Abra o seu Perfil da Empresa no Google Maps.",
          "Selecione Editar perfil e o tipo de transação (agendamento).",
          "Selecione Adicionar link.",
          "Cole o seu link de agendamento e selecione Salvar.",
        ],
      },
      {
        title: "Depois de salvar",
        paragraphs: [
          "Segundo a ajuda do Google, é possível adicionar até 10 links por categoria. Use o mesmo link que está no seu Instagram e no seu WhatsApp, para o cliente encontrar a mesma agenda em qualquer lugar.",
          "Confira o perfil depois de alguns dias: o Google pode levar um tempo para mostrar as alterações.",
        ],
      },
    ],
    faq: [
      {
        question: "O MeetChat é um parceiro do “Reservar com o Google”?",
        answer:
          "Não. Você adiciona o seu link do MeetChat como um link próprio de agendamento, como o Google permite.",
      },
      {
        question: "Preciso pagar ao Google para adicionar o link?",
        answer:
          "A ajuda do Google sobre links de empresas locais não fala em cobrança para adicionar o link. Confira a página oficial em caso de dúvida.",
      },
    ],
    sources: [
      {
        label: "Ajuda do Perfil da Empresa no Google: links de empresas locais",
        url: "https://support.google.com/business/answer/6218037?hl=pt-BR",
      },
    ],
    related: ["/agendamento/link-na-bio", "/agendamento/pelo-whatsapp"],
    cta: "Ainda não tem o link? Ele fica pronto em 1 minuto.",
  },
  {
    slug: "como-organizar-a-agenda-do-salao",
    section: "recursos",
    status: "published",
    title: "Como organizar a agenda do salão de beleza | MeetChat",
    description:
      "Duração real de cada serviço, intervalos, pausas, agenda por profissional e regras de antecedência: como montar a agenda do salão para ela não estourar.",
    h1: "Como organizar a agenda do salão de beleza",
    summary:
      "A agenda do salão fica organizada quando cada serviço tem a duração real, há intervalo entre atendimentos, cada profissional tem os próprios horários e existem regras claras de antecedência. Com isso definido uma vez, o sistema de agendamento só oferece horários que cabem de verdade.",
    author: TEAM,
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
    category: "Organização da agenda",
    niche: "beauty",
    keywords: ["agenda de salão", "organizar agenda", "salão de beleza"],
    sections: [
      {
        title: "1. Cronometre os serviços de verdade",
        paragraphs: [
          "Muita agenda estoura porque a escova está cadastrada com 30 minutos e leva 45. Durante uma ou duas semanas, anote quanto cada serviço leva de fato, do momento em que a cliente senta até ela sair.",
          "Use esse tempo real no cadastro. Serviços longos, como mechas e progressiva, ocupam o tempo inteiro na agenda e não deixam outro atendimento ser marcado por cima.",
        ],
      },
      {
        title: "2. Deixe intervalo entre atendimentos",
        paragraphs: [
          "Limpar a bancada, esterilizar materiais e respirar fazem parte do trabalho. Um intervalo curto entre atendimentos evita que um pequeno atraso se acumule até o fim do dia.",
        ],
      },
      {
        title: "3. Uma agenda por profissional",
        list: [
          "Cada profissional com os próprios dias, horários e pausas.",
          "Cada uma oferecendo só os serviços que faz.",
          "A cliente escolhendo com quem quer ser atendida, ou a primeira livre.",
        ],
      },
      {
        title: "4. Regras de antecedência",
        paragraphs: [
          "Defina com quanto tempo de antecedência mínima a cliente pode marcar (para você não ser surpreendida por um horário marcado cinco minutos antes) e até quantos dias à frente a agenda fica aberta.",
        ],
      },
      {
        title: "5. Proteja os horários longos",
        paragraphs: [
          "Para os serviços que tomam a tarde, considere pedir sinal pelo Pix e mostrar uma política de faltas clara. Quando alguém cancela, a lista de espera ajuda a preencher o horário.",
        ],
      },
    ],
    faq: [
      {
        question: "Vale a pena deixar a cliente marcar sozinha?",
        answer:
          "Com durações e regras bem configuradas, sim: ela só vê horários que cabem, e você para de combinar horário por mensagem.",
      },
    ],
    related: ["/beleza", "/beleza/reduzir-faltas", "/agendamento/multiagenda"],
    cta: "Monte a agenda do seu salão com essas regras em poucos minutos.",
  },
  {
    slug: "como-sair-das-buscas",
    section: "ajuda",
    status: "published",
    title: "Como tirar o meu perfil das buscas | Ajuda MeetChat",
    description:
      "Como esconder o seu perfil do portal, do diretório do MeetChat e do Google, mantendo o seu link de agendamento funcionando para quem já o tem.",
    h1: "Como tirar o meu perfil das buscas",
    summary:
      "No painel, abra Configurações e ligue “Não aparecer nas buscas”. O seu perfil sai do portal e do diretório do MeetChat e passa a pedir ao Google e a outros buscadores para não mostrá-lo. O seu link continua funcionando para quem já o tem.",
    author: TEAM,
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
    category: "Perfil e privacidade",
    keywords: ["privacidade", "perfil", "buscas"],
    sections: [
      {
        title: "Passo a passo",
        ordered: true,
        list: [
          "Entre no painel.",
          "Abra Configurações.",
          "Ligue “Não aparecer nas buscas” e salve.",
        ],
      },
      {
        title: "O que muda",
        list: [
          "O perfil passa a sair com a marcação “noindex”, que pede aos buscadores para não mostrá-lo.",
          "Ele sai do portal, do diretório por cidade e do mapa do site do MeetChat.",
          "Buscadores podem levar alguns dias para remover uma página que já mostravam.",
        ],
      },
      {
        title: "O que não muda",
        paragraphs: [
          "O link continua no ar: quem tem o seu link (no Instagram, no WhatsApp ou salvo) agenda normalmente.",
        ],
      },
    ],
    related: ["/ajuda/como-o-cliente-remarca-ou-cancela", "/privacidade"],
    cta: "Ainda não tem conta? Seu link fica pronto em 1 minuto.",
  },
  {
    slug: "como-o-cliente-remarca-ou-cancela",
    section: "ajuda",
    status: "published",
    title: "Como o cliente remarca ou cancela um horário | Ajuda MeetChat",
    description:
      "Como o cliente remarca ou cancela um horário marcado pelo seu link do MeetChat, e o que acontece quando ele não informou o e-mail.",
    h1: "Como o cliente remarca ou cancela um horário",
    summary:
      "O cliente que informou o e-mail ao agendar remarca ou cancela pelos botões do e-mail de confirmação e do lembrete. Ao remarcar, ele escolhe outro horário livre. Quem não informou e-mail fala com você, e você ajusta o horário no painel.",
    author: TEAM,
    datePublished: "2026-10-16",
    dateModified: "2026-10-16",
    category: "Agendamentos",
    keywords: ["remarcar", "cancelar", "lembrete"],
    sections: [
      {
        title: "Com e-mail informado",
        ordered: true,
        list: [
          "O cliente abre o e-mail de confirmação ou o lembrete enviado um dia antes.",
          "Toca em “Preciso remarcar” e escolhe outro horário livre, ou em “Cancelar horário”.",
          "A agenda se ajusta, e você recebe o aviso.",
        ],
      },
      {
        title: "Sem e-mail informado",
        paragraphs: [
          "O e-mail é opcional no agendamento. Sem ele, o cliente não recebe confirmação nem lembrete e combina a mudança com você pelo WhatsApp, que fica salvo no agendamento.",
        ],
      },
      {
        title: "Quando o horário liberado tem fila",
        paragraphs: [
          "Se houver lista de espera para aquele dia e serviço, quem está na lista recebe um e-mail, e o primeiro a confirmar fica com o horário.",
        ],
      },
    ],
    related: ["/agendamento/lembrete-automatico", "/recursos/politica-de-faltas-e-cancelamento"],
    cta: "Quer que seus clientes remarquem sozinhos? Crie seu link.",
  },
];

export const ARTICLE_SECTIONS: Record<
  ArticleSection,
  { name: string; title: string; description: string; h1: string; intro: string; updatedAt: string }
> = {
  recursos: {
    name: "Recursos",
    title: "Recursos para quem atende com hora marcada | MeetChat",
    description:
      "Artigos práticos sobre agenda, faltas, divulgação e atendimento para negócios com hora marcada.",
    h1: "Recursos",
    intro: "Artigos práticos para organizar a agenda, reduzir faltas e receber mais agendamentos.",
    updatedAt: "2026-10-16",
  },
  ajuda: {
    name: "Ajuda",
    title: "Central de ajuda do MeetChat",
    description:
      "Respostas sobre o MeetChat: perfil, privacidade, agendamentos, remarcações e cancelamentos.",
    h1: "Central de ajuda",
    intro: "Respostas rápidas sobre como o MeetChat funciona. Suporte só por e-mail.",
    updatedAt: "2026-10-16",
  },
};

export function publishedArticles(section?: ArticleSection): Article[] {
  return ARTICLES.filter((a) => a.status === "published" && (!section || a.section === section));
}

export function getArticle(section: ArticleSection, slug: string): Article | null {
  return publishedArticles(section).find((a) => a.slug === slug) ?? null;
}
