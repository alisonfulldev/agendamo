import type { FaqItem, GuideSection } from "./niche-guides/types";

/** Free tools of the MeetChat site (/ferramentas/<slug>): indexable, each with a CTA. */
export interface ToolPage {
  slug: "calculadora-de-faltas" | "mensagens-whatsapp" | "bio-instagram";
  label: string;
  title: string;
  description: string;
  h1: string;
  /** Direct answer above the tool. */
  answer: string;
  /** How to use and context, below the tool. */
  sections: GuideSection[];
  faq: FaqItem[];
  updatedAt: string;
}

export const TOOLS: readonly ToolPage[] = [
  {
    slug: "calculadora-de-faltas",
    label: "Calculadora de prejuízo com faltas",
    title: "Calculadora de prejuízo com faltas de clientes | MeetChat",
    description:
      "Calcule quanto as faltas de clientes custam por mês e por ano com os seus números: atendimentos, taxa de faltas e ticket médio. Grátis e sem cadastro.",
    h1: "Calculadora de prejuízo com faltas",
    answer:
      "Informe quantos atendimentos você marca por mês, quantos por cento faltam e o valor médio de cada atendimento. A calculadora mostra quanto deixa de entrar por mês e por ano e quanto voltaria se uma parte das faltas fosse evitada. É uma estimativa com os seus números, não uma promessa.",
    sections: [
      {
        title: "Como chegar nos seus números",
        list: [
          "Atendimentos por mês: conte os horários marcados nas últimas quatro semanas.",
          "Taxa de faltas: dos horários marcados, quantos não apareceram nem avisaram.",
          "Ticket médio: o que entrou no mês dividido pelo número de atendimentos realizados.",
        ],
      },
      {
        title: "Sobre a parte que daria para evitar",
        paragraphs: [
          "O percentual de faltas evitadas é uma suposição sua. Ele depende do seu público, do lembrete, da facilidade de remarcar e da sua regra de faltas. Experimente valores diferentes para ver o tamanho do impacto.",
        ],
      },
    ],
    faq: [
      {
        question: "A calculadora guarda os meus números?",
        answer: "Não. O cálculo acontece no seu navegador, e nada é enviado ou salvo.",
      },
      {
        question: "Por que considerar o ano inteiro?",
        answer:
          "Uma perda pequena por mês parece aceitável; somada em doze meses, ajuda a decidir quanto tempo e dinheiro vale investir para reduzir as faltas.",
      },
    ],
    updatedAt: "2026-10-16",
  },
  {
    slug: "mensagens-whatsapp",
    label: "Mensagens de confirmação para WhatsApp",
    title: "Mensagens de confirmação e lembrete para WhatsApp | MeetChat",
    description:
      "Gere mensagens prontas de confirmação, lembrete e reagendamento para enviar pelo WhatsApp, no vocabulário da sua área. Copie e cole. Grátis.",
    h1: "Gerador de mensagens de confirmação e lembrete para WhatsApp",
    answer:
      "Escolha a sua área e o tipo de mensagem, preencha nome, serviço, dia e hora, e copie o texto pronto para enviar pelo WhatsApp. As mensagens usam o vocabulário da sua área (horário, sessão, aula) e, se você tiver um link de agendamento, já incluem o caminho para o cliente remarcar sozinho.",
    sections: [
      {
        title: "Quando usar cada mensagem",
        list: [
          "Confirmação: logo depois de marcar, para o cliente ter tudo por escrito.",
          "Lembrete: na véspera, pedindo para confirmar presença.",
          "Reagendamento: quando você precisa mudar um horário já marcado.",
        ],
      },
      {
        title: "Para não precisar mandar uma por uma",
        paragraphs: [
          "Com o MeetChat, a confirmação e o lembrete vão automaticamente por e-mail para quem agendou pelo seu link e informou o e-mail, com botões para remarcar ou cancelar. As mensagens daqui servem para quem marca por outros caminhos.",
        ],
      },
    ],
    faq: [
      {
        question: "Essas mensagens são enviadas automaticamente?",
        answer:
          "Não. Você copia e envia pelo seu WhatsApp. O MeetChat não envia mensagens por WhatsApp.",
      },
      {
        question: "Posso mudar o texto?",
        answer: "Pode. Copie, cole no WhatsApp e ajuste o que quiser antes de enviar.",
      },
    ],
    updatedAt: "2026-10-16",
  },
  {
    slug: "bio-instagram",
    label: "Gerador de bio para Instagram",
    title: "Gerador de bio para Instagram com link de agendamento | MeetChat",
    description:
      "Crie opções de bio para o Instagram do seu negócio, com até 150 caracteres e uma chamada para agendar pelo link. Escolha, copie e cole. Grátis.",
    h1: "Gerador de bio para Instagram com chamada para agendar",
    answer:
      "Escreva a sua área, o que você faz de melhor e, se quiser, o bairro ou a cidade. O gerador monta opções de bio com até 150 caracteres, o limite do Instagram, terminando com uma chamada para agendar pelo link.",
    sections: [
      {
        title: "O que uma boa bio de negócio responde",
        ordered: true,
        list: [
          "O que você faz, nas palavras que o cliente usa para procurar.",
          "O que te diferencia (uma especialidade, um tipo de atendimento).",
          "Onde você atende, se o atendimento é presencial.",
          "O que fazer agora: agendar pelo link.",
        ],
      },
      {
        title: "Depois de colar a bio",
        paragraphs: [
          "Coloque o seu link de agendamento como primeiro link do perfil. Assim a chamada “agende pelo link” leva direto para os horários livres.",
        ],
      },
    ],
    faq: [
      {
        question: "Posso usar emojis?",
        answer:
          "As opções já trazem alguns. Se preferir uma bio mais sóbria, apague-os depois de copiar.",
      },
      {
        question: "Preciso ter conta no MeetChat?",
        answer:
          "Não para usar o gerador. Para ter o link de agendamento que a bio menciona, a conta é grátis e sem cartão.",
      },
    ],
    updatedAt: "2026-10-16",
  },
];

export function getTool(slug: string): ToolPage | null {
  return TOOLS.find((t) => t.slug === slug) ?? null;
}

const toolLink = (slug: ToolPage["slug"]) => {
  const tool = getTool(slug)!;
  return { label: tool.label, href: `/ferramentas/${tool.slug}` };
};

/** Tools linked from the cross-niche guide with the same intent. */
export const TOOL_LINKS_BY_INTENT: Record<string, { label: string; href: string }[]> = {
  "reduzir-faltas": [toolLink("calculadora-de-faltas"), toolLink("mensagens-whatsapp")],
  "lembrete-automatico": [toolLink("mensagens-whatsapp")],
  "pelo-whatsapp": [toolLink("mensagens-whatsapp")],
  "link-na-bio": [toolLink("bio-instagram")],
};

export const TOOLS_INDEX = {
  title: "Ferramentas grátis para quem atende com hora marcada | MeetChat",
  description:
    "Calculadora de prejuízo com faltas, gerador de mensagens para WhatsApp e gerador de bio para Instagram. Grátis, sem cadastro.",
  h1: "Ferramentas grátis",
  intro:
    "Ferramentas simples para quem trabalha com hora marcada. Funcionam no navegador, sem cadastro.",
  updatedAt: "2026-10-16",
};
