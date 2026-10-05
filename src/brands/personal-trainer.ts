import { nicheBrand } from "./niche";

export const personalTrainer = nicheBrand({
  key: "personal-trainer",
  segment: "personal_trainer",
  niche: {
    route: "personal",
    name: "Personal trainer",
    icon: "dumbbell",
    group: "wellness",
    label: "Personal trainers",
    pitch: "Treinos e avaliações marcados pelo aluno, com lembrete contra faltas.",
  },
  theme: {
    primary: "#C2410C",
    background: "#FBF7F4",
    surface: "#FFFFFF",
    text: "#2A1D15",
    muted: "#665448",
    button: "#C2410C",
    accent: "#FBE3D6",
    danger: "#B42318",
    headingFont: "oswald",
    bodyFont: "inter",
    radius: "0.5rem",
  },
  title: "Seus alunos agendam o treino sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para personal trainers. O aluno escolhe o treino e um horário livre, e já fica na agenda. Sem ficar remarcando por mensagem.",
  demo: {
    businessName: "Personal Thiago",
    bio: "Treino funcional, hipertrofia e emagrecimento.",
    prices: [10000, 15000, 0],
    customerName: "Bruno",
    dayLabel: "Segunda, 9 de março",
    time: "06:00",
  },
  pains: [
    "Remarcar treino por mensagem toda semana",
    "Horários vagos quando o aluno esquece",
    "Avaliação física marcada no improviso",
  ],
  services: [
    { name: "Treino personalizado", durationMinutes: 60 },
    { name: "Avaliação física", durationMinutes: 60 },
    { name: "Aula experimental", durationMinutes: 60 },
  ],
  customer: { singular: "aluno", plural: "alunos" },
  service: { singular: "treino", plural: "treinos" },
  appointment: { singular: "treino", plural: "treinos" },
  testimonial: {
    name: "Thiago",
    role: "Personal trainer",
    quote: "Meus alunos marcam o treino sozinhos e eu só confiro a agenda.",
  },
});
