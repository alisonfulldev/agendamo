import { getBrand } from "@/brands";
import { PLAN_NAME, TRIAL_DAYS } from "@/lib/plans";

/**
 * Copy of the redesigned landing pages (docs/design/direction.md): the home and each niche hub
 * that has its own copy here. One main pain per page, in the words of who feels it. Facts only:
 * reminders go by e-mail, nothing is sent through WhatsApp, "grátis" always with its limit (D1).
 */
export type MockVisual = "bio" | "notification" | "reminder" | "agenda";

export interface PhoneMock {
  business: string;
  services: { name: string; minutes: number }[];
  /** Example professionals; one name = the chat skips the question, like the product. */
  professionals: string[];
  /** First name in the examples (notification, reminder). */
  customer: string;
  /** Instagram-like handle of the bio mock. */
  handle: string;
  slug: string;
  bio: string;
}

export interface LandingCopy {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: string;
    /** D1: the free plan's limit, next to the promise. */
    note: string;
    trust: string[];
  };
  /** Home: one door per most common pain, each to its guide. */
  doors?: { title: string; items: { pain: string; answer: string; href: string; label: string }[] };
  /** Niche: scenes of the niche's pains and what changes. */
  pains?: { title: string; items: { scene: string; relief: string }[] };
  story: {
    title: string;
    rows: { kicker: string; title: string; text: string; visual: MockVisual }[];
  };
  compare: {
    title: string;
    before: string;
    after: string;
    rows: { label: string; before: string; after: string }[];
  };
  objections: { title: string; items: { question: string; answer: string; href?: string }[] };
  closing: { title: string; subtitle: string; cta: string };
  mock: PhoneMock;
}

const NOTE =
  "Comece grátis, sem cartão. Grátis no modo WhatsApp; lembretes automáticos e agenda completa no plano pago.";
const TRUST = ["O cliente não baixa app", "Pronto em 1 minuto", "Sem cartão para começar"];

const PRICE_OBJECTION = {
  question: "Quanto custa?",
  answer: `Criar a conta e deixar o link no ar é grátis, no modo WhatsApp. Lembretes automáticos e a agenda completa são do plano ${PLAN_NAME}, com ${TRIAL_DAYS} dias para testar sem cartão.`,
  href: "/precos",
};

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

const barber = getBrand("barber")!;

const BARBER_LANDING: LandingCopy = {
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

/** Niches with the redesigned hub (brand key). The others keep the previous template. */
export const NICHE_LANDINGS: Record<string, LandingCopy> = {
  barber: BARBER_LANDING,
};
