import type { PaidPlan } from "@/lib/db/types";
import {
  FREE_BOOKINGS_PER_CYCLE,
  PLAN_PRICES,
  PRICE_TEXT,
  reais,
  TRIAL_DAYS,
  yearlySavings,
  type PlanTier,
} from "@/lib/plans";

export interface PlanCard {
  tier: PlanTier;
  name: string;
  /** Big price ("Grátis", "R$ 19,90"). */
  price: string;
  period: string;
  /** Under the price: yearly option / "para sempre". */
  note: string;
  tagline: string;
  includes: string[];
  /** Shown faded (e.g. "em breve"). */
  soon?: string[];
  highlight?: boolean;
  cta: string;
}

function paidNote(plan: PaidPlan): string {
  return `ou ${PRICE_TEXT[plan].yearlyPerMonth} no anual (${PRICE_TEXT[plan].yearly}, economize ${reais(yearlySavings(plan))})`;
}

/** The three plans as shown on the site (home, niche pages, /precos) and in the panel. */
export const PLAN_CARDS: PlanCard[] = [
  {
    tier: "free",
    name: "Grátis",
    price: "R$ 0",
    period: "para sempre",
    note: "Sem cartão",
    tagline: `Para começar: ${FREE_BOOKINGS_PER_CYCLE} agendamentos automáticos por mês.`,
    includes: [
      `${FREE_BOOKINGS_PER_CYCLE} agendamentos automáticos pelo chat a cada 30 dias`,
      "Depois do limite, os pedidos chegam pelo seu WhatsApp",
      "Agenda no celular",
    ],
    cta: "Começar grátis",
  },
  {
    tier: "agenda",
    name: "Agenda",
    price: reais(PLAN_PRICES.agenda.monthly),
    period: "/mês",
    note: paidNote("agenda"),
    tagline: "Agendamentos ilimitados e lembretes.",
    includes: [
      "Agendamentos ilimitados pelo chat, 24h",
      "Lembretes automáticos para o cliente",
      "Chat de agendamento no seu site",
      "Clientes, financeiro, vendas e estatísticas",
      "Equipe e Google Agenda",
    ],
    highlight: true,
    cta: `Testar ${TRIAL_DAYS} dias grátis`,
  },
  {
    tier: "pro",
    name: "Pro",
    price: reais(PLAN_PRICES.pro.monthly),
    period: "/mês",
    note: paidNote("pro"),
    tagline: "Tudo do Agenda, com pagamento no agendamento.",
    includes: [
      "Tudo do Agenda",
      "Sinal ou valor total pelo Pix, direto na sua conta",
      "Comprovante enviado no chat, com valor fácil de achar no extrato",
    ],
    cta: `Testar ${TRIAL_DAYS} dias grátis`,
  },
];

export const PLANS_NOTE = `Sem fidelidade. 1 profissional incluso no Agenda e no Pro; cada extra ${PRICE_TEXT.extraProfessional}. O teste de ${TRIAL_DAYS} dias vale uma vez por conta.`;
