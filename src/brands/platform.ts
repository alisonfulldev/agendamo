import { nicheBrand } from "./niche";

/**
 * The MeetChat product itself: generic home page (/) that sells to every niche and links to the
 * niche pages (/beleza, /psicologia, /banho-e-tosa…). Not a niche: no business ever belongs to it.
 */
export const platform = nicheBrand({
  key: "agendamo",
  segment: "beauty",
  domains: ["agendamo.example.com"],
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
    "O MeetChat é um chat de agendamento para quem trabalha com hora marcada. O cliente toca no seu link, escolhe o serviço e um horário livre, e já fica na sua agenda. Sem ficar respondendo mensagem.",
  demo: {
    businessName: "Seu negócio",
    bio: "Atendimento com hora marcada.",
    prices: [8000, 12000, 6000],
    customerName: "Ana",
    dayLabel: "Sábado, 14 de março",
    time: "10:00",
  },
  pains: [
    "Responder “tem horário?” o dia inteiro",
    "Perder o cliente que chamou à noite e você só viu de manhã",
    "Horário marcado que fica vazio porque esqueceram",
  ],
  services: [
    { name: "Atendimento", durationMinutes: 60 },
    { name: "Avaliação", durationMinutes: 60 },
    { name: "Retorno", durationMinutes: 30 },
  ],
  faq: [
    {
      question: "Para quais tipos de negócio funciona?",
      answer:
        "Para qualquer negócio que trabalha com hora marcada: salões, barbearias, estética, consultórios de saúde, terapias, estúdios, pet shops, aulas, fotografia, consultorias, quadras e muito mais. Cada área tem textos e exemplos próprios.",
    },
  ],
});
