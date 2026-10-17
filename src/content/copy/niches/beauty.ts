import { NOTE, PRICE_OBJECTION, TRUST } from "../shared";
import type { LandingCopy } from "../types";

/** Salão de beleza: várias profissionais, serviços longos (mechas, progressiva), sinal. */
export const beautyLanding: LandingCopy = {
  hero: {
    eyebrow: "Agenda online para salão de beleza",
    title: "As clientes marcam sozinhas. Você não para a escova.",
    subtitle:
      "Coloque o link no Instagram e no WhatsApp do salão. A cliente escolhe o serviço, a profissional e um horário livre, e cada serviço ocupa o tempo que leva de verdade.",
    cta: "Criar meu link para o salão",
    note: NOTE,
    trust: TRUST,
  },
  pains: {
    title: "O dia a dia do salão que o link resolve",
    items: [
      {
        scene:
          "Escova na mão e o celular tocando: “tem horário pra sábado?”. Responder agora atrasa a cliente da cadeira; responder depois perde a que perguntou.",
        relief: "Com o link, ela vê os horários livres de cada profissional e marca sozinha.",
      },
      {
        scene:
          "Mechas marcadas por mensagem sem conferir a duração, e a tarde inteira vira atraso.",
        relief:
          "Cada serviço tem a duração real que você definir; o chat só oferece horário onde ele cabe inteiro.",
      },
      {
        scene: "A cliente das mechas não aparece, e a profissional fica com a tarde vazia.",
        relief:
          "Lembrete por e-mail na véspera com botão de remarcar, e sinal pelo Pix nos serviços longos, pago direto na sua chave.",
      },
    ],
  },
  story: {
    title: "O salão com o link, do feed à cadeira",
    rows: [
      {
        kicker: "Do antes e depois ao horário",
        title: "Gostou do resultado no feed? Toca no link e marca",
        text: "A cliente não precisa mandar direct nem esperar resposta. O mesmo link fica no perfil do WhatsApp Business do salão e no Google.",
        visual: "bio",
      },
      {
        kicker: "Várias profissionais",
        title: "Cada uma com a própria agenda",
        text: "A cliente escolhe com quem quer ser atendida ou pega a primeira livre. Cada profissional tem os próprios serviços, horários e pausas, e recebe o aviso dos próprios horários.",
        visual: "notification",
      },
      {
        kicker: "Antes do horário",
        title: "Remarcar sem constrangimento",
        text: "Na véspera, quem deixou o e-mail recebe o lembrete com “Preciso remarcar”. Ela escolhe outro horário sozinha, sem ter de se explicar por mensagem.",
        visual: "reminder",
      },
      {
        kicker: "Desmarcou?",
        title: "O horário volta e a lista de espera fica sabendo",
        text: "Quem queria encaixe naquele dia recebe um e-mail quando o horário é liberado, e a primeira que confirmar fica com ele.",
        visual: "agenda",
      },
    ],
  },
  compare: {
    title: "Agenda do salão no WhatsApp ou no link?",
    before: "Marcando pelo WhatsApp",
    after: "Com o link do MeetChat",
    rows: [
      {
        label: "“Tem horário sábado?”",
        before: "Alguém do salão para e responde",
        after: "A cliente vê os horários livres e marca",
      },
      {
        label: "Mechas de várias horas",
        before: "A duração fica na cabeça de quem marca",
        after: "O serviço ocupa o tempo que leva",
      },
      {
        label: "Várias profissionais",
        before: "Um caderno para todas, e horário duplicado",
        after: "Uma agenda por profissional",
      },
      {
        label: "Cliente que falta",
        before: "Tarde vazia e nada a fazer",
        after: "Lembrete por e-mail e sinal pelo Pix nos serviços longos",
      },
    ],
  },
  objections: {
    title: "O que todo salão pergunta",
    items: [
      {
        question: "Minhas clientes gostam de falar comigo.",
        answer:
          "Elas continuam falando. O link resolve só a parte de achar horário; a conversa segue no WhatsApp do salão.",
      },
      {
        question: "Cada profissional trabalha de um jeito.",
        answer:
          "Cada uma tem serviços, durações, horários e pausas próprios. Quem faz só unha não aparece para corte.",
      },
      {
        question: "Dá para cobrar sinal nas mechas e na progressiva?",
        answer:
          "Dá. Você escolhe em quais serviços pedir sinal pelo Pix; a cliente paga direto na sua chave e você confirma.",
      },
      PRICE_OBJECTION,
    ],
  },
  closing: {
    title: "O salão no link da bio hoje.",
    subtitle:
      "Cole o link no Instagram e no WhatsApp e deixe a próxima cliente marcar sem ninguém parar.",
    cta: "Criar meu link para o salão",
  },
  mock: {
    business: "Salão Bela Rosa",
    services: [
      { name: "Corte feminino", minutes: 60 },
      { name: "Escova", minutes: 45 },
      { name: "Design de sobrancelha", minutes: 30 },
    ],
    professionals: ["Carla", "Rô"],
    customer: "Fernanda",
    handle: "salaobelarosa",
    slug: "salao-bela-rosa",
    bio: "Cabelo, unhas e sobrancelha com hora marcada.",
  },
};
