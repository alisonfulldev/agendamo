import { nicheBrand } from "./niche";

export const occupationalTherapy = nicheBrand({
  kind: "health",
  key: "occupational-therapy",
  segment: "occupational_therapy",
  niche: {
    route: "terapia-ocupacional",
    name: "Terapia ocupacional",
    icon: "puzzle",
    group: "health",
    label: "Terapeutas ocupacionais",
    pitch: "Atendimentos semanais organizados, com confirmação e lembrete automáticos.",
  },
  theme: {
    primary: "#1F6F8B",
    background: "#F3F8FA",
    surface: "#FFFFFF",
    text: "#14262E",
    muted: "#4B5F67",
    button: "#1F6F8B",
    accent: "#D9EDF3",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "inter",
    radius: "0.75rem",
  },
  title: "Seus pacientes agendam os atendimentos sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para terapeutas ocupacionais. Pacientes e famílias escolhem um horário livre e já ficam na agenda, com lembrete antes do atendimento.",
  demo: {
    businessName: "TO Desenvolver",
    bio: "Terapia ocupacional infantil e integração sensorial.",
    prices: [16000, 22000, 16000],
    customerName: "Rafael",
    dayLabel: "Quarta, 11 de março",
    time: "14:00",
  },
  pains: [
    "Combinar horário com cada família por mensagem",
    "Agenda espalhada entre caderno e celular",
    "Atendimentos perdidos por esquecimento",
  ],
  services: [
    { name: "Sessão de terapia ocupacional", durationMinutes: 50 },
    { name: "Avaliação", durationMinutes: 60 },
    { name: "Integração sensorial", durationMinutes: 50 },
  ],
  testimonial: {
    name: "Camila",
    role: "Terapeuta ocupacional",
    quote: "As famílias marcam e remarcam sozinhas, sem eu interromper a sessão.",
  },
});
