import { nicheBrand } from "./niche";

export const pilates = nicheBrand({
  key: "pilates",
  segment: "pilates",
  niche: {
    route: "pilates",
    name: "Pilates",
    icon: "person",
    group: "wellness",
    label: "Estúdios e instrutores de pilates",
    pitch: "Aulas individuais e aulas experimentais marcadas pelo próprio aluno.",
  },
  theme: {
    primary: "#2C7A7B",
    background: "#F2F8F8",
    surface: "#FFFFFF",
    text: "#152829",
    muted: "#4A6061",
    button: "#2C7A7B",
    accent: "#D5ECEC",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "inter",
    radius: "1rem",
  },
  title: "Seus alunos agendam as aulas sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para o seu estúdio. O aluno escolhe a aula e um horário livre, e já fica na agenda, com lembrete antes da aula.",
  demo: {
    businessName: "Studio Core Pilates",
    bio: "Pilates em aparelhos, solo e reabilitação.",
    prices: [9000, 0, 10000],
    customerName: "Clara",
    dayLabel: "Terça, 10 de março",
    time: "07:00",
  },
  pains: [
    "Remarcar aula por mensagem o dia inteiro",
    "Aula experimental que nunca vira matrícula",
    "Alunos que esquecem e deixam o aparelho vazio",
  ],
  services: [
    { name: "Aula individual", durationMinutes: 50 },
    { name: "Aula experimental", durationMinutes: 50 },
    { name: "Pilates para reabilitação", durationMinutes: 50 },
  ],
  customer: { singular: "aluno", plural: "alunos" },
  service: { singular: "aula", plural: "aulas" },
  appointment: { singular: "aula", plural: "aulas" },
  testimonial: {
    name: "Natália",
    role: "Instrutora de pilates",
    quote: "As aulas experimentais passaram a ser marcadas sozinhas pelo link.",
  },
});
