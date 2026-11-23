import { INCOME_GOAL_NOTE, PARTNER_NUMBERS as N } from "@/content/partners";
import { TRIAL_DAYS } from "@/lib/plans";

import type { FaqItem, GuideSection } from "./niche-guides/types";

/**
 * Income pages (/renda-extra and /renda-extra/<slug>, 2026-11-23): long-tail searches about extra
 * income and being a partner, all leading to the partner program (/parceiros). Every amount comes
 * from src/content/partners.ts; "até R$ 3 mil" is always shown with the math (INCOME_GOAL_NOTE).
 */
export interface IncomePage {
  slug: string;
  /** Short name (breadcrumb, links). */
  label: string;
  title: string;
  description: string;
  h1: string;
  /** Direct answer in the first lines. */
  answer: string;
  sections: GuideSection[];
  faq: FaqItem[];
  /** Other income pages to link (slugs). */
  related: string[];
  updatedAt: string;
}

const UPDATED = "2026-11-23";
const PER_CLIENT = `${N.first} no 1º pagamento e ${N.recurring} por mês depois, no plano ${N.planName}`;

export const INCOME_INDEX = {
  title: `Renda extra: fature até ${N.goal} por mês indicando agenda online`,
  description: `Ganhe renda extra indicando o MeetChat para salões, barbearias e clínicas: 100% do 1º pagamento e ${N.percent}% todo mês por cliente. Sem investimento, com Pix.`,
  h1: `Renda extra: fature até ${N.goal} por mês indicando o MeetChat`,
  intro: `O programa de parceiros do MeetChat paga comissão recorrente para quem indica a agenda online a negócios com hora marcada. Cada negócio que assina pelo seu link rende ${PER_CLIENT}, enquanto continuar assinando. Dá para chegar a ${INCOME_GOAL_NOTE}.`,
  updatedAt: UPDATED,
} as const;

export const INCOME_PAGES: readonly IncomePage[] = [
  {
    slug: "pelo-celular",
    label: "Renda extra pelo celular",
    title: "Renda extra pelo celular: indique e ganhe todo mês | MeetChat",
    description: `Como ganhar renda extra só com o celular indicando uma agenda online para negócios locais. Comissão de ${N.first} por cliente e ${N.recurring} todo mês, paga por Pix.`,
    h1: "Renda extra pelo celular, indicando o MeetChat",
    answer: `Dá para ganhar renda extra usando só o celular: você se cadastra como parceiro do MeetChat, recebe um link e manda esse link pelo WhatsApp ou pelo Instagram para negócios que agendam clientes. Cada negócio que assinar rende ${PER_CLIENT}.`,
    sections: [
      {
        title: "Por que o celular basta",
        paragraphs: [
          "O MeetChat é usado no navegador do celular: o dono do negócio cria a conta numa conversa guiada, sem instalar nada e sem computador. Você também acompanha cliques, clientes e comissões na área do parceiro, pelo celular.",
          "Você não precisa abrir loja, estoque ou entregar produto. Seu trabalho é mostrar o link a quem precisa de agenda.",
        ],
      },
      {
        title: "Uma rotina simples de 20 minutos por dia",
        ordered: true,
        list: [
          "Escolha 5 negócios do seu bairro ou da sua lista de contatos que marcam horário pelo WhatsApp.",
          "Mande uma mensagem curta explicando que existe um link onde o cliente marca sozinho.",
          "Envie o seu link de parceiro para quem demonstrar interesse.",
          "Volte a falar com quem não respondeu depois de 3 ou 4 dias, sem insistir demais.",
        ],
      },
      {
        title: "Onde encontrar negócios pelo celular",
        list: [
          "Google Maps: busque “salão”, “barbearia” ou “estética” perto de você e veja quem pede para agendar pelo WhatsApp.",
          "Instagram: perfis com “agende pelo direct” na bio são os que mais ganham com um link de agendamento.",
          "Seus próprios contatos: a manicure, o barbeiro e a nutricionista que você já conhece.",
        ],
      },
    ],
    faq: [
      {
        question: "Preciso de computador para ser parceiro?",
        answer: "Não. O cadastro, o link e o acompanhamento das comissões funcionam no celular.",
      },
      {
        question: "Como recebo o dinheiro?",
        answer: `Por Pix, na chave que você cadastrar, ${N.holdDays} dias depois de cada pagamento do cliente, a partir de ${N.minPayout} liberados.`,
      },
      {
        question: "Posso divulgar nos meus stories?",
        answer:
          "Pode, desde que você fale em seu nome e não se passe pelo perfil oficial do MeetChat.",
      },
    ],
    related: ["sem-investimento", "como-indicar-agenda-online", "para-maes"],
    updatedAt: UPDATED,
  },
  {
    slug: "sem-investimento",
    label: "Renda extra sem investimento",
    title: "Renda extra sem investimento: comissão recorrente | MeetChat",
    description: `Renda extra sem pagar nada para começar: indique o MeetChat e ganhe ${N.first} por negócio que assinar e ${N.percent}% de cada mensalidade seguinte. Cadastro grátis.`,
    h1: "Renda extra sem investimento: como funciona o programa de parceiros",
    answer: `O programa de parceiros do MeetChat não cobra taxa de entrada, kit, curso ou mensalidade. Você se cadastra de graça, indica a agenda online para negócios e ganha ${PER_CLIENT}. O único investimento é o seu tempo.`,
    sections: [
      {
        title: "Como identificar uma renda extra séria",
        list: [
          "Não pede pagamento para você começar a trabalhar.",
          "O dinheiro vem de um produto que alguém usa, não da entrada de novas pessoas.",
          "As regras de comissão estão escritas e você acompanha cada valor.",
          "Não promete ganho garantido; mostra a conta de como chegar lá.",
        ],
      },
      {
        title: "De onde vem o dinheiro da sua comissão",
        paragraphs: [
          "A comissão sai da mensalidade que o negócio paga pelo MeetChat. Se o negócio usa e paga, você recebe; se ele cancela, a comissão para. Por isso não existe ganho por recrutar outros parceiros: só conta quem assina o produto.",
          `No 1º pagamento, você fica com 100% do valor líquido. Nos meses seguintes, com ${N.percent}%. Isso vale para todos os planos: no ${N.sitePlanName}, por exemplo, são ${N.firstSite} e depois ${N.recurringSite} por mês.`,
        ],
      },
      {
        title: "Quanto tempo leva para ver o primeiro dinheiro",
        paragraphs: [
          `O negócio indicado começa com ${TRIAL_DAYS} dias de teste grátis. Quando ele paga, a comissão aparece no seu painel e é liberada ${N.holdDays} dias depois, o prazo para estornos. Na prática, o primeiro Pix costuma sair entre 1 e 2 meses depois da primeira indicação que vira assinatura.`,
        ],
      },
    ],
    faq: [
      {
        question: "É pirâmide ou marketing multinível?",
        answer:
          "Não. Você ganha só pelos negócios que assinam o MeetChat pelo seu link. Indicar outros parceiros não rende nada.",
      },
      {
        question: "Tenho que comprar o MeetChat para indicar?",
        answer: "Não. Você não precisa ser cliente para ser parceiro.",
      },
      {
        question: "Existe meta mínima?",
        answer: "Não há meta. Você indica no seu ritmo e recebe por cada negócio que assinar.",
      },
    ],
    related: ["sem-cnpj", "comissao-recorrente", "pelo-celular"],
    updatedAt: UPDATED,
  },
  {
    slug: "sem-cnpj",
    label: "Renda extra sem CNPJ",
    title: "Renda extra sem CNPJ: seja parceiro só com CPF | MeetChat",
    description:
      "Seja parceiro do MeetChat só com CPF e chave Pix, sem abrir empresa. Veja como funciona a comissão, o pagamento por Pix e quando vale a pena abrir um MEI.",
    h1: "Renda extra sem CNPJ: dá para ser parceiro só com CPF",
    answer:
      "Sim. Para ser parceiro do MeetChat basta ter 18 anos ou mais, CPF e uma chave Pix no seu nome. Você não precisa abrir empresa para começar; quando a renda crescer, abrir um MEI costuma ser o caminho mais simples para organizar os impostos.",
    sections: [
      {
        title: "O que você precisa para se cadastrar",
        list: [
          "Nome completo e e-mail (você confirma com um código de 4 números).",
          "WhatsApp para contato.",
          "CPF, usado para identificar você e evitar comissão sobre a própria conta.",
          "Chave Pix no seu nome, onde as comissões são pagas.",
        ],
      },
      {
        title: "E os impostos?",
        paragraphs: [
          "O que você recebe como parceiro é renda sua, e você é responsável por declará-la. Enquanto os valores são pequenos e esporádicos, muita gente apenas declara no imposto de renda anual.",
          "Quando a comissão vira uma renda mensal constante, vale conversar com um contador. O MEI é uma opção comum para formalizar uma renda pequena com um valor fixo por mês; o contador confirma se a sua atividade se encaixa.",
        ],
      },
      {
        title: "Seus dados ficam protegidos",
        paragraphs: [
          "O CPF e a chave Pix são guardados criptografados e só aparecem para a equipe do MeetChat na hora de fazer o pagamento. Os negócios que você indica não veem seus dados.",
        ],
      },
    ],
    faq: [
      {
        question: "Posso usar a chave Pix de outra pessoa?",
        answer: "Não. A chave Pix precisa estar no seu nome, o mesmo do CPF cadastrado.",
      },
      {
        question: "Menor de idade pode ser parceiro?",
        answer: "Não. É preciso ter 18 anos ou mais.",
      },
      {
        question: "Se eu abrir um MEI depois, mudo o cadastro?",
        answer:
          "Fale com o suporte por e-mail para atualizar os dados de pagamento quando abrir a empresa.",
      },
    ],
    related: ["sem-investimento", "para-estudante", "comissao-recorrente"],
    updatedAt: UPDATED,
  },
  {
    slug: "comissao-recorrente",
    label: "Afiliado com comissão recorrente",
    title: "Programa de afiliados com comissão recorrente | MeetChat",
    description: `Afiliado com comissão recorrente: ganhe 100% do 1º pagamento e ${N.percent}% de todas as mensalidades seguintes de cada negócio que assinar o MeetChat pelo seu link.`,
    h1: "Programa de afiliados com comissão recorrente",
    answer: `Comissão recorrente é quando você recebe não só pela venda, mas por todo mês em que o cliente continua pagando. No MeetChat, o parceiro ganha 100% do 1º pagamento e ${N.percent}% de cada mensalidade seguinte, sem prazo para acabar. É assim que dá para chegar a ${INCOME_GOAL_NOTE}.`,
    sections: [
      {
        title: "Recorrente x comissão única",
        paragraphs: [
          "Na comissão única, você vende hoje e precisa vender de novo amanhã para ganhar outra vez. Na recorrente, cada cliente que fica soma uma parcela à sua renda do mês seguinte, como uma carteira que cresce.",
          "O lado bom de uma agenda online é que o negócio passa a depender dela no dia a dia: clientes marcam pelo link, recebem lembretes e pagam sinal. Ferramenta usada todo dia é ferramenta que costuma continuar assinada.",
        ],
      },
      {
        title: "A conta da carteira",
        list: [
          `10 negócios ativos no plano ${N.planName}: cerca de ${N.recurring} x 10 por mês, além dos 1ºs pagamentos.`,
          `100 negócios ativos: dez vezes isso, todo mês.`,
          `Cerca de ${N.goalClients} negócios ativos: perto de ${N.goal} por mês só em mensalidades.`,
          `No plano ${N.sitePlanName}, que é mais caro, a mesma renda pede cerca de ${N.goalClientsSite} negócios.`,
        ],
      },
      {
        title: "O que faz o cliente continuar (e você continuar ganhando)",
        list: [
          "Indique para quem realmente agenda horários: salões, barbearias, clínicas, consultórios.",
          "Ajude o negócio a colocar o link na bio e no WhatsApp logo no primeiro dia.",
          "Mostre o sinal pelo Pix para quem sofre com faltas: é o recurso que mais prende.",
        ],
      },
    ],
    faq: [
      {
        question: "A comissão recorrente tem prazo?",
        answer: "Não. Você recebe enquanto o negócio indicado continuar pagando.",
      },
      {
        question: "E no plano anual?",
        answer:
          "O 1º pagamento rende o valor de uma mensalidade, e os pagamentos seguintes rendem a porcentagem normal.",
      },
      {
        question: "A comissão é sobre o valor cheio?",
        answer:
          "É sobre o valor líquido, depois da taxa da cobrança (Pix, boleto ou cartão), por isso fica um pouco abaixo do preço do plano.",
      },
    ],
    related: ["afiliado-de-software", "sem-investimento", "para-vendedores"],
    updatedAt: UPDATED,
  },
  {
    slug: "afiliado-de-software",
    label: "Afiliado de software",
    title: "Como ser afiliado de software (SaaS) e ganhar todo mês | MeetChat",
    description:
      "Afiliado de software ganha por assinatura, não por produto entregue. Veja como funciona ser parceiro de um SaaS brasileiro de agenda online e receber comissão por Pix.",
    h1: "Como ser afiliado de software e ganhar todo mês",
    answer: `Ser afiliado de software (SaaS) é indicar um sistema que as empresas pagam por mês e ganhar uma parte dessas mensalidades. No MeetChat, um sistema brasileiro de agenda online, o afiliado ganha ${PER_CLIENT}, com pagamento por Pix.`,
    sections: [
      {
        title: "Por que software é bom para afiliado",
        list: [
          "Não tem frete, estoque nem troca: o produto é um link.",
          "O cliente testa antes de pagar, então você não precisa convencer no escuro.",
          "Mensalidade gera comissão recorrente, ao contrário de um produto vendido uma vez.",
        ],
      },
      {
        title: "O que o MeetChat faz, em uma frase",
        paragraphs: [
          "Dá a negócios com hora marcada um link de agendamento: o cliente escolhe serviço, dia e horário livre e marca sozinho, recebe lembrete e pode pagar sinal pelo Pix. Para o dono, acaba a troca infinita de mensagens perguntando “tem horário?”.",
          `Todo cadastro começa com ${TRIAL_DAYS} dias grátis, sem cartão. Você indica, o negócio testa e decide.`,
        ],
      },
      {
        title: "Como começar como afiliado",
        ordered: true,
        list: [
          "Cadastre-se em /parceiros e pegue o seu link.",
          "Crie uma conta de teste para conhecer o sistema por dentro (ela não gera comissão para você).",
          "Escolha um nicho que você conhece e use o link da página desse nicho.",
          "Acompanhe na área do parceiro quem criou conta e quem assinou.",
        ],
      },
    ],
    faq: [
      {
        question: "O afiliado precisa dar suporte ao cliente?",
        answer:
          "Não. O suporte é do MeetChat. Você só precisa indicar e, se quiser, ajudar no começo.",
      },
      {
        question: "Tem link diferente por nicho?",
        answer:
          "Tem. Na área do parceiro você copia o link geral e links das páginas de beleza, barbearia, psicologia e estética.",
      },
      {
        question: "Posso anunciar no Google ou na Meta?",
        answer:
          "Pode anunciar em seu nome, sem usar a marca como se fosse o perfil oficial e sem prometer o que o sistema não faz.",
      },
    ],
    related: ["comissao-recorrente", "para-social-media", "como-indicar-agenda-online"],
    updatedAt: UPDATED,
  },
  {
    slug: "para-manicure",
    label: "Renda extra para manicure",
    title: "Renda extra para manicure: indique agenda online | MeetChat",
    description: `Manicure pode ganhar renda extra indicando a agenda online que ela mesma usa para colegas, salões e esmalterias: ${N.first} por indicação e ${N.recurring} todo mês.`,
    h1: "Renda extra para manicure e nail designer",
    answer: `Manicure conhece outras manicures, salões e esmalterias que perdem tempo marcando horário pelo WhatsApp. Indicando o MeetChat para essas colegas, você ganha ${PER_CLIENT}, sem deixar de atender.`,
    sections: [
      {
        title: "Por que a manicure é a parceira ideal",
        paragraphs: [
          "Quem faz unha sabe o quanto o celular interrompe o atendimento: mão ocupada, cliente perguntando horário, mensagem acumulando. Você fala a língua das colegas porque vive o mesmo problema.",
          "Além disso, grupos de manicures, cursos de alongamento e fornecedoras de esmalte reúnem dezenas de profissionais que podem precisar da mesma solução.",
        ],
      },
      {
        title: "Como indicar sem parecer vendedora",
        list: [
          "Use o MeetChat no seu próprio atendimento e conte a sua experiência.",
          "Mostre o seu link de agendamento funcionando para a colega ver como o cliente marca.",
          "Mande o seu link de parceira só para quem disser que quer testar.",
        ],
      },
      {
        title: "Quem você pode indicar",
        list: [
          "Colegas manicures e nail designers que atendem em casa ou em estúdio.",
          "Esmalterias e salões do seu bairro.",
          "Alunas de cursos de unha que estão começando a atender.",
          "Profissionais de sobrancelha e cílios que dividem espaço com você.",
        ],
      },
    ],
    faq: [
      {
        question: "Preciso usar o MeetChat para indicar?",
        answer:
          "Não é obrigatório, mas quem usa costuma convencer melhor porque mostra na prática.",
      },
      {
        question: "Se eu indicar o salão onde trabalho, ganho comissão?",
        answer:
          "Ganha, desde que a conta seja do dono do salão, com outro CPF, e-mail e telefone que não os seus.",
      },
      {
        question: "A minha cliente final precisa baixar aplicativo?",
        answer: "Não. O cliente marca pelo navegador do celular, sem aplicativo e sem cadastro.",
      },
    ],
    related: ["para-cabeleireira", "pelo-celular", "como-indicar-agenda-online"],
    updatedAt: UPDATED,
  },
  {
    slug: "para-cabeleireira",
    label: "Renda extra para cabeleireira",
    title: "Renda extra para cabeleireira e salão de beleza | MeetChat",
    description:
      "Cabeleireira pode ganhar comissão todo mês indicando agenda online para salões, colegas e alunas. Veja quanto rende e como indicar o MeetChat sem atrapalhar o atendimento.",
    h1: "Renda extra para cabeleireira: comissão indicando agenda online",
    answer: `Cabeleireiras convivem com donos de salão, colegas de cadeira, fornecedores e cursos. Cada um desses contatos que assinar o MeetChat pelo seu link rende ${PER_CLIENT}, uma renda que se soma à do salão.`,
    sections: [
      {
        title: "Os contatos que você já tem valem dinheiro",
        list: [
          "Donos de salão que ainda marcam tudo num caderno ou no WhatsApp.",
          "Colegas que alugam cadeira e precisam de agenda própria.",
          "Representantes de cosméticos que visitam vários salões por semana.",
          "Turmas de cursos de colorimetria, mechas e corte.",
        ],
      },
      {
        title: "O argumento que mais funciona com salão",
        paragraphs: [
          "Salão perde dinheiro com cliente que não aparece em horário longo, como mechas e progressiva. O MeetChat permite cobrar um sinal pelo Pix na hora do agendamento e manda lembrete antes, o que reduz as faltas.",
          "Para salão com várias profissionais, cada uma tem sua agenda e o cliente escolhe com quem quer marcar, sem conflito de horário.",
        ],
      },
      {
        title: "Quanto pode render",
        paragraphs: [
          `Um salão no plano ${N.planName} rende ${N.first} no primeiro pagamento e ${N.recurring} por mês. Um salão que quer site profissional junto assina o ${N.sitePlanName}, que rende ${N.firstSite} e depois ${N.recurringSite} por mês. Dez salões indicados já formam uma renda mensal que cresce a cada novo cliente.`,
        ],
      },
    ],
    faq: [
      {
        question: "Posso indicar o salão onde trabalho?",
        answer: "Pode, se a conta for do dono e não estiver no seu CPF, e-mail ou telefone.",
      },
      {
        question: "O salão precisa de computador?",
        answer: "Não. A conta é criada e usada pelo celular.",
      },
      {
        question: "O salão ganha desconto por vir de mim?",
        answer: "Não. O preço é o mesmo e o teste grátis também.",
      },
    ],
    related: ["para-manicure", "para-barbeiro", "comissao-recorrente"],
    updatedAt: UPDATED,
  },
  {
    slug: "para-barbeiro",
    label: "Renda extra para barbeiro",
    title: "Renda extra para barbeiro: indique agenda para barbearias | MeetChat",
    description: `Barbeiro pode ganhar comissão recorrente indicando agenda online para outras barbearias: ${N.first} por barbearia que assinar e ${N.recurring} por mês enquanto ela usar.`,
    h1: "Renda extra para barbeiro: indique agenda online para barbearias",
    answer: `Barbeiros conhecem outras barbearias, ex-colegas e alunos de curso que agendam corte pelo WhatsApp. Indicando o MeetChat, cada barbearia que assinar pelo seu link rende ${PER_CLIENT}.`,
    sections: [
      {
        title: "Por que barbearia assina agenda online",
        list: [
          "Corte é rápido e o movimento é alto: responder mensagem entre um cliente e outro atrasa a fila.",
          "Cada barbeiro tem sua agenda e o cliente escolhe com quem cortar.",
          "Lembrete antes do horário diminui o “esqueci” de sábado de manhã.",
        ],
      },
      {
        title: "Onde estão as barbearias que você pode indicar",
        list: [
          "Barbearias onde você já trabalhou ou fez freela.",
          "Colegas do curso de barbeiro que abriram o próprio espaço.",
          "Grupos de barbeiros no WhatsApp e no Instagram.",
          "Distribuidores de máquinas e produtos que visitam barbearias.",
        ],
      },
      {
        title: "Como mostrar em 1 minuto",
        ordered: true,
        list: [
          "Abra a página de barbearia do MeetChat com o seu link no celular.",
          "Mostre como o cliente escolhe corte, barbeiro e horário.",
          "Diga que dá para testar grátis e que a conta se cria numa conversa.",
          "Mande o link no WhatsApp do dono para ele criar a conta depois.",
        ],
      },
    ],
    faq: [
      {
        question: "Tem link próprio para barbearia?",
        answer:
          "Tem. Na área do parceiro você copia o link da página de barbearia, que já fala direto com esse público.",
      },
      {
        question: "Indicar a barbearia concorrente atrapalha o meu trabalho?",
        answer:
          "A decisão é sua. Muita gente prefere indicar barbearias de outros bairros ou cidades.",
      },
      {
        question: "Quando recebo?",
        answer: `A comissão é liberada ${N.holdDays} dias depois de cada pagamento e paga por Pix a partir de ${N.minPayout}.`,
      },
    ],
    related: ["para-cabeleireira", "para-vendedores", "como-indicar-agenda-online"],
    updatedAt: UPDATED,
  },
  {
    slug: "para-social-media",
    label: "Renda extra para social media",
    title: "Renda extra para social media e agências | MeetChat",
    description:
      "Social media e agências podem ganhar comissão recorrente indicando agenda online para os clientes que já atendem. Mais resultado para o cliente e mais renda para você.",
    h1: "Renda extra para social media: comissão sobre a agenda dos seus clientes",
    answer: `Quem cuida do Instagram de salões, clínicas e barbearias pode indicar o MeetChat como o link de agendamento da bio. O cliente converte melhor o tráfego que você gera, e você ganha ${PER_CLIENT}.`,
    sections: [
      {
        title: "A agenda fecha o funil que você abre",
        paragraphs: [
          "Você gera alcance e seguidores, mas se o perfil termina em “chama no direct”, parte dos interessados desiste esperando resposta. Um link de agendamento na bio transforma visita em horário marcado, sem depender do dono responder.",
          "Isso também ajuda você a mostrar resultado: agendamentos são uma métrica que o cliente entende.",
        ],
      },
      {
        title: "Como incluir na sua entrega",
        list: [
          "Sugira o link de agendamento na bio e no destaque “Agendar”.",
          "Use a figurinha de link nos stories de horários livres da semana.",
          "Coloque o link nas legendas de posts de promoção e nos anúncios.",
          "Ofereça configurar a conta junto com o cliente na primeira reunião.",
        ],
      },
      {
        title: "Renda que não depende de novo contrato",
        paragraphs: [
          "A comissão de parceiro é paga enquanto o negócio assina o MeetChat, mesmo que um dia ele deixe de contratar a sua gestão de redes. É uma renda separada do seu contrato.",
        ],
      },
    ],
    faq: [
      {
        question: "Posso cobrar do cliente para configurar?",
        answer:
          "Pode cobrar pelo seu serviço de configuração. Só não pode dizer que o MeetChat cobra algo que ele não cobra.",
      },
      {
        question: "Agência com vários clientes ganha por todos?",
        answer: "Sim, por cada negócio que criar a conta pelo seu link e assinar.",
      },
      {
        question: "Posso usar a marca MeetChat nos meus posts?",
        answer:
          "Pode falar do MeetChat em seu nome. Não pode criar perfil ou anúncio que se passe pela marca oficial.",
      },
    ],
    related: ["afiliado-de-software", "comissao-recorrente", "pelo-celular"],
    updatedAt: UPDATED,
  },
  {
    slug: "para-estudante",
    label: "Renda extra para estudante",
    title: "Renda extra para estudante: indique e ganhe por Pix | MeetChat",
    description:
      "Estudante maior de 18 anos pode ganhar renda extra no tempo livre indicando agenda online para negócios do bairro. Sem investimento, sem CNPJ e com pagamento por Pix.",
    h1: "Renda extra para estudante: indicação com comissão todo mês",
    answer: `Estudantes com 18 anos ou mais podem ser parceiros do MeetChat no tempo livre, sem horário fixo e sem investir nada. Você indica a agenda online para negócios do bairro ou da faculdade e ganha ${PER_CLIENT}.`,
    sections: [
      {
        title: "Por que combina com a rotina de estudante",
        list: [
          "Não tem horário fixo: você indica entre uma aula e outra.",
          "Não precisa de CNPJ, só CPF e chave Pix.",
          "A renda se acumula: quem você indicou no começo do semestre continua rendendo nos meses seguintes.",
        ],
      },
      {
        title: "Negócios perto de você que precisam de agenda",
        list: [
          "Barbearias e salões em volta da faculdade.",
          "Clínicas-escola e consultórios de psicologia, nutrição e fisioterapia.",
          "Personal trainers e estúdios de pilates da academia que você frequenta.",
          "Estúdios de tatuagem e de fotografia.",
        ],
      },
      {
        title: "Para quem estuda saúde, beleza ou marketing",
        paragraphs: [
          "Estudantes de psicologia, nutrição, estética ou marketing já convivem com futuros profissionais que vão precisar de agenda. Indicar para colegas que estão começando a atender é uma forma natural de começar.",
        ],
      },
    ],
    faq: [
      {
        question: "Qual a idade mínima?",
        answer: "18 anos.",
      },
      {
        question: "Preciso ter conta em banco?",
        answer: "Precisa de uma chave Pix no seu nome, o que pode ser uma conta digital gratuita.",
      },
      {
        question: "Quanto tempo leva para receber?",
        answer: `Cada comissão é liberada ${N.holdDays} dias depois do pagamento do cliente, e o Pix sai a partir de ${N.minPayout} liberados.`,
      },
    ],
    related: ["sem-cnpj", "sem-investimento", "pelo-celular"],
    updatedAt: UPDATED,
  },
  {
    slug: "para-maes",
    label: "Renda extra para mães",
    title: "Renda extra para mães: trabalhe de casa indicando | MeetChat",
    description:
      "Renda extra para mães que querem trabalhar de casa, no próprio horário: indique agenda online para negócios e receba comissão recorrente por Pix, sem investimento.",
    h1: "Renda extra para mães: indique de casa, no seu horário",
    answer: `Mães que querem uma renda sem horário fixo podem ser parceiras do MeetChat: tudo é feito pelo celular, de casa, nos intervalos do dia. Cada negócio que assinar pelo seu link rende ${PER_CLIENT}, todo mês enquanto ele usar.`,
    sections: [
      {
        title: "Uma renda que respeita a rotina da casa",
        paragraphs: [
          "Não existe expediente, reunião ou meta. Você manda mensagens quando o tempo permite e acompanha os resultados no painel quando quiser.",
          "Como a comissão é recorrente, o esforço de um mês continua rendendo nos meses seguintes, mesmo nas semanas em que você não consegue indicar ninguém.",
        ],
      },
      {
        title: "A sua rede já é um ponto de partida",
        list: [
          "A manicure, a cabeleireira e a depiladora que você frequenta.",
          "Pediatras, fonoaudiólogas, psicólogas infantis e nutricionistas da família.",
          "Professoras particulares, escolinhas de natação e de música que marcam aulas.",
          "Mães empreendedoras dos grupos da escola que atendem com hora marcada.",
        ],
      },
      {
        title: "Como explicar em uma mensagem",
        paragraphs: [
          "“Oi! Conheci um sistema em que o cliente marca o horário sozinho por um link, sem precisar te chamar no WhatsApp. Dá para testar grátis. Quer que eu te mande?” Mensagem curta, sem pressão e sem promessa.",
        ],
      },
    ],
    faq: [
      {
        question: "Preciso ficar disponível em horário comercial?",
        answer: "Não. Você indica quando puder; o negócio cria a conta sozinho.",
      },
      {
        question: "Tenho que explicar o sistema em detalhes?",
        answer:
          "Não. A criação da conta é uma conversa guiada, e o suporte é do MeetChat. Você só apresenta.",
      },
      {
        question: "Quanto dá para ganhar?",
        answer: `Depende de quantos negócios assinam. Com o plano ${N.planName}, cada um rende ${N.recurring} por mês depois do 1º pagamento; dá para chegar a ${INCOME_GOAL_NOTE}.`,
      },
    ],
    related: ["pelo-celular", "sem-investimento", "para-manicure"],
    updatedAt: UPDATED,
  },
  {
    slug: "para-vendedores",
    label: "Renda extra para vendedores",
    title: "Renda extra para vendedor e representante comercial | MeetChat",
    description:
      "Vendedores e representantes que visitam salões, clínicas e barbearias podem somar uma comissão recorrente indicando agenda online. Veja como encaixar na sua rota.",
    h1: "Renda extra para vendedores e representantes comerciais",
    answer: `Quem já visita salões, barbearias e clínicas vendendo outros produtos pode oferecer o MeetChat na mesma visita. Cada negócio que assinar pelo seu link rende ${PER_CLIENT}, uma carteira recorrente além da sua comissão principal.`,
    sections: [
      {
        title: "Encaixa na rota que você já faz",
        list: [
          "Representantes de cosméticos, produtos de barbearia e equipamentos de estética.",
          "Vendedores de maquininha de cartão e de serviços para pequenos negócios.",
          "Consultores de contabilidade, sistemas e marketing local.",
        ],
      },
      {
        title: "Um produto que não concorre com o seu",
        paragraphs: [
          "A agenda online não substitui o que você já vende; ela complementa. Em vez de chegar só com pedido, você chega com uma solução para o problema de horário do cliente, o que melhora a relação e abre portas.",
          "O negócio testa sozinho e paga direto ao MeetChat. Você não emite pedido, não cobra e não faz pós-venda.",
        ],
      },
      {
        title: "Monte sua carteira recorrente",
        paragraphs: [
          `Um representante que visita 40 negócios por semana e converte poucos por mês forma, em um ano, uma carteira que paga sozinha. Com cerca de ${N.goalClients} negócios ativos no plano ${N.planName}, a carteira chega perto de ${N.goal} por mês só em mensalidades.`,
        ],
      },
    ],
    faq: [
      {
        question: "Preciso de autorização da empresa onde trabalho?",
        answer:
          "Isso depende do seu contrato com ela. O programa do MeetChat não exige exclusividade.",
      },
      {
        question: "Posso ter material para mostrar na visita?",
        answer:
          "Sim. As páginas por nicho do site funcionam como apresentação no celular, já com o seu link.",
      },
      {
        question: "Comissão tem teto?",
        answer: "Não. Você ganha por todos os negócios que assinarem pelo seu link.",
      },
    ],
    related: ["comissao-recorrente", "para-barbeiro", "como-indicar-agenda-online"],
    updatedAt: UPDATED,
  },
  {
    slug: "como-indicar-agenda-online",
    label: "Como indicar agenda online",
    title: "Como indicar agenda online para salões e clínicas | MeetChat",
    description:
      "Passo a passo para indicar agenda online a salões, barbearias e clínicas: quem abordar, o que dizer, objeções comuns e como acompanhar suas comissões de parceiro.",
    h1: "Como indicar agenda online para salões, barbearias e clínicas",
    answer:
      "Para indicar bem uma agenda online, procure negócios que marcam horário pelo WhatsApp, mostre como o cliente agenda sozinho pelo link e convide para o teste grátis. O dono cria a conta numa conversa guiada, e você acompanha tudo na área do parceiro.",
    sections: [
      {
        title: "Quem abordar primeiro",
        list: [
          "Quem diz “agende pelo WhatsApp” ou “chama no direct” no Instagram.",
          "Quem demora a responder mensagens: é quem mais sofre com elas.",
          "Quem reclama de cliente que falta ou desmarca em cima da hora.",
          "Quem está abrindo o negócio agora e ainda não tem sistema.",
        ],
      },
      {
        title: "O que dizer",
        ordered: true,
        list: [
          "Comece pelo problema: “Você perde muito tempo marcando horário pelo WhatsApp?”",
          "Mostre a solução no celular: o cliente escolhe serviço, dia e horário livre e confirma sozinho.",
          "Cite o sinal pelo Pix e os lembretes para quem sofre com faltas.",
          `Convide para testar: são ${TRIAL_DAYS} dias grátis, sem cartão.`,
          "Mande o seu link e se ofereça para ajudar a colocar na bio.",
        ],
      },
      {
        title: "Respostas para as objeções mais comuns",
        list: [
          "“Meus clientes são velhinhos”: o link abre no navegador, sem aplicativo e sem cadastro, como uma conversa.",
          "“Eu já uso caderno”: o caderno não avisa o cliente nem impede dois horários iguais.",
          "“Não tenho tempo para configurar”: os serviços do ramo já vêm prontos e dá para ajustar pelo celular.",
          "“É caro?”: mostre a página de preços; o valor é menor que uma falta por mês na maioria dos serviços.",
        ],
      },
    ],
    faq: [
      {
        question: "E se o negócio criar a conta sem o meu link?",
        answer:
          "Ele só fica ligado a você se entrar pelo seu link e criar a conta em até 60 dias. Por isso mande sempre o link, não só o nome do site.",
      },
      {
        question: "Como sei quem criou conta?",
        answer:
          "Na área do parceiro aparecem os negócios ligados a você, se estão em teste ou assinando, e cada comissão.",
      },
      {
        question: "Posso mandar mensagem em massa?",
        answer:
          "Não. Spam e listas compradas são proibidos e encerram a parceria. Fale com quem você conhece ou com quem pode realmente usar.",
      },
    ],
    related: ["pelo-celular", "para-vendedores", "afiliado-de-software"],
    updatedAt: UPDATED,
  },
];

export function getIncomePage(slug: string): IncomePage | null {
  return INCOME_PAGES.find((p) => p.slug === slug) ?? null;
}
