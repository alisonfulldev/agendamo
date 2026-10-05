import { nicheBrand } from "./niche";

export const chiropractic = nicheBrand({
  kind: "health",
  key: "chiropractic",
  segment: "chiropractic",
  niche: {
    route: "quiropraxia",
    name: "Quiropraxia",
    icon: "bone",
    group: "health",
    label: "Quiropraxistas",
    pitch: "Ajustes e avaliações marcados sozinhos, com retorno fácil de agendar.",
  },
  theme: {
    primary: "#2D4A8A",
    background: "#F4F6FB",
    surface: "#FFFFFF",
    text: "#18213A",
    muted: "#535D75",
    button: "#2D4A8A",
    accent: "#DEE5F5",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "inter",
    radius: "0.5rem",
  },
  title: "Seus pacientes agendam o ajuste sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para o seu consultório de quiropraxia. O paciente escolhe avaliação ou sessão e um horário livre, e já fica na agenda.",
  demo: {
    businessName: "Quiro Coluna",
    bio: "Quiropraxia para dores na coluna e postura.",
    prices: [20000, 15000, 25000],
    customerName: "Marcos",
    dayLabel: "Sexta, 13 de março",
    time: "08:00",
  },
  pains: [
    "Perder paciente que chamou fora do horário",
    "Retornos que ninguém lembra de marcar",
    "Horários vagos por esquecimento",
  ],
  services: [
    { name: "Avaliação quiroprática", durationMinutes: 60 },
    { name: "Sessão de ajuste", durationMinutes: 30 },
    { name: "Sessão com liberação miofascial", durationMinutes: 50 },
  ],
  testimonial: {
    name: "André",
    role: "Quiropraxista",
    quote: "Os pacientes marcam o retorno na hora, direto pelo link.",
  },
});
