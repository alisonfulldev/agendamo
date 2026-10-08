import { PRICE_TEXT, TRIAL_DAYS } from "@/lib/plans";

/** Texts of the creation conversation (opens over the site from the home page). */
export const CREATION = {
  intro: "Oi! Vamos montar seu link de agendamento? Leva 1 minuto.",
  askName: "Qual o nome do seu negócio?",
  namePlaceholder: "Nome do negócio",
  confirmNiche: "{nome}… você trabalha com {ramo}, certo?",
  confirmYes: "Isso mesmo",
  confirmNo: "Não, outra coisa",
  askNiche: "O que você faz?",
  other: "Outro",
  seeAll: "Ver todos",
  askOther: "Me conta em poucas palavras o que você faz.",
  otherPlaceholder: "Ex.: restauro móveis, aulas de costura",
  building: "Estamos criando seu chat…",
  buildingSteps: [
    "Separando os serviços do seu ramo",
    "Preparando os horários",
    "Deixando com a cara do seu negócio",
  ],
  /** After the loading screen: sign up now or first see the simulation. */
  ready: {
    title: "Seu chat de agendamento está pronto para ser criado ✨",
    subtitle: "Falta só criar sua conta grátis (1 minuto, sem cartão).",
    preview: "Ver como meu cliente vai agendar",
  },
  banner: "Simulação: é assim que seu cliente vai agendar. Seu link ainda não foi criado.",
  simulationEnd: "Isso foi só uma simulação. Crie sua conta grátis para ter o seu link de verdade.",
  addPhoto: "Adicionar sua foto (opcional)",
  testDone: "Prontinho! Seu horário de teste está confirmado.",
  arrives: "É isso que chega para você:",
  claim: "Criar minha conta grátis",
  restart: "Recomeçar",
  resume: "Quer continuar de onde parou, {nome}?",
  resumeYes: "Continuar",
  resumeNo: "Começar de novo",
  error: "Não consegui montar seu chat agora. Pode tentar de novo?",
  signup: {
    askWhatsapp:
      "Qual o seu WhatsApp? É por ele que seus clientes falam com você quando precisarem.",
    whatsappPlaceholder: "(11) 99999-8888",
    later: "Depois",
    askEmail: "Seu link está quase pronto! Qual seu e-mail?",
    emailPlaceholder: "seu@email.com",
    invalidEmail: "Esse e-mail não parece certo. Confere e manda de novo?",
    didYouMean: "Você quis dizer {sugestao}?",
    yes: "Sim",
    no: "Não",
    terms: "Para criar sua conta, você aceita os Termos de uso e a Política de privacidade?",
    termsLinks: [
      { label: "Termos de uso", href: "/termos" },
      { label: "Política de privacidade", href: "/privacidade" },
    ],
    acceptTerms: "Aceito, enviar o código",
    sending: "Enviando o código…",
    codeSent: "Te mandei um código de 4 números para {email}. Digita aqui.",
    existingAccount: "Esse e-mail já tem conta. Te mandei um código para entrar: digita aqui.",
    codePlaceholder: "Código de 4 números",
    resend: "Reenviar código",
    resendIn: "Reenviar em {s}s",
    changeEmail: "Trocar e-mail",
    checking: "Conferindo…",
    wrongCode: "Esse código não confere. Dá uma olhada no e-mail e tenta de novo.",
    tooMany: "Foram muitas tentativas. Peça um código novo.",
    expired: "Esse código expirou. Peça um código novo.",
    wait: "Espere {s} segundos para pedir outro código.",
    rateLimited: "Muitos códigos pedidos para esse e-mail. Tente de novo daqui a pouco.",
    accountsLimit:
      "Muitas contas criadas daqui hoje. Tente amanhã ou entre com uma conta que você já tem.",
    failed: "Não consegui enviar agora. Tenta de novo em instantes?",
    created: "🎉 Sua conta está pronta, {nome}!",
    createdHint: "Seu link de agendamento está te esperando no painel.",
    hasBusiness: "Você já tem um negócio no MeetChat e entrou na sua conta.",
    goPanel: "Entrar no meu painel",
  },
  rateLimited: "Muitas tentativas por aqui. Espere alguns minutos e tente de novo.",
  shortcuts: {
    price: {
      label: "Quanto custa?",
      answer: `${TRIAL_DAYS} dias grátis, sem cartão. Depois, ${PRICE_TEXT.summary}, com tudo incluso.`,
    },
    app: {
      label: "Meu cliente precisa baixar app?",
      answer: "Não! O link abre direto no navegador do celular, como uma conversa.",
    },
    account: { label: "Já tenho conta", href: "/entrar" },
  },
  /** Chips when the niche is not detected (niche keys), plus "Outro" and "Ver todos". */
  popular: ["lash-brow", "nails", "beauty", "barber", "aesthetics", "psychology"],
  /** Chip labels for the popular niches (the niche name otherwise). */
  chipLabels: {
    "lash-brow": "Sobrancelha",
    nails: "Unhas",
    beauty: "Cabelo",
    barber: "Barbearia",
    aesthetics: "Estética",
    psychology: "Psicologia",
  } as Record<string, string>,
} as const;

/**
 * Niche detection from the business name (accents removed, lowercase). Order matters: the more
 * specific patterns come first. Short words only match as whole words ("car" ≠ "Carla").
 */
export const NICHE_KEYWORDS: [string, RegExp][] = [
  ["psychoanalysis", /psicanal/],
  ["psychopedagogy", /psicopedag/],
  ["occupational-therapy", /terapia ocupacional|\bto\b/],
  ["psychology", /psicolog|\bpsi\b|\bpsico\b|terapia|terapeuta/],
  ["lash-brow", /\bbrow|sobrancelh|cilios|\blash/],
  ["nails", /\bnail|\bunha|esmalteria|manicure/],
  ["barber", /barbear|\bbarber|barbeiro/],
  ["aesthetics", /estetica|\bskin\b|depila/],
  ["tattoo", /tattoo|tatuag|\bink\b|piercing/],
  ["beauty", /\bsalao|\bhair\b|cabel|\bbeauty\b|\bbeleza\b/],
  ["physio", /fisio/],
  ["nutrition", /\bnutri/],
  ["speech-therapy", /\bfono/],
  ["dentistry", /odonto|\bdent|sorriso/],
  ["medical", /\bmedic|clinica medica|consultorio medico/],
  ["podiatry", /podolog/],
  ["chiropractic", /quiropra/],
  ["osteopathy", /osteopat/],
  ["acupuncture", /acupunt/],
  ["massage-therapy", /massag|massoterap|\bspa\b/],
  ["integrative-therapy", /reiki|holist|integrativ|constelac|aromaterap/],
  ["pilates", /pilates/],
  ["yoga", /\byoga/],
  ["personal-trainer", /\bpersonal\b|\btreino|fitness|academia/],
  ["pet-grooming", /\bpet\b|\bpets\b|banho e tosa|\bdog\b|\bcao\b/],
  ["veterinary", /\bvet\b|veterin/],
  ["tutoring", /\baulas?\b|professor|idioma|ingles|reforco|musica/],
  ["photography", /fotograf|\bphoto|\bfoto\b/],
  ["consulting", /advoca|contab|consultoria|juridic/],
  ["auto-detailing", /\bcar\b|\bauto\b|lava.?jato|lava.?rapido|detail|polimento/],
  ["sports-court", /\bquadras?\b|\barena\b|beach|futebol|padel|society/],
];

/** Niche key detected in a business name, or null. */
export function detectNiche(name: string): string | null {
  const normalized = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return NICHE_KEYWORDS.find(([, pattern]) => pattern.test(normalized))?.[0] ?? null;
}
