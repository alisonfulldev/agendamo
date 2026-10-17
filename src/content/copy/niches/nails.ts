import { NOTE, PRICE_OBJECTION, TRUST } from "../shared";
import type { LandingCopy } from "../types";

/** Manicure e nail designer: mãos ocupadas, alongamento longo, manutenção. */
export const nailsLanding: LandingCopy = {
  hero: {
    eyebrow: "Agenda online para manicure e nail designer",
    title: "Unha feita, cliente marcada, sem largar o pincel.",
    subtitle:
      "Com o link no Instagram e no WhatsApp, a cliente escolhe manicure, alongamento ou manutenção e um horário em que o serviço cabe inteiro. Você vê o aviso no fim da aplicação.",
    cta: "Criar meu link de manicure",
    note: NOTE,
    trust: TRUST,
  },
  pains: {
    title: "Se o seu dia é assim, o link é para você",
    items: [
      {
        scene:
          "No meio da aplicação o celular não para, e a cliente que perguntou horário acaba marcando com outra.",
        relief: "Com o link, ela vê os horários livres e marca na hora, sem esperar você.",
      },
      {
        scene: "Um alongamento de duas horas encaixado onde só cabia uma manicure.",
        relief:
          "Cada serviço tem a duração que você definir, e o chat só oferece o horário onde ele cabe.",
      },
      {
        scene: "A cliente da manutenção marca, esquece e some.",
        relief:
          "Lembrete por e-mail na véspera com botão de remarcar; com pacote de manutenção, ela vê quantas sessões ainda tem.",
      },
    ],
  },
  story: {
    title: "Como fica a sua agenda de unhas com o link",
    rows: [
      {
        kicker: "Da nail art ao horário",
        title: "Viu a unha no feed, marca pelo link",
        text: "Sem direct e sem esperar resposta. O mesmo link vai no perfil do WhatsApp Business e no seu Perfil da Empresa no Google.",
        visual: "bio",
      },
      {
        kicker: "Mãos ocupadas",
        title: "Você termina a aplicação e o horário já está marcado",
        text: "O chat pergunta o serviço e o dia e mostra só horários livres. Quando você pega o celular, o aviso do novo agendamento está lá.",
        visual: "notification",
      },
      {
        kicker: "Manutenção em dia",
        title: "O lembrete chega antes, com botão de remarcar",
        text: "Um dia antes, quem deixou o e-mail recebe o lembrete. Quem não pode vir remarca sozinha, e o horário volta para a agenda.",
        visual: "reminder",
      },
      {
        kicker: "Horário vago",
        title: "Quem queria encaixe fica sabendo",
        text: "Quando alguém cancela, quem entrou na lista de espera daquele dia recebe um e-mail, e a primeira que confirmar fica com a vaga.",
        visual: "agenda",
      },
    ],
  },
  compare: {
    title: "Marcar unha pelo WhatsApp ou pelo link?",
    before: "Pelo WhatsApp",
    after: "Com o link do MeetChat",
    rows: [
      {
        label: "Pergunta no meio da aplicação",
        before: "Você para ou deixa a cliente esperando",
        after: "Ela marca sozinha nos horários livres",
      },
      {
        label: "Alongamento de 2 horas",
        before: "Você calcula o encaixe de cabeça",
        after: "O serviço ocupa o tempo que leva",
      },
      {
        label: "Manutenção esquecida",
        before: "Horário vazio",
        after: "Lembrete por e-mail com botão de remarcar",
      },
      {
        label: "Sinal do alongamento",
        before: "Cobrança no constrangimento",
        after: "Sinal pelo Pix com política aceita antes",
      },
    ],
  },
  objections: {
    title: "O que toda manicure pergunta",
    items: [
      {
        question: "Atendo sozinha. Preciso disso?",
        answer:
          "É para você mesmo. Com uma profissional só, o chat nem pergunta com quem marcar: vai direto ao serviço e ao horário.",
      },
      {
        question: "Dá para vender pacote de manutenção?",
        answer:
          "Dá. Você cria o pacote com o número de sessões e o preço, e o saldo de cada cliente fica no painel.",
      },
      {
        question: "A cliente consegue ver meus trabalhos?",
        answer:
          "Consegue. Tocando na sua foto no chat, ela vê o perfil com fotos, serviços e, se você quiser, os preços.",
      },
      PRICE_OBJECTION,
    ],
  },
  closing: {
    title: "Seu link de manicure no ar hoje.",
    subtitle: "Cole na bio e no WhatsApp e deixe a próxima cliente marcar enquanto você aplica.",
    cta: "Criar meu link de manicure",
  },
  mock: {
    business: "Esmalteria Flor",
    services: [
      { name: "Manicure", minutes: 45 },
      { name: "Alongamento em gel", minutes: 120 },
      { name: "Manutenção", minutes: 90 },
    ],
    professionals: ["Juli"],
    customer: "Ana",
    handle: "esmalteriaflor",
    slug: "esmalteria-flor",
    bio: "Unhas em gel, manutenção e esmaltação com hora marcada.",
  },
};
