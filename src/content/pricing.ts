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

/**
 * Texts of /precos (D1, 2026-10-16). Values always come from src/lib/plans.ts, never typed here.
 * "Grátis" is the waiting mode (the link and the chat stay up and end on WhatsApp); nothing here
 * promises it "para sempre".
 */
export const PRICING = {
  meta: {
    title: "Preços do MeetChat: agenda online, site e sinal pelo Pix",
    description: `Agenda online por ${PRICE_TEXT.monthly}, site + agenda por ${SITE_PRICE_TEXT.monthly} ou ${PREMIUM_PLAN_NAME} com sinal pelo Pix e lembrete para o cliente por ${PREMIUM_PRICE_TEXT.monthly}. Comece grátis, sem cartão, com ${TRIAL_DAYS} dias para testar.`,
  },
  title: "Preços",
  intro: `Comece grátis, sem cartão. Todo cadastro começa com ${TRIAL_DAYS} dias do ${PREMIUM_PLAN_NAME}, com tudo liberado. Depois, você escolhe: continuar grátis no modo WhatsApp, só a agenda (${PLAN_NAME}), ${SITE_PLAN_NAME} ou ${PREMIUM_PLAN_NAME}.`,
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
        { included: false, text: "Agenda, clientes e financeiro no painel" },
      ],
    },
    {
      id: "completo",
      name: PLAN_NAME,
      summary: "O cliente marca sozinho e o horário já fica na sua agenda.",
      price: PRICE_TEXT.monthly,
      priceNote: `ou ${PRICE_TEXT.yearlyPerMonth} no anual (${PRICE_TEXT.yearly}). ${TRIAL_DAYS} dias grátis para testar, sem cartão.`,
      highlight: false,
      items: [
        { included: true, text: "Agendamentos ilimitados, com o horário reservado na hora" },
        { included: true, text: "Confirmação automática para o cliente" },
        { included: true, text: "Agenda, clientes e financeiro simples" },
        { included: true, text: "Pacotes, combos, cupons e lista de espera" },
        { included: true, text: "Google Agenda e chat de agendamento no seu site" },
        {
          included: true,
          text: `1 profissional incluso; cada profissional a mais custa ${PRICE_TEXT.extraProfessional} (${reais(PLAN_PRICES.extraProfessional.yearly)}/ano no anual)`,
        },
        { included: true, text: "Marca MeetChat discreta, em uma linha pequena no rodapé" },
      ],
    },
    {
      id: "site",
      name: SITE_PLAN_NAME,
      summary: "Seu site profissional pronto para o Google, com a agenda online dentro.",
      price: SITE_PRICE_TEXT.monthly,
      priceNote: `ou ${SITE_PRICE_TEXT.yearly} no anual. Sem fidelidade. ${TRIAL_DAYS} dias grátis para testar, sem cartão.`,
      highlight: false,
      items: [
        {
          included: true,
          text: "Site do seu negócio, na sua cor, com serviços, preços, fotos e avaliações",
        },
        {
          included: true,
          text: "Feito para aparecer no Google, com o seu endereço e a sua cidade",
        },
        { included: true, text: "Você muda modelo, cores, foto e textos quando quiser" },
        { included: true, text: "Todo botão “Agendar” do site abre a sua agenda online" },
        { included: true, text: `Tudo do plano ${PLAN_NAME}` },
      ],
    },
    {
      id: "premium",
      name: PREMIUM_PLAN_NAME,
      summary: "Para o cliente não faltar: sinal pelo Pix e lembrete no celular dele.",
      price: PREMIUM_PRICE_TEXT.monthly,
      priceNote: `ou ${PREMIUM_PRICE_TEXT.yearly} no anual. Sem fidelidade. ${TRIAL_DAYS} dias grátis para testar, sem cartão.`,
      highlight: true,
      items: [
        { included: true, text: "Sinal ou valor total pelo Pix, direto na sua conta" },
        {
          included: true,
          text: "Comprovante conferido na hora: se o valor, o recebedor e a data baterem, o horário é confirmado sozinho",
        },
        {
          included: true,
          text: "Lembrete no celular do cliente, 1 dia e 2 horas antes do horário",
        },
        { included: true, text: `Tudo do ${SITE_PLAN_NAME}` },
      ],
    },
  ],
  cta: "Comece grátis, sem cartão",
  ctaNote: "Pronto em 1 minuto.",
  faq: [
    {
      question: `O que o ${PREMIUM_PLAN_NAME} tem a mais?`,
      answer: `O ${PREMIUM_PLAN_NAME} tem tudo do ${SITE_PLAN_NAME} e mais duas coisas para o cliente não faltar: o sinal pelo Pix (o cliente paga direto na sua conta e envia o comprovante, que é conferido na hora) e o lembrete no celular do cliente, 1 dia e 2 horas antes do horário. Os planos ${PLAN_NAME} e ${SITE_PLAN_NAME} não têm sinal nem lembrete.`,
    },
    {
      question: `Qual a diferença entre o ${SITE_PLAN_NAME} e o ${PLAN_NAME}?`,
      answer: `Os dois têm a agenda online completa. O ${SITE_PLAN_NAME} vem também com um site profissional do seu negócio, pronto para o Google, que você personaliza no painel. O ${PLAN_NAME} é só a agenda, com o link de agendamento para a bio e o WhatsApp.`,
    },
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
