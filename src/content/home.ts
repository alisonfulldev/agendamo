import { TRIAL_DAYS } from "@/lib/plans";

import { CONTACT_EMAIL } from "./contact";

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
    /** Small line above the title (accent color, no badge). */
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    note: string;
    /** Short points with icons (computer). */
    points: readonly string[];
    /** A/B test (?v=b): another title and button text, recorded with the sign-ups. */
    variantB?: { title: string; primaryCta: string };
  };
  /** Unique text about the niche (niche pages), after "Como funciona". */
  intro?: { title: string; paragraphs: readonly string[] };
  /** What is particular about scheduling in the niche (published niche guides). */
  notes?: { title: string; items: readonly string[] };
  /** Directory cities of the niche with enough profiles (/{nicho}/{cidade}). */
  cities?: { title: string; links: readonly { label: string; href: string }[] };
  /** Links to the niche's subpages (published niche guides). */
  guides?: { title: string; links: readonly { label: string; href: string }[] };
  steps: { title: string; items: readonly string[] };
  gains: { title: string; items: readonly { icon: Icon; text: string }[] };
  reminders: { title: string; text: string };
  audience: { title: string; chips: readonly { label: string; href: string }[] };
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
 * Texts of the home page (sales page of the MeetChat site). Prices only on /precos (2026-10-16);
 * "grátis" only where true, with the limit next to the promise.
 */
export const HOME: HomeContent = {
  meta: {
    title: "Agendamento online grátis pelo link da bio | MeetChat",
    description:
      "Crie seu link de agendamento em 1 minuto. Seus clientes marcam horário sozinhos pelo Instagram e WhatsApp, 24h. Comece grátis, sem cartão.",
  },
  hero: {
    eyebrow: "Agendamento online grátis",
    title: "Seus clientes marcam horário sozinhos, 24h",
    subtitle:
      "Crie seu link de agendamento em 1 minuto e coloque no Instagram e no WhatsApp. Sem app e sem responder mensagem.",
    primaryCta: "Comece grátis, sem cartão",
    // D1 (2026-10-16): the limit of "grátis" stays next to the promise.
    note: "Grátis no modo WhatsApp. Lembretes automáticos e agenda completa no plano pago.",
    points: [
      "Agenda 24h sem responder mensagem",
      "Lembrete para o cliente não faltar",
      "Funciona no Instagram, WhatsApp e site",
    ],
    variantB: {
      title: "Agendamento online grátis pelo link da bio",
      primaryCta: "Criar meu link de agendamento",
    },
  },
  steps: {
    title: "Como funciona o agendamento online",
    items: [
      "Crie seu link em 1 minuto.",
      "Divulgue no WhatsApp, Instagram, Facebook e no seu site.",
      "Os clientes agendam sozinhos e você recebe o aviso no celular.",
    ],
  },
  gains: {
    title: "Agendamento pelo Instagram e WhatsApp",
    items: [
      { icon: "calendar-check", text: "Agenda cheia sem responder mensagem" },
      { icon: "bell", text: "Lembrete automático para o cliente não faltar" },
      { icon: "smartphone", text: "Aviso no seu celular a cada agendamento" },
      { icon: "link", text: "Funciona no Instagram, no WhatsApp e no seu site" },
      { icon: "layout", text: "Sua agenda organizada num lugar só" },
      { icon: "pointer", text: "Seu cliente não baixa nada" },
    ],
  },
  reminders: {
    title: "Lembrete automático para o cliente não faltar",
    text: "Cada cliente recebe a confirmação na hora e um lembrete antes do horário, com o link para remarcar ou cancelar. Assim o horário vago volta para a agenda, em vez de virar falta.",
  },
  audience: {
    title: "Para salões, barbearias, estética, psicólogos e mais de 30 profissões",
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
  faq: {
    title: "Perguntas frequentes",
    items: [
      {
        question: "O MeetChat é grátis?",
        answer: `Criar a conta e colocar o link no ar é grátis, sem cartão. No modo grátis, o cliente escolhe o serviço, o dia e o turno e chama você no WhatsApp com a mensagem pronta. Lembretes automáticos, horário reservado na hora e a agenda completa são do plano pago. Todo cadastro começa com ${TRIAL_DAYS} dias do plano pago, sem cartão.`,
      },
      {
        question: "Preciso de cartão?",
        answer: "Não. Você cria sua conta e coloca seu link no ar sem cartão.",
      },
      {
        question: "Meu cliente precisa baixar app?",
        answer: "Não. O link abre direto no navegador do celular, como uma conversa.",
      },
      {
        question: "Funciona com WhatsApp?",
        answer:
          "Sim. Coloque o link no status, na mensagem de ausência, no Instagram e no seu site. O cliente toca, escolhe o horário e agenda, sem você precisar responder.",
      },
      {
        question: "Posso cancelar quando quiser?",
        answer:
          "Sim, sem multa e sem fidelidade. Seu link continua no ar e os pedidos passam a chegar pelo seu WhatsApp. Nada é apagado.",
      },
      {
        question: "Atende mais de um profissional?",
        answer:
          "Sim. Cada profissional tem a própria agenda, e o cliente escolhe com quem quer agendar.",
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
    cta: "Comece grátis, sem cartão",
  },
  footer: {
    links: [
      { label: "Preços", href: "/precos" },
      { label: "Guias", href: "/agendamento" },
      { label: "Ferramentas", href: "/ferramentas" },
      { label: "Comparativos", href: "/comparar" },
      { label: "Recursos", href: "/recursos" },
      { label: "Ajuda", href: "/ajuda" },
      { label: "Termos de uso", href: "/termos" },
      { label: "Privacidade", href: "/privacidade" },
      // Support is by e-mail only.
      { label: "Contato", href: `mailto:${CONTACT_EMAIL}` },
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
