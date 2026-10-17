import type { NicheGuide } from "./types";

export const nailsGuide: NicheGuide = {
  brandKey: "nails",
  published: true,
  ymyl: false,
  searchTerms: {
    singular: "manicure",
    plural: "manicures",
    synonyms: ["esmalteria", "nail designer", "unhas de gel", "alongamento de unhas"],
  },
  notes: {
    title: "Feito para manicure, esmalteria e nail designer",
    items: [
      "Manicure de 45 minutos e alongamento em gel de 2 horas convivem na mesma agenda, cada um com o tempo certo.",
      "A manutenção pode ser vendida em pacote, com o saldo de sessões de cada cliente no painel.",
      "Para o alongamento, dá para pedir sinal pelo Pix direto na sua chave.",
      "Quem atende em dupla ou tem equipe separa a agenda por profissional.",
    ],
  },
  related: ["lash-brow", "beauty", "aesthetics"],
  topics: {
    "reduzir-faltas": {
      title: "Como reduzir faltas na manicure e esmalteria | MeetChat",
      description:
        "Duas horas de alongamento perdidas por uma falta pesam no mês. Veja como lembrete, sinal pelo Pix e lista de espera ajudam manicure e nail designer.",
      h1: "Como reduzir faltas na manicure e na esmalteria",
      answer:
        "Manicure e nail designer reduzem faltas com três coisas: lembrete antes do horário, um jeito fácil de remarcar e sinal nos serviços longos, como alongamento. O MeetChat faz as três: lembrete por e-mail um dia antes, remarcação pela própria cliente e sinal pelo Pix por serviço.",
      linkLabel: "faltas na esmalteria",
      sections: [
        {
          title: "Alongamento não é manicure",
          paragraphs: [
            "Uma manicure de 45 minutos que falta abre um buraco que às vezes se preenche com um encaixe. Um alongamento de duas horas que falta dificilmente se recupera no mesmo dia.",
            "Por isso a estratégia muda por serviço: lembrete para todos, sinal só onde o prejuízo da falta é maior.",
          ],
        },
        {
          title: "O lembrete chega com o botão de remarcar",
          paragraphs: [
            "Quem informa o e-mail ao agendar recebe a confirmação e, um dia antes, um lembrete com “Preciso remarcar” e “Cancelar horário”. A cliente escolhe um novo horário livre sozinha.",
            "Para quem faz manutenção, isso evita a falta silenciosa: em vez de sumir, ela empurra o horário, e a agenda continua organizada.",
          ],
        },
        {
          title: "Sinal no alongamento e na aplicação",
          list: [
            "Configure o sinal só nos serviços longos, em valor fixo ou porcentagem.",
            "A cliente paga na sua chave Pix e toca em “Já fiz o Pix”; o comprovante é opcional.",
            "Você confere no extrato e confirma. O MeetChat nunca recebe esse dinheiro.",
          ],
        },
        {
          title: "Quem quer encaixe entra na lista de espera",
          paragraphs: [
            "Dia cheio? A cliente entra na lista de espera do dia e do serviço. Quando alguém cancela, a lista recebe um e-mail, e o horário fica com quem confirmar primeiro.",
          ],
        },
      ],
      faq: [
        {
          question: "Posso exigir comprovante do Pix?",
          answer:
            "O comprovante é opcional por padrão. Se você marcar que não recebeu o Pix de uma cliente, ela passa a ter de anexar o comprovante nos próximos agendamentos com você.",
        },
        {
          question: "Dá para vender pacote de manutenção?",
          answer:
            "Dá. Você cria o pacote com o número de sessões e o preço; o saldo de cada cliente fica no painel.",
        },
      ],
      updatedAt: "2026-10-16",
    },
    "agendar-pelo-whatsapp": {
      title: "Agendamento de manicure pelo WhatsApp | MeetChat",
      description:
        "Manicure com as mãos ocupadas não responde mensagem: com o link no WhatsApp, a cliente escolhe esmaltação, alongamento ou manutenção e marca sozinha.",
      h1: "Agendamento pelo WhatsApp para manicure e nail designer",
      answer:
        "Manicure agenda pelo WhatsApp sem parar o atendimento colocando o link do MeetChat no perfil, na mensagem de ausência e numa resposta rápida. A cliente escolhe o serviço, vê os horários livres e marca; você recebe o aviso no celular.",
      linkLabel: "marcar unha pelo WhatsApp",
      sections: [
        {
          title: "Mão ocupada, celular apitando",
          paragraphs: [
            "Durante uma aplicação não dá para pegar o celular a cada mensagem. A cliente que perguntou horário fica esperando, e às vezes marca com outra pessoa.",
            "Com o link, a pergunta “tem horário?” se responde sozinha: a cliente vê os horários em que o serviço escolhido cabe inteiro.",
          ],
        },
        {
          title: "Onde deixar o link",
          list: [
            "No perfil do WhatsApp Business, no campo de site.",
            "Na mensagem de ausência, para quem chama enquanto você atende.",
            "Numa resposta rápida para mandar em dois toques.",
            "No status, com a arte dos horários livres e o QR code gerados no painel.",
          ],
        },
        {
          title: "Serviço certo, tempo certo",
          paragraphs: [
            "Cada serviço tem duração própria: manicure, pé e mão, alongamento, manutenção. O chat só oferece horários em que o serviço cabe, sem você precisar calcular.",
          ],
        },
      ],
      faq: [
        {
          question: "O MeetChat conversa com a cliente no meu WhatsApp?",
          answer:
            "Não. O chat de agendamento é do MeetChat, aberto pelo link. O seu WhatsApp continua só seu.",
        },
        {
          question: "A cliente precisa instalar alguma coisa?",
          answer: "Não. O link abre no navegador do celular.",
        },
      ],
      updatedAt: "2026-10-16",
    },
    "agendar-pelo-instagram": {
      title: "Agendamento de manicure pelo Instagram | MeetChat",
      description:
        "Nail art que vira agendamento: link de agendamento na bio, nos stories e no direct para a cliente escolher o serviço e marcar sem esperar resposta.",
      h1: "Agendamento pelo Instagram para manicure e nail designer",
      answer:
        "Nail designer transforma o Instagram em agenda colocando o link do MeetChat na bio e nos stories. A cliente que viu a nail art toca no link, escolhe alongamento, manutenção ou esmaltação e marca num horário livre.",
      linkLabel: "agenda de unhas no Instagram",
      sections: [
        {
          title: "Quem vê a nail art quer marcar agora",
          paragraphs: [
            "No feed de unhas, a decisão é visual e rápida. Se o próximo passo é perguntar no direct, a vontade esfria enquanto a resposta não chega.",
            "O link na bio leva direto ao chat de agendamento, com os serviços e os horários livres.",
          ],
        },
        {
          title: "Um caminho para cada tipo de post",
          list: [
            "Post de resultado: “agende pelo link da bio”.",
            "Story de horários vagos: arte gerada no painel com os horários livres de hoje e amanhã, com a figurinha de link.",
            "Destaque “Agendar”: para quem chega no perfil depois.",
            "Direct: resposta rápida com o link para quem pergunta valor.",
          ],
        },
        {
          title: "Perfil com fotos dos trabalhos",
          paragraphs: [
            "No chat, a cliente toca na sua foto e vê o perfil com serviços, preços (se você mostrar), fotos e avaliações, sem sair do agendamento.",
          ],
        },
      ],
      faq: [
        {
          question: "Consigo mostrar só alguns serviços?",
          answer:
            "Sim. Você escolhe quais serviços ficam ativos no chat e pode esconder os preços se preferir combinar na hora.",
        },
        {
          question: "Quanto tempo leva para colocar o link no ar?",
          answer:
            "Você cria a conta em cerca de um minuto, e o link já vem com serviços do seu ramo para ajustar.",
        },
      ],
      updatedAt: "2026-10-16",
    },
  },
};
