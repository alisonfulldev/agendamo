import { nicheBrand } from "./niche";

export const osteopathy = nicheBrand({
  kind: "health",
  key: "osteopathy",
  segment: "osteopathy",
  niche: {
    route: "osteopatia",
    name: "Osteopatia",
    icon: "hand-heart",
    group: "health",
    label: "Osteopatas",
    pitch: "Sessões e avaliações organizadas, com confirmação e lembrete automáticos.",
  },
  theme: {
    primary: "#31606B",
    background: "#F3F7F7",
    surface: "#FFFFFF",
    text: "#17272B",
    muted: "#4F6166",
    button: "#31606B",
    accent: "#DCEBEC",
    danger: "#B42318",
    headingFont: "lora",
    bodyFont: "inter",
    radius: "0.75rem",
  },
  title: "Seus pacientes agendam a sessão sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para o seu consultório de osteopatia. O paciente escolhe o atendimento e um horário livre, e recebe a confirmação na hora.",
  demo: {
    businessName: "Osteo Equilíbrio",
    bio: "Osteopatia estrutural e visceral.",
    prices: [22000, 25000, 22000],
    customerName: "Helena",
    dayLabel: "Quinta, 12 de março",
    time: "11:00",
  },
  pains: [
    "Agenda controlada por mensagem e caderno",
    "Paciente que desiste porque demorou a resposta",
    "Faltas por esquecimento",
  ],
  services: [
    { name: "Sessão de osteopatia", durationMinutes: 50 },
    { name: "Primeira consulta", durationMinutes: 60 },
    { name: "Osteopatia pediátrica", durationMinutes: 40 },
  ],
  testimonial: {
    name: "Gustavo",
    role: "Osteopata",
    quote: "Ganhei tempo e a agenda ficou cheia com menos mensagens.",
  },
});
