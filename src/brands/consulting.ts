import { nicheBrand } from "./niche";

export const consulting = nicheBrand({
  key: "consulting",
  segment: "consulting",
  niche: {
    route: "consultoria",
    name: "Consultorias",
    icon: "briefcase",
    group: "services",
    label: "Advogados, contadores e consultores",
    pitch: "Reuniões e consultas marcadas pelo cliente, presenciais ou online.",
  },
  theme: {
    primary: "#1E3A5F",
    background: "#F4F6F9",
    surface: "#FFFFFF",
    text: "#141C28",
    muted: "#525C6B",
    button: "#1E3A5F",
    accent: "#DDE4EE",
    danger: "#B42318",
    headingFont: "lora",
    bodyFont: "inter",
    radius: "0.5rem",
  },
  title: "Seus clientes agendam a reunião sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para escritórios e consultores. O cliente escolhe o tipo de reunião e um horário livre, e recebe a confirmação na hora.",
  demo: {
    businessName: "Silva Advocacia",
    bio: "Direito de família, trabalhista e consumidor.",
    prices: [30000, 0, 25000],
    customerName: "Renato",
    dayLabel: "Quinta, 12 de março",
    time: "14:30",
  },
  pains: [
    "Troca de e-mails para achar um horário de reunião",
    "Clientes que esquecem a consulta",
    "Agenda da equipe sem visão única",
  ],
  services: [
    { name: "Consulta inicial", durationMinutes: 60 },
    { name: "Reunião de acompanhamento", durationMinutes: 30 },
    { name: "Reunião online", durationMinutes: 45 },
  ],
  service: { singular: "atendimento", plural: "atendimentos" },
  testimonial: {
    name: "Dra. Carla",
    role: "Advogada",
    quote: "Acabou a troca de mensagens para marcar reunião.",
  },
});
