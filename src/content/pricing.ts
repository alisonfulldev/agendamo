import { PLAN_NAME, PLAN_PRICES, PRICE_TEXT, reais, TRIAL_DAYS, yearlySavings } from "@/lib/plans";

/** Texts of the /precos page. Prices always come from PLAN_PRICES / PRICE_TEXT. */
export const PRICING = {
  meta: {
    title: `Preços do MeetChat: um plano só, ${TRIAL_DAYS} dias grátis`,
    description: `Um plano só, o ${PLAN_NAME}: ${PRICE_TEXT.summary}, com tudo incluído. ${TRIAL_DAYS} dias grátis sem cartão. Sem fidelidade.`,
  },
  hero: {
    title: `Um plano só, com tudo. ${TRIAL_DAYS} dias grátis.`,
    subtitle: `O ${PLAN_NAME} custa ${PRICE_TEXT.summary}: agendamentos ilimitados, lembretes, sinal pelo Pix e tudo mais. Teste ${TRIAL_DAYS} dias, sem cartão.`,
    cta: "Criar meu link grátis",
  },
  extrasTitle: "Adicionais (opcionais)",
  extras: [
    {
      name: "Profissional extra",
      price: `${PRICE_TEXT.extraProfessional} (${reais(PLAN_PRICES.extraProfessional.yearly)}/ano)`,
      description:
        "1 profissional está incluso. Cada pessoa a mais na equipe ganha a própria agenda.",
    },
    {
      name: "Destaque no portal",
      price: `${reais(PLAN_PRICES.featured.monthly)}/mês por cidade`,
      description: "Seu negócio aparece primeiro nas buscas do portal da sua cidade.",
    },
  ],
  faq: {
    title: "Perguntas sobre planos e pagamento",
    items: [
      {
        question: `Como funciona o teste de ${TRIAL_DAYS} dias?`,
        answer: `Você usa o ${PLAN_NAME} com tudo liberado, sem cartão, uma vez por conta. Avisamos por e-mail e no celular no 10º, no 13º e no 14º dia.`,
      },
      {
        question: "E se eu não assinar depois do teste?",
        answer:
          "Seu link continua no ar: o chat anota o serviço, o dia e o turno que a pessoa prefere e abre o seu WhatsApp com o pedido pronto. O painel fica pausado, mas agenda, clientes e configurações ficam guardados, e os horários já marcados continuam valendo. Assinando, tudo volta na hora.",
      },
      {
        question: "Quais as formas de pagamento?",
        answer: "Pix ou cartão de crédito, no plano mensal ou no anual.",
      },
      {
        question: "Quando começa a cobrança?",
        answer:
          "No dia em que você assina. O ciclo começa nessa data, sem cobrança proporcional. Ao assinar, tudo libera na hora.",
      },
      {
        question: "Tem fidelidade ou multa para cancelar?",
        answer:
          "Não. Ao cancelar, o plano continua até o fim do período pago. Depois, o link continua no ar com os pedidos indo para o seu WhatsApp, sem perder nada.",
      },
      {
        question: "Cobram taxa por agendamento?",
        answer: "Não. O preço é fixo, não importa quantos agendamentos você tenha.",
      },
      {
        question: "Vale a pena o plano anual?",
        answer: `No anual, o ${PLAN_NAME} sai ${PRICE_TEXT.yearlyPerMonth} (${PRICE_TEXT.yearly}), uma economia de ${reais(yearlySavings())} por ano.`,
      },
    ],
  },
  closing: {
    title: "Crie seu link grátis e veja os agendamentos chegando.",
    cta: "Criar meu link grátis",
  },
} as const;
