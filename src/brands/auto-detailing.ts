import { nicheBrand } from "./niche";

export const autoDetailing = nicheBrand({
  key: "auto-detailing",
  segment: "auto_detailing",
  niche: {
    route: "estetica-automotiva",
    name: "Estética automotiva",
    icon: "car",
    group: "services",
    label: "Estética automotiva e lava-rápidos",
    pitch: "Lavagem, polimento e higienização marcados pelo cliente.",
  },
  theme: {
    primary: "#1F4E79",
    background: "#F3F6F9",
    surface: "#FFFFFF",
    text: "#14202C",
    muted: "#4F5D6B",
    button: "#1F4E79",
    accent: "#DAE5F0",
    danger: "#B42318",
    headingFont: "oswald",
    bodyFont: "inter",
    radius: "0.25rem",
  },
  title: "Seus clientes agendam a lavagem sozinhos, direto pelo link da bio",
  subtitle:
    "Um chat de agendamento para estética automotiva. O cliente escolhe o serviço e um horário livre, e o carro já fica na agenda.",
  demo: {
    businessName: "Brilho Car Detail",
    bio: "Lavagem detalhada, polimento e vitrificação.",
    prices: [8000, 35000, 25000],
    customerName: "Diego",
    dayLabel: "Sexta, 13 de março",
    time: "09:00",
  },
  pains: [
    "Fila de carros sem hora marcada",
    "Responder orçamento por mensagem o dia inteiro",
    "Box parado porque o cliente não apareceu",
  ],
  services: [
    { name: "Lavagem completa", durationMinutes: 60 },
    { name: "Polimento", durationMinutes: 240 },
    { name: "Higienização interna", durationMinutes: 180 },
    { name: "Vitrificação", durationMinutes: 360 },
  ],
  testimonial: {
    name: "Júnior",
    role: "Dono de estética automotiva",
    quote: "O box nunca mais ficou parado esperando cliente.",
  },
});
