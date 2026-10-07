import { formatBRL } from "@/lib/money";
import {
  PLAN_PRICES,
  PRICE_TEXT,
  TRIAL_DAYS,
  TRIAL_PROFESSIONALS,
  yearlySavings,
} from "@/lib/plans";

const reais = (cents: number) => formatBRL(cents).replace(/,00$/, "");

/** Texts of the /precos page. Prices always come from PLAN_PRICES / PRICE_TEXT. */
export const PRICING = {
  meta: {
    title: `Preços do MeetChat: agendamento por chat por ${PRICE_TEXT.monthly}`,
    description: `Plano único do MeetChat: ${TRIAL_DAYS} dias grátis sem cartão, depois ${PRICE_TEXT.summary}. Tudo incluso, sem fidelidade. Veja o que vem no plano.`,
  },
  hero: {
    title: "Um plano só, com tudo incluso",
    subtitle: `Comece com ${TRIAL_DAYS} dias grátis, sem cartão. Depois, escolha pagar por mês ou por ano. Sem fidelidade e sem taxa por agendamento.`,
    cta: `Começar meus ${TRIAL_DAYS} dias grátis`,
  },
  cycles: [
    {
      name: "Mensal",
      price: reais(PLAN_PRICES.monthly),
      period: "/mês",
      note: "Cancele quando quiser",
      highlight: false,
    },
    {
      name: "Anual",
      price: PRICE_TEXT.yearlyPerMonth.replace("/mês", ""),
      period: "/mês",
      note: `${PRICE_TEXT.yearly} à vista · economize ${reais(yearlySavings(0))} por ano`,
      highlight: true,
    },
  ],
  includesTitle: "O que vem no plano",
  includes: [
    "Link de agendamento por chat, 24 horas por dia",
    "Só horários realmente livres, com confirmação na hora",
    "Lembretes automáticos por e-mail para o cliente",
    "Aviso no seu celular a cada agendamento",
    "Agenda por profissional, salas e equipamentos sem conflito",
    "Sinal pelo Pix, direto na sua conta",
    "Pacotes, combos, cupons e lista de espera",
    "Financeiro simples: entradas dos atendimentos e custos",
    "Integração com o Google Agenda",
    "Botão de agendar no seu site e até 60 fotos",
  ],
  extrasTitle: "Adicionais (opcionais)",
  extras: [
    {
      name: "Profissional extra",
      price: `${PRICE_TEXT.extraProfessional} (${reais(PLAN_PRICES.extraProfessional.yearly)}/ano)`,
      description:
        "O plano inclui 1 profissional. Cada pessoa a mais na equipe ganha a própria agenda.",
    },
    {
      name: "Destaque no portal",
      price: `${reais(PLAN_PRICES.featured.monthly)}/mês por cidade`,
      description: "Seu negócio aparece primeiro nas buscas do portal da sua cidade.",
    },
  ],
  faq: {
    title: "Perguntas sobre pagamento",
    items: [
      {
        question: "Preciso de cartão para testar?",
        answer: `Não. Os ${TRIAL_DAYS} dias grátis começam quando você cria o seu link, com tudo liberado (até ${TRIAL_PROFESSIONALS} profissionais), sem cartão.`,
      },
      {
        question: "Quais as formas de pagamento?",
        answer: "Pix ou cartão de crédito, no plano mensal ou no anual.",
      },
      {
        question: "O que acontece quando o teste acaba e eu não assino?",
        answer:
          "Nada é apagado. Seu link continua no ar, mas os pedidos passam a chegar pelo seu WhatsApp, sem reserva automática na agenda. Assinou, tudo volta na hora.",
      },
      {
        question: "Tem fidelidade ou multa para cancelar?",
        answer: "Não. Você cancela quando quiser, direto no painel.",
      },
      {
        question: "Cobram taxa por agendamento ou por cliente?",
        answer: "Não. O preço é fixo, não importa quantos agendamentos ou clientes você tenha.",
      },
      {
        question: "O dinheiro do sinal passa pelo MeetChat?",
        answer:
          "Não. O sinal é pago pelo Pix direto para você. O MeetChat nunca recebe dinheiro dos seus clientes.",
      },
      {
        question: "Vale a pena o plano anual?",
        answer: `No anual você paga ${PRICE_TEXT.yearly}, o que sai ${PRICE_TEXT.yearlyPerMonth}, e economiza ${reais(yearlySavings(0))} por ano em relação ao mensal.`,
      },
    ],
  },
  closing: {
    title: `Teste grátis por ${TRIAL_DAYS} dias e veja os agendamentos chegando.`,
    cta: "Criar meu link grátis",
  },
} as const;
