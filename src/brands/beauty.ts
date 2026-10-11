import { PRICE_TEXT } from "@/lib/plans";

import type { BrandConfigInput } from "./schema";

// Niche of the MeetChat product (domain still provisional).
export const beauty = {
  key: "beauty",
  name: "MeetChat",
  domains: ["beauty.example.com"],
  logo: "/brands/beauty/logo.svg",
  favicon: "/brands/beauty/favicon.svg",
  defaultSegment: "beauty",
  niche: {
    route: "beleza",
    name: "Beleza",
    icon: "sparkles",
    group: "beauty",
    label: "Salões, esmalterias e estúdios de beleza",
    pitch: "Unhas, cabelo, cílios e sobrancelha com agenda cheia e menos faltas.",
  },
  theme: {
    primary: "#A8466D",
    background: "#FFF8F6",
    surface: "#FFFFFF",
    text: "#2B1B22",
    muted: "#7A6670",
    button: "#A8466D",
    accent: "#F3D6DF",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "poppins",
    radius: "1rem",
  },
  sales: {
    title: "Suas clientes agendam sozinhas, direto pelo seu link",
    subtitle:
      "Um chat de agendamento com a cara do seu salão. A cliente toca no link, escolhe o serviço e o horário livre, e pronto: já está na sua agenda. Sem ficar respondendo no WhatsApp.",
    demo: {
      businessName: "Studio Bela",
      bio: "Unhas, cabelo e sobrancelha com carinho.",
      prices: [9000, 6000, 4000, 4500],
      customerName: "Mariana",
      dayLabel: "Sábado, 14 de março",
      time: "14:00",
    },
    pains: [
      "Responder “tem horário?” o dia inteiro",
      "Perder a cliente que chamou à noite e você só viu de manhã",
      "Cliente que esquece e falta",
    ],
    benefits: [
      {
        title: "Chat de agendamento 24 horas",
        description: "A cliente escolhe serviço, dia e horário livre e já fica agendada.",
      },
      {
        title: "Perfil igual ao do WhatsApp",
        description: "Tocando na sua foto, ela vê fotos dos trabalhos, preços e avaliações.",
      },
      {
        title: "Lembretes automáticos",
        description: "Menos faltas: a cliente recebe o lembrete antes do horário.",
      },
      {
        title: "Sinal no agendamento",
        description: "Sinal ou valor total pelo Pix, com comprovante no chat.",
      },
      {
        title: "Financeiro simples",
        description: "Receitas dos atendimentos, custos e o lucro do mês, sem planilha.",
      },
      {
        title: "Equipe e site próprio",
        description: "Agenda por profissional e botão de agendar no seu site.",
      },
    ],
    howItWorks: [
      {
        title: "Cadastre serviços e horários",
        description: "Em 5 minutos, com preço, duração e seus dias de atendimento.",
      },
      {
        title: "Divulgue seu link",
        description: "Instagram, status do WhatsApp, Google e onde mais quiser.",
      },
      {
        title: "Receba agendamentos",
        description: "As clientes escolhem o horário livre sozinhas, até de madrugada.",
      },
    ],
    faq: [
      {
        question: "Preciso de cartão para testar?",
        answer: PRICE_TEXT.noCard,
      },
      {
        question: "Minhas clientes precisam baixar algum aplicativo?",
        answer: "Não. O link abre direto no navegador do celular, como uma conversa.",
      },
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
        question: "Funciona para unhas, cílios, sobrancelha e cabelo?",
        answer: "Sim. Você cadastra cada serviço com a duração e o preço que quiser.",
      },
      {
        question: "Posso colocar no meu site?",
        answer:
          "Pode. Cole o link do chat nos botões do site ou use o botão pronto que abre o chat por cima da página.",
      },
    ],
    testimonials: [
      {
        name: "Camila",
        role: "Nail designer",
        quote: "Parei de responder horário por mensagem o dia inteiro.",
        isExample: true,
      },
      {
        name: "Renata",
        role: "Dona de salão",
        quote: "As clientes acham a página linda e agendam sozinhas.",
        isExample: true,
      },
    ],
  },
  suggestedServices: [
    { name: "Corte feminino", durationMinutes: 60 },
    { name: "Escova", durationMinutes: 45 },
    { name: "Manicure", durationMinutes: 45 },
    { name: "Pedicure", durationMinutes: 45 },
    { name: "Design de sobrancelha", durationMinutes: 30 },
    { name: "Extensão de cílios", durationMinutes: 120 },
  ],
  terms: {
    customer: { singular: "cliente", plural: "clientes" },
    service: { singular: "serviço", plural: "serviços" },
    appointment: { singular: "horário", plural: "horários" },
  },
  chatMessages: {
    greeting: "Oi! 👋 Você está na agenda de {business}. Qual serviço você quer agendar?",
    askProfessional: "Com quem você prefere?",
    askDate: "Ótimo! Qual dia fica melhor pra você?",
    askTime: "Esses são os horários livres em {date}:",
    noSlots: "Esse dia está cheio. Quer escolher outro dia ou entrar na lista de espera?",
    askName: "Pra confirmar, me diz seu nome:",
    askPhone: "Agora seu WhatsApp:",
    askEmail: "Quer receber a confirmação por e-mail? Se quiser, me diz seu e-mail (é opcional):",
    optInLabel: "Se eu não terminar o agendamento, podem me chamar no WhatsApp",
    askCoupon: "Tem cupom de desconto?",
    summary: "Confere pra mim: {service} com {professional}, {date} às {time}, valor R$ {price}",
    successConfirmed: "Prontinho, {customerName}! Seu horário está confirmado. 💅",
    emailNote: "Te mandei a confirmação por e-mail.",
    successPending: "Recebi seu pedido! {business} vai confirmar seu horário.",
    successDeposit: "Seu horário está reservado! Falta só o pagamento pelo Pix:",
    conflict: "Ops, esse horário acabou de ser ocupado. Veja os horários atualizados:",
    blocked:
      "No momento não conseguimos concluir seu agendamento por aqui. Fale direto com {business} pelo WhatsApp.",
    error: "Algo deu errado do nosso lado. Tenta de novo em instantes?",
  },
  messageTemplates: {
    reactivation:
      "Oi, {customerName}! Aqui é {business}. Faz tempo que não te vejo por aqui 💕 Que tal marcar um horário essa semana?",
    return:
      "Oi, {customerName}! Já está na hora de renovar o seu {service}. Quer que eu reserve um horário pra você?",
    birthday:
      "Feliz aniversário, {customerName}! 🎉 A {business} preparou um mimo pra você. Bora marcar?",
    abandoned:
      "Oi, {customerName}! Vi que você quase agendou {service} com a gente. Posso te ajudar a escolher um horário?",
  },
  emailFrom: {
    name: "MeetChat",
    address: "contato@beauty.example.com",
  },
  socialLinks: {},
} satisfies BrandConfigInput;
