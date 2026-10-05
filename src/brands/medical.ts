import { nicheBrand } from "./niche";

export const medical = nicheBrand({
  key: "medical",
  segment: "medical",
  kind: "health",
  niche: {
    route: "consultorios",
    name: "Consultórios médicos",
    icon: "stethoscope",
    group: "health",
    label: "Médicos e consultórios",
    pitch: "Consultas particulares marcadas pelo paciente, com confirmação na hora.",
  },
  theme: {
    primary: "#0F6E6E",
    background: "#F2F8F8",
    surface: "#FFFFFF",
    text: "#132626",
    muted: "#4A5F5F",
    button: "#0F6E6E",
    accent: "#D5ECEC",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "inter",
    radius: "0.75rem",
  },
  title: "Seus pacientes agendam a consulta sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para consultórios particulares. O paciente escolhe a consulta e um horário livre, e recebe a confirmação e o lembrete automaticamente.",
  demo: {
    businessName: "Consultório Dra. Helena",
    bio: "Clínica médica e medicina preventiva.",
    prices: [35000, 25000, 30000],
    customerName: "Roberto",
    dayLabel: "Quarta, 11 de março",
    time: "08:30",
  },
  pains: [
    "Secretária presa no WhatsApp marcando consulta",
    "Pacientes que esquecem e não avisam",
    "Horários vagos que ninguém soube que existiam",
  ],
  services: [
    { name: "Consulta", durationMinutes: 30 },
    { name: "Retorno", durationMinutes: 20 },
    { name: "Teleconsulta", durationMinutes: 30 },
  ],
  testimonial: {
    name: "Dra. Helena",
    role: "Médica",
    quote: "A agenda enche sem a secretária passar o dia no WhatsApp.",
  },
});
