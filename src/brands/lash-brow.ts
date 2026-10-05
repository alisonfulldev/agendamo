import { nicheBrand } from "./niche";

export const lashBrow = nicheBrand({
  key: "lash-brow",
  segment: "lash_brow",
  niche: {
    route: "cilios-e-sobrancelhas",
    name: "Cílios e sobrancelhas",
    icon: "eye",
    group: "beauty",
    label: "Lash designers e designers de sobrancelha",
    pitch: "Extensão, manutenção e design marcados sozinhos, com lembrete contra faltas.",
  },
  theme: {
    primary: "#7A3E6E",
    background: "#FCF6FA",
    surface: "#FFFFFF",
    text: "#2A1A26",
    muted: "#675563",
    button: "#7A3E6E",
    accent: "#F1DDEB",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "nunito",
    radius: "1rem",
  },
  title: "Suas clientes agendam cílios e sobrancelhas sozinhas, direto pelo link da bio",
  subtitle:
    "Um chat de agendamento para lash e brow designers. A cliente escolhe o procedimento e um horário livre, e recebe a confirmação na hora.",
  demo: {
    businessName: "Studio Olhar",
    bio: "Extensão de cílios, brow lamination e design.",
    prices: [18000, 9000, 6000],
    customerName: "Gabriela",
    dayLabel: "Sexta, 13 de março",
    time: "15:00",
  },
  pains: [
    "Parar o procedimento para responder mensagem",
    "Manutenção que passa do prazo porque ninguém lembrou",
    "Faltas em horários longos",
  ],
  services: [
    { name: "Extensão de cílios", durationMinutes: 120 },
    { name: "Manutenção de cílios", durationMinutes: 90 },
    { name: "Design de sobrancelha", durationMinutes: 30 },
    { name: "Brow lamination", durationMinutes: 60 },
  ],
  service: { singular: "procedimento", plural: "procedimentos" },
  testimonial: {
    name: "Isabela",
    role: "Lash designer",
    quote: "Os horários longos pararam de ficar vazios.",
  },
});
