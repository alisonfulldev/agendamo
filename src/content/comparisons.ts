import { PRICE_TEXT, PLAN_NAME } from "@/lib/plans";

import type { FaqItem, GuideSection } from "./niche-guides/types";

/**
 * Comparisons (/comparar/<slug>): "MeetChat vs X", "alternativas a X" and "melhores sistemas
 * para <nicho>". Competitor facts come only from public sources, each with its URL, and the page
 * shows when they were last checked. Unknown = null ("Não verificado"); never filled by guess.
 */
export const COMPARISON_CRITERIA = [
  { key: "booking", label: "Como o cliente agenda" },
  { key: "reminders", label: "Confirmação e lembrete ao cliente" },
  { key: "team", label: "Equipe com uma agenda por profissional" },
  { key: "resources", label: "Salas e aparelhos sem conflito" },
  { key: "payment", label: "Pagamento antecipado" },
  { key: "setup", label: "Onde se configura" },
  { key: "waitlist", label: "Lista de espera" },
  { key: "price", label: "Preço" },
] as const;
export type CriterionKey = (typeof COMPARISON_CRITERIA)[number]["key"];

/** MeetChat side of the table: the product as it is (src/lib/plans.ts, CLAUDE.md). */
export const MEETCHAT_FACTS: Record<CriterionKey, string> = {
  booking:
    "Conversa pelo link, no navegador do celular, sem app nem conta; informa nome e WhatsApp.",
  reminders:
    "Confirmação e lembrete por e-mail um dia antes, com botão para remarcar ou cancelar (plano pago; para quem informa o e-mail).",
  team: "Sim: cada profissional com horários e serviços próprios.",
  resources: "Sim: o horário só é oferecido com a profissional e o recurso livres.",
  payment: "Sinal ou pagamento total pelo Pix, direto na chave do profissional.",
  setup: "Painel pelo celular ou pelo computador.",
  waitlist: "Sim: quem está na lista recebe e-mail quando um horário é liberado.",
  price: `Grátis no modo WhatsApp; plano ${PLAN_NAME} por ${PRICE_TEXT.monthly}.`,
};

export interface Source {
  label: string;
  url: string;
}

export interface Competitor {
  slug: string;
  name: string;
  /** Date the facts were last checked against the sources (YYYY-MM-DD). */
  verifiedAt: string;
  sources: Source[];
  facts: Record<CriterionKey, { value: string; source: string } | null>;
}

const GOOGLE_HELP = "https://support.google.com/calendar/answer/10729749?hl=pt-BR";

export const COMPETITORS: readonly Competitor[] = [
  {
    slug: "google-agenda",
    name: "Google Agenda (agendamento de horários)",
    verifiedAt: "2026-10-16",
    sources: [{ label: "Ajuda do Google Agenda: agendamento de horários", url: GOOGLE_HELP }],
    facts: {
      booking: {
        value:
          "Página de agendamento com os horários disponíveis; dá para exigir verificação por e-mail de quem agenda.",
        source: GOOGLE_HELP,
      },
      reminders: {
        value:
          "E-mails de confirmação e lembretes configuráveis; alguns recursos exigem assinatura do Workspace ou do Google One.",
        source: GOOGLE_HELP,
      },
      team: null,
      resources: null,
      payment: {
        value: "Pagamento pelos horários conectando uma conta da Stripe.",
        source: GOOGLE_HELP,
      },
      setup: {
        value:
          "O agendamento de horários não pode ser criado no app Agenda para Android ou iPhone.",
        source: GOOGLE_HELP,
      },
      waitlist: null,
      price: {
        value: "Alguns recursos de agendamento exigem assinatura do Workspace ou do Google One.",
        source: GOOGLE_HELP,
      },
    },
  },
];

export interface ComparisonPage {
  slug: string;
  kind: "vs" | "alternativas" | "melhores";
  /** Competitor compared ("vs", "alternativas"). */
  competitor?: string;
  /** Niche brand key ("melhores sistemas para <nicho>"). */
  niche?: string;
  /** Off: 404 and out of the sitemap (draft without verified data). */
  published: boolean;
  label: string;
  title: string;
  description: string;
  h1: string;
  answer: string;
  sections: GuideSection[];
  faq: FaqItem[];
  updatedAt: string;
}

export const COMPARISONS: readonly ComparisonPage[] = [
  {
    slug: "meetchat-vs-google-agenda",
    kind: "vs",
    competitor: "google-agenda",
    published: true,
    label: "MeetChat ou Google Agenda",
    title: "MeetChat ou Google Agenda para agendar clientes? | MeetChat",
    description:
      "Comparação entre o MeetChat e o agendamento de horários do Google Agenda para quem atende com hora marcada, com fontes e data da verificação.",
    h1: "MeetChat ou Google Agenda: qual usar para agendar clientes",
    answer:
      "O agendamento de horários do Google Agenda é uma boa opção para quem já organiza a vida no Google e quer uma página simples de reserva, configurada no computador. O MeetChat foi feito para negócios de serviço: o cliente agenda numa conversa pelo celular, cada profissional tem a própria agenda, salas e aparelhos não entram em conflito e o sinal é pago pelo Pix direto na sua chave.",
    sections: [
      {
        title: "Quando o Google Agenda basta",
        list: [
          "Você atende sozinho e já usa o Google Agenda no dia a dia.",
          "Seus horários são parecidos entre si (por exemplo, reuniões de duração fixa).",
          "Você prefere configurar tudo pelo computador.",
        ],
      },
      {
        title: "Quando o MeetChat faz mais sentido",
        list: [
          "Seus clientes chegam pelo Instagram e pelo WhatsApp e agendam pelo celular.",
          "Você tem vários serviços com durações diferentes, ou uma equipe.",
          "Você usa salas, macas ou aparelhos que não podem ser marcados duas vezes.",
          "Você quer pedir sinal pelo Pix nos serviços em que a falta pesa mais.",
        ],
      },
      {
        title: "Dá para usar os dois juntos",
        paragraphs: [
          "O MeetChat se conecta ao Google Agenda: seus compromissos do Google bloqueiam os horários do chat, para nenhum cliente marcar em cima de um compromisso pessoal.",
        ],
      },
    ],
    faq: [
      {
        question: "As informações do Google Agenda estão atualizadas?",
        answer:
          "Elas foram conferidas na página de ajuda oficial do Google na data indicada abaixo da tabela. Recursos e planos mudam; confira a fonte antes de decidir.",
      },
      {
        question: "Por que alguns campos dizem “Não verificado”?",
        answer:
          "Porque só publicamos o que encontramos em fonte pública e oficial. Quando não há confirmação, o campo fica em branco em vez de um palpite.",
      },
    ],
    updatedAt: "2026-10-16",
  },
];

export function getComparison(slug: string): ComparisonPage | null {
  return COMPARISONS.find((c) => c.slug === slug && c.published) ?? null;
}

export function getCompetitor(slug: string | undefined): Competitor | null {
  return COMPETITORS.find((c) => c.slug === slug) ?? null;
}

export const COMPARISONS_INDEX = {
  title: "Comparativos de sistemas de agendamento | MeetChat",
  description:
    "Comparações entre o MeetChat e outras formas de agendar clientes, com fontes públicas e a data em que cada informação foi verificada.",
  h1: "Comparativos",
  intro:
    "Comparamos o MeetChat com outras formas de agendar usando só informações públicas e oficiais, sempre com a fonte e a data da verificação.",
  updatedAt: "2026-10-16",
};
