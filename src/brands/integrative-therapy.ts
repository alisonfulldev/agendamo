import { nicheBrand } from "./niche";

export const integrativeTherapy = nicheBrand({
  key: "integrative-therapy",
  segment: "integrative_therapy",
  niche: {
    route: "terapias-integrativas",
    name: "Terapias integrativas",
    icon: "leaf",
    group: "wellness",
    label: "Terapeutas integrativos e holísticos",
    pitch: "Reiki, aromaterapia, constelação e outras terapias marcadas em poucos toques.",
  },
  theme: {
    primary: "#A0446B",
    background: "#FBF5F8",
    surface: "#FFFFFF",
    text: "#2C1A23",
    muted: "#665260",
    button: "#A0446B",
    accent: "#F5DFEA",
    danger: "#B42318",
    headingFont: "lora",
    bodyFont: "nunito",
    radius: "1rem",
  },
  title: "Seus clientes agendam a terapia sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para terapeutas integrativos. A pessoa escolhe a terapia e um horário livre, e já fica na agenda, com confirmação e lembrete.",
  demo: {
    businessName: "Espaço Ser Inteiro",
    bio: "Reiki, aromaterapia e terapia floral.",
    prices: [12000, 15000, 18000],
    customerName: "Aline",
    dayLabel: "Sábado, 14 de março",
    time: "10:00",
  },
  pains: [
    "Combinar horário por mensagem com cada pessoa",
    "Sessões esquecidas que viram horário vago",
    "Agenda espalhada entre caderno e celular",
  ],
  services: [
    { name: "Sessão de reiki", durationMinutes: 50 },
    { name: "Terapia floral", durationMinutes: 50 },
    { name: "Constelação individual", durationMinutes: 90 },
  ],
  customer: { singular: "cliente", plural: "clientes" },
  service: { singular: "terapia", plural: "terapias" },
  testimonial: {
    name: "Vera",
    role: "Terapeuta integrativa",
    quote: "As pessoas agendam sozinhas e chegam no horário com o lembrete.",
  },
});
