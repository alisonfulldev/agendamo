import { nicheBrand } from "./niche";

export const speechTherapy = nicheBrand({
  kind: "health",
  key: "speech-therapy",
  segment: "speech_therapy",
  niche: {
    route: "fonoaudiologia",
    name: "Fonoaudiologia",
    icon: "audio",
    group: "health",
    label: "Fonoaudiólogas e fonoaudiólogos",
    pitch: "Terapias semanais e avaliações organizadas, com lembrete para os pais.",
  },
  theme: {
    primary: "#A3431C",
    background: "#FBF6F2",
    surface: "#FFFFFF",
    text: "#2B1D16",
    muted: "#665248",
    button: "#A3431C",
    accent: "#F7E2D6",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "nunito",
    radius: "1rem",
  },
  title: "Pacientes e famílias agendam a terapia sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para o seu consultório de fono. Pais e pacientes escolhem o atendimento e um horário livre, e recebem a confirmação na hora.",
  demo: {
    businessName: "Fono Falar Bem",
    bio: "Fonoaudiologia infantil e adulta.",
    prices: [15000, 20000, 15000],
    customerName: "Marina",
    dayLabel: "Terça, 10 de março",
    time: "15:00",
  },
  pains: [
    "Pais mandando mensagem para remarcar a semana toda",
    "Avaliações marcadas no caderno",
    "Terapias perdidas por esquecimento",
  ],
  services: [
    { name: "Sessão de fonoterapia", durationMinutes: 45 },
    { name: "Avaliação", durationMinutes: 60 },
    { name: "Terapia online", durationMinutes: 45 },
  ],
  faq: [
    {
      question: "Os pais podem agendar pela criança?",
      answer:
        "Sim. Quem agenda informa o nome e o contato, e a confirmação e o lembrete chegam para essa pessoa.",
    },
  ],
  testimonial: {
    name: "Patrícia",
    role: "Fonoaudióloga",
    quote: "Os pais agendam sozinhos e eu não perco mais tempo no WhatsApp.",
  },
});
