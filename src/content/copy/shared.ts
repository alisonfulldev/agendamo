import { PLAN_NAME, PREMIUM_PLAN_NAME, TRIAL_DAYS } from "@/lib/plans";

/** Pieces every landing page shares: the D1 note, true trust facts and the price objection. */
export const NOTE =
  "Comece grátis, sem cartão. Grátis no modo WhatsApp; agenda completa no plano pago, e sinal pelo Pix e lembrete para o cliente no Premium.";
export const TRUST = ["O cliente não baixa app", "Pronto em 1 minuto", "Sem cartão para começar"];
/** Trust line of the health niches (paciente). */
export const HEALTH_TRUST = [
  "O paciente não baixa app",
  "Pronto em 1 minuto",
  "Sem cartão para começar",
];

export const PRICE_OBJECTION = {
  question: "Quanto custa?",
  answer: `Criar a conta e deixar o link no ar é grátis, no modo WhatsApp. A agenda completa começa no plano ${PLAN_NAME}; o sinal pelo Pix e o lembrete para o cliente são do ${PREMIUM_PLAN_NAME}. Todo cadastro tem ${TRIAL_DAYS} dias do ${PREMIUM_PLAN_NAME} para testar, sem cartão.`,
  href: "/precos",
};

/** Notice of the health niches (YMYL), next to the FAQ. */
export const HEALTH_NOTICE =
  "O MeetChat organiza a agenda, os lembretes e o atendimento. Não substitui as orientações do seu conselho profissional nem promete resultado de tratamento.";
