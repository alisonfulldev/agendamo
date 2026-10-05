import { nicheBrand } from "./niche";

export const dentistry = nicheBrand({
  key: "dentistry",
  segment: "dentistry",
  kind: "health",
  niche: {
    route: "odontologia",
    name: "Odontologia",
    icon: "smile",
    group: "health",
    label: "Dentistas e clínicas odontológicas",
    pitch: "Consultas, limpezas e retornos marcados sozinhos, com lembrete automático.",
  },
  theme: {
    primary: "#1D5F99",
    background: "#F3F7FB",
    surface: "#FFFFFF",
    text: "#142233",
    muted: "#4E5E70",
    button: "#1D5F99",
    accent: "#DCE9F6",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "inter",
    radius: "0.75rem",
  },
  title: "Seus pacientes agendam a consulta sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para o seu consultório odontológico. O paciente escolhe o atendimento e um horário livre, e já fica na agenda do dentista.",
  demo: {
    businessName: "Sorriso Odontologia",
    bio: "Clínica geral, ortodontia e clareamento.",
    prices: [15000, 20000, 25000],
    customerName: "Débora",
    dayLabel: "Terça, 10 de março",
    time: "09:00",
  },
  pains: [
    "Recepção presa no telefone para marcar e remarcar",
    "Retornos de manutenção que ninguém lembra",
    "Cadeira vazia por falta sem aviso",
  ],
  services: [
    { name: "Consulta de avaliação", durationMinutes: 30 },
    { name: "Limpeza", durationMinutes: 45 },
    { name: "Manutenção de aparelho", durationMinutes: 30 },
    { name: "Clareamento", durationMinutes: 60 },
  ],
  testimonial: {
    name: "Dr. Paulo",
    role: "Dentista",
    quote: "As manutenções de aparelho passaram a ser marcadas sozinhas.",
  },
});
