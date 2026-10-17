import type { NicheGuide } from "./types";

export const beautyGuide: NicheGuide = {
  brandKey: "beauty",
  published: true,
  ymyl: false,
  searchTerms: {
    singular: "salão de beleza",
    plural: "salões de beleza",
    synonyms: ["cabeleireira", "cabeleireiro", "studio de beleza", "espaço de beleza"],
  },
  notes: {
    title: "Pensado para a rotina de um salão",
    items: [
      "Cada profissional (cabeleireira, manicure, designer) tem agenda e serviços próprios, e a cliente escolhe com quem quer ser atendida.",
      "Serviços longos, como mechas e progressiva, ocupam o tempo inteiro na agenda; um corte rápido não é oferecido por cima deles.",
      "Para serviços longos, dá para pedir sinal pelo Pix, pago direto na sua chave.",
      "Pacotes e combos (escova + hidratação, por exemplo) ficam no chat com o preço que você definir.",
    ],
  },
  related: ["nails", "lash-brow", "aesthetics", "barber"],
  topics: {
    "reduzir-faltas": {
      title: "Como reduzir faltas no salão de beleza | MeetChat",
      description:
        "Uma falta em mechas ou progressiva derruba a tarde do salão. Veja como lembrete, remarcação pela própria cliente, sinal pelo Pix e lista de espera ajudam.",
      h1: "Como reduzir faltas no salão de beleza",
      answer:
        "O salão reduz faltas quando a cliente lembra do horário, consegue remarcar sem constrangimento e, nos serviços longos, assume um compromisso com um sinal. O MeetChat envia confirmação e lembrete por e-mail um dia antes, com botão para remarcar, e permite pedir sinal pelo Pix por serviço.",
      linkLabel: "como diminuir faltas no salão",
      sections: [
        {
          title: "No salão, a falta custa mais nos serviços longos",
          paragraphs: [
            "Uma escova que não acontece é meia hora parada. Mechas ou progressiva que não acontecem podem ser a tarde inteira de uma profissional, muitas vezes recusada para outras clientes.",
            "Por isso vale tratar os serviços de forma diferente: os rápidos só precisam de lembrete; os longos merecem um compromisso maior.",
          ],
        },
        {
          title: "Lembrete e remarcação sem constrangimento",
          paragraphs: [
            "A cliente que informa o e-mail ao agendar recebe a confirmação na hora e um lembrete um dia antes. No lembrete há o botão “Preciso remarcar”: ela escolhe outro horário livre sozinha, sem ter que se explicar por mensagem.",
            "Isso importa porque muita falta é só vergonha de desmarcar. Quando remarcar é fácil, o horário volta para a agenda em vez de virar buraco.",
          ],
        },
        {
          title: "Sinal pelo Pix nos procedimentos longos",
          list: [
            "Você escolhe em quais serviços pedir sinal: valor fixo, porcentagem do preço ou o pagamento total.",
            "A cliente paga direto na sua chave Pix e avisa no chat; você confere no extrato e confirma.",
            "O horário fica reservado enquanto o Pix é conferido, e a política do sinal aparece para a cliente aceitar antes de pagar.",
          ],
        },
        {
          title: "Horário cancelado não precisa ficar vazio",
          paragraphs: [
            "Quando o dia está cheio, a cliente pode entrar na lista de espera daquele dia e serviço. Se alguém cancelar, a lista recebe um e-mail, e quem confirmar primeiro fica com o horário.",
          ],
        },
      ],
      faq: [
        {
          question: "A cliente precisa informar e-mail?",
          answer:
            "Não é obrigatório. Sem e-mail ela agenda normalmente, mas não recebe a confirmação nem o lembrete automático; você continua com o WhatsApp dela no agendamento.",
        },
        {
          question: "Posso aprovar cada agendamento antes de confirmar?",
          answer:
            "Pode. No modo “Eu aprovo cada um”, o pedido chega para você e só vira horário confirmado quando você aprova.",
        },
      ],
      updatedAt: "2026-10-16",
    },
    "agendar-pelo-whatsapp": {
      title: "Agendamento de salão pelo WhatsApp | MeetChat",
      description:
        "Salão que agenda pelo WhatsApp sem responder mensagem: a cliente toca no link, escolhe serviço, profissional e horário livre, e você só recebe o aviso.",
      h1: "Agendamento pelo WhatsApp para salão de beleza",
      answer:
        "Para o salão agendar pelo WhatsApp sem passar o dia respondendo, coloque o link do MeetChat no perfil do WhatsApp Business, na mensagem de ausência e numa resposta rápida. A cliente escolhe o serviço, a profissional e um horário livre, e o agendamento chega pronto para você.",
      linkLabel: "agendamento do salão pelo WhatsApp",
      sections: [
        {
          title: "A conversa que se repete o dia todo",
          paragraphs: [
            "“Oi, tem horário pra escova sábado?” A resposta exige olhar a agenda, perguntar com quem, oferecer horários, esperar a resposta e anotar. Multiplicado pelo número de clientes, é muito tempo longe da cadeira.",
            "O link resolve essa parte: a cliente vê sozinha só os horários em que o serviço cabe inteiro, com a profissional que ela escolheu.",
          ],
        },
        {
          title: "Onde o link trabalha por você",
          list: [
            "Perfil comercial do WhatsApp Business: quem abre a conversa já vê o link.",
            "Mensagem de ausência: à noite e no fim de semana, a cliente recebe o link e agenda na hora.",
            "Resposta rápida: um atalho com o link para quem pergunta horário.",
            "Status: a arte com os horários livres do dia, gerada no painel com o QR code do seu link.",
          ],
        },
        {
          title: "Salão com várias profissionais",
          paragraphs: [
            "Cada profissional tem a própria agenda. A cliente escolhe com quem quer ser atendida ou pede a primeira livre, e cada uma recebe o aviso dos próprios horários.",
          ],
        },
      ],
      faq: [
        {
          question: "O MeetChat manda mensagem pelo meu WhatsApp?",
          answer:
            "Não. O MeetChat não usa o seu WhatsApp. Você divulga o link, e a confirmação e o lembrete da cliente vão por e-mail.",
        },
        {
          question: "E se a cliente preferir falar comigo?",
          answer:
            "Ela continua podendo chamar você normalmente. O link só tira da conversa a parte de combinar horário.",
        },
      ],
      updatedAt: "2026-10-16",
    },
    "agendar-pelo-instagram": {
      title: "Agendamento de salão pelo Instagram | MeetChat",
      description:
        "Do antes e depois no feed ao horário marcado: use o link de agendamento na bio e nos stories do salão para a cliente marcar sem precisar mandar direct.",
      h1: "Agendamento pelo Instagram para salão de beleza",
      answer:
        "O salão agenda pelo Instagram colocando o link do MeetChat na bio, nos stories com a figurinha de link e nas respostas rápidas do direct. A cliente que gostou do antes e depois toca, escolhe o serviço e o horário, e marca sem esperar resposta.",
      linkLabel: "link de agendamento na bio do salão",
      sections: [
        {
          title: "O antes e depois vende; o link fecha",
          paragraphs: [
            "No salão, o Instagram é onde a cliente decide: uma foto de mechas, um corte novo, uma coloração. O momento de vontade é ali, e marcar precisa ser tão fácil quanto curtir.",
            "Quando o próximo passo é mandar direct, a cliente espera a resposta, às vezes desiste e às vezes vai para outro salão que respondeu antes.",
          ],
        },
        {
          title: "Como montar o caminho no Instagram",
          ordered: true,
          list: [
            "Coloque o link do MeetChat como primeiro link da bio.",
            "Nos stories de resultado, use a figurinha de link apontando para o seu chat.",
            "Crie um destaque “Agende” com a arte dos horários livres que o painel gera.",
            "Salve o link numa resposta rápida do direct para quem pergunta preço ou horário.",
          ],
        },
        {
          title: "A cliente vê o que vai contratar",
          paragraphs: [
            "Tocando na foto do chat, a cliente abre o perfil do salão: serviços, preços (se você quiser mostrar), fotos dos trabalhos e avaliações de outras clientes.",
          ],
        },
      ],
      faq: [
        {
          question: "Funciona com mais de um link na bio?",
          answer:
            "Funciona. O Instagram permite mais de um link na bio; deixe o de agendamento em primeiro para ele aparecer em destaque.",
        },
        {
          question: "A cliente precisa ter conta em algum lugar?",
          answer: "Não. Ela agenda informando só o nome e o WhatsApp; o e-mail é opcional.",
        },
      ],
      updatedAt: "2026-10-16",
    },
  },
};
