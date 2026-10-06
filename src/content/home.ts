import { PRICE_TEXT, TRIAL_DAYS } from "@/lib/plans";

type Icon =
  | "moon"
  | "ghost"
  | "calendar-x"
  | "calendar-check"
  | "bell"
  | "smartphone"
  | "link"
  | "layout"
  | "pointer";

/** Texts of a sales page: the home and each niche page share this shape. */
export interface HomeContent {
  meta: { title: string; description: string };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    note: string;
  };
  /** Unique text about the niche (niche pages), right after the top. */
  intro?: { title: string; paragraphs: readonly string[] };
  pains: { title: string; items: readonly { icon: Icon; text: string }[] };
  steps: { title: string; items: readonly string[] };
  gains: { title: string; items: readonly { icon: Icon; text: string }[] };
  audience: { title: string; chips: readonly { label: string; href: string }[] };
  pricing: {
    title: string;
    tagline: string;
    planName: string;
    trial: string;
    includes: readonly string[];
    extra: string;
  };
  faq: { title: string; items: readonly { question: string; answer: string }[] };
  closing: { title: string; cta: string };
  footer: { links: readonly { label: string; href: string }[] };
  demo: readonly {
    business: string;
    customer: string;
    service: string;
    times: readonly string[];
  }[];
}

/**
 * Texts of the home page (sales page of the MeetChat site). Prices always come from PRICE_TEXT /
 * PLAN_PRICES; niche routes are the existing niche pages.
 */
export const HOME: HomeContent = {
  meta: {
    title: "MeetChat · Seus clientes agendam sozinhos",
    description:
      "Coloque seu link na bio. O cliente escolhe o serviço e o horário, e já cai na sua agenda, 24 horas por dia.",
  },
  hero: {
    badge: "Para quem trabalha com hora marcada",
    title: "Seus clientes agendam sozinhos. Você para de responder mensagem.",
    subtitle:
      "Coloque seu link na bio. O cliente escolhe o serviço e o horário, e já cai na sua agenda, 24 horas por dia.",
    primaryCta: "Criar meu link grátis",
    secondaryCta: "Ver como fica o meu",
    note: `${TRIAL_DAYS} dias grátis · sem cartão · pronto em 1 minuto`,
  },
  pains: {
    title: "Quanto tempo você perde respondendo “tem horário?”",
    items: [
      { icon: "moon", text: "Mensagem às 23h, e você responde de pijama." },
      { icon: "ghost", text: "O cliente pergunta, some e não marca." },
      { icon: "calendar-x", text: "Cliente marca e não aparece." },
    ],
  },
  steps: {
    title: "Como funciona",
    items: [
      "Crie seu link em 1 minuto.",
      "Coloque na bio do Instagram e no WhatsApp.",
      "Os clientes agendam sozinhos e você recebe o aviso no celular.",
    ],
  },
  gains: {
    title: "O que você ganha",
    items: [
      { icon: "calendar-check", text: "Agenda cheia sem responder mensagem" },
      { icon: "bell", text: "Lembrete automático para o cliente não faltar" },
      { icon: "smartphone", text: "Aviso no seu celular a cada agendamento" },
      { icon: "link", text: "Funciona no Instagram, no WhatsApp e no seu site" },
      { icon: "layout", text: "Sua agenda organizada num lugar só" },
      { icon: "pointer", text: "Seu cliente não baixa nada" },
    ],
  },
  audience: {
    title: "Para quem é",
    chips: [
      { label: "Sobrancelha", href: "/cilios-e-sobrancelhas" },
      { label: "Unhas", href: "/manicure" },
      { label: "Cabelo", href: "/beleza" },
      { label: "Barbearia", href: "/barbearia" },
      { label: "Estética", href: "/estetica" },
      { label: "Psicologia", href: "/psicologia" },
      { label: "e outros", href: "/comecar" },
    ],
  },
  pricing: {
    title: "Um preço simples",
    tagline: "Um cliente que não falta já paga o mês.",
    planName: "MeetChat completo",
    trial: `${TRIAL_DAYS} dias grátis, sem cartão`,
    includes: [
      "Agendamento pelo link, 24 horas por dia",
      "Lembretes automáticos para o cliente",
      "Aviso no seu celular a cada agendamento",
      "Agenda, clientes e financeiro simples",
      "Botão de agendar no seu site",
    ],
    extra: `1 profissional incluso · cada extra ${PRICE_TEXT.extraProfessional}`,
  },
  faq: {
    title: "Perguntas frequentes",
    items: [
      {
        question: "Preciso de cartão?",
        answer: `Não. São ${TRIAL_DAYS} dias grátis com tudo liberado, sem cartão. Depois, ${PRICE_TEXT.summary}.`,
      },
      {
        question: "Meu cliente precisa baixar app?",
        answer: "Não. O link abre direto no navegador do celular, como uma conversa.",
      },
      {
        question: "Funciona com WhatsApp?",
        answer:
          "Sim. Coloque o link no status, na mensagem de ausência e na bio. O cliente toca, escolhe o horário e agenda, sem você precisar responder.",
      },
      {
        question: "Posso cancelar quando quiser?",
        answer:
          "Sim, sem multa e sem fidelidade. Seu link continua no ar e os pedidos passam a chegar pelo seu WhatsApp. Nada é apagado.",
      },
      {
        question: "Atende mais de um profissional?",
        answer: `Sim. Cada profissional tem a própria agenda. O plano inclui 1 profissional e cada extra custa ${PRICE_TEXT.extraProfessional}.`,
      },
      {
        question: "E se eu não souber mexer?",
        answer:
          "Em 1 minuto o MeetChat monta seu link com os serviços do seu ramo. Depois é só ajustar preços e horários, pelo celular mesmo.",
      },
    ],
  },
  closing: {
    title: "Seu link de agendamento pronto em 1 minuto.",
    cta: "Criar meu link grátis",
  },
  footer: {
    links: [
      { label: "Termos de uso", href: "/termos" },
      { label: "Privacidade", href: "/privacidade" },
      // Support is by e-mail only.
      { label: "Contato", href: "mailto:contato@brandcodesolutions.com.br" },
      { label: "Entrar", href: "/entrar" },
    ],
  },
  /** Animated phone: one example per niche, alternating. */
  demo: [
    {
      business: "Studio Lumi",
      customer: "Mariana",
      service: "Design de sobrancelha",
      times: ["09:30", "14:00", "16:30"],
    },
    {
      business: "Barbearia do Zé",
      customer: "Rafael",
      service: "Corte + barba",
      times: ["10:00", "18:30", "19:30"],
    },
    {
      business: "Espaço Escuta",
      customer: "Carla",
      service: "Sessão individual",
      times: ["08:00", "17:00", "19:00"],
    },
    {
      business: "Esmalteria Flor",
      customer: "Juliana",
      service: "Manicure",
      times: ["11:00", "15:00", "17:30"],
    },
  ],
};
