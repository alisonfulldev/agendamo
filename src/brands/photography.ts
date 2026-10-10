import { nicheBrand } from "./niche";

export const photography = nicheBrand({
  key: "photography",
  segment: "photography",
  niche: {
    route: "fotografia",
    name: "Fotografia",
    icon: "camera",
    group: "services",
    label: "Fotógrafos e estúdios de fotografia",
    pitch: "Ensaios e sessões de estúdio marcados pelo cliente, com lembrete automático.",
  },
  theme: {
    primary: "#374151",
    background: "#F7F7F8",
    surface: "#FFFFFF",
    text: "#1A1D23",
    muted: "#575C66",
    button: "#374151",
    accent: "#E3E5E9",
    danger: "#B42318",
    headingFont: "oswald",
    bodyFont: "inter",
    radius: "0.5rem",
  },
  title: "Seus clientes agendam o ensaio sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para fotógrafos. O cliente escolhe o ensaio e um horário livre, e recebe a confirmação na hora.",
  demo: {
    businessName: "Luz Estúdio",
    bio: "Ensaios, retratos corporativos e newborn.",
    prices: [35000, 25000, 50000],
    customerName: "Mariana",
    dayLabel: "Sábado, 14 de março",
    time: "16:00",
  },
  pains: [
    "Responder disponibilidade de data o dia inteiro",
    "Cliente que reserva e não aparece",
    "Agenda de ensaios em vários lugares",
  ],
  services: [
    { name: "Ensaio externo", durationMinutes: 90 },
    { name: "Retrato corporativo", durationMinutes: 60 },
    { name: "Ensaio newborn", durationMinutes: 180 },
  ],
  service: { singular: "ensaio", plural: "ensaios" },
  testimonial: {
    name: "Thiago",
    role: "Fotógrafo",
    quote: "Os lembretes automáticos acabaram com as reservas que não apareciam.",
  },
});
