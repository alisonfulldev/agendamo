import type { BrandConfigInput } from "./schema";

// Example brand (Prompt 39): configuration only. Provisional name, domain and copy.
export const psychology = {
  key: "psychology",
  name: "Agendamo",
  domains: ["psicologia.example.com"],
  logo: "/brands/psychology/logo.svg",
  favicon: "/brands/psychology/favicon.svg",
  defaultSegment: "psychology",
  niche: {
    route: "psicologia",
    name: "Psicologia",
    label: "Psicólogas e psicólogos",
    pitch: "Agendamento discreto de sessões, presenciais ou online.",
  },
  theme: {
    primary: "#4A5B7A",
    background: "#F6F5FA",
    surface: "#FFFFFF",
    text: "#252A36",
    muted: "#585E6E",
    button: "#4A5B7A",
    accent: "#E7E1F3",
    danger: "#B42318",
    headingFont: "lora",
    bodyFont: "nunito",
    radius: "1rem",
  },
  sales: {
    title: "Seus pacientes agendam a sessão com tranquilidade, pelo seu link",
    subtitle:
      "Um agendamento discreto e acolhedor para o seu consultório. O paciente escolhe o atendimento e um horário livre, e recebe a confirmação por e-mail. Sem trocas de mensagem para marcar.",
    demo: {
      businessName: "Consultório Acolher",
      bio: "Psicoterapia para adultos, presencial e online.",
      prices: [18000, 20000, 15000, 18000],
      customerName: "Carla",
      dayLabel: "Terça, 10 de março",
      time: "19:00",
    },
    pains: [
      "Interromper o dia para combinar horário por mensagem",
      "Pacientes com vergonha de perguntar se há vaga",
      "Sessões perdidas por esquecimento",
    ],
    benefits: [
      {
        title: "Agendamento discreto",
        description: "O paciente marca a sessão sem precisar conversar para isso.",
      },
      {
        title: "Perfil profissional",
        description: "Abordagem, valores, formação e avaliações num só lugar.",
      },
      { title: "Lembretes automáticos", description: "Menos sessões perdidas por esquecimento." },
      {
        title: "Sinal por Pix",
        description: "Se quiser, peça sinal para confirmar a sessão. O Pix vai direto pra você.",
      },
      {
        title: "Financeiro simples",
        description: "Receitas das sessões, custos e o resultado do mês.",
      },
      {
        title: "Site próprio",
        description: "Botão de agendar no seu site, abrindo o mesmo agendamento.",
      },
    ],
    howItWorks: [
      {
        title: "Cadastre atendimentos e horários",
        description: "Sessão individual, online, primeira consulta: duração e valores.",
      },
      {
        title: "Compartilhe seu link",
        description: "No Instagram, no Google, no seu site ou direto para o paciente.",
      },
      {
        title: "Receba agendamentos",
        description: "O paciente escolhe um horário livre com privacidade.",
      },
    ],
    faq: [
      {
        question: "Preciso de cartão para testar?",
        answer:
          "Não. São 30 dias grátis com tudo liberado, sem cartão. Depois, R$ 29/mês ou R$ 240/ano (sai R$ 20/mês).",
      },
      {
        question: "Minhas pacientes precisam baixar algum aplicativo?",
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
        question: "Os dados dos pacientes ficam seguros?",
        answer:
          "Sim. Cada consultório só acessa os próprios dados, e as estatísticas nunca identificam quem visitou seu link.",
      },
      {
        question: "Posso colocar no meu site?",
        answer:
          "Pode. Cole o link do chat nos botões do site ou use o botão pronto que abre o chat por cima da página.",
      },
    ],
    testimonials: [
      {
        name: "Mariana",
        role: "Psicóloga",
        quote: "Parei de perder tempo trocando mensagens para marcar sessão.",
        isExample: true,
      },
    ],
  },
  suggestedServices: [
    { name: "Sessão de psicoterapia", durationMinutes: 50 },
    { name: "Sessão online", durationMinutes: 50 },
    { name: "Primeira consulta", durationMinutes: 60 },
    { name: "Terapia de casal", durationMinutes: 80 },
  ],
  terms: {
    customer: { singular: "paciente", plural: "pacientes" },
    service: { singular: "atendimento", plural: "atendimentos" },
    appointment: { singular: "sessão", plural: "sessões" },
  },
  chatMessages: {
    greeting: "Olá! Você está na agenda de {business}. Qual atendimento você gostaria de agendar?",
    askProfessional: "Com qual profissional você prefere?",
    askDate: "Qual dia fica melhor pra você?",
    askTime: "Estes são os horários disponíveis em {date}:",
    noSlots: "Este dia está sem horários. Quer escolher outro dia ou entrar na lista de espera?",
    askName: "Para confirmar, qual é o seu nome?",
    askPhone: "Agora seu WhatsApp:",
    askEmail: "Se quiser receber a confirmação por e-mail, informe seu e-mail (é opcional):",
    optInLabel: "Se eu não terminar o agendamento, podem me chamar no WhatsApp",
    askCoupon: "Tem cupom de desconto?",
    summary: "Confira: {service} com {professional}, {date} às {time}, valor R$ {price}",
    successConfirmed: "Obrigada, {customerName}. Sua sessão está confirmada.",
    emailNote: "A confirmação foi enviada por e-mail.",
    successPending: "Recebemos seu pedido. {business} vai confirmar sua sessão.",
    successDeposit:
      "Para garantir sua sessão, pague o sinal de R$ {depositAmount} pelo Pix abaixo até {deadline}.",
    conflict: "Esse horário acabou de ser ocupado. Veja os horários atualizados:",
    blocked:
      "No momento não conseguimos concluir o agendamento por aqui. Fale direto com {business} pelo WhatsApp.",
    error: "Algo deu errado do nosso lado. Pode tentar de novo em instantes?",
  },
  messageTemplates: {
    reactivation:
      "Olá, {customerName}. Aqui é {business}. Se quiser retomar as sessões, tenho horários disponíveis.",
    return: "Olá, {customerName}. Lembrete gentil: podemos agendar sua próxima sessão?",
    birthday: "Feliz aniversário, {customerName}! Desejamos um dia leve e cheio de cuidado.",
    abandoned:
      "Olá, {customerName}. Vi que você começou a agendar {service}. Posso ajudar com algum horário?",
  },
  emailFrom: { name: "Agendamo", address: "contato@psicologia.example.com" },
  socialLinks: {},
} satisfies BrandConfigInput;
