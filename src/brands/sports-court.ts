import { nicheBrand } from "./niche";

export const sportsCourt = nicheBrand({
  key: "sports-court",
  segment: "sports_court",
  niche: {
    route: "quadras",
    name: "Quadras esportivas",
    icon: "trophy",
    group: "services",
    label: "Quadras de beach tennis, futebol e padel",
    pitch: "Horários de quadra reservados pelo cliente, sem conflito de reserva.",
  },
  theme: {
    primary: "#15803D",
    background: "#F3FAF5",
    surface: "#FFFFFF",
    text: "#13261A",
    muted: "#4B6152",
    button: "#15803D",
    accent: "#D6F0DE",
    danger: "#B42318",
    headingFont: "oswald",
    bodyFont: "inter",
    radius: "0.5rem",
  },
  title: "Seus clientes reservam a quadra sozinhos, direto pelo link da bio",
  subtitle:
    "Um chat de reservas para quadras esportivas. O cliente escolhe a quadra e um horário livre, e a reserva já entra na agenda, sem conflito.",
  demo: {
    businessName: "Arena Beach",
    bio: "Beach tennis, futevôlei e vôlei de praia.",
    prices: [12000, 15000, 0],
    customerName: "Felipe",
    dayLabel: "Sábado, 14 de março",
    time: "08:00",
  },
  pains: [
    "Reserva de quadra anotada no caderno",
    "Duas turmas marcadas no mesmo horário",
    "Horário reservado que ninguém usa",
  ],
  services: [
    { name: "Quadra 1 hora", durationMinutes: 60 },
    { name: "Quadra 2 horas", durationMinutes: 120 },
    { name: "Aula experimental", durationMinutes: 60 },
  ],
  service: { singular: "reserva", plural: "reservas" },
  faq: [
    {
      question: "Como cadastro várias quadras?",
      answer:
        "Cada quadra pode ser cadastrada como um profissional ou como um recurso, com a própria agenda. Assim, uma reserva nunca bate com outra.",
    },
  ],
  chat: { askProfessional: "Qual quadra você prefere?" },
  testimonial: {
    name: "Gustavo",
    role: "Dono de arena",
    quote: "As reservas entram sozinhas e nunca mais teve quadra duplicada.",
  },
});
