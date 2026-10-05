import { nicheBrand } from "./niche";

export const psychoanalysis = nicheBrand({
  kind: "health",
  key: "psychoanalysis",
  segment: "psychoanalysis",
  niche: {
    route: "psicanalise",
    name: "Psicanálise",
    icon: "sofa",
    group: "health",
    label: "Psicanalistas",
    pitch: "Agenda das sessões organizada, com o analisando marcando em poucos toques.",
  },
  theme: {
    primary: "#6B3F5E",
    background: "#F9F5F7",
    surface: "#FFFFFF",
    text: "#2A1F27",
    muted: "#62535D",
    button: "#6B3F5E",
    accent: "#F1E3EC",
    danger: "#B42318",
    headingFont: "lora",
    bodyFont: "inter",
    radius: "0.75rem",
  },
  title: "Seus analisandos agendam sozinhos, direto pelo seu link",
  subtitle:
    "Um agendamento sóbrio para o seu consultório. A pessoa escolhe um horário livre e já fica na agenda, com confirmação e lembrete automáticos.",
  demo: {
    businessName: "Consultório Lacan",
    bio: "Psicanálise para adultos, presencial e online.",
    prices: [20000, 20000, 25000],
    customerName: "Luísa",
    dayLabel: "Quarta, 11 de março",
    time: "18:00",
  },
  pains: [
    "Combinar horário por mensagem entre uma sessão e outra",
    "Remarcações perdidas no meio das conversas",
    "Horários vagos que ninguém soube que existiam",
  ],
  services: [
    { name: "Sessão de análise", durationMinutes: 50 },
    { name: "Sessão online", durationMinutes: 50 },
    { name: "Entrevista inicial", durationMinutes: 60 },
  ],
  customer: { singular: "analisando", plural: "analisandos" },
  testimonial: {
    name: "Ricardo",
    role: "Psicanalista",
    quote: "Minha agenda ficou organizada sem eu precisar de secretária.",
  },
});
