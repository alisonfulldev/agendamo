import { PLAN_NAME, PLAN_PRICES, PRICE_TEXT, reais, TRIAL_DAYS } from "@/lib/plans";

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
  tagline: "Tudo incluído, sem limite de agendamentos.",
  includes: [
    "Agendamentos ilimitados pelo chat, 24h",
    "Lembretes automáticos para o cliente não faltar",
    "Sinal ou valor total pelo Pix, direto na sua conta",
    "Chat de agendamento no seu site e no Instagram",
    "Clientes, financeiro, vendas e estatísticas",
    "Equipe e Google Agenda",
  ],
  cta: `Testar ${TRIAL_DAYS} dias grátis`,
};
