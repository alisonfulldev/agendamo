import { PRICE_TEXT, TRIAL_DAYS } from "@/lib/plans";

import type { BrandConfigInput } from "./schema";

// Niche of the Agendamo product (domain still provisional).
export const barber = {
  key: "barber",
  name: "Agendamo",
  domains: ["barber.example.com"],
  logo: "/brands/barber/logo.svg",
  favicon: "/brands/barber/favicon.svg",
  defaultSegment: "barber",
  niche: {
    route: "barbearia",
    name: "Barbearia",
    icon: "scissors",
    group: "beauty",
    label: "Barbearias e barbeiros",
    pitch: "Corte, barba e combo marcados sozinhos, com agenda por barbeiro.",
  },
  theme: {
    primary: "#C8A15A",
    background: "#141414",
    surface: "#1F1F1F",
    text: "#F2EDE4",
    muted: "#A39E95",
    button: "#C8A15A",
    accent: "#2C2A26",
    danger: "#F04438",
    headingFont: "oswald",
    bodyFont: "inter",
    radius: "0.25rem",
  },
  sales: {
    title: "Seus clientes marcam o corte sozinhos, direto pelo link da bio",
    subtitle:
      "Um chat de agendamento com a cara da sua barbearia. O cliente toca no link, escolhe o serviço, o barbeiro e o horário livre, e já está na agenda. Sem ficar respondendo no WhatsApp.",
    demo: {
      businessName: "Barbearia Navalha",
      bio: "Corte, barba e resenha boa.",
      prices: [4500, 3500, 7000, 2000],
      customerName: "Rafael",
      dayLabel: "Sexta, 13 de março",
      time: "18:30",
    },
    pains: [
      "Parar o corte pra responder “tem horário hoje?”",
      "Cliente que chamou à noite e foi pra outra barbearia",
      "Horário marcado que fica vazio porque o cliente esqueceu",
    ],
    benefits: [
      {
        title: "Chat de agendamento 24 horas",
        description: "O cliente escolhe serviço, barbeiro, dia e horário e já fica agendado.",
      },
      {
        title: "Perfil igual ao do WhatsApp",
        description: "Tocando na foto, ele vê seus cortes, preços e avaliações.",
      },
      {
        title: "Lembretes automáticos",
        description: "Menos cadeira vazia: o cliente recebe o lembrete antes do horário.",
      },
      {
        title: "Sinal por Pix",
        description: "Peça sinal em horários concorridos. O Pix vai direto pra você.",
      },
      {
        title: "Financeiro simples",
        description: "Receitas dos cortes, custos e o lucro do mês, sem caderninho.",
      },
      {
        title: "Agenda por barbeiro",
        description: "Cada barbeiro com a própria agenda, e botão de agendar no seu site.",
      },
    ],
    howItWorks: [
      {
        title: "Cadastre serviços e horários",
        description: "Corte, barba, combo: preço, duração e seus dias de atendimento.",
      },
      {
        title: "Cole o link na bio",
        description: "Instagram, status do WhatsApp, Google e onde mais quiser.",
      },
      {
        title: "Receba agendamentos",
        description: "Os clientes escolhem o horário livre sozinhos, a qualquer hora.",
      },
    ],
    faq: [
      {
        question: "Preciso de cartão para testar?",
        answer: `Não. São ${TRIAL_DAYS} dias grátis com tudo liberado, sem cartão. Depois, ${PRICE_TEXT.summary}.`,
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
        answer: `Sim. Cada profissional tem a própria agenda. O plano inclui 1 profissional e cada extra custa ${PRICE_TEXT.extraProfessional}.`,
      },
      {
        question: "Dá pra cada barbeiro ter a própria agenda?",
        answer:
          "Dá. O cliente escolhe com quem quer cortar ou pega o primeiro horário livre de qualquer um.",
      },
      {
        question: "Posso colocar no meu site?",
        answer:
          "Pode. Cole o link do chat nos botões do site ou use o botão pronto que abre o chat por cima da página.",
      },
    ],
    testimonials: [
      {
        name: "Diego",
        role: "Barbeiro",
        quote: "Acabou o vai e vem de mensagem para marcar corte.",
        isExample: true,
      },
      {
        name: "Marcos",
        role: "Dono de barbearia",
        quote: "Os clientes marcam até de madrugada e eu só confiro de manhã.",
        isExample: true,
      },
    ],
  },
  suggestedServices: [
    { name: "Corte", durationMinutes: 30 },
    { name: "Barba", durationMinutes: 30 },
    { name: "Corte + barba", durationMinutes: 60 },
    { name: "Pezinho", durationMinutes: 15 },
    { name: "Sobrancelha", durationMinutes: 15 },
  ],
  terms: {
    customer: { singular: "cliente", plural: "clientes" },
    service: { singular: "serviço", plural: "serviços" },
    appointment: { singular: "horário", plural: "horários" },
  },
  chatMessages: {
    greeting: "Fala! 👊 Você está na agenda de {business}. Qual serviço vai ser?",
    askProfessional: "Com qual barbeiro você prefere?",
    askDate: "Beleza! Qual dia fica melhor pra você?",
    askTime: "Esses são os horários livres em {date}:",
    noSlots: "Esse dia está lotado. Quer escolher outro dia ou entrar na lista de espera?",
    askName: "Pra confirmar, qual seu nome?",
    askPhone: "Agora seu WhatsApp:",
    askEmail: "Quer a confirmação no e-mail? Se quiser, manda aí (é opcional):",
    optInLabel: "Se eu não terminar o agendamento, podem me chamar no WhatsApp",
    askCoupon: "Tem cupom de desconto?",
    summary: "Confere: {service} com {professional}, {date} às {time}, valor R$ {price}",
    successConfirmed: "Fechado, {customerName}! Seu horário está confirmado. 💈",
    emailNote: "A confirmação foi pro seu e-mail.",
    successPending: "Pedido recebido! {business} vai confirmar seu horário.",
    successDeposit:
      "Pra garantir seu horário, pague o sinal de R$ {depositAmount} pelo Pix abaixo até {deadline}.",
    conflict: "Ops, esse horário acabou de ser ocupado. Veja os horários atualizados:",
    blocked:
      "No momento não conseguimos concluir seu agendamento por aqui. Fale direto com {business} pelo WhatsApp.",
    error: "Deu um erro do nosso lado. Tenta de novo em instantes?",
  },
  messageTemplates: {
    reactivation:
      "Fala, {customerName}! Aqui é {business}. Sumiu, hein? Bora dar um trato no visual essa semana?",
    return:
      "Fala, {customerName}! Já tá na hora de repetir o {service}. Quer que eu separe um horário?",
    birthday:
      "Parabéns, {customerName}! 🎉 Presente de {business}: vem cortar com desconto essa semana.",
    abandoned:
      "Fala, {customerName}! Vi que você quase marcou {service}. Quer ajuda pra escolher o horário?",
  },
  emailFrom: {
    name: "Agendamo",
    address: "contato@barber.example.com",
  },
  socialLinks: {},
} satisfies BrandConfigInput;
