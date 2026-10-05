import { nicheBrand } from "./niche";

export const tattoo = nicheBrand({
  key: "tattoo",
  segment: "tattoo",
  niche: {
    route: "tatuagem",
    name: "Tatuagem",
    icon: "pen",
    group: "beauty",
    label: "Estúdios de tatuagem e piercing",
    pitch: "Sessões, orçamentos e piercings marcados pelo link, com sinal por Pix.",
  },
  theme: {
    primary: "#B91C1C",
    background: "#151313",
    surface: "#1F1B1A",
    text: "#F3ECEA",
    muted: "#A89D9A",
    button: "#B91C1C",
    accent: "#2A2423",
    danger: "#F04438",
    headingFont: "oswald",
    bodyFont: "inter",
    radius: "0.25rem",
  },
  title: "Seus clientes marcam a sessão sozinhos, direto pelo link da bio",
  subtitle:
    "Um chat de agendamento para estúdios de tatuagem e piercing. O cliente escolhe o tatuador e um horário livre, e garante a sessão com sinal pelo Pix.",
  demo: {
    businessName: "Black Ink Studio",
    bio: "Tatuagem fineline, blackwork e piercing.",
    prices: [0, 50000, 12000],
    customerName: "Lucas",
    dayLabel: "Quinta, 12 de março",
    time: "14:00",
  },
  pains: [
    "Perder tempo respondendo “quanto custa?” no direct",
    "Sessão longa perdida por falta sem aviso",
    "Agenda de cada tatuador espalhada em vários lugares",
  ],
  services: [
    { name: "Orçamento", durationMinutes: 30 },
    { name: "Sessão de tatuagem", durationMinutes: 180 },
    { name: "Piercing", durationMinutes: 30 },
    { name: "Retoque", durationMinutes: 60 },
  ],
  service: { singular: "serviço", plural: "serviços" },
  faq: [
    {
      question: "Consigo cobrar sinal para segurar a sessão?",
      answer:
        "Consegue. O cliente paga o sinal pelo Pix direto para você, e a sessão só fica garantida depois do pagamento.",
    },
  ],
  chat: { askProfessional: "Com qual tatuador você prefere?" },
  testimonial: {
    name: "Rafa",
    role: "Tatuador",
    quote: "O sinal pelo Pix acabou com as faltas nas sessões longas.",
  },
});
