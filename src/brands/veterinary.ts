import { nicheBrand } from "./niche";

export const veterinary = nicheBrand({
  key: "veterinary",
  segment: "veterinary",
  niche: {
    route: "veterinaria",
    name: "Veterinária",
    icon: "stethoscope",
    group: "pets",
    label: "Veterinários e clínicas veterinárias",
    pitch: "Consultas, vacinas e retornos marcados pelo tutor, com lembrete.",
  },
  theme: {
    primary: "#2F6F4E",
    background: "#F4F9F6",
    surface: "#FFFFFF",
    text: "#16261D",
    muted: "#4C6155",
    button: "#2F6F4E",
    accent: "#DBEEE3",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "inter",
    radius: "0.75rem",
  },
  title: "Os tutores agendam a consulta sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para clínicas veterinárias. O tutor escolhe a consulta ou a vacina e um horário livre, e recebe a confirmação na hora.",
  demo: {
    businessName: "Clínica Vet Amigo",
    bio: "Clínica geral, vacinas e exames.",
    prices: [18000, 12000, 15000],
    customerName: "Paulo",
    dayLabel: "Terça, 10 de março",
    time: "16:00",
  },
  pains: [
    "Recepção sobrecarregada com ligações",
    "Vacinas e retornos esquecidos",
    "Horários vagos por falta sem aviso",
  ],
  services: [
    { name: "Consulta", durationMinutes: 30 },
    { name: "Vacinação", durationMinutes: 15 },
    { name: "Retorno", durationMinutes: 20 },
    { name: "Consulta domiciliar", durationMinutes: 60 },
  ],
  customer: { singular: "tutor", plural: "tutores" },
  service: { singular: "atendimento", plural: "atendimentos" },
  testimonial: {
    name: "Dra. Lívia",
    role: "Veterinária",
    quote: "As vacinas passaram a ser marcadas sem a recepção ligar.",
  },
});
