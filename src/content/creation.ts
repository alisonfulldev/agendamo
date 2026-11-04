import { reais, SITE_OFFER } from "@/lib/plans";

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
    subtitle: "Falta só criar sua conta (sem cartão, leva 1 minuto).",
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
  reservedName: "Esse nome é reservado. Qual é o nome do seu negócio?",
  signup: {
    askWhatsapp:
      "Qual o seu WhatsApp? É por ele que seus clientes falam com você quando precisarem.",
    whatsappPlaceholder: "(11) 99999-8888",
    later: "Depois",
    invalidWhatsapp: "Esse número não parece certo. Confere o DDD e manda de novo?",
    askEmail: "Seu link está quase pronto! Qual seu e-mail?",
    emailPlaceholder: "seu@email.com",
    invalidEmail: "Esse e-mail não parece certo. Confere e manda de novo?",
    didYouMean: "Você quis dizer {sugestao}?",
    yes: "Sim",
    no: "Não",
    trialUsed:
      "O teste grátis já foi usado com este e-mail ou telefone. Seu link já está no ar, com os pedidos indo para o seu WhatsApp. Assine no painel para os clientes marcarem sozinhos.",
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
    app: {
      label: "Meu cliente precisa baixar app?",
      answer: "Não! O link abre direto no navegador do celular, como uma conversa.",
    },
    /** Closes the conversation and shows the site behind it (for people who came from an ad). */
    site: { label: "Ver site" },
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

const price = (cents: number) => reais(cents);

/**
 * "Site + Agenda" sales conversation (link ?criar=1&oferta=site, 2026-11-04): the chat explains the
 * offer step by step with buttons, and "Falar com o consultor" opens the sales WhatsApp. No trial
 * and no "grátis" here: it is a paid offer.
 */
export const SITE_SALES = {
  intro: `Oi! 👋 Vou te mostrar como ter um site profissional + agenda online para o seu negócio. Leva 1 minuto.`,
  askName: "Pra começar, qual o nome do seu negócio?",
  pitchSite: `Perfeito, {nome}! A gente cria um site profissional para você, com seus serviços, fotos, localização e Instagram. Fica pronto em até 48 horas úteis.`,
  nextAgenda: "Legal, e o que mais?",
  pitchAgenda:
    "E o melhor: todo botão de “Agendar” do site abre o seu chat de agendamento. O cliente escolhe o serviço e um horário livre e já cai na sua agenda, 24h, sem você responder mensagem. E você recebe o aviso no celular.",
  seeHow: "Quero ver como funciona",
  toPrice: "Entendi, e o preço?",
  afterSimulation: "Viu? É assim que seu cliente agenda pelo site. Quer saber o preço?",
  pitchPrice: `💰 ${price(SITE_OFFER.monthlyCents)}/mês, sem taxa de criação: o site e a agenda já estão inclusos. Debitado pelo Pix Automático. Sem fidelidade: cancele quando quiser.`,
  want: "Quero meu site",
  doubts: "Ficou uma dúvida",
  doubtsIntro: "Pode escolher:",
  faq: [
    {
      q: "Preciso entender de site?",
      a: "Não. A gente faz tudo: você só confere e pede ajustes se quiser.",
    },
    {
      q: "Posso mudar algo depois?",
      a: "Pode. Pequenos ajustes no site estão incluídos na mensalidade. É só pedir por e-mail.",
    },
    {
      q: "Tem taxa para criar o site?",
      a: `Não. Você paga só a mensalidade de ${price(SITE_OFFER.monthlyCents)}, e o site já está incluso.`,
    },
    {
      q: "Funciona no celular?",
      a: "Sim. O site e o chat de agendamento foram feitos para o celular, e funcionam no computador também.",
    },
    {
      q: "E se eu cancelar?",
      a: "Sem multa nem fidelidade. Tudo segue até o fim do mês pago; depois o site sai do ar e o seu link continua recebendo pedidos pelo WhatsApp.",
    },
    {
      q: "O que vocês precisam de mim?",
      a: "Só o cadastro. Usamos as informações e fotos do seu perfil e, se faltar algo, falamos com você.",
    },
  ],
  askDomain: `Quer um endereço próprio, tipo seunegocio.com.br? São +${price(SITE_OFFER.domainYearlyCents)} por ano.`,
  wantDomain: "Quero meu domínio",
  noDomain: "Agora não",
  askDomainName:
    "Qual endereço você prefere? Ex.: studiolumi.com.br. A gente confere se está livre.",
  domainPlaceholder: "seunegocio.com.br",
  invalidDomain: "Esse endereço não parece certo. Escreve só o nome, tipo studiolumi.com.br.",
  toSignup: "Ótimo! Agora é só criar sua conta e pagar para a gente começar.",
  created:
    "🎉 Conta criada, {nome}! No painel, pague o Pix para ativar. Assim que cair, sua agenda é liberada e começamos o seu site.",
  consultant: "Falar com o consultor",
  /** Sales WhatsApp (a regular wa.me link the person opens; no API). */
  consultantPhone: "5518996742364",
  consultantMessage: "Oi! Vim pelo MeetChat e quero saber mais sobre o Site + Agenda.{negocio}",
} as const;
