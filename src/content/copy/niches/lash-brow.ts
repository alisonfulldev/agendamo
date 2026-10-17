import { NOTE, PRICE_OBJECTION, TRUST } from "../shared";
import type { LandingCopy } from "../types";

/** Lash designer e designer de sobrancelha: procedimentos longos, manutenção, foco total. */
export const lashBrowLanding: LandingCopy = {
  hero: {
    eyebrow: "Agenda online para cílios e sobrancelha",
    title: "Cílios e sobrancelha marcados enquanto você aplica.",
    subtitle:
      "Coloque o link na bio e no WhatsApp. A cliente escolhe extensão, manutenção ou design e um horário em que o procedimento cabe inteiro, sem você tirar os olhos do trabalho.",
    cta: "Criar meu link de lash e brow",
    note: NOTE,
    trust: TRUST,
  },
  pains: {
    title: "Se o seu estúdio é assim, o link resolve",
    items: [
      {
        scene:
          "Duas horas de extensão, a cliente de olhos fechados e o celular vibrando do lado com pedido de horário.",
        relief: "Com o link, quem pergunta marca sozinha. Você responde só o que importa, depois.",
      },
      {
        scene: "A cliente sai linda e só lembra da manutenção quando já passou do ponto.",
        relief:
          "No fim do atendimento, mande o link: ela marca a manutenção na hora, e o lembrete chega na véspera.",
      },
      {
        scene: "Falta numa extensão: duas horas paradas que ninguém mais consegue usar.",
        relief:
          "Sinal pelo Pix nos procedimentos longos, pago direto na sua chave, e lista de espera para o horário liberado.",
      },
    ],
  },
  story: {
    title: "O estúdio com o link, do feed à maca",
    rows: [
      {
        kicker: "Do resultado ao horário",
        title: "Viu o volume no feed, toca no link e marca",
        text: "Sem direct. O mesmo link fica no perfil do WhatsApp Business e no Google, para quem procura lash designer perto.",
        visual: "bio",
      },
      {
        kicker: "Foco no procedimento",
        title: "Você termina e o próximo horário já está marcado",
        text: "O chat mostra só os horários em que extensão, manutenção ou design cabem inteiros. O aviso chega no seu celular.",
        visual: "notification",
      },
      {
        kicker: "Manutenção no prazo",
        title: "A manutenção lembrada na véspera",
        text: "Quem deixou o e-mail recebe o lembrete um dia antes. Se não puder vir, remarca sozinha, sem mensagem.",
        visual: "reminder",
      },
      {
        kicker: "Desmarcou?",
        title: "A vaga vai para quem estava esperando",
        text: "O horário cancelado volta para a agenda, e quem entrou na lista de espera daquele dia recebe um e-mail para confirmar.",
        visual: "agenda",
      },
    ],
  },
  compare: {
    title: "Agenda de lash no WhatsApp ou no link?",
    before: "Pelo WhatsApp",
    after: "Com o link do MeetChat",
    rows: [
      {
        label: "Pedido de horário durante a aplicação",
        before: "Você interrompe ou a cliente espera",
        after: "Ela marca sozinha",
      },
      {
        label: "Extensão de 2 horas",
        before: "Encaixe calculado de cabeça",
        after: "O procedimento ocupa o tempo que leva",
      },
      {
        label: "Manutenção",
        before: "Depende da cliente lembrar",
        after: "Link no fim do atendimento e lembrete na véspera",
      },
      {
        label: "Falta em procedimento longo",
        before: "Duas horas perdidas",
        after: "Sinal pelo Pix e lista de espera",
      },
    ],
  },
  objections: {
    title: "O que toda lash designer pergunta",
    items: [
      {
        question: "Faço cílios e sobrancelha. Cabe tudo?",
        answer:
          "Cabe. Cada procedimento tem a duração que você definir, e a cliente escolhe direto no chat.",
      },
      {
        question: "Posso exigir sinal na extensão?",
        answer:
          "Pode. O sinal é configurado por serviço; a cliente aceita a política e paga pelo Pix direto na sua chave.",
      },
      {
        question: "Minhas clientes vão estranhar?",
        answer:
          "O link abre no navegador do celular como uma conversa, sem instalar nada. Ela informa nome e WhatsApp e escolhe o horário.",
      },
      PRICE_OBJECTION,
    ],
  },
  closing: {
    title: "Seu estúdio no link da bio hoje.",
    subtitle: "Cole o link e deixe a próxima manutenção ser marcada antes de a cliente sair.",
    cta: "Criar meu link de lash e brow",
  },
  mock: {
    business: "Studio Íris",
    services: [
      { name: "Extensão de cílios", minutes: 120 },
      { name: "Manutenção de cílios", minutes: 90 },
      { name: "Design de sobrancelha", minutes: 30 },
    ],
    professionals: ["Íris"],
    customer: "Paula",
    handle: "studioiris",
    slug: "studio-iris",
    bio: "Extensão de cílios e design de sobrancelha com hora marcada.",
  },
};
