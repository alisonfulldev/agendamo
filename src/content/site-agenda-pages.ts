import { PLAN_NAME, PRICE_TEXT, SITE_PLAN_NAME, SITE_PRICE_TEXT, TRIAL_DAYS } from "@/lib/plans";

import type { FaqItem, GuideSection } from "./niche-guides/types";

/**
 * "Site + agenda online para <profissão>" (/site-e-agenda/<slug>, 2026-11-06): one page per
 * niche selling the "Site + Agenda" plan, for search engines and AI answers. Each page has its
 * own answer, sections and FAQ (the quality gate compares pages of this template); only the price
 * block is shared. Real features only; prices from src/lib/plans.ts.
 */
export interface SiteAgendaPage {
  slug: string;
  /** Brand key of the niche (src/brands): example sites, colors, sign-up niche. */
  nicheKey: string;
  /** Short label (links, breadcrumb): "Nutricionistas". */
  label: string;
  title: string;
  description: string;
  h1: string;
  answer: string;
  sections: GuideSection[];
  faq: FaqItem[];
  updatedAt: string;
}

const UPDATED = "2026-11-06";

/** The price block, the same on every page (kept short so pages stay distinct). */
function priceSection(customers: string): GuideSection {
  return {
    title: "Quanto custa",
    paragraphs: [
      `O plano ${SITE_PLAN_NAME} custa ${SITE_PRICE_TEXT.monthly} (ou ${SITE_PRICE_TEXT.yearly} no anual), sem taxa de criação e sem fidelidade. Inclui o site, a agenda online e tudo do plano ${PLAN_NAME}. Se preferir só a agenda, sem o site, o ${PLAN_NAME} sai por ${PRICE_TEXT.monthly}.`,
      `Todo cadastro começa com ${TRIAL_DAYS} dias para testar, sem cartão: você monta o site, divulga o link e vê os ${customers} agendando antes de decidir.`,
    ],
  };
}

const priceFaq: FaqItem = {
  question: "Preciso de cartão de crédito para testar?",
  answer: `Não. Você cria a conta com o e-mail, testa por ${TRIAL_DAYS} dias e, se quiser continuar, paga pelo Pix. Não há fidelidade.`,
};

export const SITE_AGENDA_PAGES: readonly SiteAgendaPage[] = [
  {
    slug: "nutricionista",
    nicheKey: "nutrition",
    label: "Nutricionistas",
    title: "Site + agenda online para nutricionista | MeetChat",
    description: `Site profissional para nutricionista, pronto para o Google, com agenda online: o paciente escolhe o horário e marca a consulta sozinho. ${SITE_PRICE_TEXT.monthly}.`,
    h1: "Site + agenda online para nutricionista",
    answer:
      "Um site de nutricionista com agenda online junta, num endereço só, a sua apresentação profissional (formação, abordagem, tipos de consulta e valores) e um botão que abre a agenda: o paciente escolhe a consulta, o dia e um horário livre e confirma sozinho, inclusive à noite, sem precisar te chamar no WhatsApp.",
    sections: [
      {
        title: "Por que o nutricionista precisa de um site próprio",
        paragraphs: [
          "Boa parte dos pacientes chega por indicação ou pelo Instagram, mas antes de marcar quase todos pesquisam o seu nome no Google. Um site com a sua formação, o tipo de acompanhamento (emagrecimento, nutrição esportiva, materno-infantil, clínica) e como funciona a primeira consulta responde as dúvidas que viram mensagem no direct.",
          "Também é o lugar certo para explicar consultas presenciais e on-line, retornos e o que o paciente precisa levar, sem repetir a mesma explicação a cada contato.",
        ],
      },
      {
        title: "O que vai no seu site de nutrição",
        list: [
          "Apresentação com foto, CRN e a sua linha de trabalho",
          "Consultas e retornos, com duração e valor (ou sem valor, se preferir)",
          "Fotos do consultório e dos seus materiais, sem antes e depois de pacientes",
          "Avaliações de pacientes que concluíram a consulta",
          "Endereço com mapa e o botão “Agendar consulta” em todas as seções",
        ],
      },
      {
        title: "Como o paciente marca a consulta",
        paragraphs: [
          "Ao tocar em “Agendar”, abre uma conversa rápida no celular: ele escolhe primeira consulta ou retorno, o dia e um horário livre. A consulta entra na sua agenda, ele recebe a confirmação e um lembrete antes, e você recebe um aviso no celular.",
          "Se você trabalha com retorno a cada 30 ou 45 dias, o painel mostra quem está na hora de voltar, para você chamar o paciente.",
        ],
      },
      priceSection("pacientes"),
    ],
    faq: [
      {
        question: "Posso mostrar fotos de antes e depois de pacientes?",
        answer:
          "O Código de Ética do Nutricionista restringe o uso de imagens de pacientes para divulgação. No site você mostra o consultório, os seus materiais e a sua apresentação; a responsabilidade pelo conteúdo é sua.",
      },
      {
        question: "Dá para atender on-line e presencial na mesma agenda?",
        answer:
          "Sim. Você cadastra a consulta on-line e a presencial como serviços diferentes, cada uma com a sua duração, e o paciente escolhe ao agendar.",
      },
      {
        question: "Preciso mostrar o valor da consulta no site?",
        answer:
          "Não. Os preços podem ficar visíveis ou escondidos: você decide no painel, e o paciente agenda do mesmo jeito.",
      },
      priceFaq,
    ],
    updatedAt: UPDATED,
  },
  {
    slug: "psicologo",
    nicheKey: "psychology",
    label: "Psicólogos",
    title: "Site + agenda online para psicólogo | MeetChat",
    description: `Site profissional para psicólogo, pronto para o Google, com agenda online: o paciente marca a sessão sozinho, sem você interromper atendimentos. ${SITE_PRICE_TEXT.monthly}.`,
    h1: "Site + agenda online para psicólogo",
    answer:
      "Um site de psicólogo com agenda online apresenta a sua abordagem, o público que você atende e como funcionam as sessões, e deixa o paciente marcar sozinho, num horário livre da sua agenda. Você não precisa responder mensagens entre uma sessão e outra, e a primeira conversa já chega com dia e horário definidos.",
    sections: [
      {
        title: "Por que o psicólogo precisa de um site",
        paragraphs: [
          "Quem procura terapia costuma pesquisar com calma antes de dar o primeiro passo, muitas vezes no Google, com buscas como “psicólogo perto de mim” ou “terapia on-line”. Um site claro, com a sua abordagem (TCC, psicanálise, sistêmica…), o público que você atende e se as sessões são presenciais ou on-line, ajuda a pessoa a decidir que é com você.",
          "Para quem atende sozinho, sem secretária, a agenda online resolve outra dor: o paciente marca sem você precisar parar uma sessão para responder.",
        ],
      },
      {
        title: "O que vai no seu site de psicologia",
        list: [
          "Apresentação com foto, número do CRP e a sua abordagem",
          "Tipos de atendimento: individual, casal, adolescentes, on-line",
          "Como é a primeira sessão e a duração de cada sessão",
          "Fotos do consultório, em um tom acolhedor",
          "Botão “Agendar sessão” e o seu endereço, se atender presencialmente",
        ],
      },
      {
        title: "Discrição para o paciente",
        paragraphs: [
          "O agendamento pede só o nome e o contato do paciente; não há perguntas sobre o motivo da consulta. A confirmação e o lembrete chegam por e-mail, sem expor o assunto da sessão.",
          "Você controla quais horários aparecem, a antecedência mínima e até quantos dias à frente o paciente pode marcar.",
        ],
      },
      priceSection("pacientes"),
    ],
    faq: [
      {
        question: "O Conselho permite que o psicólogo tenha site?",
        answer:
          "Sim. As regras de publicidade do CFP pedem informações verdadeiras, sem promessa de resultado e com o seu número de registro. O site do MeetChat mostra o que você escrever; o cuidado com o conteúdo é seu.",
      },
      {
        question: "Dá para agendar sessões on-line?",
        answer:
          "Sim. Você cadastra a sessão on-line como um serviço e o paciente escolhe o horário. O link da chamada você envia como já faz hoje.",
      },
      {
        question: "Posso deixar o valor da sessão de fora do site?",
        answer: "Pode. Os preços ficam visíveis ou escondidos conforme você escolher no painel.",
      },
      priceFaq,
    ],
    updatedAt: UPDATED,
  },
  {
    slug: "clinica-de-estetica",
    nicheKey: "aesthetics",
    label: "Clínicas de estética",
    title: "Site + agenda online para clínica de estética | MeetChat",
    description: `Site para clínica de estética com procedimentos, fotos e avaliações, pronto para o Google, e agenda online com sinal pelo Pix. ${SITE_PRICE_TEXT.monthly}.`,
    h1: "Site + agenda online para clínica de estética",
    answer:
      "Um site de clínica de estética com agenda online mostra os procedimentos, os protocolos e o seu espaço, e deixa a cliente escolher o procedimento e o horário sozinha, com a opção de pagar um sinal pelo Pix para garantir a reserva. Assim os horários longos, como os de protocolos faciais e corporais, não ficam vazios por falta.",
    sections: [
      {
        title: "Por que a clínica de estética precisa de site",
        paragraphs: [
          "Procedimentos estéticos são uma compra pensada: a cliente compara clínicas, procura avaliações e quer entender o que é cada protocolo antes de marcar. Um site com os procedimentos bem explicados, fotos do espaço e avaliações reais passa a confiança que o perfil do Instagram sozinho não passa.",
          "No Google, quem busca “limpeza de pele” ou “clínica de estética” na sua cidade encontra um site com endereço, serviços e o botão de agendar.",
        ],
      },
      {
        title: "O que vai no site da sua clínica",
        list: [
          "Procedimentos com duração e valor: limpeza de pele, peeling, drenagem, protocolos",
          "Galeria com fotos do espaço e dos equipamentos",
          "Avaliações de clientes atendidas",
          "Equipe, se mais de uma profissional atende",
          "Endereço, mapa e o botão “Agendar” em cada procedimento",
        ],
      },
      {
        title: "Sinal pelo Pix para não perder horário",
        paragraphs: [
          "Em procedimentos mais longos, uma falta custa caro. Com o sinal pelo Pix, a cliente paga uma parte (ou o total) direto na sua chave ao agendar, e o horário fica reservado. Você confere no extrato e confirma no painel.",
          "Também dá para vender pacotes de sessões e acompanhar o saldo de cada cliente.",
        ],
      },
      priceSection("clientes"),
    ],
    faq: [
      {
        question: "Posso usar fotos de antes e depois?",
        answer:
          "Depende das regras do seu conselho profissional (biomedicina, enfermagem, fisioterapia dermatofuncional, estética) e da autorização da cliente. O site mostra o que você publicar; prefira fotos do espaço e dos protocolos.",
      },
      {
        question: "O dinheiro do sinal passa pelo MeetChat?",
        answer:
          "Não. O Pix vai direto para a sua chave. O MeetChat cobra só a assinatura do plano.",
      },
      {
        question: "Dá para ter várias profissionais na mesma agenda?",
        answer:
          "Sim. Cada profissional tem os seus horários, e a cliente escolhe com quem quer ser atendida. Cada profissional extra tem um valor mensal pequeno.",
      },
      priceFaq,
    ],
    updatedAt: UPDATED,
  },
  {
    slug: "salao-de-beleza",
    nicheKey: "beauty",
    label: "Salões de beleza",
    title: "Site + agenda online para salão de beleza | MeetChat",
    description: `Site para salão de beleza com serviços, preços e fotos dos trabalhos, pronto para o Google, e agenda online 24h. ${SITE_PRICE_TEXT.monthly}, sem fidelidade.`,
    h1: "Site + agenda online para salão de beleza",
    answer:
      "Um site de salão de beleza com agenda online reúne os seus serviços com preços, as fotos dos trabalhos e a equipe, e deixa a cliente marcar corte, escova, coloração ou manicure sozinha, escolhendo a profissional e um horário livre. O salão para de depender do WhatsApp para fechar cada horário.",
    sections: [
      {
        title: "Por que o salão precisa de site além do Instagram",
        paragraphs: [
          "O Instagram mostra os trabalhos, mas não responde “quanto custa a escova?” nem “tem horário sábado?”. O site mostra a tabela de serviços com preço e duração, e o botão de agendar resolve o resto, a qualquer hora.",
          "No Google, quem procura “salão de beleza perto de mim” encontra o seu endereço, as avaliações e o botão de agendar no mesmo lugar.",
        ],
      },
      {
        title: "O que vai no site do seu salão",
        list: [
          "Tabela de serviços: corte, escova, coloração, mechas, tratamentos, manicure",
          "Galeria com até 20 fotos dos trabalhos",
          "Equipe, com a agenda de cada profissional",
          "Avaliações das clientes",
          "Endereço, horário de funcionamento e o botão “Agendar horário”",
        ],
      },
      {
        title: "Agenda que respeita a duração de cada serviço",
        paragraphs: [
          "Uma coloração de três horas não cabe no mesmo espaço de uma escova. A agenda só oferece horários em que o serviço inteiro cabe, com o intervalo que você definir, fora das pausas e dos horários já marcados.",
          "Com mais de uma profissional, cada uma tem a sua agenda, e a cliente escolhe com quem quer ser atendida.",
        ],
      },
      priceSection("clientes"),
    ],
    faq: [
      {
        question: "As clientes precisam baixar algum aplicativo?",
        answer:
          "Não. Elas agendam pelo navegador do celular, numa conversa rápida, sem criar conta.",
      },
      {
        question: "Posso cobrar sinal para horários longos?",
        answer:
          "Sim. Você define o sinal por serviço (valor fixo, porcentagem ou o total) e a cliente paga pelo Pix direto na sua chave ao agendar.",
      },
      {
        question: "Dá para postar os horários livres do dia?",
        answer:
          "Sim. O painel monta o texto com os horários livres de hoje e cria uma arte para os stories, com o link de agendamento.",
      },
      priceFaq,
    ],
    updatedAt: UPDATED,
  },
  {
    slug: "barbearia",
    nicheKey: "barber",
    label: "Barbearias",
    title: "Site + agenda online para barbearia | MeetChat",
    description: `Site para barbearia com cortes, preços e fotos, pronto para o Google, e agenda online para o cliente marcar com o barbeiro. ${SITE_PRICE_TEXT.monthly}.`,
    h1: "Site + agenda online para barbearia",
    answer:
      "Um site de barbearia com agenda online mostra os cortes, os preços, os barbeiros e as fotos dos trabalhos, e deixa o cliente escolher o serviço, o barbeiro e um horário livre sozinho. Você continua na máquina enquanto a agenda se enche, sem parar para responder “tem horário hoje?”.",
    sections: [
      {
        title: "Por que a barbearia precisa de site",
        paragraphs: [
          "Muito cliente novo encontra barbearia pelo Google ou pelo mapa, com buscas como “barbearia perto de mim”. Um site com endereço, fotos dos cortes, preços e avaliações transforma essa busca em agendamento, sem passar pelo WhatsApp.",
          "Para o cliente fiel, o link de agendamento evita fila e espera: ele chega no horário marcado.",
        ],
      },
      {
        title: "O que vai no site da sua barbearia",
        list: [
          "Serviços: corte, barba, corte + barba, pezinho, sobrancelha, pigmentação",
          "Galeria com os cortes e o ambiente",
          "Cada barbeiro com a sua agenda",
          "Avaliações dos clientes",
          "Endereço, mapa e o botão “Agendar”",
        ],
      },
      {
        title: "Menos falta, mais cadeira ocupada",
        paragraphs: [
          "O cliente recebe a confirmação e um lembrete antes do horário, com opção de remarcar. Se alguém cancelar, a lista de espera avisa sozinha quem queria aquele horário.",
          "No painel você vê quem não volta há tempo e pode chamar o cliente para o próximo corte.",
        ],
      },
      priceSection("clientes"),
    ],
    faq: [
      {
        question: "Cada barbeiro tem a sua agenda?",
        answer:
          "Sim. Cada barbeiro tem os seus horários e o cliente escolhe com quem quer cortar ao agendar.",
      },
      {
        question: "Funciona para quem atende por ordem de chegada também?",
        answer:
          "Sim. Você define os horários em que a agenda fica aberta; nos demais, continua atendendo por ordem de chegada.",
      },
      {
        question: "Posso vender pacote de cortes?",
        answer:
          "Sim. Você cria pacotes (por exemplo, 4 cortes por mês) e o painel controla o saldo de cada cliente.",
      },
      priceFaq,
    ],
    updatedAt: UPDATED,
  },
  {
    slug: "designer-de-cilios-e-sobrancelhas",
    nicheKey: "lash-brow",
    label: "Cílios e sobrancelhas",
    title: "Site + agenda online para designer de cílios e sobrancelhas | MeetChat",
    description: `Site para lash designer e designer de sobrancelhas, com fotos e preços, pronto para o Google, e agenda online com sinal pelo Pix. ${SITE_PRICE_TEXT.monthly}.`,
    h1: "Site + agenda online para designer de cílios e sobrancelhas",
    answer:
      "Um site de designer de cílios e sobrancelhas com agenda online mostra as técnicas que você faz (fio a fio, volume brasileiro, brow lamination, henna), com fotos e preços, e deixa a cliente marcar a aplicação ou a manutenção sozinha, no horário livre. Com o sinal pelo Pix, as aplicações longas ficam garantidas.",
    sections: [
      {
        title: "Por que a lash e a brow designer precisam de site",
        paragraphs: [
          "As técnicas mudam de nome a cada temporada e a cliente quer ver o resultado antes de marcar. Um site com a galeria dos seus trabalhos e a explicação de cada técnica responde “qual a diferença entre volume russo e brasileiro?” antes da mensagem.",
          "Também deixa claro o tempo de cada procedimento e a diferença entre aplicação e manutenção.",
        ],
      },
      {
        title: "O que vai no seu site",
        list: [
          "Técnicas de cílios e sobrancelhas com duração e valor",
          "Aplicação e manutenção como serviços separados",
          "Galeria com até 20 fotos dos seus trabalhos",
          "Avaliações das clientes",
          "Botão “Agendar” e o seu endereço",
        ],
      },
      {
        title: "Manutenção no prazo certo",
        paragraphs: [
          "A manutenção de cílios tem prazo. O painel mostra quem está na hora de voltar, para você chamar a cliente antes de os fios caírem.",
          "Para aplicações de duas horas ou mais, o sinal pelo Pix evita o horário vazio.",
        ],
      },
      priceSection("clientes"),
    ],
    faq: [
      {
        question: "A cliente consegue escolher entre aplicação e manutenção?",
        answer:
          "Sim. Cada uma é um serviço com a sua duração e o seu valor, e a agenda só oferece horários em que o procedimento inteiro cabe.",
      },
      {
        question: "Posso cobrar o sinal só na aplicação?",
        answer: "Sim. O sinal é definido serviço por serviço; a manutenção pode ficar sem sinal.",
      },
      {
        question: "Dá para mostrar fotos dos trabalhos?",
        answer:
          "Sim. Você envia as fotos pelo celular e elas aparecem na galeria do site e no seu perfil.",
      },
      priceFaq,
    ],
    updatedAt: UPDATED,
  },
  {
    slug: "manicure",
    nicheKey: "nails",
    label: "Manicures e nail designers",
    title: "Site + agenda online para manicure e nail designer | MeetChat",
    description: `Site para manicure e nail designer com fotos das unhas e tabela de preços, pronto para o Google, e agenda online 24h. ${SITE_PRICE_TEXT.monthly}.`,
    h1: "Site + agenda online para manicure e nail designer",
    answer:
      "Um site de manicure com agenda online mostra as suas unhas (gel, fibra, esmaltação em gel, nail art) com fotos e preços, e deixa a cliente marcar a aplicação ou a manutenção sozinha, a qualquer hora. Você para de perder horário enquanto responde mensagem com a mão ocupada.",
    sections: [
      {
        title: "Por que a manicure precisa de um site",
        paragraphs: [
          "Quem atende sozinha passa o dia com as mãos ocupadas, e cada “tem horário?” no WhatsApp espera até o fim do atendimento. Com o link de agendamento na bio e o site com a tabela de preços, a cliente vê o valor, escolhe o horário e marca sem esperar.",
          "No Google, quem busca “manicure perto de mim” ou “unha de gel” na sua cidade encontra o seu site com as fotos.",
        ],
      },
      {
        title: "O que vai no seu site",
        list: [
          "Serviços: mão, pé, pé e mão, alongamento em gel ou fibra, manutenção, esmaltação em gel",
          "Galeria com as fotos das unhas",
          "Avaliações das clientes",
          "Endereço, ou a informação de atendimento em domicílio",
          "Botão “Agendar” em cada serviço",
        ],
      },
      {
        title: "Manutenção a cada 15 ou 21 dias",
        paragraphs: [
          "O painel mostra as clientes que estão na hora da manutenção, para você chamar antes que elas procurem outra pessoa.",
          "Na sexta à tarde, poste os horários livres do fim de semana no status: o painel monta o texto com o link.",
        ],
      },
      priceSection("clientes"),
    ],
    faq: [
      {
        question: "Atendo em casa e a domicílio. Funciona?",
        answer:
          "Sim. Você cadastra os dois tipos de atendimento como serviços diferentes e informa o endereço ou a região no site.",
      },
      {
        question: "A cliente vê o preço antes de marcar?",
        answer:
          "Vê, se você quiser. Os preços podem ficar visíveis ou escondidos no site e no chat.",
      },
      {
        question: "Posso fazer cupom de desconto para cliente nova?",
        answer: "Sim. Você cria cupons no painel e a cliente usa o código ao agendar.",
      },
      priceFaq,
    ],
    updatedAt: UPDATED,
  },
  {
    slug: "fisioterapeuta",
    nicheKey: "physio",
    label: "Fisioterapeutas",
    title: "Site + agenda online para fisioterapeuta | MeetChat",
    description: `Site profissional para fisioterapeuta, pronto para o Google, e agenda online para o paciente marcar avaliação e sessões. ${SITE_PRICE_TEXT.monthly}.`,
    h1: "Site + agenda online para fisioterapeuta",
    answer:
      "Um site de fisioterapeuta com agenda online apresenta as suas especialidades (ortopédica, esportiva, neurológica, pélvica, RPG), explica como é a avaliação e deixa o paciente marcar a primeira consulta e as sessões sozinho, nos horários livres. Pacotes de sessões e retornos ficam organizados no mesmo painel.",
    sections: [
      {
        title: "Por que o fisioterapeuta precisa de site",
        paragraphs: [
          "O paciente costuma chegar com indicação médica e pesquisa no Google antes de escolher onde fazer as sessões. Um site com as suas especialidades, a estrutura do consultório e as avaliações de pacientes ajuda a escolher você.",
          "Como o tratamento tem várias sessões, a agenda online evita a troca de mensagens para cada remarcação.",
        ],
      },
      {
        title: "O que vai no seu site de fisioterapia",
        list: [
          "Apresentação com foto, CREFITO e especialidades",
          "Avaliação inicial e sessões, com duração",
          "Fotos do consultório e dos equipamentos",
          "Atendimento domiciliar, se você fizer",
          "Botão “Agendar avaliação” e o endereço com mapa",
        ],
      },
      {
        title: "Pacotes de sessões sem planilha",
        paragraphs: [
          "Venda o tratamento em pacote (por exemplo, 10 sessões) e o painel desconta cada sessão do saldo do paciente.",
          "Com mais de um fisioterapeuta, cada um tem a sua agenda, e o paciente marca com quem já o acompanha.",
        ],
      },
      priceSection("pacientes"),
    ],
    faq: [
      {
        question: "O paciente pode remarcar sozinho?",
        answer:
          "Sim. O e-mail de confirmação tem o link para remarcar ou cancelar, dentro das regras de antecedência que você definir.",
      },
      {
        question: "Atendo em clínica e a domicílio. Dá para separar?",
        answer:
          "Sim. Você cria serviços diferentes para cada tipo de atendimento, com a duração de cada um.",
      },
      {
        question: "Funciona com convênio?",
        answer:
          "A agenda funciona para qualquer paciente; o MeetChat não faz faturamento de convênio. Você pode deixar os preços escondidos no site.",
      },
      priceFaq,
    ],
    updatedAt: UPDATED,
  },
  {
    slug: "personal-trainer",
    nicheKey: "personal-trainer",
    label: "Personal trainers",
    title: "Site + agenda online para personal trainer | MeetChat",
    description: `Site para personal trainer com modalidades, planos e fotos, pronto para o Google, e agenda online para o aluno marcar o treino. ${SITE_PRICE_TEXT.monthly}.`,
    h1: "Site + agenda online para personal trainer",
    answer:
      "Um site de personal trainer com agenda online mostra a sua forma de trabalho (musculação, funcional, corrida, treino em casa ou on-line), os planos e os resultados que você acompanha, e deixa o aluno marcar a aula experimental e os treinos nos seus horários livres. Você organiza a semana sem ficar trocando mensagem com cada aluno.",
    sections: [
      {
        title: "Por que o personal precisa de site",
        paragraphs: [
          "O aluno novo quer saber onde você atende, como funciona a aula e quanto custa antes de mandar mensagem. Um site com isso tudo, as suas certificações e o botão de agendar a aula experimental converte quem chega pelo Instagram ou pelo Google.",
          "Para quem atende em vários lugares (academia, condomínio, parque), o site deixa claro onde é cada horário.",
        ],
      },
      {
        title: "O que vai no seu site",
        list: [
          "Apresentação com foto, CREF e especialidades",
          "Aula experimental, treino avulso e planos mensais",
          "Locais de atendimento ou treino on-line",
          "Fotos dos treinos",
          "Botão “Agendar aula experimental”",
        ],
      },
      {
        title: "Planos com saldo de aulas",
        paragraphs: [
          "Venda pacotes de aulas e o painel controla quantas o aluno já usou. O aluno recebe lembrete antes de cada treino, o que reduz os cancelamentos em cima da hora.",
          "No financeiro, você vê o que entrou no mês sem planilha.",
        ],
      },
      priceSection("alunos"),
    ],
    faq: [
      {
        question: "Dá para agendar treino em lugares diferentes?",
        answer:
          "Sim. Crie um serviço para cada local ou modalidade, com a duração e o valor de cada um.",
      },
      {
        question: "O aluno pode marcar vários treinos de uma vez?",
        answer:
          "Ele agenda um treino por vez pelo chat. Com o pacote, o saldo de aulas é descontado a cada agendamento.",
      },
      {
        question: "Funciona para treino on-line?",
        answer:
          "Sim. A sessão on-line é um serviço como os outros; o link da chamada você envia ao aluno.",
      },
      priceFaq,
    ],
    updatedAt: UPDATED,
  },
  {
    slug: "studio-de-pilates",
    nicheKey: "pilates",
    label: "Studios de pilates",
    title: "Site + agenda online para studio de pilates | MeetChat",
    description: `Site para studio de pilates com aulas, planos e fotos do espaço, pronto para o Google, e agenda online para aula experimental e reposições. ${SITE_PRICE_TEXT.monthly}.`,
    h1: "Site + agenda online para studio de pilates",
    answer:
      "Um site de studio de pilates com agenda online apresenta o espaço, os aparelhos, os instrutores e os planos, e deixa o aluno marcar a aula experimental e as reposições sozinho, nos horários com vaga. O studio para de controlar reposição por mensagem e caderno.",
    sections: [
      {
        title: "Por que o studio de pilates precisa de site",
        paragraphs: [
          "Quem procura pilates quer ver o espaço, os aparelhos e saber se tem horário perto de casa ou do trabalho. Um site com fotos do studio, a explicação das modalidades (solo, aparelhos, clínico) e o botão para marcar a aula experimental transforma a busca no Google em aluno novo.",
          "Também é o lugar para explicar os planos (duas ou três vezes por semana) e as regras de reposição.",
        ],
      },
      {
        title: "O que vai no site do seu studio",
        list: [
          "Fotos do espaço e dos aparelhos",
          "Modalidades e instrutores",
          "Aula experimental com o botão de agendar",
          "Planos e pacotes de aulas",
          "Endereço, mapa e horário de funcionamento",
        ],
      },
      {
        title: "Reposição sem caderno",
        paragraphs: [
          "Com pacotes de aulas, o aluno agenda a reposição num horário com vaga e o saldo é descontado sozinho. Cada instrutor tem a sua agenda.",
          "A lista de espera avisa quem queria um horário quando alguém cancela.",
        ],
      },
      priceSection("alunos"),
    ],
    faq: [
      {
        question: "Funciona para aulas em grupo nos aparelhos?",
        answer:
          "A agenda trabalha por profissional e por recurso (aparelho ou sala): um horário ocupado não é oferecido de novo. Para turmas com vários alunos no mesmo horário, fale com o suporte para ver a melhor configuração.",
      },
      {
        question: "Dá para cobrar a aula experimental?",
        answer: "Sim. Ela é um serviço com valor (ou gratuito) e pode ter sinal pelo Pix.",
      },
      {
        question: "Cada instrutor vê os seus alunos?",
        answer:
          "Sim. Cada instrutor tem a própria agenda e o próprio acesso ao painel, e recebe os avisos dos agendamentos dele.",
      },
      priceFaq,
    ],
    updatedAt: UPDATED,
  },
];

export const SITE_AGENDA_INDEX = {
  title: "Site + agenda online para profissionais e negócios | MeetChat",
  description: `Site profissional pronto para o Google com agenda online: seus clientes marcam sozinhos, 24h. ${SITE_PRICE_TEXT.monthly}, sem fidelidade. Veja por área.`,
  h1: "Site + agenda online para o seu negócio",
  intro:
    "Um site do seu negócio, pronto para aparecer no Google, com a agenda online dentro: todo botão “Agendar” abre uma conversa em que o cliente escolhe o serviço, o dia e um horário livre e confirma sozinho. Escolha a sua área para ver como fica.",
  updatedAt: UPDATED,
};

export function getSiteAgendaPage(slug: string): SiteAgendaPage | null {
  return SITE_AGENDA_PAGES.find((p) => p.slug === slug) ?? null;
}
