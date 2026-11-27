import {
  PLAN_NAME,
  PLAN_PRICES,
  PREMIUM_PLAN_NAME,
  PREMIUM_PRICE_TEXT,
  PRICE_TEXT,
  reais,
  SITE_PLAN_NAME,
  SITE_PRICE_TEXT,
  TRIAL_DAYS,
} from "@/lib/plans";

export interface PlanCard {
  name: string;
  /** Big price ("R$ 23,90"). */
  price: string;
  period: string;
  /** Under the price: the yearly option. */
  note: string;
  tagline: string;
  includes: string[];
  cta: string;
}

/** The single plan as shown in the panel (Assinatura); prices are not on the public pages. */
export const PLAN_CARD: PlanCard = {
  name: PLAN_NAME,
  price: reais(PLAN_PRICES.complete.monthly),
  period: "/mês",
  note: `ou ${PRICE_TEXT.yearlyPerMonth} no anual (${PRICE_TEXT.yearly}, ${PRICE_TEXT.yearlySavings})`,
  tagline: "A agenda online, sem limite de agendamentos.",
  includes: [
    "Agendamentos ilimitados pelo chat, 24h",
    "Chat de agendamento no seu site e no Instagram",
    "Clientes, financeiro, vendas e estatísticas",
    "Equipe e Google Agenda",
  ],
  cta: `Testar ${TRIAL_DAYS} dias grátis`,
};

/** "Site + Agenda" (2026-11-05): Completo + the landing page at /<slug>/site. */
export const SITE_PLAN_CARD: PlanCard = {
  name: SITE_PLAN_NAME,
  price: reais(PLAN_PRICES.site.monthly),
  period: "/mês",
  note: `ou ${SITE_PRICE_TEXT.yearlyPerMonth} no anual (${SITE_PRICE_TEXT.yearly}, ${SITE_PRICE_TEXT.yearlySavings})`,
  tagline: "Tudo do Completo + seu site profissional, pronto e no Google.",
  includes: [
    "Seu site pronto, na cor do seu negócio",
    "Você muda cores, fotos e textos quando quiser",
    "Feito para aparecer no Google",
    "Todo botão de agendar abre o seu chat",
    "Tudo do plano Completo",
  ],
  cta: `Testar ${TRIAL_DAYS} dias grátis`,
};

/**
 * Premium (2026-11-27): Site + Agenda + the deposit by Pix with the receipt read on the spot and
 * the reminder to the customer by notification.
 */
export const PREMIUM_PLAN_CARD: PlanCard = {
  name: PREMIUM_PLAN_NAME,
  price: reais(PLAN_PRICES.premium.monthly),
  period: "/mês",
  note: `ou ${PREMIUM_PRICE_TEXT.yearlyPerMonth} no anual (${PREMIUM_PRICE_TEXT.yearly}, ${PREMIUM_PRICE_TEXT.yearlySavings})`,
  tagline: "Tudo do Site + Agenda, com sinal pelo Pix e lembrete para o cliente não faltar.",
  includes: [
    "Sinal pelo Pix, direto na sua conta",
    "Comprovante conferido na hora: o horário é confirmado sozinho",
    "Lembrete no celular do cliente, 1 dia e 2 horas antes",
    "Tudo do Site + Agenda",
  ],
  cta: `Testar ${TRIAL_DAYS} dias grátis`,
};

/** The booking plans, for the subscription screen. */
export const PLAN_CARDS = {
  complete: PLAN_CARD,
  site: SITE_PLAN_CARD,
  premium: PREMIUM_PLAN_CARD,
} as const;
