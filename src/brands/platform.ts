import { nicheBrand } from "./niche";

/**
 * The MeetChat product itself: generic home page (/) that sells to every niche and links to the
 * niche pages (/beleza, /psicologia, /banho-e-tosa…). Not a niche: no business ever belongs to it.
 */
export const platform = nicheBrand({
  key: "agendamo",
  segment: "beauty",
  domains: ["agendamo.example.com"],
  // Vinho #A8466D on warm cream (docs/design/direction.md). All AA: text 15:1, muted 6.3:1,
  // white on the brand 5.6:1, success/warning on white 5.3 and 5.4:1.
  theme: {
    primary: "#A8466D",
    background: "#FBF6F3",
    surface: "#FFFFFF",
    text: "#2B1D23",
    muted: "#6B5560",
    button: "#A8466D",
    accent: "#F5E4EA",
    danger: "#B42318",
    success: "#1F7A4D",
    warning: "#9A5B00",
    headingFont: "fraunces",
    bodyFont: "figtree",
    radius: "1rem",
  },
  title: "Seus clientes agendam sozinhos, direto pelo seu link",
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
