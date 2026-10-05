import { nicheBrand } from "./niche";

export const nutrition = nicheBrand({
  kind: "health",
  key: "nutrition",
  segment: "nutrition",
  niche: {
    route: "nutricao",
    name: "Nutrição",
    icon: "apple",
    group: "health",
    label: "Nutricionistas",
    pitch: "Consultas e retornos marcados sozinhos, presenciais ou online.",
  },
  theme: {
    primary: "#2F6B3A",
    background: "#F5F9F4",
    surface: "#FFFFFF",
    text: "#1B2A1E",
    muted: "#526155",
    button: "#2F6B3A",
    accent: "#DFF0DC",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "nunito",
    radius: "1rem",
  },
  title: "Seus pacientes agendam consulta e retorno sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para o seu consultório de nutrição. O paciente escolhe primeira consulta ou retorno e um horário livre, e já fica na agenda.",
  demo: {
    businessName: "Nutri Equilíbrio",
    bio: "Nutrição clínica e esportiva, presencial e online.",
    prices: [25000, 15000, 22000],
    customerName: "Fernanda",
    dayLabel: "Quinta, 12 de março",
    time: "10:00",
  },
  pains: [
    "Responder “quanto custa a consulta?” o dia inteiro",
    "Paciente que some e não marca o retorno",
    "Consultas esquecidas que deixam buraco na agenda",
  ],
  services: [
    { name: "Primeira consulta", durationMinutes: 60 },
    { name: "Retorno", durationMinutes: 40 },
    { name: "Consulta online", durationMinutes: 50 },
    { name: "Bioimpedância", durationMinutes: 20 },
  ],
  faq: [
    {
      question: "Funciona para consultas online?",
      answer:
        "Sim. Você cadastra a consulta online com a duração e o valor dela, e o paciente escolhe entre online e presencial.",
    },
  ],
  testimonial: {
    name: "Beatriz",
    role: "Nutricionista",
    quote: "Os retornos passaram a ser marcados sem eu precisar correr atrás.",
  },
});
