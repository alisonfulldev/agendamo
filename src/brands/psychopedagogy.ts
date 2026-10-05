import { nicheBrand } from "./niche";

export const psychopedagogy = nicheBrand({
  kind: "health",
  key: "psychopedagogy",
  segment: "psychopedagogy",
  niche: {
    route: "psicopedagogia",
    name: "Psicopedagogia",
    icon: "book",
    group: "health",
    label: "Psicopedagogas e psicopedagogos",
    pitch: "Avaliações e atendimentos marcados pelos pais, sem troca de mensagens.",
  },
  theme: {
    primary: "#5B3FA0",
    background: "#F7F5FC",
    surface: "#FFFFFF",
    text: "#221C33",
    muted: "#5C5670",
    button: "#5B3FA0",
    accent: "#E7E0F8",
    danger: "#B42318",
    headingFont: "nunito",
    bodyFont: "nunito",
    radius: "1rem",
  },
  title: "Os pais agendam os atendimentos sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para o seu espaço de psicopedagogia. Os responsáveis escolhem o atendimento e um horário livre, e recebem a confirmação na hora.",
  demo: {
    businessName: "Espaço Aprender",
    bio: "Psicopedagogia clínica e neuropsicopedagogia.",
    prices: [15000, 30000, 15000],
    customerName: "Sofia",
    dayLabel: "Segunda, 9 de março",
    time: "16:00",
  },
  pains: [
    "Responder os pais entre um atendimento e outro",
    "Avaliações com várias sessões controladas no papel",
    "Horários esquecidos que ficam vagos",
  ],
  services: [
    { name: "Atendimento psicopedagógico", durationMinutes: 50 },
    { name: "Avaliação psicopedagógica", durationMinutes: 60 },
    { name: "Devolutiva aos pais", durationMinutes: 60 },
  ],
  testimonial: {
    name: "Renata",
    role: "Psicopedagoga",
    quote: "Os pais adoraram poder marcar à noite, sem precisar me chamar.",
  },
});
