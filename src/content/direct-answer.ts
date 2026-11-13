import type { BrandConfig } from "@/brands";
import { PRICE_TEXT, SITE_PRICE_TEXT, TRIAL_DAYS } from "@/lib/plans";

/**
 * "Resposta direta" near the top of the home, the niche pages and /precos (2026-11-13): what
 * MeetChat is, for whom, how much it costs and what sets it apart, in 2 or 3 sentences that an
 * answer engine can quote as they are. Prices only from src/lib/plans.ts.
 */
export interface DirectAnswer {
  question: string;
  sentences: string[];
}

const PRICE_SENTENCE = `Você cria o link grátis, sem cartão, e testa o plano Completo por ${TRIAL_DAYS} dias; depois, a agenda online custa ${PRICE_TEXT.monthly} (ou ${SITE_PRICE_TEXT.monthly} com site profissional), e o modo WhatsApp continua grátis.`;

export const HOME_ANSWER: DirectAnswer = {
  question: "O que é o MeetChat?",
  sentences: [
    "O MeetChat é um chat de agendamento online para quem trabalha com hora marcada no Brasil: salões, barbearias, clínicas, consultórios, estúdios, pet shops, professores e outros serviços.",
    "O cliente toca no seu link no Instagram, no WhatsApp ou no Google, escolhe o serviço e um horário livre numa conversa e confirma sem baixar aplicativo, com lembrete por e-mail e sinal pelo Pix pago direto a você.",
    PRICE_SENTENCE,
  ],
};

export function nicheAnswer(brand: BrandConfig): DirectAnswer {
  const niche = brand.niche!;
  return {
    question: `O que é o MeetChat para ${niche.name.toLowerCase()}?`,
    sentences: [
      `O MeetChat é um chat de agendamento online para ${niche.label.toLowerCase()}: o cliente toca no seu link, escolhe o serviço e um horário livre numa conversa e confirma sem baixar aplicativo.`,
      niche.pitch,
      PRICE_SENTENCE,
    ],
  };
}

export const PRICING_ANSWER: DirectAnswer = {
  question: "Quanto custa o MeetChat?",
  sentences: [
    `O plano Completo, com agenda online, lembretes e sinal pelo Pix, custa ${PRICE_TEXT.monthly} ou ${PRICE_TEXT.yearlyPerMonth} no anual; o Site + Agenda, com um site profissional junto, custa ${SITE_PRICE_TEXT.monthly}.`,
    `Todo cadastro começa com ${TRIAL_DAYS} dias grátis do plano pago, sem cartão, e o modo WhatsApp (o cliente escolhe o horário e chama você com a mensagem pronta) continua grátis depois do teste.`,
    "Sem multa e sem fidelidade: ao cancelar, o plano continua até o fim do período já pago.",
  ],
};
