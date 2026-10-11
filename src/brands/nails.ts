import { nicheBrand } from "./niche";

export const nails = nicheBrand({
  key: "nails",
  segment: "nails",
  niche: {
    route: "manicure",
    name: "Manicure",
    icon: "brush",
    group: "beauty",
    label: "Manicures e nail designers",
    pitch: "Unhas, alongamento e manutenção marcados sozinhos, sem trocar mensagem.",
  },
  theme: {
    primary: "#B03A5B",
    background: "#FFF7F8",
    surface: "#FFFFFF",
    text: "#2D1A20",
    muted: "#6E5560",
    button: "#B03A5B",
    accent: "#F8DCE4",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "poppins",
    radius: "1rem",
  },
  title: "Suas clientes marcam as unhas sozinhas, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para manicures e nail designers. A cliente escolhe o serviço e um horário livre, e já fica na sua agenda.",
  demo: {
    businessName: "Esmalteria Rosé",
    bio: "Manicure, alongamento em gel e nail art.",
    prices: [4000, 15000, 9000],
    customerName: "Larissa",
    dayLabel: "Sábado, 14 de março",
    time: "11:00",
  },
  pains: [
    "Responder “tem horário amanhã?” com a mão no esmalte",
    "Cliente que some depois de perguntar o preço",
    "Manutenção esquecida que vira horário vago",
  ],
  services: [
    { name: "Manicure", durationMinutes: 45 },
    { name: "Alongamento em gel", durationMinutes: 120 },
    { name: "Manutenção", durationMinutes: 90 },
    { name: "Pé e mão", durationMinutes: 75 },
  ],
  faq: [
    {
      question: "Dá para cobrar sinal no alongamento?",
      answer:
        "Dá: o cliente paga o sinal pelo Pix direto para você e envia o comprovante no chat. Você confere no banco e confirma.",
    },
  ],
  testimonial: {
    name: "Bruna",
    role: "Nail designer",
    quote: "Agora as clientes marcam a manutenção sozinhas.",
  },
});
