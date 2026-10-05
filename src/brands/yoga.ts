import { nicheBrand } from "./niche";

export const yoga = nicheBrand({
  key: "yoga",
  segment: "yoga",
  niche: {
    route: "yoga",
    name: "Yoga",
    icon: "sun",
    group: "wellness",
    label: "Professores e estúdios de yoga e meditação",
    pitch: "Aulas individuais e experimentais marcadas pelo próprio aluno.",
  },
  theme: {
    primary: "#8A5A12",
    background: "#FBF7EF",
    surface: "#FFFFFF",
    text: "#2B2213",
    muted: "#665A45",
    button: "#8A5A12",
    accent: "#F2E6CC",
    danger: "#B42318",
    headingFont: "lora",
    bodyFont: "nunito",
    radius: "1rem",
  },
  title: "Seus alunos agendam as aulas sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para professores de yoga e meditação. O aluno escolhe a aula e um horário livre, e já fica na agenda, com lembrete antes da aula.",
  demo: {
    businessName: "Espaço Prana",
    bio: "Hatha, vinyasa e meditação.",
    prices: [9000, 0, 12000],
    customerName: "Marta",
    dayLabel: "Segunda, 9 de março",
    time: "07:00",
  },
  pains: [
    "Combinar horário de aula por mensagem",
    "Aula experimental que nunca é marcada",
    "Alunos que esquecem a aula",
  ],
  services: [
    { name: "Aula individual", durationMinutes: 60 },
    { name: "Aula experimental", durationMinutes: 60 },
    { name: "Meditação guiada", durationMinutes: 30 },
  ],
  customer: { singular: "aluno", plural: "alunos" },
  service: { singular: "aula", plural: "aulas" },
  appointment: { singular: "aula", plural: "aulas" },
  testimonial: {
    name: "Sílvia",
    role: "Professora de yoga",
    quote: "Os alunos marcam as aulas sozinhos e chegam no horário.",
  },
});
