import { nicheBrand } from "./niche";

export const physio = nicheBrand({
  kind: "health",
  key: "physio",
  segment: "physio",
  niche: {
    route: "fisioterapia",
    name: "Fisioterapia",
    icon: "activity",
    group: "health",
    label: "Fisioterapeutas e clínicas de fisioterapia",
    pitch: "Sessões e pacotes organizados, com lembretes contra faltas.",
  },
  theme: {
    primary: "#1F6F78",
    background: "#F3F8F9",
    surface: "#FFFFFF",
    text: "#13282C",
    muted: "#4A6064",
    button: "#1F6F78",
    accent: "#D6ECEF",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "inter",
    radius: "0.5rem",
  },
  title: "Seus pacientes agendam as sessões sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento com a cara da sua clínica. O paciente escolhe o atendimento e o horário livre, e já está na agenda. Pacotes de sessões e lembretes inclusos.",
  demo: {
    businessName: "Fisio Movimento",
    bio: "Fisioterapia ortopédica e esportiva.",
    prices: [12000, 15000, 10000],
    customerName: "Pedro",
    dayLabel: "Segunda, 9 de março",
    time: "07:30",
  },
  pains: [
    "Ligações e mensagens o dia todo para remarcar",
    "Pacote de sessões controlado no papel",
    "Horário marcado que fica vazio porque esqueceram",
  ],
  services: [
    { name: "Sessão de fisioterapia", durationMinutes: 50 },
    { name: "Avaliação", durationMinutes: 60 },
    { name: "Fisioterapia domiciliar", durationMinutes: 60 },
    { name: "RPG", durationMinutes: 50 },
  ],
  faq: [
    {
      question: "Dá para vender pacote de sessões?",
      answer:
        "Dá. Você cria pacotes (por exemplo, 10 sessões) e acompanha quanto falta para cada paciente.",
    },
  ],
  testimonial: {
    name: "Juliana",
    role: "Fisioterapeuta",
    quote: "As faltas diminuíram muito depois dos lembretes automáticos.",
  },
});
