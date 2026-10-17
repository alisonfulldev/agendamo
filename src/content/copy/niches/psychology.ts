import { HEALTH_NOTICE, HEALTH_TRUST, NOTE, PRICE_OBJECTION } from "../shared";
import type { LandingCopy } from "../types";

// TODO(revisão-especialista): revisar com psicóloga(o) com CRP (publicidade conforme o CFP).
// Só agenda, lembretes e atendimento; nada de conduta clínica nem de resultado. Sem sessão fixa
// recorrente: o produto não tem recorrência.
/** Psicologia: primeiro contato delicado, remarcação sem constrangimento, discrição. */
export const psychologyLanding: LandingCopy = {
  hero: {
    eyebrow: "Agenda online para psicólogos",
    title: "Remarcar sessão sem constrangimento e sem troca de mensagens.",
    subtitle:
      "O paciente marca a primeira conversa pelo link no seu Instagram ou WhatsApp, informando só nome e WhatsApp. Na véspera, quem deixou o e-mail recebe o lembrete com o botão de remarcar.",
    cta: "Criar meu link de psicologia",
    note: NOTE,
    trust: HEALTH_TRUST,
  },
  pains: {
    title: "Se a sua agenda de consultório é assim, o link ajuda",
    items: [
      {
        scene:
          "A pessoa criou coragem para procurar terapia e mandou mensagem. Você só viu horas depois, entre uma sessão e outra.",
        relief:
          "Pelo link, ela vê os horários livres e marca a primeira conversa no ritmo dela, sem esperar resposta.",
      },
      {
        scene: "Remarcar vira uma troca de mensagens que expõe o paciente e ocupa o seu intervalo.",
        relief:
          "O lembrete traz “Preciso remarcar”: o paciente escolhe outro horário sozinho, sem justificar.",
      },
      {
        scene: "Sessões presenciais e online espalhadas entre caderno, conversas e aplicativos.",
        relief:
          "Uma agenda só, com os atendimentos nomeados por você e o link da chamada enviado como você já faz.",
      },
    ],
  },
  story: {
    title: "O consultório com o link, com discrição",
    rows: [
      {
        kicker: "Do conteúdo ao primeiro contato",
        title: "Quem acompanha seu perfil marca pelo link",
        text: "Sem precisar escrever no direct, o que muita gente prefere nesse primeiro passo. O mesmo link vai no WhatsApp Business e no Google.",
        visual: "bio",
      },
      {
        kicker: "No horário do paciente",
        title: "A primeira conversa marcada às 23h",
        text: "O chat pede só nome e WhatsApp; nada sobre o motivo da consulta. Você recebe o aviso e, se preferir, aprova cada pedido antes de confirmar.",
        visual: "notification",
      },
      {
        kicker: "Antes da sessão",
        title: "Lembrete discreto, com botão de remarcar",
        text: "O lembrete mostra o nome do atendimento que você escolheu, o dia e o horário. Nada além disso.",
        visual: "reminder",
      },
      {
        kicker: "Horário liberado",
        title: "Quem estava na lista de espera fica sabendo",
        text: "Se um paciente cancela, quem entrou na lista de espera daquele dia recebe um e-mail, e o primeiro que confirmar fica com o horário.",
        visual: "agenda",
      },
    ],
  },
  compare: {
    title: "Agenda de psicologia por mensagem ou pelo link?",
    before: "Por mensagem",
    after: "Com o link do MeetChat",
    rows: [
      {
        label: "Primeiro contato",
        before: "Troca de mensagens até achar horário",
        after: "A pessoa vê os horários e marca",
      },
      {
        label: "Remarcação",
        before: "Conversa que expõe o paciente",
        after: "Botão de remarcar no lembrete",
      },
      {
        label: "Dados pedidos",
        before: "O que surgir na conversa",
        after: "Só nome e WhatsApp; e-mail opcional",
      },
      {
        label: "Presencial e online",
        before: "Agendas separadas",
        after: "Uma agenda só",
      },
    ],
  },
  objections: {
    title: "O que todo psicólogo pergunta",
    items: [
      {
        question: "E o sigilo?",
        answer:
          "O chat pede só nome e WhatsApp (e-mail opcional) e nada sobre o motivo da consulta. O lembrete mostra apenas o nome do atendimento que você definiu.",
      },
      {
        question: "Quero aprovar antes de confirmar.",
        answer:
          "No modo “Eu aprovo cada um”, o pedido chega para você e só vira sessão confirmada quando você aprova.",
      },
      {
        question: "Dá para marcar sessões toda semana automaticamente?",
        answer:
          "Não. O MeetChat não cria sessões recorrentes; cada sessão é marcada pelo paciente no link ou por você no painel.",
      },
      PRICE_OBJECTION,
    ],
  },
  closing: {
    title: "Seu consultório no link da bio hoje.",
    subtitle: "Ofereça um caminho discreto para a primeira conversa e para remarcar sem mensagem.",
    cta: "Criar meu link de psicologia",
  },
  mock: {
    business: "Espaço Escuta",
    services: [
      { name: "Primeira conversa", minutes: 60 },
      { name: "Sessão individual", minutes: 50 },
      { name: "Sessão online", minutes: 50 },
    ],
    professionals: ["Carla"],
    customer: "Luiza",
    handle: "espacoescuta",
    slug: "espaco-escuta",
    bio: "Psicoterapia individual, presencial e online.",
  },
  ymyl: { notice: HEALTH_NOTICE, review: "pendente" },
};
