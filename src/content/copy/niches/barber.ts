import { getBrand } from "@/brands";

import { NOTE, PRICE_OBJECTION, TRUST } from "../shared";
import type { LandingCopy } from "../types";

const barber = getBrand("barber")!;

export const BARBER_LANDING: LandingCopy = {
  hero: {
    eyebrow: "Agenda online para barbearia",
    title: "Corte e barba marcados sem você largar a máquina.",
    subtitle:
      "Coloque o link no Instagram e no WhatsApp da barbearia. O cliente escolhe o serviço, o barbeiro e um horário livre, e o encaixe respeita o tempo de cada corte.",
    cta: "Criar meu link de barbearia",
    note: NOTE,
    trust: TRUST,
  },
  pains: {
    title: "Se a sua barbearia é assim, o link resolve",
    items: [
      {
        scene:
          "O celular vibra no meio do degradê: “tem horário hoje?”. Você para, responde, perde o ritmo, e o cliente da cadeira espera.",
        relief: "Com o link, quem pergunta já marca sozinho. Você vê o aviso no fim do corte.",
      },
      {
        scene:
          "Um pezinho de 15 minutos entra onde cabia um corte e barba, e o resto da tarde atrasa.",
        relief:
          "Cada serviço tem a duração que você definir; o chat só oferece horário onde ele cabe inteiro.",
      },
      {
        scene: "Sábado cheio no papel e cadeira vazia na hora, porque o cliente esqueceu.",
        relief:
          "Lembrete por e-mail no dia anterior, com botão para remarcar, e a vaga vai para quem está na lista de espera.",
      },
    ],
  },
  story: {
    title: "A barbearia com o link, do feed à cadeira",
    rows: [
      {
        kicker: "Do feed ao horário",
        title: "Viu o corte no Instagram, toca no link e marca",
        text: "Sem mandar direct e sem esperar resposta. O mesmo link vai no perfil do WhatsApp Business da barbearia e no Google.",
        visual: "bio",
      },
      {
        kicker: "Um barbeiro, uma agenda",
        title: "O cliente escolhe com quem quer cortar",
        text: "Ou pega o primeiro horário livre. Cada barbeiro tem horários, pausas e serviços próprios, e recebe o aviso dos próprios horários.",
        visual: "notification",
      },
      {
        kicker: "Para a cadeira não ficar vazia",
        title: "O lembrete chega na véspera, com “Preciso remarcar”",
        text: "Quem deixou o e-mail recebe o lembrete um dia antes. Quem não pode vir libera o horário a tempo de outro cliente marcar.",
        visual: "reminder",
      },
      {
        kicker: "Desmarcou?",
        title: "A vaga volta para quem queria encaixe",
        text: "O horário cancelado reaparece no link na hora, e quem entrou na lista de espera daquele dia recebe um e-mail para confirmar.",
        visual: "agenda",
      },
    ],
  },
  compare: {
    title: "Agenda no WhatsApp ou link de agendamento?",
    before: "Marcando pelo WhatsApp",
    after: "Com o link do MeetChat",
    rows: [
      {
        label: "“Tem horário hoje?”",
        before: "Você responde com a máquina na mão",
        after: "O cliente vê os horários livres e marca",
      },
      {
        label: "Corte + barba de 1 hora",
        before: "Você conta os minutos de cabeça",
        after: "O chat só oferece onde a hora cabe inteira",
      },
      {
        label: "Mais de um barbeiro",
        before: "Um caderno para todos, e conflito",
        after: "Uma agenda por barbeiro",
      },
      {
        label: "Cliente que esqueceu",
        before: "Cadeira vazia no sábado",
        after: "Lembrete por e-mail com botão de remarcar",
      },
    ],
  },
  objections: {
    title: "O que todo barbeiro pergunta",
    items: [
      {
        question: "Meus clientes não usam aplicativo.",
        answer:
          "Nem precisam. O link abre no navegador do celular como uma conversa; o cliente informa nome e WhatsApp e escolhe o horário.",
      },
      {
        question: "E quem chega sem marcar?",
        answer:
          "Você continua atendendo por ordem de chegada. Lance o atendimento na agenda pelo painel, e aquele horário deixa de aparecer no link.",
      },
      {
        question: "Dá para vender combo de corte e barba?",
        answer:
          "Dá. Você cria combos com preço próprio e pacotes de cortes, e o cliente escolhe direto no chat.",
      },
      PRICE_OBJECTION,
    ],
  },
  closing: {
    title: "Sua agenda de barbearia no ar hoje.",
    subtitle:
      "Cole o link no Instagram e no WhatsApp e deixe o próximo corte ser marcado sem você parar.",
    cta: "Criar meu link de barbearia",
  },
  mock: {
    business: "Barbearia do Zé",
    services: barber.suggestedServices.slice(0, 3).map((s) => ({
      name: s.name,
      minutes: s.durationMinutes,
    })),
    professionals: ["Zé", "Léo"],
    customer: "Rafael",
    handle: "barbeariadoze",
    slug: "barbearia-do-ze",
    bio: "Corte, barba e sobrancelha com hora marcada.",
  },
};
