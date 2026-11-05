/**
 * Example sites for WhatsApp sales (/exemplo/<ramo>, 2026-11-06): what a prospect sees before
 * buying "Site + Agenda". By default a fictional business of the niche; a niche listed in
 * SHOWCASE_SLUGS shows that real (showcase) business instead, with its own photos.
 */

/** Niche key → slug of a showcase business with real photos (created by the platform owner). */
export const SHOWCASE_SLUGS: Partial<Record<string, string>> = {};

/** Fictional business name per niche (the default "Seu negócio"). */
export const EXAMPLE_NAMES: Partial<Record<string, string>> = {
  beauty: "Studio Bela",
  barber: "Barbearia Navalha",
  aesthetics: "Clínica Pele Leve",
  nails: "Esmalteria Aurora",
  "lash-brow": "Studio Olhar",
  tattoo: "Tinta Fina Tattoo",
  psychology: "Ana Souza Psicologia",
  psychoanalysis: "Consultório Escuta",
  physio: "Movimento Fisioterapia",
  nutrition: "Nutri Clara Mendes",
  "speech-therapy": "Fala Bem Fonoaudiologia",
  dentistry: "Sorriso Odontologia",
  pilates: "Studio Equilíbrio Pilates",
  yoga: "Casa Prana Yoga",
  "personal-trainer": "Personal Lucas Ramos",
  "pet-grooming": "Pet Cheiroso",
  veterinary: "Clínica Vet Amigo",
  tutoring: "Aulas com a Prof. Bia",
  photography: "Luz Fotografia",
  "massage-therapy": "Toque Massoterapia",
};

export const EXAMPLE_CITY = "São Paulo";

/**
 * Gallery photos of each niche on the example sites (public/examples/gallery/<key>-<n>.webp,
 * Pexels, see docs/design/example-photos.md): how many there are.
 */
export const EXAMPLE_GALLERY: Partial<Record<string, number>> = {
  acupuncture: 5,
  aesthetics: 6,
  "auto-detailing": 5,
  barber: 6,
  beauty: 6,
  chiropractic: 6,
  consulting: 6,
  dentistry: 6,
  "integrative-therapy": 6,
  "lash-brow": 4,
  "massage-therapy": 6,
  medical: 5,
  nails: 6,
  nutrition: 6,
  "occupational-therapy": 6,
  osteopathy: 6,
  "personal-trainer": 6,
  "pet-grooming": 5,
  photography: 5,
  physio: 5,
  pilates: 6,
  podiatry: 4,
  psychoanalysis: 4,
  psychology: 6,
  psychopedagogy: 6,
  "speech-therapy": 6,
  "sports-court": 6,
  tattoo: 6,
  tutoring: 6,
  veterinary: 5,
  yoga: 5,
};

/** Sample reviews (the page says it is an example). */
export const EXAMPLE_REVIEWS = [
  {
    first_name: "Mariana",
    rating: 5,
    comment: "Marquei pelo celular em um minuto. Atendimento impecável!",
  },
  {
    first_name: "Carla",
    rating: 5,
    comment: "Amei poder agendar à noite, sem precisar esperar resposta.",
  },
  {
    first_name: "Juliana",
    rating: 5,
    comment: "Lembrete no dia anterior salvou minha agenda. Recomendo demais.",
  },
];

export const EXAMPLE_COPY = {
  banner: "Site de exemplo",
  switchTo: { vibrant: "Ver modelo Vibrante", elegant: "Ver modelo Elegante" },
  templateName: { vibrant: "Modelo Vibrante", elegant: "Modelo Elegante" },
  bio: (niche: string, name: string) =>
    `Na ${name}, cada atendimento de ${niche.toLowerCase()} é com hora marcada e todo o cuidado. Escolha o serviço, veja os horários livres e agende em 1 minuto, a qualquer hora.`,
};
