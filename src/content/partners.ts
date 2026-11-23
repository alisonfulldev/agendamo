import type { DirectAnswer } from "@/content/direct-answer";
import { formatAmount } from "@/lib/money";
import {
  HOLD_DAYS,
  MIN_PAYOUT_CENTS,
  PARTNER_TERMS_VERSION,
  RECURRING_PERCENT,
  commissionFor,
} from "@/lib/partners/rules";
import { PLAN_NAME, PLAN_PRICES, SITE_PLAN_NAME, WEB_PLAN_NAME } from "@/lib/plans";

/** Partner program pages (/parceiros). Amounts come from the plan prices and the rules. */

const monthly = PLAN_PRICES.complete.monthly;
const commissionOf = (price: number, isFirst: boolean) =>
  commissionFor({ paymentCents: price, monthlyPriceCents: price, first: isFirst });
const first = commissionOf(monthly, true);
const recurring = commissionOf(monthly, false);
const brl = (cents: number) => `R$ ${formatAmount(cents)}`;

/** Commission of each plan: first payment and every later monthly one. */
const PLAN_COMMISSIONS = (
  [
    [PLAN_NAME, PLAN_PRICES.complete.monthly],
    [SITE_PLAN_NAME, PLAN_PRICES.site.monthly],
    [WEB_PLAN_NAME, PLAN_PRICES.web.monthly],
  ] as const
).map(([plan, price]) => ({
  plan,
  price: brl(price),
  first: brl(commissionOf(price, true)),
  recurring: brl(commissionOf(price, false)),
}));

/** Simulation with the Completo plan: N clients that keep paying for 12 months. */
const SIMULATION = [5, 10, 20, 50].map((clients) => ({
  clients,
  firstMonth: brl(first * clients),
  monthly: brl(recurring * clients),
  year: brl((first + recurring * 11) * clients),
}));

const FAQ = [
  {
    question: "O que é o programa de parceiros do MeetChat?",
    answer: `É um programa de indicação (afiliados) para ganhar renda extra: você indica o MeetChat, a agenda online com link de agendamento, para negócios que trabalham com hora marcada. Quando o negócio assina pelo seu link, você ganha 100% do 1º pagamento e ${RECURRING_PERCENT}% de cada mensalidade seguinte, enquanto ele continuar assinando.`,
  },
  {
    question: "Quem pode ser parceiro?",
    answer:
      "Qualquer pessoa maior de idade com CPF e chave Pix. Não precisa ter empresa, CNPJ, experiência em vendas nem ser cliente do MeetChat. Não há aprovação: você se cadastra e recebe o link na hora.",
  },
  {
    question: "Preciso pagar alguma coisa para ser parceiro?",
    answer:
      "Não. O cadastro é grátis, sem taxa, sem kit para comprar e sem mensalidade. Você também não precisa assinar o MeetChat.",
  },
  {
    question: "Quanto eu ganho por indicação?",
    answer: `No plano ${PLAN_NAME} (${brl(monthly)} por mês), você ganha ${brl(first)} no 1º pagamento e ${brl(recurring)} em cada mensalidade seguinte. Nos planos ${SITE_PLAN_NAME} e ${WEB_PLAN_NAME}, a comissão é maior porque o preço é maior. No plano anual, o 1º pagamento rende o valor de uma mensalidade.`,
  },
  {
    question: "A comissão é recorrente?",
    answer: `Sim. Depois do 1º pagamento, você recebe ${RECURRING_PERCENT}% de cada mensalidade que o negócio pagar, todo mês, sem prazo para acabar. Por isso a renda cresce a cada novo cliente que continua assinando.`,
  },
  {
    question: "Quando e como eu recebo?",
    answer: `Por Pix, na chave que você cadastrar. Cada comissão é liberada ${HOLD_DAYS} dias depois que o cliente paga (prazo para estornos), e o pagamento sai a partir de ${brl(MIN_PAYOUT_CENTS)} liberados. Você acompanha tudo na área do parceiro.`,
  },
  {
    question: "Como o cliente fica ligado a mim?",
    answer:
      "Pelo seu link de parceiro. Quando a pessoa entra por ele e cria a conta em até 60 dias, o negócio fica ligado a você. Se ela entrar pelo link de outro parceiro antes de criar a conta, vale o último link.",
  },
  {
    question: "Para quem posso indicar o MeetChat?",
    answer:
      "Para qualquer negócio que trabalha com hora marcada: salões de beleza, barbearias, manicures, clínicas de estética, psicólogos, nutricionistas, fisioterapeutas, personal trainers, tatuadores, pet shops e outros. Quem agenda pelo WhatsApp hoje é o cliente ideal.",
  },
  {
    question: "Preciso saber vender ou explicar o sistema?",
    answer:
      "Não precisa ser vendedor. O negócio cria a conta sozinho em poucos minutos, numa conversa guiada, e testa grátis antes de pagar. Basta mandar o seu link ou mostrar o MeetChat funcionando no celular.",
  },
  {
    question: "O cliente que eu indico ganha desconto?",
    answer:
      "Não. O cliente paga o preço normal e tem o mesmo teste grátis de qualquer cadastro. Contas vindas de parceiro não usam cupom de desconto.",
  },
  {
    question: "Ganho por indicar outros parceiros?",
    answer:
      "Não. Não é marketing multinível nem pirâmide: você ganha só pelos negócios que assinam pelo seu link. Não existe ganho por recrutar pessoas.",
  },
  {
    question: "E se o cliente cancelar ou pedir estorno?",
    answer:
      "Você para de receber a partir do mês em que ele deixa de pagar. Pagamento estornado ou contestado não gera comissão.",
  },
  {
    question: "Posso indicar a minha própria empresa?",
    answer:
      "Não. Não há comissão sobre a sua própria conta nem sobre contas com o seu CPF, e-mail ou telefone.",
  },
  {
    question: "Preciso emitir nota fiscal ou pagar imposto?",
    answer:
      "Você é responsável pelos impostos sobre o que receber. Se a renda ficar frequente, vale conversar com um contador; abrir um MEI costuma ser o caminho mais simples.",
  },
] as const;

export const PARTNERS = {
  updatedAt: "2026-11-23",
  title: "Renda extra indicando agenda online | Parceiros MeetChat",
  description: `Seja parceiro do MeetChat: indique a agenda online para salões, barbearias e clínicas e ganhe 100% do 1º pagamento e ${RECURRING_PERCENT}% todo mês. Grátis, com Pix.`,
  h1: "Renda extra indicando o MeetChat",
  lead: `Todo negócio que trabalha com hora marcada perde tempo agendando pelo WhatsApp. Você mostra o MeetChat, o negócio assina, e você ganha a 1ª mensalidade inteira e ${RECURRING_PERCENT}% de todas as seguintes, todo mês, enquanto o cliente usar.`,
  cta: "Quero ser parceiro",
  login: "Já sou parceiro",
  answer: {
    question: "Como ganhar renda extra com o MeetChat?",
    sentences: [
      "Cadastre-se grátis no programa de parceiros, pegue o seu link e indique o MeetChat para negócios que trabalham com hora marcada, como salões, barbearias e clínicas.",
      `Cada negócio que assinar pelo seu link paga a você 100% do 1º pagamento (${brl(first)} no plano ${PLAN_NAME}) e ${RECURRING_PERCENT}% de todas as mensalidades seguintes (${brl(recurring)} por mês), enquanto continuar assinando.`,
      `Você recebe por Pix, ${HOLD_DAYS} dias depois de cada pagamento do cliente, sem taxa, sem meta e sem precisar de CNPJ.`,
    ],
  } satisfies DirectAnswer,
  steps: [
    {
      title: "Cadastre-se grátis",
      text: "Nome, WhatsApp, CPF e chave Pix. Leva 2 minutos e você recebe o seu link de parceiro na hora.",
    },
    {
      title: "Indique para negócios",
      text: "Mande o seu link para salões, barbearias, manicures, estética, psicólogos, personal trainers… ou mostre o MeetChat funcionando no celular.",
    },
    {
      title: "Ganhe todo mês",
      text: `Quando o negócio assina pelo seu link, você ganha a 1ª mensalidade inteira (${brl(first)} no plano ${PLAN_NAME}) e depois ${brl(recurring)} por mês, enquanto ele pagar.`,
    },
  ],
  commissions: {
    title: "Quanto você ganha por cliente",
    intro: `100% do 1º pagamento e ${RECURRING_PERCENT}% de cada mensalidade seguinte, em todos os planos:`,
    rows: PLAN_COMMISSIONS,
  },
  simulation: {
    title: "Simulação de renda extra",
    intro: `Quanto dá para ganhar com o plano ${PLAN_NAME}, se os negócios indicados continuarem assinando por 12 meses:`,
    rows: SIMULATION,
    note: "É uma simulação, não uma promessa de ganho. O resultado depende de quantos negócios você indicar e de quantos continuarem assinando.",
  },
  who: {
    title: "Quem pode ser parceiro",
    items: [
      "Quem quer uma renda extra no tempo livre, de casa ou pelo celular",
      "Profissionais da beleza e da saúde que conhecem outros profissionais",
      "Vendedores, representantes e quem já atende pequenos negócios",
      "Social media, designers e agências que cuidam de negócios locais",
      "Professores de cursos de beleza, barbearia e estética",
    ],
  },
  product: {
    title: "O que você vai indicar",
    text: "O MeetChat é uma agenda online para quem trabalha com hora marcada. O negócio ganha um link de agendamento para o Instagram e o WhatsApp, os clientes marcam sozinhos 24 horas por dia, recebem lembretes e podem pagar um sinal pelo Pix para reduzir faltas. Todo cadastro começa com um teste grátis, sem cartão.",
  },
  nichesTitle: "Negócios que mais precisam de agenda online",
  faqTitle: "Perguntas frequentes sobre o programa de parceiros",
  rulesTitle: "Regras do programa",
  faq: FAQ,
} as const;

export const PARTNER_TERMS = {
  version: PARTNER_TERMS_VERSION,
  text: [
    "Para ser parceiro é preciso ter 18 anos ou mais, CPF próprio e uma chave Pix em seu nome.",
    `Comissão: 100% do 1º pagamento de cada negócio que criar a conta pelo seu link (limitado a uma mensalidade do plano) e ${RECURRING_PERCENT}% de cada mensalidade seguinte, enquanto o negócio pagar.`,
    `A comissão é liberada ${HOLD_DAYS} dias após o pagamento do cliente e paga por Pix na chave cadastrada, a partir de ${brl(MIN_PAYOUT_CENTS)} liberados. Pagamentos estornados ou contestados não geram comissão.`,
    "Não há comissão sobre a sua própria conta nem sobre contas com o seu CPF, e-mail ou telefone. Contas vindas do seu link não usam cupom de desconto.",
    "Você ganha só pelos negócios que indicar. Não existe ganho por indicar outros parceiros.",
    "É proibido: enviar spam ou usar listas compradas, prometer o que o MeetChat não faz, prometer ganhos a terceiros, se apresentar como funcionário do MeetChat e criar perfis, páginas ou anúncios que se passem pela marca oficial.",
    "Você é responsável pelos impostos sobre o que receber. O MeetChat pode mudar estas regras com aviso por e-mail, e pode encerrar a parceria em caso de abuso, sem pagar comissões ligadas ao abuso.",
  ],
} as const;
