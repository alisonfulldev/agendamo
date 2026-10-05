import { nicheBrand } from "./niche";

export const massageTherapy = nicheBrand({
  key: "massage-therapy",
  segment: "massage_therapy",
  niche: {
    route: "massoterapia",
    name: "Massoterapia",
    icon: "hand",
    group: "wellness",
    label: "Massoterapeutas",
    pitch: "Massagens terapêuticas marcadas sozinhas, com agenda sempre atualizada.",
  },
  theme: {
    primary: "#7A5230",
    background: "#FAF6F1",
    surface: "#FFFFFF",
    text: "#2B2016",
    muted: "#665747",
    button: "#7A5230",
    accent: "#F0E3D3",
    danger: "#B42318",
    headingFont: "lora",
    bodyFont: "nunito",
    radius: "1rem",
  },
  title: "Seus clientes agendam a massagem sozinhos, direto pelo seu link",
  subtitle:
    "Um chat de agendamento para o seu espaço de massoterapia. O cliente escolhe a massagem e um horário livre, e já fica na agenda.",
  demo: {
    businessName: "Espaço Relaxar",
    bio: "Massagem terapêutica, relaxante e drenagem.",
    prices: [15000, 13000, 18000],
    customerName: "Paula",
    dayLabel: "Sexta, 13 de março",
    time: "17:00",
  },
  pains: [
    "Responder “tem horário hoje?” o dia inteiro",
    "Clientes que desistem por falta de resposta",
    "Horários vagos por esquecimento",
  ],
  services: [
    { name: "Massagem terapêutica", durationMinutes: 60 },
    { name: "Massagem relaxante", durationMinutes: 60 },
    { name: "Drenagem linfática", durationMinutes: 50 },
    { name: "Quick massage", durationMinutes: 20 },
  ],
  customer: { singular: "cliente", plural: "clientes" },
  testimonial: {
    name: "Eduardo",
    role: "Massoterapeuta",
    quote: "Agora o cliente marca sozinho, até de madrugada.",
  },
});
