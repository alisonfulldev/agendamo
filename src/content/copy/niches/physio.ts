import { HEALTH_NOTICE, HEALTH_TRUST, NOTE, PRICE_OBJECTION } from "../shared";
import type { LandingCopy } from "../types";

// TODO(revisão-especialista): revisar com fisioterapeuta (publicidade conforme o COFFITO/CREFITO).
// Só agenda, pacotes de sessões e atendimento; nada sobre tratamento ou resultado.
/** Fisioterapia: sessões e avaliações, pacotes, atendimento domiciliar. */
export const physioLanding: LandingCopy = {
  hero: {
    eyebrow: "Agenda online para fisioterapia",
    title: "Sessões marcadas sem você sair do atendimento.",
    subtitle:
      "O paciente escolhe sessão, avaliação ou RPG pelo link no Instagram e no WhatsApp, num horário em que o atendimento cabe inteiro. Pacotes de sessões ficam com o saldo de cada paciente.",
    cta: "Criar meu link de fisioterapia",
    note: NOTE,
    trust: HEALTH_TRUST,
  },
  pains: {
    title: "Se a sua clínica é assim, o link ajuda",
    items: [
      {
        scene: "Paciente no exercício e o celular tocando com pedido de horário.",
        relief: "Pelo link, o paciente vê os horários livres e marca sem você sair do atendimento.",
      },
      {
        scene:
          "Uma avaliação de uma hora marcada onde cabia uma sessão de 50 minutos, e a tarde inteira atrasa.",
        relief:
          "Cada atendimento tem a sua duração; o chat só oferece horário onde ele cabe inteiro.",
      },
      {
        scene:
          "Atendimento em casa e consultório no mesmo dia, sem tempo de deslocamento na agenda.",
        relief:
          "Um intervalo depois de cada atendimento domiciliar reserva o deslocamento, e o próximo horário respeita.",
      },
    ],
  },
  story: {
    title: "A agenda da fisioterapia com o link",
    rows: [
      {
        kicker: "Onde o paciente procura",
        title: "Quem procura fisioterapia perto encontra o seu link",
        text: "Quem procura fisioterapia perto encontra o seu perfil e marca pelo link, sem ligar nem esperar resposta.",
        visual: "bio",
      },
      {
        kicker: "Uma agenda por fisioterapeuta",
        title: "O paciente escolhe com quem e quando",
        text: "Cada profissional tem os próprios horários e atendimentos, e recebe o aviso dos próprios agendamentos.",
        visual: "notification",
      },
      {
        kicker: "Antes da sessão",
        title: "O paciente lembrado da sessão um dia antes",
        text: "Quem deixou o e-mail recebe o lembrete um dia antes. Se não puder vir, remarca sozinho e o horário volta para a agenda.",
        visual: "reminder",
      },
      {
        kicker: "Sessão desmarcada",
        title: "O horário vai para quem estava esperando",
        text: "Quem entrou na lista de espera daquele dia recebe um e-mail, e o primeiro que confirmar fica com o horário.",
        visual: "agenda",
      },
    ],
  },
  compare: {
    title: "Agenda da clínica por telefone ou pelo link?",
    before: "Por telefone e mensagem",
    after: "Com o link do MeetChat",
    rows: [
      {
        label: "Pedido de horário",
        before: "Você atende no intervalo",
        after: "O paciente marca sozinho",
      },
      {
        label: "Avaliação e sessão",
        before: "Durações na cabeça de quem marca",
        after: "Cada atendimento com a sua duração",
      },
      {
        label: "Pacote de 10 sessões",
        before: "Controle no papel",
        after: "Saldo de cada paciente no painel",
      },
      {
        label: "Paciente que esquece",
        before: "Horário vazio",
        after: "Lembrete por e-mail com botão de remarcar",
      },
    ],
  },
  objections: {
    title: "O que todo fisioterapeuta pergunta",
    items: [
      {
        question: "Muitos pacientes são mais velhos.",
        answer:
          "O link abre como uma conversa, sem instalar nada nem criar conta. E você continua marcando por eles no painel quando preferirem ligar.",
      },
      {
        question: "Vendo pacote de sessões.",
        answer:
          "Você cria o pacote com o número de sessões e o preço; o saldo de cada paciente fica no painel.",
      },
      {
        question: "Atendo em domicílio também.",
        answer:
          "Crie o atendimento domiciliar com a duração e o intervalo para o deslocamento, e ele convive com os do consultório.",
      },
      PRICE_OBJECTION,
    ],
  },
  closing: {
    title: "A agenda da sua fisioterapia no ar hoje.",
    subtitle: "Cole o link e deixe o paciente marcar a próxima sessão sem interromper você.",
    cta: "Criar meu link de fisioterapia",
  },
  mock: {
    business: "Clínica Movimento",
    services: [
      { name: "Sessão de fisioterapia", minutes: 50 },
      { name: "Avaliação", minutes: 60 },
      { name: "RPG", minutes: 50 },
    ],
    professionals: ["Rafa", "Bruna"],
    customer: "João",
    handle: "clinicamovimento",
    slug: "clinica-movimento",
    bio: "Fisioterapia e RPG com hora marcada.",
  },
  ymyl: { notice: HEALTH_NOTICE, review: "pendente" },
};
