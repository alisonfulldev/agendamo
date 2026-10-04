import type { BrandConfigInput } from "./schema";

// Example brand (Prompt 39): configuration only. Provisional name, domain and copy.
export const physio = {
  key: "physio",
  name: "Agendamo",
  domains: ["fisio.example.com"],
  logo: "/brands/physio/logo.svg",
  favicon: "/brands/physio/favicon.svg",
  defaultSegment: "physio",
  niche: {
    route: "fisioterapia",
    name: "Fisioterapia",
    label: "Fisioterapeutas e pilates",
    pitch: "Sessões e pacotes organizados, com lembretes contra faltas.",
  },
  theme: {
    primary: "#1F6F78",
    background: "#F3F8F9",
    surface: "#FFFFFF",
    text: "#13282C",
    muted: "#4A6064",
    button: "#1F6F78",
    accent: "#D6ECEF",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "inter",
    radius: "0.5rem",
  },
  sales: {
    title: "Seus pacientes agendam as sessões sozinhos, direto pelo seu link",
    subtitle:
      "Um chat de agendamento com a cara da sua clínica. O paciente escolhe o atendimento e o horário livre, e já está na agenda. Pacotes de sessões e lembretes inclusos.",
    demo: {
      businessName: "Fisio Movimento",
      bio: "Fisioterapia ortopédica, esportiva e pilates.",
      prices: [12000, 10000, 15000, 9000],
      customerName: "Pedro",
      dayLabel: "Segunda, 9 de março",
      time: "07:30",
    },
    pains: [
      "Ligações e mensagens o dia todo para remarcar",
      "Pacote de sessões controlado no papel",
      "Faltas que quebram o tratamento",
    ],
    benefits: [
      {
        title: "Chat de agendamento 24 horas",
        description: "O paciente escolhe atendimento, dia e horário livre e já fica agendado.",
      },
      {
        title: "Pacotes de sessões",
        description: "Venda pacotes e acompanhe quantas sessões faltam.",
      },
      { title: "Lembretes automáticos", description: "Menos faltas e tratamento em dia." },
      {
        title: "Sinal por Pix",
        description: "Peça sinal quando fizer sentido. O Pix vai direto pra você.",
      },
      {
        title: "Financeiro simples",
        description: "Receitas das sessões, custos e o lucro do mês.",
      },
      {
        title: "Equipe e site próprio",
        description: "Agenda por fisioterapeuta e botão de agendar no seu site.",
      },
    ],
    howItWorks: [
      {
        title: "Cadastre atendimentos e horários",
        description: "Sessão, avaliação, pilates: duração, valor e seus horários.",
      },
      {
        title: "Compartilhe seu link",
        description: "No Instagram, no Google, no seu site ou direto para o paciente.",
      },
      {
        title: "Receba agendamentos",
        description: "O paciente escolhe o horário livre sozinho, a qualquer hora.",
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
        question: "Consigo controlar pacotes de sessões?",
        answer: "Sim. Você vende o pacote e cada sessão concluída desconta automaticamente.",
      },
      {
        question: "Posso colocar no meu site?",
        answer:
          "Pode. Cole o link do chat nos botões do site ou use o botão pronto que abre o chat por cima da página.",
      },
    ],
    testimonials: [
      {
        name: "Rafael",
        role: "Fisioterapeuta",
        quote: "Os pacotes ficaram organizados e as faltas caíram.",
        isExample: true,
      },
    ],
  },
  suggestedServices: [
    { name: "Avaliação fisioterapêutica", durationMinutes: 60 },
    { name: "Sessão de fisioterapia", durationMinutes: 50 },
    { name: "Pilates", durationMinutes: 50 },
    { name: "RPG", durationMinutes: 60 },
    { name: "Liberação miofascial", durationMinutes: 40 },
  ],
  terms: {
    customer: { singular: "paciente", plural: "pacientes" },
    service: { singular: "atendimento", plural: "atendimentos" },
    appointment: { singular: "sessão", plural: "sessões" },
  },
  chatMessages: {
    greeting: "Olá! Você está na agenda de {business}. Qual atendimento você quer agendar?",
    askProfessional: "Com qual fisioterapeuta você prefere?",
    askDate: "Ótimo! Qual dia fica melhor pra você?",
    askTime: "Esses são os horários livres em {date}:",
    noSlots: "Esse dia está cheio. Quer escolher outro dia ou entrar na lista de espera?",
    askName: "Para confirmar, qual é o seu nome?",
    askPhone: "Agora seu WhatsApp:",
    askEmail: "Quer receber a confirmação por e-mail? Se quiser, informe seu e-mail (é opcional):",
    optInLabel: "Se eu não terminar o agendamento, podem me chamar no WhatsApp",
    askCoupon: "Tem cupom de desconto?",
    summary: "Confira: {service} com {professional}, {date} às {time}, valor R$ {price}",
    successConfirmed: "Pronto, {customerName}! Sua sessão está confirmada. 💪",
    emailNote: "Enviamos a confirmação por e-mail.",
    successPending: "Recebemos seu pedido! {business} vai confirmar sua sessão.",
    successDeposit:
      "Para garantir sua sessão, pague o sinal de R$ {depositAmount} pelo Pix abaixo até {deadline}.",
    conflict: "Ops, esse horário acabou de ser ocupado. Veja os horários atualizados:",
    blocked:
      "No momento não conseguimos concluir seu agendamento por aqui. Fale direto com {business} pelo WhatsApp.",
    error: "Algo deu errado do nosso lado. Pode tentar de novo em instantes?",
  },
  messageTemplates: {
    reactivation:
      "Olá, {customerName}! Aqui é {business}. Como você está? Que tal retomar as sessões essa semana?",
    return:
      "Olá, {customerName}! Está na hora do seu retorno de {service}. Posso reservar um horário?",
    birthday: "Feliz aniversário, {customerName}! 🎉 A {business} deseja muita saúde e movimento.",
    abandoned:
      "Olá, {customerName}! Vi que você quase agendou {service}. Posso ajudar a escolher um horário?",
  },
  emailFrom: { name: "Agendamo", address: "contato@fisio.example.com" },
  socialLinks: {},
} satisfies BrandConfigInput;
