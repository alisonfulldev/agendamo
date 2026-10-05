import { nicheBrand } from "./niche";

export const petGrooming = nicheBrand({
  key: "pet-grooming",
  segment: "pet_grooming",
  niche: {
    route: "banho-e-tosa",
    name: "Banho e tosa",
    icon: "paw",
    group: "pets",
    label: "Pet shops e banho e tosa",
    pitch: "Banho, tosa e hidratação marcados pelo tutor, com lembrete automático.",
  },
  theme: {
    primary: "#C2410C",
    background: "#FFF8F3",
    surface: "#FFFFFF",
    text: "#2B1D14",
    muted: "#6A564A",
    button: "#C2410C",
    accent: "#FDE3D2",
    danger: "#B42318",
    headingFont: "poppins",
    bodyFont: "nunito",
    radius: "1rem",
  },
  title: "Os tutores agendam o banho e tosa sozinhos, direto pelo link da bio",
  subtitle:
    "Um chat de agendamento para pet shops. O tutor escolhe o serviço e um horário livre, e o pet já fica na agenda. Sem ficar respondendo mensagem.",
  demo: {
    businessName: "Pet Feliz",
    bio: "Banho, tosa e hidratação com carinho.",
    prices: [6000, 9000, 4000],
    customerName: "Carol",
    dayLabel: "Sábado, 14 de março",
    time: "09:30",
  },
  pains: [
    "Telefone tocando para marcar banho o dia todo",
    "Tutor que esquece e o horário fica vazio",
    "Agenda de banho e tosa no caderno",
  ],
  services: [
    { name: "Banho", durationMinutes: 60 },
    { name: "Banho e tosa", durationMinutes: 90 },
    { name: "Tosa higiênica", durationMinutes: 45 },
    { name: "Hidratação", durationMinutes: 30 },
  ],
  customer: { singular: "tutor", plural: "tutores" },
  faq: [
    {
      question: "Dá para informar o porte do pet?",
      answer:
        "Dá. Você pode cadastrar serviços por porte (pequeno, médio, grande), cada um com o próprio tempo e preço.",
    },
  ],
  testimonial: {
    name: "Fábio",
    role: "Dono de pet shop",
    quote: "Os tutores marcam o banho pelo Instagram, até de madrugada.",
  },
});
