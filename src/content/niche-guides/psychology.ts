import type { NicheGuide } from "./types";

// TODO(revisão-especialista): textos de saúde (psicologia) a revisar por psicóloga(o) com CRP
// antes de publicar novas subpáginas. Os textos falam só de agenda, lembretes e atendimento;
// nada de conduta clínica.
export const psychologyGuide: NicheGuide = {
  brandKey: "psychology",
  published: true,
  ymyl: true,
  searchTerms: {
    singular: "psicólogo",
    plural: "psicólogos",
    synonyms: ["psicóloga", "consultório de psicologia", "psicoterapia", "terapia online"],
  },
  disclaimer:
    "O MeetChat organiza a agenda, os lembretes e o atendimento. Não substitui as orientações do seu conselho profissional nem o contrato que você combina com cada paciente.",
  notes: {
    title: "Agenda de psicologia com discrição",
    items: [
      "O chat pede só o necessário para marcar: nome e WhatsApp; o e-mail é opcional. Nada sobre o motivo da consulta.",
      "Os nomes dos atendimentos são os que você escolher, como “Sessão individual” ou “Primeira conversa”.",
      "Sessões presenciais e online ficam na mesma agenda; o link da chamada você envia como já faz hoje.",
      "Você pode aprovar cada pedido antes de virar sessão confirmada.",
    ],
  },
  related: ["psychoanalysis", "psychopedagogy", "integrative-therapy"],
  topics: {
    "reduzir-faltas": {
      title: "Como reduzir faltas em sessões de psicologia | MeetChat",
      description:
        "Sessões perdidas atrapalham o paciente e a agenda. Veja como confirmação, lembrete por e-mail e remarcação pelo próprio paciente ajudam no consultório.",
      h1: "Como reduzir faltas nas sessões de psicologia",
      answer:
        "No consultório de psicologia, as faltas diminuem quando o paciente é lembrado da sessão e consegue remarcar com facilidade, sem precisar se justificar. O MeetChat envia confirmação e lembrete por e-mail um dia antes, com um botão para remarcar ou cancelar, e libera o horário para quem está na lista de espera.",
      linkLabel: "faltas em sessões de psicologia",
      sections: [
        {
          title: "Falta no consultório tem dois lados",
          paragraphs: [
            "Para o paciente, uma sessão perdida interrompe um processo. Para você, é um horário reservado que não pode ser oferecido a outra pessoa de última hora.",
            "Muitas faltas não são decisão: são esquecimento, rotina que mudou ou desconforto de avisar. Um lembrete e um caminho simples para remarcar resolvem boa parte disso.",
          ],
        },
        {
          title: "Lembrete discreto, sem expor o paciente",
          paragraphs: [
            "O paciente que informa o e-mail ao agendar recebe a confirmação e um lembrete um dia antes, com o nome do atendimento que você definiu, o dia e o horário. Não há nada sobre o motivo da consulta.",
            "No lembrete, o botão “Preciso remarcar” leva aos horários livres. O paciente escolhe outro sozinho, sem precisar escrever uma justificativa.",
          ],
        },
        {
          title: "Política de faltas: combine no contrato",
          paragraphs: [
            "Cobrança de sessão não desmarcada, antecedência para avisar e sinal antecipado são decisões suas e do contrato que você faz com cada paciente, dentro das orientações do seu conselho. Se fizer sentido para você, o MeetChat permite pedir sinal pelo Pix por atendimento, pago direto na sua chave.",
          ],
        },
        {
          title: "O horário liberado encontra quem precisa",
          paragraphs: [
            "Quando a agenda está cheia, a pessoa pode entrar na lista de espera do dia. Se um paciente cancelar, a lista recebe um e-mail e o horário fica com quem confirmar primeiro.",
          ],
        },
      ],
      faq: [
        {
          question: "O lembrete diz o motivo da consulta?",
          answer:
            "Não. O lembrete mostra o nome do atendimento que você escolheu (por exemplo, “Sessão individual”), o dia, o horário e o seu nome ou do consultório.",
        },
        {
          question: "Dá para marcar sessões toda semana automaticamente?",
          answer:
            "O MeetChat não cria sessões recorrentes sozinho. Cada sessão é agendada pelo paciente no link, ou por você no painel.",
        },
      ],
      updatedAt: "2026-10-16",
    },
    "agendar-pelo-whatsapp": {
      title: "Agendamento de psicólogo pelo WhatsApp | MeetChat",
      description:
        "O paciente marca a sessão pelo link que você deixa no WhatsApp, sem trocar mensagens sobre horários. Você recebe o aviso e mantém o WhatsApp para o que importa.",
      h1: "Agendamento pelo WhatsApp para psicólogos",
      answer:
        "O psicólogo pode receber agendamentos pelo WhatsApp sem combinar horário por mensagem: basta deixar o link do MeetChat no perfil do WhatsApp Business e na mensagem de ausência. O paciente escolhe o atendimento e um horário livre e informa só nome e WhatsApp.",
      linkLabel: "marcar sessão pelo WhatsApp",
      sections: [
        {
          title: "Menos troca de mensagens com quem ainda não é paciente",
          paragraphs: [
            "O primeiro contato costuma ser delicado: a pessoa criou coragem para procurar terapia e manda uma mensagem. Ficar trocando opções de horário nesse momento cansa os dois lados.",
            "Com o link, a pessoa vê os horários livres e marca a primeira conversa no ritmo dela. Você responde depois, com calma, o que for sobre o atendimento.",
          ],
        },
        {
          title: "Onde colocar o link",
          list: [
            "No perfil do WhatsApp Business, no campo de site.",
            "Na mensagem de ausência: quem chama durante as sessões recebe o link.",
            "Numa resposta rápida, para enviar quando alguém pergunta disponibilidade.",
          ],
        },
        {
          title: "O WhatsApp continua sendo seu",
          paragraphs: [
            "O MeetChat não lê nem envia mensagens pelo seu WhatsApp. Ele só guarda, em cada agendamento, o nome e o WhatsApp que o paciente informou, para você entrar em contato se precisar.",
          ],
        },
      ],
      faq: [
        {
          question: "O paciente precisa criar conta?",
          answer: "Não. Ele informa nome e WhatsApp; o e-mail é opcional, para receber o lembrete.",
        },
        {
          question: "Posso aprovar antes de confirmar a sessão?",
          answer:
            "Pode. No modo “Eu aprovo cada um”, o pedido chega para você e só vira sessão confirmada quando você aprova.",
        },
      ],
      updatedAt: "2026-10-16",
    },
    "agendar-pelo-instagram": {
      title: "Agendamento de psicólogo pelo Instagram | MeetChat",
      description:
        "Quem chega pelo conteúdo do seu Instagram pode marcar a primeira sessão pelo link da bio, com discrição e sem precisar mandar direct.",
      h1: "Agendamento pelo Instagram para psicólogos",
      answer:
        "Psicólogos recebem agendamentos pelo Instagram deixando o link do MeetChat na bio e num destaque fixo. Quem acompanha seu conteúdo toca no link e marca a primeira conversa sem precisar escrever no direct, o que muita gente prefere nesse primeiro passo.",
      linkLabel: "link de agendamento para psicólogo no Instagram",
      sections: [
        {
          title: "Nem todo mundo quer começar pelo direct",
          paragraphs: [
            "Muitas pessoas acompanham o conteúdo de psicólogos por um tempo antes de procurar atendimento. Quando decidem, mandar uma mensagem pode ser a parte mais difícil.",
            "O link na bio oferece um caminho mais reservado: ver os horários livres e marcar a primeira conversa, informando só nome e WhatsApp.",
          ],
        },
        {
          title: "Como organizar o perfil",
          list: [
            "Link do MeetChat na bio, com uma chamada simples como “Agende sua primeira conversa”.",
            "Destaque “Atendimento” explicando como funcionam as sessões presenciais e online.",
            "Resposta rápida no direct com o link, para quem prefere perguntar antes.",
          ],
        },
        {
          title: "O perfil mostra o essencial",
          paragraphs: [
            "No chat, o paciente pode tocar na sua foto e ver o perfil com sua apresentação, os atendimentos e, se você quiser, os valores. Você decide o que aparece.",
          ],
        },
      ],
      faq: [
        {
          question: "Posso esconder os valores das sessões?",
          answer:
            "Pode. Você escolhe mostrar ou não os preços no perfil; o agendamento funciona igual.",
        },
        {
          question: "O agendamento aparece para os meus seguidores?",
          answer:
            "Não. O agendamento acontece no chat do MeetChat, fora do Instagram, e só você vê quem marcou.",
        },
      ],
      updatedAt: "2026-10-16",
    },
  },
};
