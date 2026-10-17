import { NOTE, PRICE_OBJECTION, TRUST } from "../shared";
import type { LandingCopy } from "../types";

/** Clínica de estética: salas, macas e aparelhos; protocolos de várias sessões. */
export const aestheticsLanding: LandingCopy = {
  hero: {
    eyebrow: "Agenda online para clínica de estética",
    title: "Procedimento marcado sem disputar sala nem maca.",
    subtitle:
      "A cliente escolhe o procedimento pelo link no Instagram e no WhatsApp, e o chat só oferece horário quando a profissional, a sala e o aparelho estão livres ao mesmo tempo.",
    cta: "Criar meu link para a clínica",
    note: NOTE,
    trust: TRUST,
  },
  pains: {
    title: "Se a sua clínica é assim, o link resolve",
    items: [
      {
        scene:
          "Duas clientes marcadas na mesma sala porque cada uma combinou com uma profissional diferente.",
        relief:
          "Salas, macas e aparelhos entram como recursos: o horário só aparece quando todos estão livres juntos.",
      },
      {
        scene:
          "A recepção confere três agendas a cada mensagem de “tem horário para limpeza de pele?”.",
        relief: "A cliente vê sozinha os horários em que o procedimento cabe e marca.",
      },
      {
        scene: "Protocolo de várias sessões em que a cliente perde a conta e para no meio.",
        relief:
          "O pacote mostra quantas sessões ela já usou, e cada sessão é marcada pelo mesmo link.",
      },
    ],
  },
  story: {
    title: "A clínica com o link, sem conflito de sala",
    rows: [
      {
        kicker: "Da pesquisa ao horário",
        title: "Pesquisou o procedimento? Marca pelo link",
        text: "A cliente que viu o procedimento no seu Instagram toca no link e escolhe. O mesmo link vai no WhatsApp Business e no Google.",
        visual: "bio",
      },
      {
        kicker: "Recursos sem conflito",
        title: "Profissional, sala e aparelho conferidos juntos",
        text: "O chat só oferece o horário quando a profissional e o recurso do procedimento estão livres, e a equipe recebe o aviso.",
        visual: "notification",
      },
      {
        kicker: "Antes do procedimento",
        title: "Lembrete na véspera com botão de remarcar",
        text: "Quem deixou o e-mail recebe o lembrete. Se não puder vir, remarca sozinha e libera sala e aparelho a tempo.",
        visual: "reminder",
      },
      {
        kicker: "Cancelou?",
        title: "Sala e aparelho voltam para a agenda",
        text: "O horário liberado reaparece no link, e quem estava na lista de espera daquele dia recebe um e-mail para confirmar.",
        visual: "agenda",
      },
    ],
  },
  compare: {
    title: "Agenda de estética por mensagem ou pelo link?",
    before: "Por mensagem",
    after: "Com o link do MeetChat",
    rows: [
      {
        label: "Sala e aparelho",
        before: "Conferidos a cada conversa",
        after: "Conferidos pelo sistema, junto com a profissional",
      },
      {
        label: "Duas profissionais, um aparelho",
        before: "Risco de marcar em dobro",
        after: "O aparelho não é oferecido duas vezes",
      },
      {
        label: "Protocolo de sessões",
        before: "Controle em caderno",
        after: "Pacote com saldo de cada cliente",
      },
      {
        label: "Procedimento longo",
        before: "Falta sem aviso",
        after: "Lembrete por e-mail e sinal pelo Pix",
      },
    ],
  },
  objections: {
    title: "O que toda clínica de estética pergunta",
    items: [
      {
        question: "Tenho poucas salas e muitos procedimentos.",
        answer:
          "Cadastre cada sala ou aparelho e ligue aos procedimentos que o usam. O chat cuida do resto.",
      },
      {
        question: "Faço avaliação antes do procedimento.",
        answer:
          "Crie um atendimento “Avaliação” com a duração que quiser; a cliente agenda pelo mesmo link.",
      },
      {
        question: "E as promessas de resultado?",
        answer:
          "Os textos do seu perfil são seus. O MeetChat cuida da agenda; descreva os procedimentos com clareza, sem prometer resultado.",
      },
      PRICE_OBJECTION,
    ],
  },
  closing: {
    title: "A agenda da clínica no ar hoje.",
    subtitle: "Cole o link no Instagram e no WhatsApp e pare de conferir sala por mensagem.",
    cta: "Criar meu link para a clínica",
  },
  mock: {
    business: "Clínica Essência",
    services: [
      { name: "Limpeza de pele", minutes: 90 },
      { name: "Drenagem linfática", minutes: 60 },
      { name: "Peeling", minutes: 60 },
    ],
    professionals: ["Lu", "Bia"],
    customer: "Camila",
    handle: "clinicaessencia",
    slug: "clinica-essencia",
    bio: "Estética facial e corporal com hora marcada.",
  },
};
