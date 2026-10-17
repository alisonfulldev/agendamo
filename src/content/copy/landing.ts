import { NOTE, PRICE_OBJECTION, TRUST } from "./shared";
import type { LandingCopy } from "./types";
import { aestheticsLanding } from "./niches/aesthetics";
import { BARBER_LANDING } from "./niches/barber";
import { beautyLanding } from "./niches/beauty";
import { lashBrowLanding } from "./niches/lash-brow";
import { nailsLanding } from "./niches/nails";
import { nutritionLanding } from "./niches/nutrition";
import { physioLanding } from "./niches/physio";
import { psychologyLanding } from "./niches/psychology";

export type { LandingCopy, MockVisual, PhoneMock } from "./types";

/**
 * Copy of the redesigned landing pages (docs/design/direction.md): the home and each niche hub
 * that has its own copy here. One main pain per page, in the words of who feels it. Facts only:
 * reminders go by e-mail, nothing is sent through WhatsApp, "grátis" always with its limit (D1).
 */
export const HOME_LANDING: LandingCopy = {
  hero: {
    eyebrow: "Agenda online pelo link da bio",
    title: "Seu cliente marca sozinho. Você para de responder mensagem.",
    subtitle:
      "Um link no Instagram e no WhatsApp abre uma conversa: o cliente escolhe o serviço, o dia e um horário livre, e o horário já entra na sua agenda. A qualquer hora, sem ele baixar nada.",
    cta: "Criar meu link de agendamento",
    note: NOTE,
    trust: TRUST,
  },
  doors: {
    title: "Qual dessas é a sua?",
    items: [
      {
        pain: "“Passo o dia respondendo ‘tem horário?’”",
        answer: "O link responde por você: o cliente vê só os horários livres e marca sozinho.",
        href: "/agendamento/pelo-whatsapp",
        label: "Agendamento pelo WhatsApp",
      },
      {
        pain: "“O cliente marca e não aparece.”",
        answer:
          "Um lembrete por e-mail no dia anterior, com botão para remarcar, devolve o horário a tempo.",
        href: "/agendamento/reduzir-faltas",
        label: "Como reduzir faltas",
      },
      {
        pain: "“Meu Instagram tem seguidor, mas ninguém marca.”",
        answer: "Um link na bio transforma o “que lindo!” em horário marcado, sem direct.",
        href: "/agendamento/link-na-bio",
        label: "Link de agendamento na bio",
      },
    ],
  },
  story: {
    title: "Como fica o seu dia com o link",
    rows: [
      {
        kicker: "Onde o cliente já está",
        title: "Um link só, no Instagram, no WhatsApp e no Google",
        text: "Você cola o mesmo link na bio, no perfil do WhatsApp Business e no seu Perfil da Empresa no Google. Quem quer marcar toca e começa a conversa.",
        visual: "bio",
      },
      {
        kicker: "A qualquer hora",
        title: "Ele marca às 23h. Você acorda com o horário na agenda.",
        text: "O chat pergunta o serviço, o profissional e o dia, e só mostra horários em que o serviço cabe inteiro. Ninguém marca em cima de ninguém, e você recebe o aviso no celular.",
        visual: "notification",
      },
      {
        kicker: "Antes do horário",
        title: "O lembrete chega com o botão de remarcar",
        text: "Um dia antes, quem deixou o e-mail recebe um lembrete com “Preciso remarcar”. Quem não pode ir avisa com um toque, em vez de simplesmente não aparecer.",
        visual: "reminder",
      },
      {
        kicker: "Quando alguém desmarca",
        title: "O horário vago volta para a agenda",
        text: "O cancelamento libera o horário na hora. Se houver lista de espera para aquele dia, quem está nela recebe um e-mail, e o primeiro que confirmar fica com a vaga.",
        visual: "agenda",
      },
    ],
  },
  compare: {
    title: "WhatsApp e caderno, ou um link?",
    before: "Hoje, no WhatsApp e no caderno",
    after: "Com o link do MeetChat",
    rows: [
      {
        label: "Quem responde “tem horário?”",
        before: "Você, entre um atendimento e outro",
        after: "O link, com os horários livres de verdade",
      },
      {
        label: "Cliente que chama às 23h",
        before: "Espera até amanhã, ou desiste",
        after: "Marca na hora",
      },
      {
        label: "Esquecimento",
        before: "Você lembra um por um",
        after: "Lembrete automático por e-mail, com botão de remarcar",
      },
      {
        label: "Desmarcação",
        before: "O horário fica vazio",
        after: "Volta para a agenda e avisa a lista de espera",
      },
      {
        label: "Onde está a agenda",
        before: "No caderno, nas conversas e na memória",
        after: "Num lugar só, no seu celular",
      },
    ],
  },
  objections: {
    title: "Mas e se…",
    items: [
      {
        question: "Eu não sei mexer com sistema?",
        answer:
          "Você diz o nome do negócio e o ramo, e em 1 minuto o link fica pronto com os serviços do seu ramo. Preço e horário você ajusta depois, pelo celular.",
      },
      {
        question: "Meu cliente não vai usar?",
        answer:
          "Ele não instala nada nem cria conta: toca no link e responde a uma conversa, como no WhatsApp. Informa nome e WhatsApp, e pronto.",
      },
      {
        question: "Eu já atendo tudo pelo WhatsApp.",
        answer:
          "Continue atendendo. O link só tira de você a parte de combinar horário; a conversa com o cliente segue no seu WhatsApp.",
      },
      PRICE_OBJECTION,
    ],
  },
  closing: {
    title: "Seu link pronto em 1 minuto.",
    subtitle: "Cole no Instagram e no WhatsApp hoje e deixe o próximo cliente marcar sozinho.",
    cta: "Criar meu link de agendamento",
  },
  mock: {
    business: "Studio Lumi",
    services: [
      { name: "Design de sobrancelha", minutes: 45 },
      { name: "Escova", minutes: 45 },
      { name: "Manicure", minutes: 45 },
    ],
    professionals: ["Ana", "Bia"],
    customer: "Mariana",
    handle: "studiolumi",
    slug: "studio-lumi",
    bio: "Sobrancelha, cabelo e unhas com hora marcada.",
  },
};

/** Niches with the redesigned hub (brand key). The others keep the previous template. */
export const NICHE_LANDINGS: Record<string, LandingCopy> = {
  barber: BARBER_LANDING,
  beauty: beautyLanding,
  nails: nailsLanding,
  "lash-brow": lashBrowLanding,
  aesthetics: aestheticsLanding,
  psychology: psychologyLanding,
  physio: physioLanding,
  nutrition: nutritionLanding,
};
