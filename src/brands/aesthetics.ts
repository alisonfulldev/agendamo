import type { BrandConfigInput } from "./schema";

// Example brand (Prompt 39): configuration only. Provisional name, domain and copy.
export const aesthetics = {
  key: "aesthetics",
  name: "Lively Estética",
  domains: ["estetica.example.com"],
  logo: "/brands/aesthetics/logo.svg",
  favicon: "/brands/aesthetics/favicon.svg",
  defaultSegment: "aesthetics",
  theme: {
    primary: "#4F6B57",
    background: "#F7F4EE",
    surface: "#FFFFFF",
    text: "#24302A",
    muted: "#55625A",
    button: "#4F6B57",
    accent: "#E3EBDD",
    danger: "#B42318",
    headingFont: "lora",
    bodyFont: "nunito",
    radius: "0.75rem",
  },
  sales: {
    title: "Suas clientes agendam procedimentos sozinhas, direto pelo link da bio",
    subtitle:
      "Um chat de agendamento com a cara da sua clínica. A cliente toca no link, escolhe o procedimento e o horário livre, e já está na agenda, respeitando sala e maca ocupadas.",
    demo: {
      businessName: "Clínica Essência",
      bio: "Estética facial e corporal com cuidado e técnica.",
      prices: [18000, 15000, 22000, 12000],
      customerName: "Juliana",
      dayLabel: "Quinta, 12 de março",
      time: "10:00",
    },
    pains: [
      "Passar o dia confirmando horário pelo WhatsApp",
      "Duas clientes marcadas na mesma maca",
      "Procedimento longo perdido por falta sem aviso",
    ],
    benefits: [
      {
        title: "Chat de agendamento 24 horas",
        description: "A cliente escolhe procedimento, dia e horário livre e já fica agendada.",
      },
      {
        title: "Salas e macas sem conflito",
        description: "O sistema só oferece horários com o espaço livre.",
      },
      { title: "Lembretes automáticos", description: "Menos faltas em procedimentos longos." },
      {
        title: "Sinal por Pix e pacotes",
        description: "Sinal nos horários concorridos e pacotes de sessões.",
      },
      {
        title: "Financeiro simples",
        description: "Receitas dos atendimentos, custos e o lucro do mês.",
      },
      {
        title: "Equipe e site próprio",
        description: "Agenda por profissional e botão de agendar no seu site.",
      },
    ],
    howItWorks: [
      {
        title: "Cadastre procedimentos e horários",
        description: "Duração, intervalo, preço e quais precisam de sala ou maca.",
      },
      {
        title: "Cole o link na bio",
        description: "Instagram, status do WhatsApp, Google e onde mais quiser.",
      },
      {
        title: "Receba agendamentos",
        description: "As clientes escolhem o horário livre sozinhas, sem conflito de sala.",
      },
    ],
    faq: [
      {
        question: "Preciso de cartão para testar?",
        answer:
          "Não. São 30 dias grátis com tudo liberado, sem cartão. Depois, R$ 29/mês ou R$ 240/ano (sai R$ 20/mês).",
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
        answer:
          "Sim. Cada profissional tem a própria agenda. O plano inclui 1 profissional e cada extra custa R$ 9/mês.",
      },
      {
        question: "Funciona com salas e macas compartilhadas?",
        answer:
          "Sim. Você liga cada procedimento à sala ou maca e o chat nunca oferece um horário com o espaço ocupado.",
      },
      {
        question: "Posso colocar no meu site?",
        answer:
          "Pode. Cole o link do chat nos botões do site ou use o botão pronto que abre o chat por cima da página.",
      },
    ],
    testimonials: [
      {
        name: "Patrícia",
        role: "Esteticista",
        quote: "As clientes agendam limpeza de pele direto pelo Instagram.",
        isExample: true,
      },
    ],
  },
  suggestedServices: [
    { name: "Limpeza de pele", durationMinutes: 90 },
    { name: "Drenagem linfática", durationMinutes: 60 },
    { name: "Peeling", durationMinutes: 60 },
    { name: "Massagem modeladora", durationMinutes: 60 },
    { name: "Depilação a laser", durationMinutes: 30 },
  ],
  terms: {
    customer: { singular: "cliente", plural: "clientes" },
    service: { singular: "procedimento", plural: "procedimentos" },
    appointment: { singular: "horário", plural: "horários" },
  },
  chatMessages: {
    greeting: "Olá! Você está na agenda de {business}. Qual procedimento você quer agendar?",
    askProfessional: "Com qual profissional você prefere?",
    askDate: "Perfeito! Qual dia fica melhor pra você?",
    askTime: "Esses são os horários livres em {date}:",
    noSlots: "Esse dia está completo. Quer escolher outro dia ou entrar na lista de espera?",
    askName: "Para confirmar, qual é o seu nome?",
    askPhone: "Agora seu WhatsApp:",
    askEmail: "Quer receber a confirmação por e-mail? Se quiser, informe seu e-mail (é opcional):",
    optInLabel: "Se eu não terminar o agendamento, podem me chamar no WhatsApp",
    askCoupon: "Tem cupom de desconto?",
    summary: "Confira: {service} com {professional}, {date} às {time}, valor R$ {price}",
    successConfirmed: "Tudo certo, {customerName}! Seu horário está confirmado. 🌿",
    emailNote: "Enviamos a confirmação por e-mail.",
    successPending: "Recebemos seu pedido! {business} vai confirmar seu horário.",
    successDeposit:
      "Para garantir seu horário, pague o sinal de R$ {depositAmount} pelo Pix abaixo até {deadline}.",
    conflict: "Ops, esse horário acabou de ser ocupado. Veja os horários atualizados:",
    blocked:
      "No momento não conseguimos concluir seu agendamento por aqui. Fale direto com {business} pelo WhatsApp.",
    error: "Algo deu errado do nosso lado. Pode tentar de novo em instantes?",
  },
  messageTemplates: {
    reactivation:
      "Olá, {customerName}! Aqui é {business}. Sentimos sua falta. Que tal agendar um momento de cuidado essa semana?",
    return:
      "Olá, {customerName}! Já está na hora do seu retorno de {service}. Posso reservar um horário?",
    birthday:
      "Feliz aniversário, {customerName}! 🌿 A {business} preparou um presente especial pra você.",
    abandoned:
      "Olá, {customerName}! Vi que você quase agendou {service}. Posso ajudar a escolher um horário?",
  },
  emailFrom: { name: "Lively Estética", address: "contato@estetica.example.com" },
  socialLinks: {},
} satisfies BrandConfigInput;
