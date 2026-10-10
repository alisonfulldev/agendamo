/**
 * SEO texts of each niche page (long tail): title, description, H1 and unique paragraphs and
 * questions, so each page reads as made for that niche. Anything left out falls back to the
 * niche's brand file (src/content/niche-pages.ts). Only real features are mentioned: chat booking
 * 24 h, automatic reminders, packages, waitlist, agenda per professional, shared rooms
 * and equipment, Google Calendar, button on the site and simple finance.
 */
export interface NicheSeo {
  /** <title>: main search of the niche first (up to ~60 characters). */
  title?: string;
  /** Meta description (up to ~155 characters). */
  description?: string;
  h1?: string;
  subtitle?: string;
  painsTitle?: string;
  intro?: { title: string; paragraphs: string[] };
  /** Niche questions (long tail), shown before the shared ones. */
  faq?: { question: string; answer: string }[];
  /** Extra examples for the animated phone. */
  demo?: { business: string; customer: string; service: string; times: string[] }[];
}

export const NICHE_SEO: Record<string, NicheSeo> = {
  // ---------------------------------------------------------------- Beleza e estética
  beauty: {
    title: "Agenda online para salão de beleza | MeetChat",
    description:
      "Sistema de agendamento para salão de beleza: a cliente marca corte, escova e unhas pelo seu link, 24h, e você recebe o aviso no celular. Grátis para sempre.",
    h1: "Salão de agenda cheia, sem responder mensagem",
    subtitle: "A cliente marca pelo seu link, 24h. Você só atende.",
    painsTitle: "Quanto tempo o seu salão perde respondendo “tem horário?”",
    intro: {
      title: "Um sistema de agendamento feito para salão de beleza",
      paragraphs: [
        "No salão, cada mensagem respondida no meio de uma escova é um atendimento atrasado. Com o MeetChat, a cliente toca no seu link, no Instagram ou no WhatsApp, escolhe o serviço e a profissional, vê só os horários realmente livres e já fica na agenda.",
        "Cada cabeleireira, manicure e designer tem a própria agenda, o tempo de cada serviço é respeitado e a cliente recebe a confirmação e o lembrete automaticamente. Para serviços longos, como mechas e progressiva, o plano Pro pede sinal pelo Pix, pago direto para você.",
      ],
    },
    faq: [
      {
        question: "Funciona para salão com várias profissionais?",
        answer:
          "Sim. Cada profissional tem a própria agenda e seus serviços. A cliente escolhe com quem quer ser atendida ou pede qualquer profissional livre.",
      },
      {
        question: "Dá para cobrar sinal em mechas, progressiva e outros serviços longos?",
        answer:
          "Dá, no plano Pro: o cliente paga o sinal pelo Pix direto para você e envia o comprovante no chat. Você confere no banco e confirma.",
      },
      {
        question: "Como a cliente marca horário no salão pelo Instagram?",
        answer:
          "Coloque o seu link do MeetChat no Instagram, no WhatsApp ou no seu site. A cliente toca, conversa com o chat, escolhe o serviço e o horário e pronto: o agendamento aparece na sua agenda.",
      },
    ],
    demo: [
      {
        business: "Salão Bela Rosa",
        customer: "Fernanda",
        service: "Escova",
        times: ["10:00", "13:30", "16:00"],
      },
    ],
  },
  barber: {
    title: "Sistema de agendamento para barbearia | MeetChat",
    description:
      "Agenda online para barbearia: o cliente marca corte e barba pelo seu link, escolhe o barbeiro e o horário livre, 24h por dia. Grátis para sempre.",
    h1: "Barbearia lotada sem largar a máquina",
    subtitle: "O cliente marca o corte pelo link, até de madrugada.",
    painsTitle: "Quantos cortes você perde parando para responder “tem horário hoje?”",
    intro: {
      title: "Feito para o ritmo de uma barbearia",
      paragraphs: [
        "Na barbearia o celular não para: cliente perguntando horário, remarcando, sumindo. Com o MeetChat, ele toca no link, escolhe o serviço e o barbeiro, vê os horários livres e já fica agendado, sem você largar a máquina.",
        "Cada barbeiro tem a própria agenda e os próprios serviços, o encaixe respeita o tempo de cada corte e o lembrete automático reduz as cadeiras vazias. No fim do mês, o financeiro mostra quanto entrou com os atendimentos.",
      ],
    },
    faq: [
      {
        question: "Cada barbeiro pode ter a própria agenda?",
        answer:
          "Pode. Cada barbeiro tem horários e serviços próprios, e o cliente escolhe com quem quer cortar ou pega o primeiro horário livre.",
      },
      {
        question: "Existe app de agendamento para barbearia sem o cliente baixar nada?",
        answer:
          "É exatamente o MeetChat: o cliente abre o link no navegador do celular, como uma conversa, e agenda sem instalar aplicativo.",
      },
      {
        question: "Dá para vender combo de corte e barba?",
        answer:
          "Dá. Você cria combos com preço especial e pacotes de cortes, e o cliente escolhe direto no chat.",
      },
    ],
    demo: [
      {
        business: "Barbearia do Zé",
        customer: "Rafael",
        service: "Corte + barba",
        times: ["10:00", "18:30", "19:30"],
      },
    ],
  },
  aesthetics: {
    title: "Agenda para clínica de estética | MeetChat",
    description:
      "Sistema de agendamento para clínica de estética e esteticistas: procedimentos marcados por chat, sem conflito de sala ou maca, com lembrete automático. Grátis para sempre.",
    h1: "Sua clínica de estética agendando sozinha",
    subtitle: "Procedimentos marcados por chat, sem conflito de sala.",
    intro: {
      title: "Agendamento pensado para estética",
      paragraphs: [
        "Na estética, um horário marcado na sala errada vira atraso para o dia inteiro. O MeetChat só oferece o horário quando a profissional e o recurso (sala, maca ou aparelho) estão livres ao mesmo tempo.",
        "A cliente escolhe o procedimento pelo seu link, recebe a confirmação e o lembrete automaticamente. Pacotes de sessões ficam organizados, com o saldo de cada cliente.",
      ],
    },
    faq: [
      {
        question: "O sistema evita duas clientes na mesma maca?",
        answer:
          "Sim. Você cadastra salas, macas e aparelhos como recursos, e o horário só aparece quando o recurso necessário está livre.",
      },
      {
        question: "Dá para vender pacote de sessões de estética?",
        answer:
          "Dá. Você cria pacotes (por exemplo, 10 sessões de drenagem) e acompanha quantas sessões cada cliente ainda tem.",
      },
      {
        question: "Posso pedir sinal antes do procedimento?",
        answer: "Dá, no plano Pro: o cliente paga o sinal pelo Pix direto para você e envia o comprovante no chat. Você confere no banco e confirma.",
      },
    ],
    demo: [
      {
        business: "Clínica Essência",
        customer: "Juliana",
        service: "Limpeza de pele",
        times: ["09:00", "11:00", "15:30"],
      },
    ],
  },
  nails: {
    title: "Agenda para manicure e nail designer | MeetChat",
    description:
      "Agendamento online para manicure, esmalteria e nail designer: a cliente marca unha, alongamento e manutenção pelo link, 24h. Grátis para sempre.",
    h1: "Unhas agendadas sem largar o esmalte",
    subtitle: "A cliente marca pelo seu link, 24h por dia.",
    intro: {
      title: "Agenda online para esmalteria e nail designer",
      paragraphs: [
        "Quem trabalha com unhas sabe: dá para responder mensagem com a mão no esmalte? Com o MeetChat, a cliente escolhe o serviço pelo seu link e só vê os horários livres, já com o tempo certo de cada serviço.",
        "O lembrete automático reduz as faltas nos alongamentos, e a lista de espera avisa quem queria um horário que vagou. Depois de agendar, o chat ainda oferece deixar a próxima manutenção marcada.",
      ],
    },
    faq: [
      {
        question: "Dá para lembrar a cliente da manutenção do alongamento?",
        answer:
          "Dá. Você define o retorno ideal do serviço (por exemplo, 15 dias) e, logo depois de agendar, o chat oferece deixar a próxima manutenção marcada.",
      },
      {
        question: "Serve para esmalteria com várias manicures?",
        answer:
          "Serve. Cada manicure tem a própria agenda e a cliente escolhe com quem quer fazer as unhas.",
      },
      {
        question: "Como evitar cliente que marca alongamento e não aparece?",
        answer:
          "No plano Pro, peça sinal pelo Pix nos serviços longos: a cliente envia o comprovante no chat. E conte com o lembrete automático antes do horário.",
      },
    ],
    demo: [
      {
        business: "Esmalteria Flor",
        customer: "Larissa",
        service: "Alongamento em gel",
        times: ["09:30", "13:00", "16:30"],
      },
    ],
  },
  "lash-brow": {
    title: "Agenda para lash designer e sobrancelha | MeetChat",
    description:
      "Agendamento online para lash designer e designer de sobrancelha: extensão de cílios, manutenção e brow lamination marcados por chat, 24h. Grátis para sempre.",
    h1: "Cílios e sobrancelha agendados sozinhos",
    subtitle: "A cliente marca pelo link e recebe lembrete. Menos faltas.",
    intro: {
      title: "Feito para quem trabalha com cílios e sobrancelhas",
      paragraphs: [
        "Procedimentos de cílios são longos e uma falta derruba a agenda do dia. Com o MeetChat, a cliente agenda sozinha pelo link, recebe a confirmação e o lembrete.",
        "O chat oferece já deixar a manutenção marcada no intervalo certo, e a lista de espera ajuda a preencher o horário de quem desmarcou.",
      ],
    },
    faq: [
      {
        question: "Dá para marcar a manutenção dos cílios já no primeiro agendamento?",
        answer:
          "Dá. Com o retorno ideal cadastrado no serviço, o chat oferece deixar a manutenção marcada logo depois do agendamento.",
      },
      {
        question: "Posso cobrar sinal na extensão de cílios?",
        answer: "Dá, no plano Pro: o cliente paga o sinal pelo Pix direto para você e envia o comprovante no chat. Você confere no banco e confirma.",
      },
      {
        question: "Funciona para studio de sobrancelha com mais de uma profissional?",
        answer:
          "Funciona. Cada profissional tem a própria agenda e a cliente escolhe com quem quer ser atendida.",
      },
    ],
    demo: [
      {
        business: "Studio Olhar",
        customer: "Gabriela",
        service: "Extensão de cílios",
        times: ["10:00", "14:00", "17:00"],
      },
    ],
  },
  tattoo: {
    title: "Agenda para estúdio de tatuagem e piercing | MeetChat",
    description:
      "Agendamento online para estúdio de tatuagem: orçamentos, sessões e piercings marcados por chat, com agenda por tatuador. Grátis para sempre.",
    h1: "Sessões de tatuagem agendadas sem troca de mensagens",
    subtitle: "O cliente escolhe o tatuador e o horário pelo link.",
    intro: {
      title: "Agendamento feito para estúdio de tatuagem",
      paragraphs: [
        "Sessão de tatuagem dura horas, e um cliente que some deixa o tatuador parado. Com o MeetChat, o cliente marca orçamento ou sessão pelo seu link, sem troca de mensagens.",
        "Cada tatuador tem a própria agenda, os horários respeitam a duração de cada sessão e o lembrete automático chega antes do dia marcado.",
      ],
    },
    faq: [
      {
        question: "Dá para exigir sinal para garantir a sessão?",
        answer:
          "Dá, no plano Pro: o cliente paga o sinal pelo Pix direto para você e envia o comprovante no chat. Você confere no banco e confirma.",
      },
      {
        question: "Cada tatuador pode ter a própria agenda?",
        answer: "Pode. O cliente escolhe o tatuador e só vê os horários livres dele.",
      },
      {
        question: "Dá para marcar só o orçamento antes da tatuagem?",
        answer:
          "Dá. Cadastre um serviço de orçamento (com ou sem valor) e o cliente agenda a conversa antes da sessão.",
      },
    ],
    demo: [
      {
        business: "Black Ink Studio",
        customer: "Lucas",
        service: "Sessão de tatuagem",
        times: ["11:00", "14:00", "16:00"],
      },
    ],
  },

  // ---------------------------------------------------------------- Saúde
  psychology: {
    title: "Agenda online para psicólogos | MeetChat",
    description:
      "Sistema de agendamento para psicólogos: o paciente marca a sessão, presencial ou online, pelo seu link, com discrição e lembrete automático. Grátis para sempre.",
    h1: "Seu paciente agenda a sessão com discrição",
    subtitle: "Pelo seu link, sem troca de mensagens. Presencial ou online.",
    painsTitle: "Quanto do seu dia vai em combinar horário por mensagem?",
    intro: {
      title: "Um agendamento discreto para o consultório de psicologia",
      paragraphs: [
        "Muitos pacientes têm receio de perguntar se há vaga. Com o MeetChat, a pessoa agenda sozinha, no próprio ritmo, sem precisar explicar nada por mensagem, e recebe a confirmação na hora.",
        "Você define os atendimentos (primeira consulta, sessão, sessão online), a duração e os intervalos entre pacientes. Os lembretes automáticos não mencionam o motivo do atendimento, e a sua agenda fica organizada num lugar só, com o Google Agenda integrado.",
      ],
    },
    faq: [
      {
        question: "O agendamento é discreto para o paciente?",
        answer:
          "Sim. O paciente agenda sozinho, sem precisar contar nada por mensagem, e os avisos falam só de data e horário.",
      },
      {
        question: "Funciona para sessões online?",
        answer:
          "Funciona. Cadastre a sessão online com a duração dela e o paciente escolhe entre presencial e online.",
      },
      {
        question: "Dá para deixar intervalo entre um paciente e outro?",
        answer:
          "Dá. Cada atendimento pode ter um intervalo depois, e o sistema só oferece horários em que sessão e intervalo cabem inteiros.",
      },
    ],
    demo: [
      {
        business: "Consultório Acolher",
        customer: "Carla",
        service: "Sessão online",
        times: ["08:00", "17:00", "19:00"],
      },
    ],
  },
  psychoanalysis: {
    title: "Agenda online para psicanalistas | MeetChat",
    description:
      "Agendamento online para psicanalistas: o analisando marca a sessão pelo seu link, com confirmação e lembrete automáticos. Grátis para sempre.",
    h1: "Sessões de psicanálise agendadas sem interrupção",
    subtitle: "O analisando marca pelo seu link, com lembrete automático.",
    intro: {
      title: "Agenda simples para o consultório de psicanálise",
      paragraphs: [
        "Combinar horários entre uma sessão e outra tira a atenção do trabalho clínico. Com o MeetChat, o analisando escolhe um horário livre pelo seu link e recebe a confirmação na hora.",
        "Você controla os dias e horários de atendimento, a duração de cada sessão e os intervalos, e o lembrete automático reduz as faltas sem você precisar mandar mensagem.",
      ],
    },
    faq: [
      {
        question: "Dá para atender presencial e online no mesmo sistema?",
        answer:
          "Dá. Cadastre os dois tipos de sessão com as durações e o analisando escolhe a modalidade ao agendar.",
      },
      {
        question: "O analisando precisa criar conta para agendar?",
        answer:
          "Não. Ele só informa o nome e o contato na conversa; não há cadastro nem aplicativo.",
      },
    ],
  },
  physio: {
    title: "Sistema de agendamento para fisioterapia | MeetChat",
    description:
      "Agenda online para fisioterapeutas e clínicas de fisioterapia: sessões, avaliações e pacotes marcados por chat, com lembrete contra faltas. Grátis para sempre.",
    h1: "Fisioterapia sem faltas e sem planilha",
    subtitle: "Sessões e pacotes marcados pelo paciente, com lembrete.",
    intro: {
      title: "Agenda feita para clínica de fisioterapia",
      paragraphs: [
        "Tratamento de fisioterapia é feito de muitas sessões, e cada falta atrasa a evolução do paciente. Com o MeetChat, o paciente agenda pelo link, recebe a confirmação e o lembrete, e remarca sozinho quando precisa.",
        "Pacotes de sessões ficam com o saldo atualizado, cada fisioterapeuta tem a própria agenda e salas ou aparelhos compartilhados só são oferecidos quando estão livres.",
      ],
    },
    faq: [
      {
        question: "Dá para controlar pacote de sessões de fisioterapia?",
        answer:
          "Dá. Você cria pacotes (por exemplo, 10 sessões) e acompanha quantas sessões cada paciente ainda tem.",
      },
      {
        question: "Funciona para clínica com vários fisioterapeutas?",
        answer:
          "Funciona. Cada profissional tem a própria agenda, e salas e aparelhos compartilhados não são marcados em dobro.",
      },
      {
        question: "O paciente consegue remarcar sozinho?",
        answer:
          "Consegue. A confirmação e o lembrete trazem um link para remarcar ou cancelar, liberando o horário para outra pessoa.",
      },
    ],
    demo: [
      {
        business: "Fisio Movimento",
        customer: "Pedro",
        service: "Sessão de fisioterapia",
        times: ["07:30", "12:00", "18:00"],
      },
    ],
  },
  nutrition: {
    title: "Agenda online para nutricionistas | MeetChat",
    description:
      "Sistema de agendamento para nutricionista: consultas, retornos e atendimentos online marcados por chat, com lembrete automático. Grátis para sempre.",
    h1: "Seu paciente marca consulta e retorno sozinho",
    subtitle: "Pelo seu link, 24h por dia. Presencial ou online.",
    intro: {
      title: "Agendamento para o consultório de nutrição",
      paragraphs: [
        "O paciente que some depois da primeira consulta raramente volta sozinho. Com o MeetChat, logo depois de agendar, o chat oferece já deixar o retorno marcado no intervalo que você definir.",
        "Você cadastra consultas presenciais e online com valores e durações próprias, e o paciente vê tudo isso antes de agendar, sem precisar perguntar por mensagem.",
      ],
    },
    faq: [
      {
        question: "Dá para o paciente já marcar o retorno?",
        answer:
          "Dá. Com o retorno ideal cadastrado (por exemplo, 30 dias), o chat oferece deixar o próximo horário marcado logo depois do agendamento.",
      },
      {
        question: "Funciona para consulta online de nutrição?",
        answer:
          "Funciona. Cadastre a consulta online com a duração e o valor dela e o paciente escolhe a modalidade.",
      },
    ],
    demo: [
      {
        business: "Nutri Equilíbrio",
        customer: "Fernanda",
        service: "Retorno",
        times: ["09:00", "14:00", "18:00"],
      },
    ],
  },
  "speech-therapy": {
    title: "Agenda online para fonoaudiólogos | MeetChat",
    description:
      "Agendamento online para fonoaudiologia: pais e pacientes marcam terapias e avaliações pelo seu link, com lembrete automático. Grátis para sempre.",
    h1: "Fono agendada pelos pais, a qualquer hora",
    subtitle: "Eles marcam pelo seu link e recebem lembrete.",
    intro: {
      title: "Agenda feita para o consultório de fonoaudiologia",
      paragraphs: [
        "Em fono infantil, quem agenda são os pais, e eles mandam mensagem a qualquer hora. Com o MeetChat, a família escolhe o horário livre pelo seu link, à noite ou no fim de semana, e recebe a confirmação na hora.",
        "A confirmação e o lembrete chegam para quem agendou, e a remarcação é feita pelo próprio link, sem você precisar parar uma sessão para responder.",
      ],
    },
    faq: [
      {
        question: "Os pais podem agendar pela criança?",
        answer:
          "Podem. Quem agenda informa o nome e o contato, e os avisos chegam para essa pessoa.",
      },
      {
        question: "Dá para atender online?",
        answer: "Dá. Cadastre a terapia online como um atendimento próprio, com a duração dela.",
      },
    ],
  },
  "occupational-therapy": {
    title: "Agenda para terapeuta ocupacional | MeetChat",
    description:
      "Sistema de agendamento para terapia ocupacional: famílias marcam avaliações e atendimentos pelo seu link, com lembrete automático. Grátis para sempre.",
    h1: "Terapia ocupacional agendada pelas famílias",
    subtitle: "Pelo seu link, com lembrete e salas sem conflito.",
    intro: {
      title: "Agendamento para terapia ocupacional",
      paragraphs: [
        "Combinar horário com cada família por mensagem toma tempo de atendimento. Com o MeetChat, a família agenda pelo seu link, recebe a confirmação e o lembrete, e remarca sozinha quando precisa.",
        "Se a clínica divide salas de integração sensorial, elas entram como recursos: o horário só aparece quando a sala e a terapeuta estão livres.",
      ],
    },
    faq: [
      {
        question: "Dá para controlar a sala de integração sensorial?",
        answer:
          "Dá. Cadastre a sala como recurso e ela nunca é marcada para dois atendimentos ao mesmo tempo.",
      },
      {
        question: "Funciona com mais de uma terapeuta?",
        answer: "Funciona. Cada terapeuta tem a própria agenda e os próprios atendimentos.",
      },
    ],
  },
  psychopedagogy: {
    title: "Agenda online para psicopedagogos | MeetChat",
    description:
      "Agendamento online para psicopedagogia: os pais marcam avaliações, atendimentos e devolutivas pelo seu link, com lembrete automático. Grátis para sempre.",
    h1: "Psicopedagogia agendada pelos pais, sem mensagem",
    subtitle: "Eles marcam pelo seu link, à noite ou no fim de semana.",
    intro: {
      title: "Agenda para o espaço de psicopedagogia",
      paragraphs: [
        "Os pais costumam procurar horário à noite, depois do trabalho. Com o MeetChat, eles agendam sozinhos pelo seu link e recebem a confirmação na hora.",
        "Avaliações em várias sessões, atendimentos semanais e devolutivas ficam organizados na agenda, com lembrete automático para a família.",
      ],
    },
    faq: [
      {
        question: "Dá para marcar a devolutiva aos pais?",
        answer:
          "Dá. Cadastre a devolutiva como um atendimento com a duração dela e os pais agendam como qualquer outro.",
      },
      {
        question: "Os pais precisam baixar aplicativo?",
        answer: "Não. O link abre no navegador do celular, como uma conversa.",
      },
    ],
  },
  dentistry: {
    title: "Agenda online para dentista e clínica odontológica | MeetChat",
    description:
      "Sistema de agendamento para dentistas: o paciente marca avaliação, limpeza e manutenção pelo link, com lembrete automático. Grátis para sempre.",
    h1: "Consultório odontológico agendando 24h",
    subtitle: "O paciente marca pelo link. A recepção respira.",
    intro: {
      title: "Agendamento para consultório e clínica odontológica",
      paragraphs: [
        "A recepção presa no telefone é um dos maiores gargalos da clínica. Com o MeetChat, o paciente agenda pelo link, à hora que quiser, e a confirmação e o lembrete saem automaticamente.",
        "Cada dentista tem a própria agenda, cadeiras e salas entram como recursos e o chat oferece já deixar marcada a próxima manutenção de aparelho ou limpeza.",
      ],
    },
    faq: [
      {
        question: "Dá para lembrar o paciente da manutenção do aparelho?",
        answer:
          "Dá. Com o retorno ideal cadastrado no serviço, o chat oferece deixar a próxima manutenção marcada logo depois do agendamento.",
      },
      {
        question: "Funciona para clínica com vários dentistas e cadeiras?",
        answer:
          "Funciona. Cada dentista tem a própria agenda e as cadeiras não são marcadas em dobro.",
      },
    ],
  },
  medical: {
    title: "Agenda online para consultório médico | MeetChat",
    description:
      "Sistema de agendamento para consultório médico particular: o paciente marca consulta e retorno pelo seu link, com confirmação e lembrete. Grátis para sempre.",
    h1: "Consultas médicas marcadas pelo paciente, 24h",
    subtitle: "Pelo seu link, com confirmação e lembrete automáticos.",
    intro: {
      title: "Agendamento para consultório particular",
      paragraphs: [
        "Com o MeetChat, o paciente escolhe a consulta e um horário livre pelo seu link e recebe a confirmação e o lembrete automaticamente. Remarcações e cancelamentos são feitos pelo próprio paciente, liberando o horário.",
        "A agenda integra com o Google Agenda, para compromissos pessoais bloquearem horários, e os retornos podem ficar marcados logo depois da consulta.",
      ],
    },
    faq: [
      {
        question: "O sistema funciona para consultas por convênio?",
        answer:
          "O MeetChat é feito para agendamento particular: o paciente escolhe a consulta e o horário. Não há faturamento de convênio.",
      },
      {
        question: "Dá para bloquear horários com compromissos pessoais?",
        answer:
          "Dá. Conectando o Google Agenda, seus compromissos bloqueiam os horários do chat automaticamente.",
      },
    ],
  },
  podiatry: {
    title: "Agenda online para podólogos | MeetChat",
    description:
      "Agendamento online para podologia: o paciente marca atendimentos e retornos pelo seu link, com lembrete automático. Grátis para sempre.",
    h1: "Podologia com agenda cheia e retornos marcados",
    subtitle: "O paciente agenda pelo seu link, 24h por dia.",
    intro: {
      title: "Agendamento para o consultório de podologia",
      paragraphs: [
        "Tratamentos de podologia costumam pedir retorno, e é fácil o paciente esquecer. Com o MeetChat, o chat oferece já deixar o retorno marcado logo depois do primeiro agendamento.",
        "O paciente agenda pelo seu link, recebe a confirmação e o lembrete, e você vê o dia organizado no painel, pelo celular.",
      ],
    },
    faq: [
      {
        question: "Dá para marcar o retorno do tratamento de unha encravada?",
        answer:
          "Dá. Com o retorno cadastrado no serviço, o chat oferece deixar o próximo horário marcado.",
      },
    ],
  },
  chiropractic: {
    title: "Agenda online para quiropraxia | MeetChat",
    description:
      "Sistema de agendamento para quiropraxistas: avaliações, ajustes e retornos marcados pelo paciente pelo seu link, com lembrete. Grátis para sempre.",
    h1: "Quiropraxia: o paciente com dor marca na hora",
    subtitle: "Pelo seu link, até à noite e no fim de semana.",
    intro: {
      title: "Agendamento para o consultório de quiropraxia",
      paragraphs: [
        "Paciente com dor quer marcar na hora, muitas vezes fora do horário comercial. Com o MeetChat, ele agenda pelo seu link, à noite ou no fim de semana, e já fica na agenda.",
        "Pacotes de ajustes ficam com o saldo atualizado, e o chat oferece deixar o retorno marcado no intervalo que você definir.",
      ],
    },
    faq: [
      {
        question: "Dá para vender pacote de sessões de ajuste?",
        answer: "Dá. Você cria pacotes e acompanha quantas sessões cada paciente ainda tem.",
      },
    ],
  },
  osteopathy: {
    title: "Agenda online para osteopatas | MeetChat",
    description:
      "Agendamento online para osteopatia: o paciente marca primeira consulta e sessões pelo seu link, com confirmação e lembrete. Grátis para sempre.",
    h1: "Osteopatia agendada sem troca de mensagens",
    subtitle: "O paciente marca pelo seu link e recebe lembrete.",
    intro: {
      title: "Agendamento para o consultório de osteopatia",
      paragraphs: [
        "Com o MeetChat, o paciente escolhe o atendimento e um horário livre pelo seu link e recebe a confirmação na hora, sem esperar você terminar a sessão para responder.",
        "Os lembretes automáticos reduzem as faltas e o paciente remarca sozinho pelo link da confirmação, liberando o horário para outra pessoa.",
      ],
    },
    faq: [
      {
        question: "Dá para atender em mais de um endereço?",
        answer:
          "Cada conta tem uma agenda por profissional; para dois consultórios, você cadastra os dias e horários de cada lugar na sua agenda.",
      },
    ],
  },

  // ---------------------------------------------------------------- Bem-estar e movimento
  acupuncture: {
    title: "Agenda online para acupunturistas | MeetChat",
    description:
      "Sistema de agendamento para acupuntura e auriculoterapia: sessões e pacotes marcados pelo seu link, com lembrete automático. Grátis para sempre.",
    h1: "Acupuntura com sessões em dia, sem cobrar ninguém",
    subtitle: "O paciente agenda pelo link e recebe lembrete.",
    intro: {
      title: "Agendamento para o espaço de acupuntura",
      paragraphs: [
        "Tratamentos de acupuntura são feitos em sequência de sessões. Com o MeetChat, o paciente agenda pelo seu link, recebe o lembrete e mantém a regularidade sem você precisar cobrar.",
        "Pacotes de sessões ficam organizados com o saldo de cada paciente, e a lista de espera preenche os horários que vagam.",
      ],
    },
    faq: [
      {
        question: "Dá para controlar pacote de sessões de acupuntura?",
        answer: "Dá. Você cria pacotes e acompanha o saldo de sessões de cada paciente.",
      },
    ],
  },
  "massage-therapy": {
    title: "Agenda online para massoterapeutas | MeetChat",
    description:
      "Agendamento online para massoterapia e espaços de massagem: o cliente marca massagem e drenagem pelo link, 24h, com lembrete. Grátis para sempre.",
    h1: "Massagens agendadas até de madrugada",
    subtitle: "O cliente marca pelo link. Salas e macas sem conflito.",
    intro: {
      title: "Agendamento para espaço de massoterapia",
      paragraphs: [
        "Quem procura massagem quer marcar na hora, muitas vezes para o mesmo dia. Com o MeetChat, o cliente vê só os horários livres e agenda pelo seu link em poucos toques.",
        "Salas e macas entram como recursos, os pacotes ficam organizados e o lembrete automático chega antes do horário.",
      ],
    },
    faq: [
      {
        question: "Dá para vender pacote de massagens?",
        answer: "Dá. Você cria pacotes e combos e o cliente escolhe direto no chat.",
      },
      {
        question: "O sistema controla as salas de massagem?",
        answer:
          "Controla. Cadastre as salas como recursos e o horário só aparece quando há sala e profissional livres.",
      },
    ],
  },
  "integrative-therapy": {
    title: "Agenda para terapeuta holístico e integrativo | MeetChat",
    description:
      "Agendamento online para terapias integrativas: reiki, aromaterapia, terapia floral e constelação marcados pelo seu link, 24h. Grátis para sempre.",
    h1: "Terapias integrativas agendadas sem quebrar o clima",
    subtitle: "A pessoa marca pelo seu link e recebe lembrete.",
    intro: {
      title: "Agendamento para terapias integrativas e holísticas",
      paragraphs: [
        "Combinar horário com cada pessoa por mensagem quebra o clima do seu trabalho. Com o MeetChat, a pessoa agenda sozinha pelo seu link e recebe a confirmação na hora.",
        "Você cadastra cada terapia com a duração e o valor dela, e a sua agenda fica organizada num lugar só, com lembretes automáticos.",
      ],
    },
    faq: [
      {
        question: "Dá para cadastrar terapias com durações diferentes?",
        answer:
          "Dá. Cada terapia tem a própria duração, e o sistema só oferece horários em que ela cabe inteira.",
      },
    ],
  },
  pilates: {
    title: "Agenda online para estúdio de pilates | MeetChat",
    description:
      "Sistema de agendamento para pilates: o aluno marca aula individual e experimental pelo link, com lembrete automático. Grátis para sempre.",
    h1: "Aula experimental de pilates marcada na hora",
    subtitle: "Quem chega pelo Instagram ou WhatsApp agenda na hora, pelo seu link.",
    intro: {
      title: "Agendamento para estúdio e instrutor de pilates",
      paragraphs: [
        "Aula experimental que nunca é marcada é aluno perdido. Com o MeetChat, quem chega pelo Instagram agenda a experimental na hora, pelo seu link.",
        "Os aparelhos entram como recursos, os pacotes de aulas ficam organizados e o lembrete automático reduz os horários vazios.",
      ],
    },
    faq: [
      {
        question: "Dá para agendar aula experimental grátis?",
        answer: "Dá. Cadastre a aula experimental sem valor e o aluno agenda direto pelo seu link.",
      },
      {
        question: "Funciona para aulas em grupo?",
        answer:
          "Hoje o MeetChat agenda um atendimento por vez em cada horário; é ideal para aulas individuais e experimentais.",
      },
    ],
  },
  yoga: {
    title: "Agenda online para professor de yoga | MeetChat",
    description:
      "Agendamento online para yoga e meditação: o aluno marca aula individual e experimental pelo seu link, com lembrete. Grátis para sempre.",
    h1: "Alunos de yoga agendando sozinhos",
    subtitle: "Aula experimental ou individual marcada pelo seu link.",
    intro: {
      title: "Agendamento para professores e estúdios de yoga",
      paragraphs: [
        "Com o MeetChat, quem quer começar marca a aula experimental na hora, pelo seu link, sem esperar resposta.",
        "As aulas individuais ficam organizadas na agenda, com lembrete automático e remarcação pelo próprio aluno.",
      ],
    },
    faq: [
      {
        question: "Dá para oferecer aula experimental?",
        answer: "Dá. Cadastre a aula experimental (com ou sem valor) e o aluno agenda sozinho.",
      },
    ],
  },
  "personal-trainer": {
    title: "Agenda online para personal trainer | MeetChat",
    description:
      "Sistema de agendamento para personal trainer: o aluno marca treino e avaliação física pelo seu link, com lembrete contra faltas. Grátis para sempre.",
    h1: "Treinos marcados sem remarcar por mensagem",
    subtitle: "O aluno agenda pelo seu link e recebe lembrete.",
    intro: {
      title: "Agendamento para personal trainers",
      paragraphs: [
        "Remarcar treino por mensagem toda semana toma o tempo que você podia usar treinando. Com o MeetChat, o aluno escolhe o horário livre pelo seu link e remarca sozinho quando precisa.",
        "O lembrete automático reduz as faltas, os pacotes de treinos ficam organizados e o financeiro mostra quanto entrou no mês.",
      ],
    },
    faq: [
      {
        question: "Dá para vender pacote mensal de treinos?",
        answer: "Dá. Você cria pacotes e acompanha quantos treinos cada aluno ainda tem.",
      },
    ],
  },

  // ---------------------------------------------------------------- Pets
  "pet-grooming": {
    title: "Sistema de agendamento para pet shop e banho e tosa | MeetChat",
    description:
      "Agenda online para banho e tosa: o tutor marca banho, tosa e hidratação pelo link, 24h, com lembrete automático. Grátis para sempre.",
    h1: "Banho e tosa agendado sem atender telefone",
    subtitle: "O tutor marca pelo seu link, 24h por dia.",
    intro: {
      title: "Agendamento feito para pet shop",
      paragraphs: [
        "No pet shop, o telefone toca o dia todo para marcar banho. Com o MeetChat, o tutor agenda pelo seu link, escolhe o serviço do porte certo e vê só os horários livres.",
        "Os serviços podem ter tempos e preços diferentes por porte, e o lembrete automático chega antes do horário, para o pet não perder a vez.",
      ],
    },
    faq: [
      {
        question: "Dá para ter preço diferente por porte do pet?",
        answer:
          "Dá. Cadastre os serviços por porte (pequeno, médio, grande), cada um com o próprio tempo e preço.",
      },
      {
        question: "O tutor pode marcar o banho pelo Instagram?",
        answer:
          "Pode. Coloque o link do MeetChat no Instagram e no WhatsApp e o tutor agenda direto, sem precisar ligar.",
      },
    ],
  },
  veterinary: {
    title: "Agenda online para clínica veterinária | MeetChat",
    description:
      "Sistema de agendamento para veterinários: o tutor marca consulta, vacina e retorno pelo seu link, com lembrete automático. Grátis para sempre.",
    h1: "Consultas e vacinas agendadas pelo tutor",
    subtitle: "Pelo seu link, sem ocupar a recepção.",
    intro: {
      title: "Agendamento para clínica veterinária",
      paragraphs: [
        "Com o MeetChat, o tutor escolhe o atendimento e um horário livre pelo seu link e recebe a confirmação na hora, sem ocupar a recepção.",
        "Cada veterinário tem a própria agenda, o lembrete automático chega antes do horário e o chat oferece deixar o retorno marcado.",
      ],
    },
    faq: [
      {
        question: "Dá para agendar vacina pelo link?",
        answer:
          "Dá. Cadastre a vacinação como um serviço com a duração dela e o tutor agenda como qualquer consulta.",
      },
    ],
  },

  // ---------------------------------------------------------------- Aulas e serviços
  tutoring: {
    title: "Agenda online para professor particular | MeetChat",
    description:
      "Agendamento online para aulas particulares, idiomas e música: o aluno (ou os pais) marca a aula pelo seu link, com lembrete. Grátis para sempre.",
    h1: "Aulas particulares marcadas pelo aluno",
    subtitle: "Pelo seu link, sem combinar horário um por um.",
    intro: {
      title: "Agendamento para aulas particulares, idiomas e música",
      paragraphs: [
        "Combinar horário com cada aluno por mensagem toma tempo de aula. Com o MeetChat, o aluno ou os pais escolhem um horário livre pelo seu link e recebem a confirmação na hora.",
        "Aulas online e presenciais ficam na mesma agenda, os pacotes de aulas ficam organizados e o aluno remarca sozinho quando precisa.",
      ],
    },
    faq: [
      {
        question: "Dá para vender pacote de aulas?",
        answer: "Dá. Você cria pacotes e acompanha quantas aulas cada aluno ainda tem.",
      },
    ],
  },
  photography: {
    title: "Agenda online para fotógrafos | MeetChat",
    description:
      "Sistema de agendamento para fotógrafos: o cliente marca ensaio e sessão de estúdio pelo seu link, com lembrete automático. Grátis para sempre.",
    h1: "Ensaios fotográficos agendados pelo cliente",
    subtitle: "O cliente marca o ensaio pelo link e recebe lembrete.",
    intro: {
      title: "Agendamento para fotógrafos e estúdios",
      paragraphs: [
        "Reserva de data que não aparece custa um dia inteiro. Com o MeetChat, o cliente escolhe o ensaio e a data pelo seu link, sem troca de mensagens.",
        "Cada tipo de ensaio tem a própria duração, o estúdio entra como recurso e o lembrete automático chega antes do dia.",
      ],
    },
    faq: [
      {
        question: "Dá para cobrar sinal para reservar a data do ensaio?",
        answer: "Dá, no plano Pro: o cliente paga o sinal pelo Pix direto para você e envia o comprovante no chat. Você confere no banco e confirma.",
      },
    ],
  },
  consulting: {
    title: "Agenda online para advogados e consultores | MeetChat",
    description:
      "Agendamento online para advogados, contadores e consultores: o cliente marca a reunião pelo seu link, presencial ou online. Grátis para sempre.",
    h1: "Reuniões marcadas sem troca de e-mails",
    subtitle: "O cliente escolhe o horário pelo seu link.",
    intro: {
      title: "Agendamento para escritórios e consultores",
      paragraphs: [
        "Achar um horário de reunião por e-mail pode levar dias. Com o MeetChat, o cliente vê os horários livres e agenda pelo seu link na hora.",
        "Cada profissional do escritório tem a própria agenda, o Google Agenda bloqueia seus compromissos e o lembrete automático chega antes da reunião.",
      ],
    },
    faq: [
      {
        question: "Dá para integrar com o Google Agenda?",
        answer:
          "Dá. Seus compromissos do Google Agenda bloqueiam os horários do chat automaticamente.",
      },
    ],
  },
  "auto-detailing": {
    title: "Agenda online para estética automotiva e lava-rápido | MeetChat",
    description:
      "Sistema de agendamento para estética automotiva: o cliente marca lavagem, polimento e higienização pelo link, com box sem conflito. Grátis para sempre.",
    h1: "Estética automotiva com box sempre ocupado",
    subtitle: "O cliente marca a lavagem pelo link, 24h.",
    intro: {
      title: "Agendamento para estética automotiva e lava-rápidos",
      paragraphs: [
        "Fila de carro sem hora marcada é box parado num horário e lotado no outro. Com o MeetChat, o cliente agenda pelo link e só vê horários em que o serviço cabe inteiro.",
        "Os boxes entram como recursos e o lembrete automático chega antes do horário.",
      ],
    },
    faq: [
      {
        question: "O sistema controla os boxes de lavagem?",
        answer:
          "Controla. Cadastre os boxes como recursos e eles nunca são marcados para dois carros ao mesmo tempo.",
      },
    ],
  },
  "sports-court": {
    title: "Sistema de reserva de quadras | MeetChat",
    description:
      "Reserva online de quadras de beach tennis, futebol e padel: o cliente reserva o horário pelo link, sem conflito de reserva. Grátis para sempre.",
    h1: "Quadras reservadas sem caderno e sem conflito",
    subtitle: "O cliente reserva o horário pelo link, 24h.",
    intro: {
      title: "Reserva online feita para arenas e quadras",
      paragraphs: [
        "Reserva anotada em caderno vira duas turmas no mesmo horário. Com o MeetChat, cada quadra tem a própria agenda e o horário reservado some na hora para os outros.",
        "O cliente reserva pelo seu link, recebe a confirmação e o lembrete.",
      ],
    },
    faq: [
      {
        question: "Dá para cadastrar várias quadras?",
        answer: "Dá. Cada quadra tem a própria agenda, então uma reserva nunca bate com outra.",
      },
      {
        question: "Posso cobrar sinal na reserva da quadra?",
        answer: "Pode, no plano Pro: o cliente paga o sinal pelo Pix direto para você e envia o comprovante no chat.",
      },
    ],
  },
};
