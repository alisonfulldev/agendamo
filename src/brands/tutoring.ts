import { nicheBrand } from "./niche";

export const tutoring = nicheBrand({
  key: "tutoring",
  segment: "tutoring",
  niche: {
    route: "aulas",
    name: "Aulas particulares",
    icon: "cap",
    group: "services",
    label: "Professores particulares, idiomas e música",
    pitch: "Aulas avulsas e experimentais marcadas pelo aluno ou pelos pais.",
  },
  theme: {
    primary: "#3B4CB8",
    background: "#F5F6FD",
    surface: "#FFFFFF",
    text: "#1A1F3A",
    muted: "#555B78",
    button: "#3B4CB8",
    accent: "#E0E4F8",
    danger: "#B42318",
    headingFont: "nunito",
    bodyFont: "nunito",
    radius: "1rem",
  },
  title: "Seus alunos agendam as aulas sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para professores particulares. O aluno (ou os pais) escolhe a aula e um horário livre, e já fica na agenda.",
  demo: {
    businessName: "Prof. Ana Inglês",
    bio: "Aulas de inglês para todas as idades.",
    prices: [8000, 0, 10000],
    customerName: "Pedro",
    dayLabel: "Quarta, 11 de março",
    time: "19:00",
  },
  pains: [
    "Combinar horário de aula com cada aluno por mensagem",
    "Aulas canceladas em cima da hora",
    "Agenda espalhada entre caderno e celular",
  ],
  services: [
    { name: "Aula individual", durationMinutes: 60 },
    { name: "Aula experimental", durationMinutes: 30 },
    { name: "Aula online", durationMinutes: 60 },
  ],
  customer: { singular: "aluno", plural: "alunos" },
  service: { singular: "aula", plural: "aulas" },
  appointment: { singular: "aula", plural: "aulas" },
  testimonial: {
    name: "Ana",
    role: "Professora de inglês",
    quote: "Os alunos remarcam sozinhos e eu não perco mais tempo com isso.",
  },
});
