import { PRICE_TEXT } from "@/lib/plans";

import type { BrandConfigInput, Segment } from "./schema";

type Term = { singular: string; plural: string };
type Niche = NonNullable<BrandConfigInput["niche"]>;
type ChatMessages = BrandConfigInput["chatMessages"];

/**
 * "general": any business with appointments (cliente / serviço / horário, casual chat).
 * "health": health professionals (paciente / atendimento / sessão, more formal chat, online FAQ).
 */
export type NicheKind = "general" | "health";

/** What each niche defines; everything else is shared by all niches of the same kind. */
export interface NicheBrandInput {
  key: string;
  segment: Segment;
  kind?: NicheKind;
  /** Absent only for the MeetChat product itself (generic home). */
  niche?: Niche;
  domains?: string[];
  theme: BrandConfigInput["theme"];
  title: string;
  subtitle: string;
  demo: BrandConfigInput["sales"]["demo"];
  pains: [string, string, string];
  services: BrandConfigInput["suggestedServices"];
  customer?: Term;
  service?: Term;
  appointment?: Term;
  /** Niche questions shown before the shared ones. */
  faq?: { question: string; answer: string }[];
  testimonial?: { name: string; role: string; quote: string };
  /** Niche wording for a few chat messages (e.g. "Com qual barbeiro você prefere?"). */
  chat?: Partial<ChatMessages>;
}

const TERMS: Record<NicheKind, { customer: Term; service: Term; appointment: Term }> = {
  general: {
    customer: { singular: "cliente", plural: "clientes" },
    service: { singular: "serviço", plural: "serviços" },
    appointment: { singular: "horário", plural: "horários" },
  },
  health: {
    customer: { singular: "paciente", plural: "pacientes" },
    service: { singular: "atendimento", plural: "atendimentos" },
    appointment: { singular: "sessão", plural: "sessões" },
  },
};

/**
 * Builds a niche brand. Texts avoid gendered articles around the terms ("horário" instead of
 * "a sessão") so every niche reads naturally; prices always come from PRICE_TEXT.
 */
export function nicheBrand<T extends NicheBrandInput>(input: T) {
  const kind = input.kind ?? "general";
  const health = kind === "health";
  const customer = input.customer ?? TERMS[kind].customer;
  const service = input.service ?? TERMS[kind].service;
  const appointment = input.appointment ?? TERMS[kind].appointment;
  const casual = !health;
  const chat: ChatMessages = {
    greeting: casual
      ? `Oi! 👋 Você está na agenda de {business}. Qual ${service.singular} você quer agendar?`
      : `Olá! Você está na agenda de {business}. Qual ${service.singular} você gostaria de agendar?`,
    askProfessional: casual ? "Com quem você prefere?" : "Com qual profissional você prefere?",
    askDate: casual ? "Ótimo! Qual dia fica melhor pra você?" : "Qual dia fica melhor pra você?",
    askTime: casual
      ? "Esses são os horários livres em {date}:"
      : "Estes são os horários livres em {date}:",
    noSlots: casual
      ? "Esse dia está cheio. Quer escolher outro dia ou entrar na lista de espera?"
      : "Este dia está sem horários. Quer escolher outro dia ou entrar na lista de espera?",
    askName: casual ? "Pra confirmar, me diz seu nome:" : "Para confirmar, qual é o seu nome?",
    askPhone: "Agora seu WhatsApp:",
    askEmail: casual
      ? "Quer receber a confirmação por e-mail? Se quiser, me diz seu e-mail (é opcional):"
      : "Se quiser receber a confirmação por e-mail, informe seu e-mail (é opcional):",
    optInLabel: "Se eu não terminar o agendamento, podem me chamar no WhatsApp",
    askCoupon: "Tem cupom de desconto?",
    summary: casual
      ? "Confere: {service} com {professional}, {date} às {time}, valor R$ {price}"
      : "Confira: {service} com {professional}, {date} às {time}, valor R$ {price}",
    successConfirmed: casual
      ? "Prontinho, {customerName}! Seu horário está confirmado. ✅"
      : "Obrigado, {customerName}! Seu horário está confirmado.",
    emailNote: "A confirmação foi enviada por e-mail.",
    successPending: "Recebemos seu pedido. {business} vai confirmar seu horário.",
    successDeposit:
      "Seu horário está reservado! Falta só o pagamento pelo Pix:",
    conflict: "Esse horário acabou de ser ocupado. Veja os horários atualizados:",
    blocked:
      "No momento não conseguimos concluir o agendamento por aqui. Fale direto com {business} pelo WhatsApp.",
    error: "Algo deu errado do nosso lado. Pode tentar de novo em instantes?",
    ...input.chat,
  };
  return {
    key: input.key,
    name: "MeetChat",
    domains: input.domains ?? [`${input.niche?.route ?? input.key}.example.com`],
    logo: `/brands/${input.key}/logo.svg`,
    favicon: `/brands/${input.key}/favicon.svg`,
    defaultSegment: input.segment,
    niche: input.niche as T["niche"],
    theme: input.theme,
    sales: {
      title: input.title,
      subtitle: input.subtitle,
      demo: input.demo,
      pains: input.pains,
      // Same order as the illustrations of the sales page (chat, profile, reminders, Pix,
      // finance, calendar).
      benefits: [
        {
          title: "Agendamento 24 horas pelo chat",
          description: `O ${customer.singular} escolhe o ${service.singular}, o dia e um horário livre, e já fica na sua agenda.`,
        },
        {
          title: "Perfil igual ao do WhatsApp",
          description: health
            ? "Tocando na sua foto, o paciente vê formação, atendimentos, valores e fotos do espaço."
            : "Tocando na sua foto, o cliente vê fotos dos trabalhos, serviços, preços e avaliações.",
        },
        {
          title: "Lembretes automáticos",
          description: `Menos faltas: o ${customer.singular} recebe a confirmação e o lembrete antes do horário.`,
        },
        {
          title: "Sinal no agendamento",
          description: "No plano Pro: sinal ou valor total pelo Pix, com comprovante no chat.",
        },
        {
          title: "Financeiro simples",
          description: `Receitas dos ${service.plural}, custos e o resultado do mês, sem planilha.`,
        },
        {
          title: "Agenda da equipe e site próprio",
          description: "Cada profissional com a própria agenda, e um botão de agendar no seu site.",
        },
      ],
      howItWorks: [
        {
          title: `Cadastre ${service.plural} e horários`,
          description: "Em 5 minutos, com valor, duração e os dias em que você atende.",
        },
        {
          title: "Divulgue seu link",
          description: "Instagram, status do WhatsApp, Google e onde mais quiser.",
        },
        {
          title: "Receba agendamentos",
          description: `O ${customer.singular} escolhe um horário livre sozinho, até de madrugada.`,
        },
      ],
      faq: [
        ...(input.faq ?? []),
        {
          question: "Preciso de cartão para testar?",
          answer: PRICE_TEXT.noCard,
        },
        {
          question: `Meus ${customer.plural} precisam baixar algum aplicativo?`,
          answer: "Não. O link abre direto no navegador do celular, como uma conversa.",
        },
        ...(health
          ? [
              {
                question: "Atendo online e presencial. Funciona?",
                answer: `Sim. Cada ${service.singular} tem a própria duração e valor, e você indica no nome se é online ou presencial.`,
              },
            ]
          : []),
        {
          question: "E se eu não assinar depois do teste?",
          answer:
            "Seu link continua no ar, mas os pedidos passam a chegar pelo seu WhatsApp, sem entrar na agenda. Nada é apagado: assinando, tudo volta na hora.",
        },
        {
          question: "Funciona com mais de um profissional?",
          answer: `Sim. Cada profissional tem a própria agenda. O plano inclui 1 profissional e cada extra custa ${PRICE_TEXT.extraProfessional}.`,
        },
        {
          question: "Posso colocar no meu site?",
          answer:
            "Pode. Cole o link do chat nos botões do site ou use o botão pronto que abre o chat por cima da página.",
        },
      ],
      testimonials: input.testimonial ? [{ ...input.testimonial, isExample: true }] : [],
    },
    suggestedServices: input.services,
    terms: { customer, service, appointment },
    chatMessages: chat,
    messageTemplates: {
      reactivation: casual
        ? "Oi, {customerName}! Aqui é {business}. Faz tempo que não te vejo por aqui. Que tal marcar um horário essa semana?"
        : "Olá, {customerName}. Aqui é {business}. Se quiser retomar, tenho horários disponíveis esta semana.",
      return: casual
        ? "Oi, {customerName}! Já está na hora de renovar o seu {service}. Quer que eu reserve um horário pra você?"
        : "Olá, {customerName}. Lembrete: podemos agendar seu próximo horário?",
      birthday: casual
        ? "Feliz aniversário, {customerName}! 🎉 Que tal marcar um horário essa semana?"
        : "Feliz aniversário, {customerName}! Desejamos um dia leve e cheio de cuidado.",
      abandoned:
        "Oi, {customerName}! Vi que você começou a agendar {service}. Posso ajudar com algum horário?",
    },
    emailFrom: { name: "MeetChat", address: "contato@agendamo.example.com" },
    socialLinks: {},
  } satisfies BrandConfigInput;
}
