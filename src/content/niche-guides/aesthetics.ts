import type { NicheGuide } from "./types";

export const aestheticsGuide: NicheGuide = {
  brandKey: "aesthetics",
  published: true,
  ymyl: false,
  searchTerms: {
    singular: "clínica de estética",
    plural: "clínicas de estética",
    synonyms: ["esteticista", "estética facial", "estética corporal", "espaço de estética"],
  },
  notes: {
    title: "Agenda de estética sem conflito de sala",
    items: [
      "Salas, macas e aparelhos entram como recursos: o horário só é oferecido quando a profissional e o recurso estão livres ao mesmo tempo.",
      "Protocolos de várias sessões viram pacotes, com o saldo de cada cliente no painel.",
      "Procedimentos mais longos podem pedir sinal pelo Pix, pago direto na sua chave.",
      "Os textos e nomes dos procedimentos são os que você definir; o MeetChat não faz promessa de resultado.",
    ],
  },
  related: ["beauty", "lash-brow", "nails", "massage-therapy"],
  topics: {
    "reduzir-faltas": {
      title: "Como reduzir faltas na clínica de estética | MeetChat",
      description:
        "Falta em procedimento com sala e aparelho reservados bagunça o dia da clínica. Veja como lembrete, sinal pelo Pix e lista de espera ajudam a estética.",
      h1: "Como reduzir faltas na clínica de estética",
      answer:
        "A clínica de estética reduz faltas lembrando a cliente antes do procedimento, facilitando a remarcação e pedindo sinal nos procedimentos que bloqueiam sala e aparelho por mais tempo. O MeetChat envia lembrete por e-mail um dia antes, com botão para remarcar, e permite sinal pelo Pix por procedimento.",
      linkLabel: "faltas na clínica de estética",
      sections: [
        {
          title: "Na estética, a falta trava mais do que um horário",
          paragraphs: [
            "Um procedimento marcado reserva a profissional, a sala e, muitas vezes, um aparelho. Se a cliente não aparece, os três ficam parados, e outra cliente que queria aquele aparelho foi recusada.",
          ],
        },
        {
          title: "Lembrete com o caminho para remarcar",
          paragraphs: [
            "A cliente que informa o e-mail recebe a confirmação na hora e um lembrete um dia antes. No lembrete estão os botões “Preciso remarcar” e “Cancelar horário”.",
            "Ao remarcar, ela só vê horários em que a profissional e o recurso do procedimento estão livres juntos, sem você precisar reorganizar a agenda.",
          ],
        },
        {
          title: "Sinal nos procedimentos que bloqueiam a agenda",
          list: [
            "Escolha os procedimentos com sinal: valor fixo, porcentagem do preço ou pagamento total.",
            "A cliente vê a política do sinal, aceita e paga na sua chave Pix.",
            "Você confere no extrato e confirma; o horário fica reservado enquanto isso.",
          ],
        },
        {
          title: "Pacotes ajudam a cliente a voltar",
          paragraphs: [
            "Em protocolos de várias sessões, o pacote deixa claro quantas sessões a cliente já usou e quantas faltam, e cada sessão é agendada pelo mesmo chat.",
          ],
        },
      ],
      faq: [
        {
          question: "O sistema evita duas clientes no mesmo aparelho?",
          answer:
            "Evita. Cadastrando o aparelho como recurso, o chat não oferece um horário em que ele já está ocupado, mesmo com profissionais diferentes.",
        },
        {
          question: "O lembrete vai por WhatsApp?",
          answer:
            "Não. O lembrete automático vai por e-mail para quem informou o e-mail ao agendar.",
        },
      ],
      updatedAt: "2026-10-16",
    },
    "agendar-pelo-whatsapp": {
      title: "Agendamento de estética pelo WhatsApp | MeetChat",
      description:
        "A cliente escolhe o procedimento e o horário pelo link no WhatsApp da clínica, e o sistema já confere sala, aparelho e profissional livres.",
      h1: "Agendamento pelo WhatsApp para clínica de estética",
      answer:
        "Para a clínica de estética agendar pelo WhatsApp sem conferir sala e aparelho a cada mensagem, coloque o link do MeetChat no perfil e na mensagem de ausência. A cliente escolhe o procedimento, e o chat só mostra horários em que profissional, sala e aparelho estão livres ao mesmo tempo.",
      linkLabel: "agendamento de estética pelo WhatsApp",
      sections: [
        {
          title: "Agendar estética por mensagem é um quebra-cabeça",
          paragraphs: [
            "Para responder “tem horário para limpeza de pele quinta?”, a recepção precisa olhar a agenda da esteticista, a sala e às vezes o aparelho. Cada conferência é uma chance de marcar duas clientes no mesmo lugar.",
            "No chat do MeetChat essa conferência é automática.",
          ],
        },
        {
          title: "Onde o link entra no WhatsApp",
          list: [
            "Perfil do WhatsApp Business, no campo de site.",
            "Mensagem de saudação para quem chama pela primeira vez.",
            "Mensagem de ausência, para quem chama fora do expediente.",
            "Resposta rápida para quando perguntarem horário ou valores.",
          ],
        },
        {
          title: "A recepção fica com o atendimento",
          paragraphs: [
            "O agendamento chega pronto, com nome e WhatsApp da cliente, e a equipe recebe o aviso. O tempo que ia para combinar horário vai para tirar dúvidas sobre os procedimentos.",
          ],
        },
      ],
      faq: [
        {
          question: "Dá para a cliente escolher a profissional?",
          answer:
            "Dá. Ela escolhe com quem quer ser atendida ou pede a primeira profissional livre para aquele procedimento.",
        },
        {
          question: "O MeetChat se conecta ao WhatsApp da clínica?",
          answer:
            "Não. Você divulga o link no WhatsApp; o agendamento acontece no chat do MeetChat.",
        },
      ],
      updatedAt: "2026-10-16",
    },
    "agendar-pelo-instagram": {
      title: "Agendamento de estética pelo Instagram | MeetChat",
      description:
        "Use o link de agendamento na bio e nos stories da clínica de estética para a cliente escolher o procedimento e marcar o horário sem precisar mandar direct.",
      h1: "Agendamento pelo Instagram para clínica de estética",
      answer:
        "A clínica de estética recebe agendamentos pelo Instagram com o link do MeetChat na bio, nos stories e nas respostas rápidas do direct. A cliente que viu o procedimento no feed toca no link, escolhe o procedimento e marca num horário livre.",
      linkLabel: "agenda da clínica de estética no Instagram",
      sections: [
        {
          title: "Do conteúdo ao procedimento marcado",
          paragraphs: [
            "Na estética, a cliente costuma pesquisar antes: vê vídeos do procedimento, lê comentários, compara clínicas. Quando decide, quer marcar sem burocracia.",
            "O link na bio leva direto ao chat, com os procedimentos que você oferece e os horários livres.",
          ],
        },
        {
          title: "Como usar o link nos lugares certos",
          ordered: true,
          list: [
            "Link do MeetChat como primeiro link da bio.",
            "Figurinha de link nos stories sobre a arte de horários livres que o painel gera.",
            "Destaque “Agendar” e destaques por procedimento.",
            "Resposta rápida no direct com o link.",
          ],
        },
        {
          title: "Informação sem promessa",
          paragraphs: [
            "No perfil, a cliente vê os procedimentos, a duração, os preços (se você mostrar) e fotos do espaço. Os textos são seus: mantenha a descrição do procedimento clara e sem promessa de resultado.",
          ],
        },
      ],
      faq: [
        {
          question: "Consigo oferecer avaliação antes do procedimento?",
          answer:
            "Consegue. Crie um atendimento “Avaliação” com a duração que quiser; a cliente agenda pelo mesmo chat.",
        },
        {
          question: "Funciona para quem atende sozinha?",
          answer:
            "Funciona. Com uma profissional só, o chat nem pergunta com quem a cliente quer marcar.",
        },
      ],
      updatedAt: "2026-10-16",
    },
  },
};
