import { nicheBrand } from "./niche";

/**
 * "Outro / Geral": any business outside the listed niches, and the fallback for an empty, unknown
 * or removed niche (getNiche). No sales page or card on the site: chosen as "Outro" in sign-up and
 * in the panel.
 */
export const general = nicheBrand({
  key: "general",
  segment: "general",
  theme: {
    primary: "#4338CA",
    background: "#F8F9FC",
    surface: "#FFFFFF",
    text: "#141A2E",
    muted: "#5B6478",
    button: "#4338CA",
    accent: "#E3E5FB",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "inter",
    radius: "1rem",
  },
  title: "Seus clientes agendam sozinhos, direto pelo link da bio",
  subtitle:
    "Um chat de agendamento para quem trabalha com hora marcada. O cliente escolhe o atendimento e um horário livre, e já fica na sua agenda.",
  demo: {
    businessName: "Seu negócio",
    bio: "Atendimento com hora marcada.",
    prices: [10000, 8000, 5000],
    customerName: "Ana",
    dayLabel: "Terça, 10 de março",
    time: "10:00",
  },
  pains: [
    "Responder “tem horário?” o dia inteiro",
    "Perder o cliente que chamou à noite e você só viu de manhã",
    "Horário marcado que fica vazio porque esqueceram",
  ],
  services: [
    { name: "Primeiro atendimento", durationMinutes: 60 },
    { name: "Atendimento", durationMinutes: 45 },
    { name: "Retorno", durationMinutes: 30 },
  ],
  service: { singular: "atendimento", plural: "atendimentos" },
});
