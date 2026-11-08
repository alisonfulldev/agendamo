import { formatBRL } from "@/lib/money";
import { PLAN_PRICES } from "@/lib/plans";

import type { FaqItem, GuideSection } from "./niche-guides/types";

/**
 * Search pages of "Site ou Loja" (2026-11-07): what people type when they want a site or an
 * online store, without booking. Two hubs (/site-profissional, /loja-virtual) and one page per
 * kind of business. Every button opens the sales chat (/criar-site). Prices from plans.ts; only
 * what the product does (the WhatsApp gets the client, there is no checkout).
 */
export type WebLandingKind = "site" | "store";

export interface WebLandingPage {
  slug: string;
  kind: WebLandingKind;
  /** Niche whose colors and photos illustrate the page (null = the MeetChat ones). */
  nicheKey: string | null;
  /** Short name (breadcrumb, links): "Advogados". */
  label: string;
  title: string;
  description: string;
  h1: string;
  answer: string;
  sections: GuideSection[];
  faq: FaqItem[];
  updatedAt: string;
}

export const WEB_PRICE = {
  monthly: `${formatBRL(PLAN_PRICES.web.monthly)}/mês`,
  yearly: `${formatBRL(PLAN_PRICES.web.yearly)}/ano`,
};

export const WEB_HUBS: Record<
  WebLandingKind,
  {
    path: string;
    title: string;
    description: string;
    h1: string;
    intro: string;
    label: string;
    updatedAt: string;
  }
> = {
  site: {
    path: "/site-profissional",
    label: "Site profissional",
    title: `Site profissional por ${WEB_PRICE.monthly} | MeetChat`,
    description: `Site bonito, pronto para o Google e com botão de WhatsApp em todas as páginas, por ${WEB_PRICE.monthly}. Você edita tudo pelo celular. Sem fidelidade.`,
    h1: "Site profissional para o seu negócio",
    intro: `Um site moderno, com seus serviços, fotos e endereço, e um botão de WhatsApp em cada parte: quem visita fala com você em um toque. Por ${WEB_PRICE.monthly}, sem taxa de criação e sem fidelidade.`,
    updatedAt: "2026-11-08",
  },
  store: {
    path: "/loja-virtual",
    label: "Loja virtual",
    title: `Loja virtual com pedido no WhatsApp por ${WEB_PRICE.monthly} | MeetChat`,
    description: `Seus produtos com fotos, preços e categorias. O cliente monta a sacolinha e o pedido chega pronto no seu WhatsApp. Sem taxa por venda. ${WEB_PRICE.monthly}.`,
    h1: "Loja virtual com pedido direto no WhatsApp",
    intro: `Uma loja online com os seus produtos, fotos e preços. O cliente escolhe, monta a sacolinha e o pedido chega no seu WhatsApp com a lista e o total. Sem taxa por venda, por ${WEB_PRICE.monthly}.`,
    updatedAt: "2026-11-08",
  },
};

const sitePrice: GuideSection = {
  title: "Quanto custa",
  paragraphs: [
    `${WEB_PRICE.monthly} ou ${WEB_PRICE.yearly} no anual, sem taxa de criação e sem fidelidade: você cancela quando quiser.`,
    "Quer um site feito sob medida por uma pessoa da nossa equipe? Também tem, a partir de R$ 197.",
  ],
};

const SITE_PAGES: Omit<WebLandingPage, "kind" | "updatedAt">[] = [
  {
    slug: "advogado",
    nicheKey: "consulting",
    label: "Advogados",
    title: "Site para advogado e escritório de advocacia | MeetChat",
    description:
      "Site para advogado com áreas de atuação, sobre o escritório e botão de WhatsApp para o primeiro contato. Sóbrio, pronto para o Google e editável pelo celular.",
    h1: "Site para advogado e escritório de advocacia",
    answer:
      "Um bom site de advogado mostra as áreas de atuação, quem é o escritório e um jeito simples de falar com você. No MeetChat, cada área vira um bloco com o botão “Quero saber mais”, que abre o seu WhatsApp com a mensagem pronta, e o site já nasce preparado para aparecer no Google.",
    sections: [
      {
        title: "O que o cliente procura antes de ligar",
        list: [
          "Se você atende a área do problema dele (trabalhista, família, previdenciário…)",
          "Onde fica o escritório e se atende online",
          "Quem são os advogados e há quanto tempo atuam",
          "Um jeito fácil de mandar a primeira mensagem",
        ],
      },
      {
        title: "Discreto e dentro das regras",
        paragraphs: [
          "O site apresenta o escritório de forma informativa, sem promessa de resultado e sem preço de consulta em destaque, no tom que a advocacia pede.",
          "Você escreve os textos com as suas palavras e muda quando quiser, sem depender de agência.",
        ],
      },
      sitePrice,
    ],
    faq: [
      {
        question: "Posso colocar o número da OAB?",
        answer: "Pode. Coloque no texto de apresentação ou no rodapé, junto do nome dos advogados.",
      },
      {
        question: "O cliente consegue falar comigo direto?",
        answer:
          "Consegue: todo botão abre o seu WhatsApp com uma mensagem pronta, dizendo de qual área ele quer saber.",
      },
    ],
  },
  {
    slug: "contador",
    nicheKey: "consulting",
    label: "Contadores",
    title: "Site para contador e escritório de contabilidade | MeetChat",
    description:
      "Site para escritório de contabilidade com serviços para MEI e empresas, sobre a equipe e botão de WhatsApp. Pronto para o Google, editável pelo celular.",
    h1: "Site para contador e escritório de contabilidade",
    answer:
      "O site de um escritório de contabilidade precisa dizer com clareza quem você atende (MEI, pequenas empresas, pessoa física) e o que faz por elas. No MeetChat cada serviço tem um botão que abre o seu WhatsApp, e o cliente pede orçamento sem preencher formulário.",
    sections: [
      {
        title: "Serviços que vale mostrar",
        list: [
          "Abertura de empresa e de MEI",
          "Contabilidade mensal e folha de pagamento",
          "Imposto de Renda de pessoa física",
          "Troca de contador sem dor de cabeça",
        ],
      },
      {
        title: "Mais confiança no primeiro contato",
        paragraphs: [
          "Quem procura contador quer saber se pode confiar. Fotos da equipe, o endereço do escritório e um texto sobre a sua experiência fazem diferença na escolha.",
          "No celular o site carrega rápido e o botão de WhatsApp fica sempre à vista, inclusive para quem chegou pela busca do Google.",
        ],
      },
      sitePrice,
    ],
    faq: [
      {
        question: "Dá para mostrar os preços dos planos de contabilidade?",
        answer:
          "Dá, se quiser: cada serviço pode ter preço ou ficar sem preço, para você combinar pelo WhatsApp.",
      },
      {
        question: "Preciso saber mexer com site?",
        answer: "Não. Você muda textos, fotos e serviços pelo painel, no celular.",
      },
    ],
  },
  {
    slug: "arquiteto",
    nicheKey: "consulting",
    label: "Arquitetos",
    title: "Site para arquiteto e designer de interiores | MeetChat",
    description:
      "Site para arquiteto com portfólio de projetos, serviços e botão de WhatsApp para orçamento. Fotos grandes, visual limpo e editável pelo celular.",
    h1: "Site para arquiteto e designer de interiores",
    answer:
      "Para arquitetos, o site é o portfólio: fotos grandes dos projetos, os serviços que você oferece e um caminho rápido para pedir orçamento. No MeetChat a galeria mostra os seus trabalhos em destaque e o botão de WhatsApp leva o interessado direto para a conversa.",
    sections: [
      {
        title: "Seu portfólio em destaque",
        paragraphs: [
          "Escolha as melhores fotos de cada projeto e organize na ordem que quiser. O modelo Clean deixa as imagens respirarem, com fundo claro e títulos elegantes.",
          "Troque as fotos sempre que terminar um projeto novo, direto do celular.",
        ],
      },
      {
        title: "Serviços que costumam entrar",
        list: [
          "Projeto residencial e comercial",
          "Projeto de interiores",
          "Reforma e acompanhamento de obra",
          "Consultoria de uma visita",
        ],
      },
      sitePrice,
    ],
    faq: [
      {
        question: "Cabem muitas fotos?",
        answer: "A galeria comporta até 20 fotos, comprimidas para carregar rápido no celular.",
      },
      {
        question: "Posso usar o meu domínio?",
        answer: "Pode, como opcional: um endereço só seu, registrado no seu nome.",
      },
    ],
  },
  {
    slug: "corretor-de-imoveis",
    nicheKey: "consulting",
    label: "Corretores de imóveis",
    title: "Site para corretor de imóveis | MeetChat",
    description:
      "Site para corretor de imóveis com apresentação, regiões de atuação e imóveis em destaque, com botão de WhatsApp em cada um. Editável pelo celular.",
    h1: "Site para corretor de imóveis",
    answer:
      "Um site de corretor apresenta você, as regiões onde atua e alguns imóveis em destaque, cada um com um botão que abre o WhatsApp já dizendo de qual imóvel a pessoa quer saber. No MeetChat você monta isso sozinho e atualiza pelo celular quando um imóvel sai.",
    sections: [
      {
        title: "Imóveis em destaque, cada um com o seu botão",
        paragraphs: [
          "Cadastre cada imóvel como um item, com foto, preço e descrição. O botão “Quero saber mais” abre o seu WhatsApp com o nome do imóvel na mensagem.",
          "Vendeu ou alugou? Oculte o item em um toque.",
        ],
      },
      {
        title: "O que passa confiança",
        list: [
          "Sua foto e o seu CRECI",
          "Bairros e cidades em que você atua",
          "Depoimento de clientes no texto de apresentação",
          "Resposta rápida pelo WhatsApp",
        ],
      },
      sitePrice,
    ],
    faq: [
      {
        question: "Tenho muitos imóveis. Cabe tudo?",
        answer:
          "O site é para os destaques. Para a carteira completa, você pode colocar um link para o seu portal no item.",
      },
      {
        question: "O cliente precisa se cadastrar?",
        answer: "Não. Ele toca no botão e a conversa abre no seu WhatsApp.",
      },
    ],
  },
  {
    slug: "eletricista",
    nicheKey: null,
    label: "Eletricistas",
    title: "Site para eletricista e prestador de serviços | MeetChat",
    description:
      "Site para eletricista com os serviços, região de atendimento e botão de WhatsApp para pedir orçamento na hora. Pronto para o Google, feito pelo celular.",
    h1: "Site para eletricista",
    answer:
      "Quem precisa de eletricista quer resolver rápido: ver o que você faz, se atende o bairro dele e chamar no WhatsApp. O site do MeetChat mostra os seus serviços e a região de atendimento, e coloca um botão de WhatsApp em cada parte para o orçamento chegar direto para você.",
    sections: [
      {
        title: "Serviços que o cliente procura",
        list: [
          "Instalação de chuveiro, tomadas e iluminação",
          "Quadro de energia e disjuntores",
          "Manutenção residencial e predial",
          "Atendimento de emergência",
        ],
      },
      {
        title: "Apareça para quem busca no Google",
        paragraphs: [
          "Escreva a sua cidade e os bairros que atende: é assim que o site fica preparado para quem pesquisa “eletricista perto de mim”.",
          "Fotos de trabalhos feitos ajudam a pessoa a confiar antes de chamar.",
        ],
      },
      sitePrice,
    ],
    faq: [
      {
        question: "Serve para outros serviços, como encanador ou pintor?",
        answer:
          "Serve: o site é o mesmo para qualquer prestador de serviço. Você só troca os serviços e as fotos.",
      },
      {
        question: "Preciso de computador?",
        answer: "Não, tudo funciona pelo celular.",
      },
    ],
  },
  {
    slug: "oficina-mecanica",
    nicheKey: "auto-detailing",
    label: "Oficinas mecânicas",
    title: "Site para oficina mecânica e autocenter | MeetChat",
    description:
      "Site para oficina mecânica com serviços, endereço, fotos da oficina e botão de WhatsApp para orçamento. Fácil de editar pelo celular.",
    h1: "Site para oficina mecânica",
    answer:
      "Uma oficina ganha clientes quando aparece no Google com endereço, serviços e um jeito fácil de pedir orçamento. O site do MeetChat mostra tudo isso e cada serviço tem um botão que abre o seu WhatsApp, para o cliente mandar a placa e o problema do carro.",
    sections: [
      {
        title: "Serviços da oficina",
        list: [
          "Revisão e troca de óleo",
          "Freios, suspensão e alinhamento",
          "Injeção eletrônica e diagnóstico",
          "Ar-condicionado automotivo",
        ],
      },
      {
        title: "Fotos e endereço que trazem cliente",
        paragraphs: [
          "Mostre a oficina, a equipe e os carros em atendimento: quem vê o lugar confia mais em deixar o carro.",
          "O endereço aparece no site e ajuda quem procura “oficina perto de mim”.",
        ],
      },
      sitePrice,
    ],
    faq: [
      {
        question: "O cliente pode mandar foto do problema?",
        answer: "Pode: a conversa abre no seu WhatsApp, onde ele manda fotos e áudios como sempre.",
      },
      {
        question: "Dá para mostrar preço de revisão?",
        answer: "Dá, em cada serviço, ou deixar sem preço para orçar caso a caso.",
      },
    ],
  },
  {
    slug: "fotografo",
    nicheKey: "photography",
    label: "Fotógrafos",
    title: "Site para fotógrafo com portfólio | MeetChat",
    description:
      "Site para fotógrafo com portfólio em destaque, pacotes e botão de WhatsApp para fechar ensaios e eventos. Visual limpo, pronto para o Google.",
    h1: "Site para fotógrafo",
    answer:
      "O site de um fotógrafo é o portfólio que vende: fotos grandes, os tipos de ensaio e eventos que você faz e um botão para chamar no WhatsApp. No MeetChat você monta isso em minutos e troca as fotos sempre que tiver um trabalho novo.",
    sections: [
      {
        title: "O que costuma entrar",
        list: [
          "Ensaios: gestante, newborn, família e individual",
          "Casamentos e eventos",
          "Fotos corporativas e de produtos",
          "Pacotes com quantidade de fotos e prazo de entrega",
        ],
      },
      {
        title: "Suas fotos em primeiro lugar",
        paragraphs: [
          "A foto do topo ocupa a tela inteira e a galeria mostra os seus melhores cliques em blocos grandes.",
          "As fotos são preparadas no celular para carregar rápido, sem perder a qualidade na tela.",
        ],
      },
      sitePrice,
    ],
    faq: [
      {
        question: "Posso separar por tipo de ensaio?",
        answer:
          "Pode: cada tipo vira um serviço com descrição, preço opcional e botão de WhatsApp.",
      },
      {
        question: "Tem limite de fotos?",
        answer: "A galeria comporta até 20 fotos, e cada serviço pode ter a sua própria foto.",
      },
    ],
  },
  {
    slug: "empresa-de-limpeza",
    nicheKey: null,
    label: "Empresas de limpeza",
    title: "Site para empresa de limpeza e diarista | MeetChat",
    description:
      "Site para empresa de limpeza ou diarista com serviços, regiões atendidas e botão de WhatsApp para orçamento. Pronto para o Google, editável pelo celular.",
    h1: "Site para empresa de limpeza e diarista",
    answer:
      "Quem contrata limpeza quer saber o que está incluído, se você atende a região e quanto custa. O site do MeetChat mostra os seus serviços com preço opcional e um botão de WhatsApp em cada um, para o pedido de orçamento chegar com o serviço já escolhido.",
    sections: [
      {
        title: "Serviços que vale listar",
        list: [
          "Limpeza residencial e faxina",
          "Limpeza pós-obra",
          "Limpeza de escritórios e condomínios",
          "Limpeza de sofá e estofados",
        ],
      },
      {
        title: "Confiança para abrir a porta",
        paragraphs: [
          "Fotos de antes e depois, a sua apresentação e o que está incluído em cada serviço ajudam o cliente a decidir.",
          "Diga as cidades e bairros que atende para aparecer para quem procura perto.",
        ],
      },
      sitePrice,
    ],
    faq: [
      {
        question: "Sou diarista autônoma. Serve para mim?",
        answer: "Serve: o site é o mesmo para uma pessoa ou para uma empresa com equipe.",
      },
      {
        question: "O cliente marca um dia pelo site?",
        answer:
          "Neste plano ele fala com você pelo WhatsApp e vocês combinam o dia. Se quiser agenda online, existe o plano Site + Agenda.",
      },
    ],
  },
  {
    slug: "tatuador",
    nicheKey: "tattoo",
    label: "Tatuadores",
    title: "Site para tatuador e estúdio de tatuagem | MeetChat",
    description:
      "Site para tatuador com portfólio, estilos, piercing e botão de WhatsApp para orçamento. Visual escuro e forte, editável pelo celular.",
    h1: "Site para tatuador e estúdio de tatuagem",
    answer:
      "O site de um tatuador mostra o seu traço: portfólio em destaque, os estilos que você faz e um caminho direto para pedir orçamento. No MeetChat o site já nasce com as cores e o clima de estúdio, e o botão de WhatsApp leva o cliente para a conversa com a referência da tatuagem.",
    sections: [
      {
        title: "Seu trabalho em destaque",
        paragraphs: [
          "Mostre as suas melhores tatuagens em fotos grandes e separe por estilo: fineline, blackwork, realismo, old school.",
          "Atualize o portfólio pelo celular sempre que finalizar uma peça nova.",
        ],
      },
      {
        title: "Serviços do estúdio",
        list: ["Orçamento de tatuagem", "Sessões", "Piercing", "Retoque"],
      },
      sitePrice,
    ],
    faq: [
      {
        question: "Posso mostrar só o portfólio, sem preços?",
        answer: "Pode: os serviços podem ficar sem preço, para você orçar pelo WhatsApp.",
      },
      {
        question: "E se eu quiser agenda para as sessões?",
        answer:
          "O plano Site + Agenda tem o mesmo site com agenda online, sinal pelo Pix e lembrete para o cliente.",
      },
    ],
  },
];

const storePrice: GuideSection = {
  title: "Quanto custa",
  paragraphs: [
    `${WEB_PRICE.monthly} ou ${WEB_PRICE.yearly} no anual, sem taxa por venda e sem fidelidade: você cancela quando quiser.`,
    "Cada produto pode ir para a sacolinha do WhatsApp ou ter o link de onde você já vende, como Shopee ou Mercado Livre.",
  ],
};

const STORE_PAGES: Omit<WebLandingPage, "kind" | "updatedAt">[] = [
  {
    slug: "roupas",
    nicheKey: "beauty",
    label: "Lojas de roupas",
    title: "Loja virtual de roupas com pedido no WhatsApp | MeetChat",
    description:
      "Loja virtual de roupas com fotos, tamanhos, categorias e sacolinha que manda o pedido no WhatsApp. Sem taxa por venda, editável pelo celular.",
    h1: "Loja virtual de roupas com pedido no WhatsApp",
    answer:
      "Para vender roupas online sem marketplace, uma loja com fotos, preços e categorias resolve: a cliente escolhe as peças, monta a sacolinha e o pedido chega no seu WhatsApp com a lista e o total. No MeetChat você cadastra as peças pelo celular e combina pagamento e entrega na conversa.",
    sections: [
      {
        title: "Organize como numa arara",
        list: [
          "Categorias: vestidos, blusas, calças, moda praia",
          "Foto, preço e descrição com tamanhos e cores",
          "Peças esgotadas ficam ocultas em um toque",
          "Novidades sempre no topo",
        ],
      },
      {
        title: "Venda sem perder a conversa",
        paragraphs: [
          "Muita gente gosta de tirar dúvida antes de comprar. Com o pedido chegando no WhatsApp, você confirma tamanho, cor e entrega com a cliente, do seu jeito.",
          "Divulgue o link da loja no Instagram e nos status: quem vê a peça já vai direto para a sacolinha.",
        ],
      },
      storePrice,
    ],
    faq: [
      {
        question: "Como a cliente escolhe o tamanho?",
        answer:
          "Coloque os tamanhos na descrição da peça e confirme com ela no WhatsApp quando o pedido chegar.",
      },
      {
        question: "Tem taxa por venda?",
        answer: "Não. Você paga só a mensalidade, venda quanto vender.",
      },
    ],
  },
  {
    slug: "cosmeticos",
    nicheKey: "beauty",
    label: "Lojas de cosméticos",
    title: "Loja virtual de cosméticos e perfumes | MeetChat",
    description:
      "Loja virtual de cosméticos, maquiagem e perfumes com catálogo, preços e pedido pelo WhatsApp. Sem taxa por venda. Monte pelo celular.",
    h1: "Loja virtual de cosméticos e perfumes",
    answer:
      "Uma loja de cosméticos online mostra cada produto com foto e preço, separa por categorias e deixa a cliente montar a sacolinha. No MeetChat o pedido chega no seu WhatsApp com a lista e o total, e você combina pagamento e entrega na conversa.",
    sections: [
      {
        title: "Catálogo que vende sozinho",
        list: [
          "Categorias: maquiagem, skincare, cabelos, perfumes",
          "Kits e presentes em destaque",
          "Preço e descrição de cada produto",
          "Link da Shopee ou do Mercado Livre, se você já vende lá",
        ],
      },
      {
        title: "Ideal para revendedoras",
        paragraphs: [
          "Revende marcas ou tem a sua própria linha? Monte o catálogo uma vez e mande o link para as clientes em vez de foto por foto no WhatsApp.",
          "Mudou o preço ou acabou o estoque? Atualize em segundos pelo celular.",
        ],
      },
      storePrice,
    ],
    faq: [
      {
        question: "Posso vender perfumes e maquiagem na mesma loja?",
        answer: "Pode: cada linha vira uma categoria, e a cliente filtra com um toque.",
      },
      {
        question: "A cliente paga pelo site?",
        answer: "Não. O pedido chega no seu WhatsApp e o pagamento é combinado com você.",
      },
    ],
  },
  {
    slug: "semijoias",
    nicheKey: "nails",
    label: "Lojas de semijoias",
    title: "Loja virtual de semijoias e acessórios | MeetChat",
    description:
      "Loja virtual de semijoias, bijuterias e acessórios com fotos, preços e sacolinha que manda o pedido no WhatsApp. Sem taxa por venda.",
    h1: "Loja virtual de semijoias e acessórios",
    answer:
      "Semijoias vendem pela foto: brincos, colares e anéis bem fotografados, com preço claro, e um jeito simples de pedir. No MeetChat cada peça tem foto grande e botão de adicionar, e o pedido da sacolinha chega no seu WhatsApp pronto para você confirmar.",
    sections: [
      {
        title: "Mostre cada peça de perto",
        paragraphs: [
          "Fotos quadradas ou em pé deixam brincos e colares em destaque. O modelo Boutique tem fundo claro e visual de vitrine.",
          "Separe por coleção ou por tipo de peça e destaque os lançamentos.",
        ],
      },
      {
        title: "Para quem revende ou fabrica",
        list: [
          "Catálogo para mandar às clientes em vez de fotos soltas",
          "Kits e presentes com preço fechado",
          "Peças esgotadas ocultas em um toque",
          "Pedido com a lista e o total no WhatsApp",
        ],
      },
      storePrice,
    ],
    faq: [
      {
        question: "Dá para vender no atacado também?",
        answer:
          "Dá para criar uma categoria de atacado com os preços e combinar as quantidades no WhatsApp.",
      },
      {
        question: "Preciso pagar para cada produto cadastrado?",
        answer: "Não. A mensalidade é a mesma, com até 300 produtos.",
      },
    ],
  },
  {
    slug: "doces-e-bolos",
    nicheKey: null,
    label: "Doces e bolos",
    title: "Catálogo online de doces e bolos por encomenda | MeetChat",
    description:
      "Catálogo online de bolos, doces e kits festa por encomenda, com fotos, preços e pedido no WhatsApp. Sem taxa por venda, monte pelo celular.",
    h1: "Catálogo online de doces e bolos por encomenda",
    answer:
      "Para quem faz bolos e doces por encomenda, um catálogo online com fotos e preços evita mandar as mesmas fotos todo dia. No MeetChat o cliente escolhe os itens, monta a sacolinha e a encomenda chega no seu WhatsApp, onde vocês combinam data, sabor e entrega.",
    sections: [
      {
        title: "Monte o seu cardápio de encomendas",
        list: [
          "Bolos por tamanho ou por quilo",
          "Doces por cento e kits festa",
          "Datas especiais: Páscoa, Natal, Dia das Mães",
          "Fotos reais dos seus trabalhos",
        ],
      },
      {
        title: "Encomenda combinada do seu jeito",
        paragraphs: [
          "O pedido chega com a lista e o total, e você confirma a data, o sabor e a forma de entrega na conversa.",
          "Mudou o preço ou parou de fazer um doce? Atualize pelo celular em segundos.",
        ],
      },
      storePrice,
    ],
    faq: [
      {
        question: "Serve para delivery de comida pronta?",
        answer:
          "Este catálogo é pensado para encomendas. Para pedidos de comida em tempo real, com entrega rápida, ele não é o ideal.",
      },
      {
        question: "O cliente escolhe a data no site?",
        answer: "Não. A data é combinada com você no WhatsApp, depois que o pedido chega.",
      },
    ],
  },
  {
    slug: "artesanato",
    nicheKey: null,
    label: "Artesanato",
    title: "Loja virtual de artesanato e decoração | MeetChat",
    description:
      "Loja virtual para artesanato, decoração e personalizados, com fotos, preços e pedido no WhatsApp. Sem taxa por venda. Monte pelo celular.",
    h1: "Loja virtual de artesanato e decoração",
    answer:
      "Peças feitas à mão merecem uma vitrine própria. Com o MeetChat você mostra cada peça com foto e preço, separa por categorias e recebe o pedido no WhatsApp, onde combina personalização, prazo e entrega com o cliente.",
    sections: [
      {
        title: "Ideias de categorias",
        list: [
          "Decoração e casa",
          "Personalizados e lembrancinhas",
          "Crochê, costura e bordado",
          "Presentes e datas especiais",
        ],
      },
      {
        title: "Personalização na conversa",
        paragraphs: [
          "Muitas peças levam nome, cor ou tamanho sob medida. Como o pedido chega no WhatsApp, você acerta cada detalhe com o cliente antes de produzir.",
          "Já vende no Elo7 ou na Shopee? Cada peça pode ter o link de lá.",
        ],
      },
      storePrice,
    ],
    faq: [
      {
        question: "Faço peças sob encomenda. Como mostro o preço?",
        answer:
          "Coloque o preço inicial (“a partir de”) na descrição e combine o valor final no WhatsApp.",
      },
      {
        question: "Tem limite de produtos?",
        answer: "Você pode cadastrar até 300 produtos, com foto em cada um.",
      },
    ],
  },
  {
    slug: "pet-shop",
    nicheKey: "pet-grooming",
    label: "Pet shops",
    title: "Loja virtual para pet shop com pedido no WhatsApp | MeetChat",
    description:
      "Loja virtual para pet shop com rações, petiscos e acessórios, preços e pedido no WhatsApp. Sem taxa por venda, monte pelo celular.",
    h1: "Loja virtual para pet shop",
    answer:
      "Um pet shop vende muito para clientes da vizinhança que pedem pelo WhatsApp. Com o MeetChat você organiza rações, petiscos e acessórios num catálogo com preços, e o pedido chega pronto no seu WhatsApp para você combinar a entrega.",
    sections: [
      {
        title: "Categorias que facilitam o pedido",
        list: [
          "Rações por marca e tamanho do pacote",
          "Petiscos e areia",
          "Coleiras, camas e brinquedos",
          "Higiene e farmácia pet",
        ],
      },
      {
        title: "O pedido que chega pronto",
        paragraphs: [
          "Em vez de responder “tem a ração X?” várias vezes por dia, mande o link da loja: o cliente vê o que tem, monta a sacolinha e você só confirma.",
          "Banho e tosa com agenda? O plano Site + Agenda faz isso junto com o site.",
        ],
      },
      storePrice,
    ],
    faq: [
      {
        question: "Dá para atualizar preços rápido?",
        answer:
          "Dá: cada produto se edita em segundos pelo celular, e produtos em falta ficam ocultos.",
      },
      {
        question: "Faço entrega no bairro. Como funciona?",
        answer: "O pedido chega no WhatsApp e a entrega é combinada com o cliente na conversa.",
      },
    ],
  },
];

export const WEB_PAGES: readonly WebLandingPage[] = [
  ...SITE_PAGES.map((p) => ({ ...p, kind: "site" as const, updatedAt: "2026-11-08" })),
  ...STORE_PAGES.map((p) => ({ ...p, kind: "store" as const, updatedAt: "2026-11-08" })),
];

/** Questions of the hubs. */
export const WEB_HUB_FAQ: Record<WebLandingKind, FaqItem[]> = {
  site: [
    {
      question: "Preciso saber mexer com site?",
      answer:
        "Não. Você escolhe o modelo, coloca seus textos, fotos e serviços pelo celular, e o site vai para o ar na hora.",
    },
    {
      question: "O site aparece no Google?",
      answer:
        "Ele já nasce preparado para o Google, com o nome do seu negócio, a sua cidade e os seus serviços. O tempo para aparecer nas buscas depende do Google.",
    },
    {
      question: "Como o cliente fala comigo?",
      answer:
        "Todo botão do site abre o seu WhatsApp com uma mensagem pronta. Você responde de onde estiver.",
    },
    {
      question: "Tem fidelidade?",
      answer: `Não. São ${WEB_PRICE.monthly}, sem taxa de criação; você cancela quando quiser.`,
    },
  ],
  store: [
    {
      question: "O cliente paga pelo site?",
      answer:
        "Não. Ele monta a sacolinha e o pedido chega no seu WhatsApp com a lista e o total; o pagamento e a entrega você combina com ele.",
    },
    {
      question: "Tem taxa por venda?",
      answer: `Não. Você paga só ${WEB_PRICE.monthly}, venda quanto vender.`,
    },
    {
      question: "Já vendo na Shopee ou no Mercado Livre. Serve?",
      answer:
        "Serve: cada produto pode ter o link de onde você já vende, e o botão leva o cliente direto para lá.",
    },
    {
      question: "Quantos produtos posso cadastrar?",
      answer: "Até 300 produtos, cada um com foto, preço, descrição e categoria.",
    },
  ],
};

export function webPagePath(page: Pick<WebLandingPage, "kind" | "slug">): string {
  return `${WEB_HUBS[page.kind].path}/${page.slug}`;
}

export function getWebPage(kind: WebLandingKind, slug: string): WebLandingPage | null {
  return WEB_PAGES.find((p) => p.kind === kind && p.slug === slug) ?? null;
}
