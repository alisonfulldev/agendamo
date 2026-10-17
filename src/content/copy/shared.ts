import { PLAN_NAME, TRIAL_DAYS } from "@/lib/plans";

/** Pieces every landing page shares: the D1 note, true trust facts and the price objection. */
export const NOTE =
  "Comece grátis, sem cartão. Grátis no modo WhatsApp; lembretes automáticos e agenda completa no plano pago.";
export const TRUST = ["O cliente não baixa app", "Pronto em 1 minuto", "Sem cartão para começar"];
/** Trust line of the health niches (paciente). */
export const HEALTH_TRUST = [
  "O paciente não baixa app",
  "Pronto em 1 minuto",
  "Sem cartão para começar",
];

export const PRICE_OBJECTION = {
  question: "Quanto custa?",
  answer: `Criar a conta e deixar o link no ar é grátis, no modo WhatsApp. Lembretes automáticos e a agenda completa são do plano ${PLAN_NAME}, com ${TRIAL_DAYS} dias para testar sem cartão.`,
  href: "/precos",
};

/** Notice of the health niches (YMYL), next to the FAQ. */
export const HEALTH_NOTICE =
  "O MeetChat organiza a agenda, os lembretes e o atendimento. Não substitui as orientações do seu conselho profissional nem promete resultado de tratamento.";
