import { nicheBrand } from "./niche";

export const acupuncture = nicheBrand({
  kind: "health",
  key: "acupuncture",
  segment: "acupuncture",
  niche: {
    route: "acupuntura",
    name: "Acupuntura",
    icon: "target",
    group: "wellness",
    label: "Acupunturistas",
    pitch: "Sessões e pacotes marcados sozinhos, com lembrete antes do horário.",
  },
  theme: {
    primary: "#9B2C2C",
    background: "#FBF5F4",
    surface: "#FFFFFF",
    text: "#2C1A1A",
    muted: "#665151",
    button: "#9B2C2C",
    accent: "#F5DEDB",
    danger: "#B42318",
    headingFont: "lora",
    bodyFont: "nunito",
    radius: "1rem",
  },
  title: "Seus pacientes agendam a acupuntura sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para o seu espaço de acupuntura. O paciente escolhe a sessão e um horário livre, e já fica na agenda, com lembrete automático.",
  demo: {
    businessName: "Acupuntura Qi",
    bio: "Acupuntura tradicional chinesa e auriculoterapia.",
    prices: [15000, 8000, 18000],
    customerName: "Tatiana",
    dayLabel: "Sábado, 14 de março",
    time: "09:00",
  },
  pains: [
    "Responder horários disponíveis por mensagem",
    "Pacotes de sessões controlados no papel",
    "Sessões esquecidas que viram horário vago",
  ],
  services: [
    { name: "Sessão de acupuntura", durationMinutes: 50 },
    { name: "Auriculoterapia", durationMinutes: 20 },
    { name: "Primeira consulta", durationMinutes: 60 },
  ],
  testimonial: {
    name: "Lúcia",
    role: "Acupunturista",
    quote: "Os pacotes ficaram organizados e as faltas caíram.",
  },
});
