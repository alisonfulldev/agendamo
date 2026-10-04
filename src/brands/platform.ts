import type { BrandConfigInput } from "./schema";

/**
 * The Agendamo product itself: generic home page (/) that sells to every niche and links to the
 * niche pages (/beleza, /barbearia…). Not a niche: no business ever belongs to it.
 */
export const platform = {
  key: "agendamo",
  name: "Agendamo",
  domains: ["agendamo.example.com"],
  logo: "/brands/agendamo/logo.svg",
  favicon: "/brands/agendamo/favicon.svg",
  defaultSegment: "beauty",
  theme: {
    primary: "#4338CA",
    background: "#F8F9FC",
    surface: "#FFFFFF",
    text: "#141A2E",
    muted: "#5B6478",
    button: "#4338CA",
    accent: "#E3E5FB",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "inter",
    radius: "1rem",
  },
  sales: {
    title: "Seus clientes agendam sozinhos, direto pelo link da bio",
    subtitle:
      "O Agendamo é um chat de agendamento para quem trabalha com hora marcada. O cliente toca no seu link, escolhe o serviço e um horário livre, e já fica na sua agenda. Sem ficar respondendo mensagem.",
    demo: {
      businessName: "Seu negócio",
      bio: "Atendimento com hora marcada.",
      prices: [8000, 12000, 6000],
      customerName: "Ana",
      dayLabel: "Sábado, 14 de março",
      time: "10:00",
    },
    pains: [
      "Responder “tem horário?” o dia inteiro",
      "Perder o cliente que chamou à noite e você só viu de manhã",
      "Horário marcado que fica vazio porque esqueceram",
    ],
    benefits: [
      {
        title: "Chat de agendamento 24 horas",
        description: "O cliente escolhe serviço, dia e horário livre e já fica agendado.",
      },
      {
        title: "Perfil igual ao do WhatsApp",
        description: "Tocando na sua foto, ele vê fotos, serviços, preços e avaliações.",
      },
      {
        title: "Lembretes automáticos",
        description: "Menos faltas: o cliente recebe o lembrete antes do horário.",
      },
      {
        title: "Sinal por Pix",
        description: "Peça sinal nos horários que costumam ter falta. O Pix vai direto pra você.",
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
        title: "Escolha seu tipo de negócio",
        description: "Os textos, serviços e cores já vêm prontos para o seu nicho.",
      },
      {
        title: "Cadastre serviços e horários",
        description: "Em 5 minutos, com preço, duração e seus dias de atendimento.",
      },
      {
        title: "Cole o link na bio",
        description: "Instagram, status do WhatsApp, Google e o seu site. Pronto: é só receber.",
      },
    ],
    faq: [
      {
        question: "Para quais tipos de negócio funciona?",
        answer:
          "Para quem atende com hora marcada: salões, barbearias, estética, psicologia, fisioterapia e outros. Cada nicho tem textos e exemplos próprios.",
      },
      {
        question: "Preciso de cartão para testar?",
        answer:
          "Não. São 30 dias grátis com tudo liberado, sem cartão. Depois, R$ 29/mês ou R$ 240/ano (sai R$ 20/mês).",
      },
      {
        question: "Meus clientes precisam baixar algum aplicativo?",
        answer: "Não. O link abre direto no navegador do celular, como uma conversa.",
      },
      {
        question: "E se eu não assinar depois do teste?",
        answer:
          "Seu link continua no ar, mas os pedidos passam a chegar pelo seu WhatsApp, sem entrar na agenda. Nada é apagado: assinando, tudo volta na hora.",
      },
      {
        question: "Funciona com mais de um profissional?",
        answer:
          "Sim. Cada profissional tem a própria agenda. O plano inclui 1 profissional e cada extra custa R$ 9/mês.",
      },
      {
        question: "Posso colocar no meu site?",
        answer:
          "Pode. Cole o link do chat nos botões do site ou use o botão pronto que abre o chat por cima da página.",
      },
    ],
    testimonials: [],
  },
  suggestedServices: [
    { name: "Atendimento", durationMinutes: 60 },
    { name: "Avaliação", durationMinutes: 60 },
    { name: "Retorno", durationMinutes: 30 },
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
    summary: "Confere: {service} com {professional}, {date} às {time}, valor R$ {price}",
    successConfirmed: "Prontinho, {customerName}! Seu horário está confirmado. ✅",
    emailNote: "A confirmação foi para o seu e-mail.",
    successPending: "Recebemos seu pedido! {business} vai confirmar seu horário.",
    successDeposit:
      "Para garantir seu horário, pague o sinal de R$ {depositAmount} pelo Pix abaixo até {deadline}.",
    conflict: "Ops, esse horário acabou de ser ocupado. Veja os horários atualizados:",
    blocked:
      "No momento não conseguimos concluir seu agendamento por aqui. Fale direto com {business} pelo WhatsApp.",
    error: "Algo deu errado do nosso lado. Tenta de novo em instantes?",
  },
  messageTemplates: {
    reactivation:
      "Oi, {customerName}! Aqui é {business}. Faz tempo que não te vejo por aqui. Que tal marcar um horário essa semana?",
    return:
      "Oi, {customerName}! Já está na hora de renovar o seu {service}. Quer que eu reserve um horário pra você?",
    birthday: "Feliz aniversário, {customerName}! 🎉 Que tal marcar um horário essa semana?",
    abandoned:
      "Oi, {customerName}! Vi que você quase agendou {service} com a gente. Posso te ajudar a escolher um horário?",
  },
  emailFrom: { name: "Agendamo", address: "contato@agendamo.example.com" },
  socialLinks: {},
} satisfies BrandConfigInput;
