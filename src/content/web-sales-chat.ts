import { formatBRL } from "@/lib/money";
import { PLAN_PRICES } from "@/lib/plans";

/**
 * Sales chat of "Site ou Loja" (/criar-site, 2026-11-07): a site or a store for any business,
 * every button to the WhatsApp, R$ 29/mês (or R$ 290/ano), and the custom site made by a person
 * (R$ 197 + the month). Whoever wants booking goes to /conheca. Prices from plans.ts.
 */
const month = formatBRL(PLAN_PRICES.web.monthly);
const year = formatBRL(PLAN_PRICES.web.yearly);
const custom = formatBRL(PLAN_PRICES.webCustomSite);

export const WEB_CHAT = {
  headerTitle: "MeetChat",
  headerSubtitle: "Seu site profissional",
  greeting: "Oi! 😊 Vou te mostrar como fica o seu site pronto, bonito e no Google.",
  askNeed: "O que você quer criar?",
  needs: {
    site: "Um site para o meu negócio",
    store: "Uma loja com catálogo",
    agenda: "Agenda online (clientes marcam horário)",
  },
  askName: "Qual é o nome do seu negócio?",
  namePlaceholder: "Nome do seu negócio",

  models: "Olha como fica {kind} de {name} 👇 Toque para ver cada modelo:",
  kindSite: "o site",
  kindStore: "a loja",
  modelOpen: "Ver",
  modelTip: "Os botões levam o cliente direto para o seu WhatsApp.",
  askModel: "Qual modelo você gostou mais?",
  modelChosen: "Gostei do {model}",
  custom: "Não gostei de nenhum",
  customOffer: `Sem problema! A gente cria um site só seu, sob medida, a partir de ${custom} + ${month}/mês. Quer conversar comigo pelo WhatsApp para eu entender o que você precisa?`,
  customYes: "Falar no WhatsApp",
  customSent: "Te espero lá no WhatsApp! 😊 Se preferir, você também pode escolher um dos modelos.",
  /** The message that opens in the seller's WhatsApp. */
  customMessage: "Olá! Vim pelo MeetChat e quero um site personalizado para {name}.",
  customNo: "Prefiro um dos modelos",

  how: {
    site: [
      "Funciona assim:",
      "🌐 Seu site fica no ar na hora, bonito no celular e pronto para o Google.",
      "💬 Todo botão leva o cliente direto para o seu WhatsApp, com uma mensagem pronta.",
      "✏️ Você muda textos, fotos e serviços quando quiser, pelo celular.",
    ],
    store: [
      "Funciona assim:",
      "🛍️ Sua loja fica no ar na hora, com seus produtos, fotos e preços.",
      "🧺 O cliente monta a sacolinha e o pedido chega pronto no seu WhatsApp, com o total.",
      "✏️ Você cadastra e muda produtos quando quiser, pelo celular.",
    ],
  },
  /** The end of the tour: her site is ready as a preview; publishing (and editing) is the plan. */
  ready: {
    site: `A base do seu site está pronta! 🎉 Toque em “Ver meu site” para ver como vai ficar. Depois de publicar, você coloca seus serviços, fotos, textos e cores e deixa do seu jeito. Para publicar e editar: ${month}/mês.`,
    store: `A base da sua loja está pronta! 🎉 Toque em “Ver minha loja” para ver como vai ficar. Depois de publicar, você coloca seus produtos, fotos, textos e cores e deixa do seu jeito. Para publicar e editar: ${month}/mês.`,
  },
  previewOpen: { site: "Ver meu site", store: "Ver minha loja" },
  howNext: { site: "Publicar meu site", store: "Publicar minha loja" },

  askCycle: "Prefere pagar por mês ou por ano?",
  cycles: {
    monthly: { label: "Mensal", price: `${month}/mês`, hint: "Cancele quando quiser" },
    yearly: { label: "Anual", price: `${year}/ano`, hint: "Sai mais barato" },
  },

  askPayer: "Ótimo! Pra gerar o seu Pix, qual o seu nome completo (ou a razão social)?",
  summary:
    "Confere se está tudo certo:\n\n🏪 {business}\n📦 {plan} · {price}\n👤 {payer}\n✉️ {email}\n📱 {whatsapp}\n\nAo pagar, você concorda com os Termos de uso.",
  planSite: "Site",
  planStore: "Loja",
  planCustom: "{plan} personalizado",

  paid: "Pagamento confirmado! 🎉 {what} já está no ar.",
  paidSite: "Seu site",
  paidStore: "Sua loja",
  paidCustom:
    "Agora é só responder umas perguntas no painel (Site personalizado) para a nossa equipe criar o seu.",
  paidEmail:
    "Agora é com você: entre no painel e deixe do seu jeito, com seu logo, fotos, textos e o que você vende. Também mandei o acesso para {email}.",
  domain: `Quer um endereço só seu, tipo seunegocio.com.br? É opcional: custa ${formatBRL(PLAN_PRICES.webDomainYearly)} por ano e dá para pedir depois, com calma.`,
  openSite: "Ver meu site",
  openStore: "Ver minha loja",
  openPanel: "Entrar no painel",
} as const;

/** First Pix: the plan (month or year), plus the custom site when chosen. */
export function webFirstPayment(cycle: "monthly" | "yearly", customSite: boolean): string {
  const plan = PLAN_PRICES.web[cycle];
  const base = cycle === "yearly" ? `${formatBRL(plan)}/ano` : `${formatBRL(plan)}/mês`;
  return customSite ? `${formatBRL(PLAN_PRICES.webCustomSite)} + ${base}` : base;
}
