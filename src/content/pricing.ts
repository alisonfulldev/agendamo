import {
  FREE_BOOKINGS_PER_CYCLE,
  PLAN_PRICES,
  PRICE_TEXT,
  reais,
  TRIAL_DAYS,
  yearlySavings,
} from "@/lib/plans";

/** Texts of the /precos page. Prices always come from PLAN_PRICES / PRICE_TEXT. */
export const PRICING = {
  meta: {
    title: "Preços do MeetChat: grátis para sempre, Agenda e Pro",
    description: `${PRICE_TEXT.free}. Agenda por ${PRICE_TEXT.agenda.monthly} e Pro por ${PRICE_TEXT.pro.monthly}, com ${TRIAL_DAYS} dias grátis sem cartão. Sem fidelidade.`,
  },
  hero: {
    title: "Comece grátis. Assine quando a agenda encher.",
    subtitle: `${PRICE_TEXT.free}. Quer agendamentos ilimitados e lembretes? Teste o Agenda ou o Pro por ${TRIAL_DAYS} dias, sem cartão.`,
    cta: "Criar meu link grátis",
  },
  compareTitle: "Compare os planos",
  compare: {
    columns: ["Grátis", "Agenda", "Pro"],
    rows: [
      {
        label: "Agendamentos automáticos pelo chat",
        values: [`${FREE_BOOKINGS_PER_CYCLE} a cada 30 dias`, "Ilimitados", "Ilimitados"],
      },
      {
        label: "Depois do limite",
        values: ["Pedidos pelo seu WhatsApp", "—", "—"],
      },
      { label: "Agenda no celular", values: [true, true, true] },
      { label: "Lembretes automáticos para o cliente", values: [false, true, true] },
      { label: "Sem marca do MeetChat", values: [false, true, true] },
      { label: "Chat de agendamento no seu site", values: [false, true, true] },
      { label: "Clientes, financeiro e estatísticas", values: [false, true, true] },
      { label: "Vendas: artes, cupons, pacotes e lista de espera", values: [false, true, true] },
      { label: "Equipe e Google Agenda", values: [false, true, true] },
      { label: "Sinal ou pagamento total no agendamento", values: [false, false, "Em breve"] },
    ] as { label: string; values: (string | boolean)[] }[],
  },
  extrasTitle: "Adicionais (opcionais)",
  extras: [
    {
      name: "Profissional extra",
      price: `${PRICE_TEXT.extraProfessional} (${reais(PLAN_PRICES.extraProfessional.yearly)}/ano)`,
      description:
        "No Agenda e no Pro, 1 profissional está incluso. Cada pessoa a mais na equipe ganha a própria agenda.",
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
        question: "O plano Grátis é grátis mesmo?",
        answer: `Sim, para sempre e sem cartão. São ${FREE_BOOKINGS_PER_CYCLE} agendamentos automáticos a cada 30 dias, contados a partir do dia do seu cadastro. Quando acabam, o chat continua: ele anota o serviço, o dia e o turno que a pessoa prefere e abre o seu WhatsApp com o pedido pronto, até o ciclo renovar.`,
      },
      {
        question: `Como funciona o teste de ${TRIAL_DAYS} dias?`,
        answer: `Você testa o Agenda ou o Pro com tudo liberado, sem cartão, uma vez por conta. No 5º e no 6º dia avisamos por e-mail e no celular. Se não assinar, a conta passa sozinha para o Grátis: nada é apagado.`,
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
        question: "Posso trocar de plano?",
        answer:
          "Sim. Do Agenda para o Pro, o Pro libera na hora e o novo valor vale a partir da próxima cobrança. Do Pro para o Agenda, a troca acontece no fim do período já pago.",
      },
      {
        question: "Tem fidelidade ou multa para cancelar?",
        answer:
          "Não. Ao cancelar, o plano continua até o fim do período pago. Depois, a conta volta para o Grátis, sem perder nada.",
      },
      {
        question: "Cobram taxa por agendamento?",
        answer:
          "Não. No Agenda e no Pro o preço é fixo, não importa quantos agendamentos você tenha.",
      },
      {
        question: "Vale a pena o plano anual?",
        answer: `No anual, o Agenda sai ${PRICE_TEXT.agenda.yearlyPerMonth} (economia de ${reais(yearlySavings("agenda"))} por ano) e o Pro sai ${PRICE_TEXT.pro.yearlyPerMonth} (economia de ${reais(yearlySavings("pro"))} por ano).`,
      },
    ],
  },
  closing: {
    title: "Crie seu link grátis e veja os agendamentos chegando.",
    cta: "Criar meu link grátis",
  },
} as const;
