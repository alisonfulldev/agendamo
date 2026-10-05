import { nicheBrand } from "./niche";

export const podiatry = nicheBrand({
  kind: "health",
  key: "podiatry",
  segment: "podiatry",
  niche: {
    route: "podologia",
    name: "Podologia",
    icon: "footprints",
    group: "health",
    label: "Podólogas e podólogos",
    pitch: "Atendimentos e retornos marcados sozinhos, com lembrete automático.",
  },
  theme: {
    primary: "#4A6A2F",
    background: "#F7F8F2",
    surface: "#FFFFFF",
    text: "#1E2617",
    muted: "#57604C",
    button: "#4A6A2F",
    accent: "#E6EDD5",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "nunito",
    radius: "0.75rem",
  },
  title: "Seus pacientes agendam a podologia sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para o seu consultório de podologia. O paciente escolhe o atendimento e um horário livre, e já fica na agenda.",
  demo: {
    businessName: "Podologia Passo Leve",
    bio: "Podologia clínica, unha encravada e calos.",
    prices: [12000, 15000, 18000],
    customerName: "Sônia",
    dayLabel: "Quarta, 11 de março",
    time: "13:30",
  },
  pains: [
    "Responder horários por mensagem o dia todo",
    "Retornos que ninguém lembra de marcar",
    "Pacientes que esquecem o horário",
  ],
  services: [
    { name: "Podologia clínica", durationMinutes: 50 },
    { name: "Tratamento de unha encravada", durationMinutes: 40 },
    { name: "Retorno", durationMinutes: 30 },
  ],
  testimonial: {
    name: "Cristina",
    role: "Podóloga",
    quote: "Os retornos ficaram muito mais fáceis de marcar.",
  },
});
