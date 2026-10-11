import { PLAN_NAME, PLAN_PRICES, PRICE_TEXT, reais, TRIAL_DAYS } from "@/lib/plans";

export interface PlanCard {
  name: string;
  /** Big price ("R$ 29,90"). */
  price: string;
  period: string;
  /** Under the price: the yearly option. */
  note: string;
  tagline: string;
  includes: string[];
  cta: string;
}

/** The single plan as shown on the site (home, niche pages, /precos) and in the panel. */
export const PLAN_CARD: PlanCard = {
  name: PLAN_NAME,
  price: reais(PLAN_PRICES.complete.monthly),
  period: "/mês",
  note: `ou ${PRICE_TEXT.yearlyPerMonth} no anual (${PRICE_TEXT.yearly}, ${PRICE_TEXT.yearlySavings})`,
  tagline: "Tudo incluído, sem limite de agendamentos.",
  includes: [
    "Agendamentos ilimitados pelo chat, 24h",
    "Lembretes automáticos para o cliente não faltar",
    "Sinal ou valor total pelo Pix, direto na sua conta, com comprovante",
    "Chat de agendamento no seu site e no Instagram",
    "Clientes, financeiro, vendas e estatísticas",
    "Equipe e Google Agenda",
    "Sem a marca MeetChat no seu chat",
  ],
  cta: `Testar ${TRIAL_DAYS} dias grátis`,
};

export const PLANS_NOTE = `${TRIAL_DAYS} dias grátis, sem cartão, uma vez por conta. Sem fidelidade. 1 profissional incluso; cada extra ${PRICE_TEXT.extraProfessional}. Se não assinar, seu link continua no ar e os pedidos chegam no seu WhatsApp.`;
