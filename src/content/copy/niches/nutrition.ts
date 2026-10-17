import { HEALTH_NOTICE, HEALTH_TRUST, NOTE, PRICE_OBJECTION } from "../shared";
import type { LandingCopy } from "../types";

// TODO(revisão-especialista): revisar com nutricionista (publicidade conforme o CFN).
// Só agenda, consultas, retornos e lembretes; nada sobre dieta, emagrecimento ou resultado.
/** Nutrição: primeira consulta, retornos, atendimento online, bioimpedância. */
export const nutritionLanding: LandingCopy = {
  hero: {
    eyebrow: "Agenda online para nutricionistas",
    title: "Consulta e retorno marcados sem você virar recepcionista.",
    subtitle:
      "O paciente marca a primeira consulta ou o retorno pelo link no Instagram e no WhatsApp, presencial ou online, num horário em que a consulta cabe inteira.",
    cta: "Criar meu link de nutrição",
    note: NOTE,
    trust: HEALTH_TRUST,
  },
  pains: {
    title: "Se a sua agenda é assim, o link ajuda",
    items: [
      {
        scene:
          "O paciente pede retorno por mensagem e a conversa vai e volta até achar um dia que sirva.",
        relief: "Pelo link, ele vê os horários livres e marca o retorno sozinho.",
      },
      {
        scene:
          "Primeira consulta de uma hora, retorno de 40 minutos e bioimpedância de 20 dividindo uma agenda feita no olho.",
        relief:
          "Cada atendimento tem a sua duração, e o chat só oferece horário onde ele cabe inteiro.",
      },
      {
        scene: "O retorno combinado no fim da consulta e esquecido pelo paciente.",
        relief:
          "Mande o link no fim da consulta: ele marca o retorno na hora, e o lembrete chega na véspera.",
      },
    ],
  },
  story: {
    title: "A agenda do consultório de nutrição com o link",
    rows: [
      {
        kicker: "Onde o paciente procura",
        title: "Do conteúdo da bio à primeira consulta",
        text: "Quem acompanha seu conteúdo marca a primeira consulta pelo link da bio, sem direct.",
        visual: "bio",
      },
      {
        kicker: "Presencial ou online",
        title: "Uma agenda só para os dois",
        text: "O paciente escolhe consulta presencial ou online; o link da chamada você envia como já faz hoje. O aviso de cada agendamento chega no seu celular.",
        visual: "notification",
      },
      {
        kicker: "Antes da consulta",
        title: "O retorno lembrado na véspera, com opção de remarcar",
        text: "Quem deixou o e-mail recebe o lembrete um dia antes e pode remarcar sozinho, sem mensagem.",
        visual: "reminder",
      },
      {
        kicker: "Consulta desmarcada",
        title: "O horário volta para a agenda",
        text: "Quem entrou na lista de espera daquele dia recebe um e-mail, e o primeiro que confirmar fica com o horário.",
        visual: "agenda",
      },
    ],
  },
  compare: {
    title: "Retorno marcado por mensagem ou pelo link?",
    before: "Por mensagem",
    after: "Com o link do MeetChat",
    rows: [
      {
        label: "Marcar o retorno",
        before: "Conversa até achar um dia",
        after: "O paciente marca no fim da consulta",
      },
      {
        label: "Consultas de durações diferentes",
        before: "Encaixe no olho",
        after: "Cada atendimento com a sua duração",
      },
      {
        label: "Presencial e online",
        before: "Agendas separadas",
        after: "Uma agenda só",
      },
      {
        label: "Paciente que esquece",
        before: "Horário vazio",
        after: "Lembrete por e-mail com botão de remarcar",
      },
    ],
  },
  objections: {
    title: "O que todo nutricionista pergunta",
    items: [
      {
        question: "Posso esconder os valores?",
        answer:
          "Pode. Você escolhe mostrar ou não os preços no perfil; o agendamento funciona igual.",
      },
      {
        question: "Atendo online e presencial.",
        answer:
          "Crie um atendimento para cada um, com a duração que quiser. O paciente escolhe no chat.",
      },
      {
        question: "Quero aprovar a primeira consulta antes.",
        answer:
          "No modo “Eu aprovo cada um”, o pedido chega para você e só vira consulta confirmada quando você aprova.",
      },
      PRICE_OBJECTION,
    ],
  },
  closing: {
    title: "Seu consultório de nutrição no link hoje.",
    subtitle: "Cole o link na bio e deixe o próximo retorno ser marcado antes de o paciente sair.",
    cta: "Criar meu link de nutrição",
  },
  mock: {
    business: "Nutri Clara",
    services: [
      { name: "Primeira consulta", minutes: 60 },
      { name: "Retorno", minutes: 40 },
      { name: "Consulta online", minutes: 50 },
    ],
    professionals: ["Clara"],
    customer: "Pedro",
    handle: "nutriclara",
    slug: "nutri-clara",
    bio: "Consultas de nutrição presenciais e online.",
  },
  ymyl: { notice: HEALTH_NOTICE, review: "pendente" },
};
