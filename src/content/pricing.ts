import { PLAN_NAME, PLAN_PRICES, PRICE_TEXT, reais, TRIAL_DAYS } from "@/lib/plans";

/**
 * Texts of /precos (D1, 2026-10-16). Values always come from src/lib/plans.ts, never typed here.
 * "Grátis" is the waiting mode (the link and the chat stay up and end on WhatsApp); nothing here
 * promises it "para sempre".
 */
export const PRICING = {
  meta: {
    title: "Preços do MeetChat: grátis no modo WhatsApp ou plano completo",
    description: `Comece grátis, sem cartão: seu link no ar com pedidos pelo WhatsApp. Agenda completa e lembretes automáticos no plano ${PLAN_NAME}, por ${PRICE_TEXT.monthly}.`,
  },
  title: "Preços",
  intro: `Comece grátis, sem cartão. Todo cadastro começa com ${TRIAL_DAYS} dias do plano ${PLAN_NAME}. Depois, você escolhe: continuar grátis no modo WhatsApp ou assinar.`,
  tiers: [
    {
      id: "gratis",
      name: "Grátis (modo WhatsApp)",
      summary: "Seu link no ar, com os pedidos chegando pelo WhatsApp.",
      price: "R$ 0",
      priceNote: "Sem cartão.",
      highlight: false,
      items: [
        { included: true, text: "Link de agendamento e chat no ar" },
        {
          included: true,
          text: "O cliente escolhe serviço, dia e turno e chama você no WhatsApp com a mensagem pronta",
        },
        { included: false, text: "Horário reservado automaticamente na sua agenda" },
        { included: false, text: "Lembretes automáticos" },
        { included: false, text: "Agenda, clientes e financeiro no painel" },
        { included: false, text: "Sem o selo “Agende também com o MeetChat”" },
      ],
    },
    {
      id: "completo",
      name: PLAN_NAME,
      summary: "O cliente marca sozinho e o horário já fica na sua agenda.",
      price: PRICE_TEXT.monthly,
      priceNote: `ou ${PRICE_TEXT.yearlyPerMonth} no anual (${PRICE_TEXT.yearly}). ${TRIAL_DAYS} dias grátis para testar, sem cartão.`,
      highlight: true,
      items: [
        { included: true, text: "Agendamentos ilimitados, com o horário reservado na hora" },
        { included: true, text: "Confirmação e lembrete automáticos para o cliente" },
        { included: true, text: "Agenda, clientes e financeiro simples" },
        { included: true, text: "Pacotes, combos, cupons e lista de espera" },
        { included: true, text: "Sinal ou pagamento pelo Pix, direto na sua chave" },
        { included: true, text: "Google Agenda e chat de agendamento no seu site" },
        {
          included: true,
          text: `1 profissional incluso; cada profissional a mais custa ${PRICE_TEXT.extraProfessional} (${reais(PLAN_PRICES.extraProfessional.yearly)}/ano no anual)`,
        },
        { included: true, text: "Sem o selo “Agende também com o MeetChat”" },
      ],
    },
  ],
  cta: "Comece grátis, sem cartão",
  ctaNote: "Pronto em 1 minuto.",
  faq: [
    {
      question: "O que acontece quando acaba o teste?",
      answer:
        "Se você não assinar, a conta passa para o modo WhatsApp: o link continua no ar e os pedidos dos clientes chegam pelo seu WhatsApp. Nada é apagado, e os horários já marcados continuam valendo. Ao assinar, tudo volta na hora.",
    },
    {
      question: "Preciso de cartão para começar?",
      answer: `Não. O teste de ${TRIAL_DAYS} dias e o modo WhatsApp não pedem cartão. O teste vale uma vez por pessoa.`,
    },
    {
      question: "Posso cancelar quando quiser?",
      answer:
        "Sim, sem multa e sem fidelidade. O plano continua até o fim do período já pago e, depois, a conta passa para o modo WhatsApp.",
    },
    {
      question: "O MeetChat recebe o dinheiro dos meus clientes?",
      answer:
        "Não. O sinal pelo Pix é pago direto na sua chave. O MeetChat cobra só a assinatura do plano.",
    },
  ],
};
