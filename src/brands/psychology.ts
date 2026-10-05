import { nicheBrand } from "./niche";

export const psychology = nicheBrand({
  kind: "health",
  key: "psychology",
  segment: "psychology",
  niche: {
    route: "psicologia",
    name: "Psicologia",
    icon: "brain",
    group: "health",
    label: "Psicólogas e psicólogos",
    pitch: "Sessões presenciais e online marcadas com discrição, sem troca de mensagens.",
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
  title: "Seus pacientes agendam a sessão com tranquilidade, direto pelo seu link",
  subtitle:
    "Um agendamento discreto e acolhedor para o seu consultório. O paciente escolhe o atendimento e um horário livre, e recebe a confirmação na hora. Sem trocar mensagens para marcar.",
  demo: {
    businessName: "Consultório Acolher",
    bio: "Psicoterapia para adultos, presencial e online.",
    prices: [18000, 18000, 22000],
    customerName: "Carla",
    dayLabel: "Terça, 10 de março",
    time: "19:00",
  },
  pains: [
    "Interromper o dia para combinar horário por mensagem",
    "Pacientes com vergonha de perguntar se há vaga",
    "Sessões perdidas por esquecimento",
  ],
  services: [
    { name: "Sessão de psicoterapia", durationMinutes: 50 },
    { name: "Sessão online", durationMinutes: 50 },
    { name: "Primeira consulta", durationMinutes: 60 },
    { name: "Terapia de casal", durationMinutes: 80 },
  ],
  faq: [
    {
      question: "O agendamento é discreto?",
      answer:
        "Sim. O paciente marca sozinho, sem precisar explicar nada por mensagem, e os lembretes não mencionam o motivo do atendimento.",
    },
  ],
  testimonial: {
    name: "Mariana",
    role: "Psicóloga",
    quote: "Parei de interromper o atendimento para responder mensagem de agendamento.",
  },
});
