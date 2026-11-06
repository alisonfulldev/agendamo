import { PLAN_PRICES, PRICE_TEXT, SITE_PRICE_TEXT } from "@/lib/plans";
import { formatBRL } from "@/lib/money";

/**
 * Sales chat (/conheca, 2026-11-07): the link sent to whoever arrives on the WhatsApp. Shows the
 * example sites with the business's name, how it works, the plans and the Pix of the first payment
 * (no trial; whoever arrives through the site gets the trial). Not public: no menu, no search.
 * Prices come from plans.ts.
 */
export const SALES_CHAT = {
  headerTitle: "MeetChat",
  headerSubtitle: "Seu site + agenda online",
  greeting:
    "Oi! 😊 Vou te mostrar como fica o seu site com agenda online, onde o cliente marca sozinho, 24h.",
  askName: "Pra começar: qual é o nome do seu negócio?",
  namePlaceholder: "Nome do seu negócio",
  confirmNiche: "Você trabalha com {niche}?",
  yes: "Sim",
  no: "Não",
  askNiche: "Qual é a sua área?",
  other: "Outra área",

  models: "Olha como fica o site de {name} 👇 Toque para ver cada modelo:",
  modelNames: { vibrant: "Modelo 1 · Vibrante", elegant: "Modelo 2 · Elegante" },
  modelHints: {
    vibrant: "Cores fortes, em blocos",
    elegant: "Claro e sofisticado",
  },
  modelOpen: "Ver o site",
  modelBack: "← Voltar para a conversa",
  modelTip: "Dentro do site, toque em “Agendar” para ver como o cliente marca.",
  askModel: "Qual modelo você gostou mais?",
  modelChosen: "Gostei do {model}",

  how: [
    "Funciona assim:",
    "📅 Seu cliente abre o link, escolhe o serviço e um horário livre e já fica marcado, 24h por dia.",
    "🔔 Ele recebe confirmação e lembrete, e falta menos.",
    "📲 Você recebe um aviso no celular a cada agendamento.",
    "💼 E no painel ficam agenda, clientes, financeiro e sinal pelo Pix, tudo num lugar só.",
  ],
  howNext: "Quero o meu",
  presentation: "Ver a apresentação",

  askPlan: "Qual plano é melhor pra você?",
  plans: {
    site: {
      label: "Site + Agenda",
      price: SITE_PRICE_TEXT.monthly,
      text: "Seu site pronto no Google + a agenda online completa.",
      badge: "Mais escolhido",
    },
    complete: {
      label: "Só a agenda",
      price: PRICE_TEXT.monthly,
      text: "A agenda online completa, sem o site.",
      badge: null,
    },
  },
  askCycle: "Prefere pagar por mês ou por ano?",
  cycles: {
    monthly: { label: "Mensal", hint: "Cancele quando quiser" },
    yearly: { label: "Anual", hint: "Sai mais barato" },
  },

  askPayer: "Ótimo! Pra gerar o seu Pix, qual o seu nome completo (ou a razão social)?",
  payerPlaceholder: "Nome completo",
  askEmail: "Qual o seu e-mail? É com ele que você entra no painel.",
  emailPlaceholder: "seuemail@exemplo.com",
  emailInvalid: "Esse e-mail parece incompleto. Confere pra mim?",
  emailFix: "Você quis dizer {email}?",
  askWhatsapp: "E o seu WhatsApp, com DDD?",
  whatsappPlaceholder: "(11) 99999-9999",
  whatsappInvalid: "Não consegui entender esse número. Manda com DDD, por favor.",
  askDocument: "Por último, o seu CPF ou CNPJ (o banco pede para gerar o Pix).",
  documentPlaceholder: "CPF ou CNPJ",
  documentInvalid: "Esse CPF ou CNPJ não parece válido. Confere pra mim?",
  summary:
    "Confere se está tudo certo:\n\n🏪 {business}\n📦 {plan} · {price}\n👤 {payer}\n✉️ {email}\n📱 {whatsapp}\n\nAo pagar, você concorda com os Termos de uso.",
  changePlan: "Trocar plano",
  changeData: "Corrigir meus dados",
  back: "Voltar",
  terms: "Ler os Termos de uso",
  generate: "Gerar meu Pix",
  generating: "Gerando seu Pix…",

  pix: "Pronto! Pague pelo app do seu banco: o Pix desta 1ª mensalidade também autoriza as próximas, que caem sozinhas (Pix Automático). Você cancela quando quiser.",
  pixCopy: "Copiar código Pix",
  pixCopied: "Código copiado!",
  waiting: "Aguardando o pagamento…",
  expired: "Esse Pix venceu.",
  renew: "Gerar outro Pix",

  paid: "Pagamento confirmado! 🎉 O seu {what} já está no ar.",
  paidSite: "site",
  paidChat: "link de agendamento",
  openSite: "Ver meu site",
  openChat: "Meu link de agendamento",
  openPanel: "Entrar no painel",
  paidEmail:
    "Também mandei o acesso para {email}. No painel você coloca sua foto, seus serviços, preços e horários.",

  errors: {
    has_account:
      "Esse e-mail já tem conta no MeetChat. Use outro e-mail ou entre em meetchat.com.br/entrar.",
    has_business: "Esse e-mail já tem um negócio no MeetChat. Use outro e-mail.",
    limit: "Muitas tentativas por agora. Tente de novo mais tarde.",
    failed: "Não consegui gerar o Pix agora. Tenta de novo?",
    login: "Não consegui entrar direto. Use o código que chegou no seu e-mail.",
  },
  restart: "Começar de novo",
} as const;

/** Value of the first Pix of a plan (no coupon, no extras), for the summary bubble. */
export function firstPaymentText(tier: "site" | "complete", cycle: "monthly" | "yearly"): string {
  const cents = PLAN_PRICES[tier][cycle];
  return cycle === "yearly" ? `${formatBRL(cents)}/ano` : `${formatBRL(cents)}/mês`;
}
