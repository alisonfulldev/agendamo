import type { NicheGuide } from "./types";

export const barberGuide: NicheGuide = {
  brandKey: "barber",
  published: true,
  ymyl: false,
  searchTerms: {
    singular: "barbearia",
    plural: "barbearias",
    synonyms: ["barbeiro", "barber shop", "salão masculino", "corte masculino"],
  },
  notes: {
    title: "Como o MeetChat funciona no ritmo de uma barbearia",
    items: [
      "Cada barbeiro tem a própria agenda e os próprios serviços; o cliente escolhe com quem quer cortar ou pega o primeiro horário livre.",
      "O tempo de cada serviço é respeitado: um pezinho de 15 minutos encaixa onde um corte + barba de 1 hora não cabe.",
      "Dá para deixar um intervalo entre atendimentos para limpar a cadeira e as máquinas.",
      "Combos de corte e barba e pacotes de cortes aparecem direto no chat, com o preço que você definir.",
    ],
  },
  related: ["beauty", "tattoo", "aesthetics"],
  topics: {
    "reduzir-faltas": {
      title: "Como reduzir faltas na barbearia | MeetChat",
      description:
        "Cadeira vazia em horário marcado custa caro. Veja como lembrete por e-mail, remarcação em um toque e lista de espera ajudam a barbearia a perder menos cortes.",
      h1: "Como reduzir faltas na barbearia",
      answer:
        "Para a barbearia perder menos cortes por falta, o cliente precisa lembrar do horário e ter um jeito fácil de avisar quando não vai. Com o MeetChat, ele recebe a confirmação e um lembrete por e-mail um dia antes, com um botão para remarcar ou cancelar, e o horário liberado pode ir para quem está na lista de espera.",
      linkLabel: "reduzir faltas na barbearia",
      sections: [
        {
          title: "Por que o cliente da barbearia falta",
          paragraphs: [
            "Quase nunca é má vontade. O corte foi marcado por mensagem há duas semanas, no meio de outras conversas, e o dia chegou sem ninguém lembrar. Ou surgiu um imprevisto e avisar parecia mais trabalhoso do que simplesmente não ir.",
            "Na barbearia isso pesa porque a agenda costuma ser de horários curtos: um corte que não acontece no sábado à tarde é um horário que outro cliente queria.",
          ],
        },
        {
          title: "O que o MeetChat faz para o horário não ficar vazio",
          list: [
            "Confirmação na hora: o cliente que informa o e-mail ao agendar recebe os detalhes do horário, do serviço e do barbeiro.",
            "Lembrete automático um dia antes, por e-mail, com os botões “Preciso remarcar” e “Cancelar horário”.",
            "Remarcar é o próprio cliente escolhendo outro horário livre, sem precisar chamar você no WhatsApp.",
            "Lista de espera: quando alguém cancela, quem pediu aquele dia e serviço recebe um e-mail, e o primeiro que confirmar fica com o horário.",
          ],
        },
        {
          title: "Sinal pelo Pix nos horários mais disputados",
          paragraphs: [
            "Se as faltas se concentram em serviços longos ou nos horários de pico, você pode pedir um sinal pelo Pix só nesses serviços. O cliente paga direto na sua chave, você confere no extrato e confirma. O MeetChat não recebe esse dinheiro.",
          ],
        },
        {
          title: "Combine a regra com os clientes",
          paragraphs: [
            "Ferramenta nenhuma substitui uma regra clara. Deixe no seu perfil quanto tempo antes o cliente deve avisar e o que acontece com o sinal se ele não aparecer. Assim ninguém é pego de surpresa.",
          ],
        },
      ],
      faq: [
        {
          question: "O lembrete vai pelo WhatsApp?",
          answer:
            "Não. O lembrete automático vai por e-mail, para quem informou o e-mail ao agendar. O WhatsApp do cliente fica salvo no agendamento, e você pode chamá-lo pelo seu próprio WhatsApp quando quiser.",
        },
        {
          question: "Posso cobrar sinal só no corte + barba?",
          answer:
            "Pode. O sinal é configurado por serviço: em valor fixo, em porcentagem do preço ou com o pagamento total.",
        },
      ],
      updatedAt: "2026-10-16",
    },
    "agendar-pelo-whatsapp": {
      title: "Agendamento de barbearia pelo WhatsApp | MeetChat",
      description:
        "Pare de responder “tem horário hoje?” entre um corte e outro: ponha o link de agendamento no WhatsApp da barbearia e o cliente escolhe barbeiro e horário.",
      h1: "Agendamento pelo WhatsApp para barbearia, sem largar a máquina",
      answer:
        "O jeito mais simples de a barbearia agendar pelo WhatsApp sem ficar respondendo mensagem é colocar o seu link do MeetChat no perfil, na mensagem de ausência e nas respostas rápidas. O cliente toca, escolhe o serviço, o barbeiro e um horário livre, e o corte já entra na agenda.",
      linkLabel: "agendar corte pelo WhatsApp",
      sections: [
        {
          title: "Onde colocar o link no WhatsApp Business",
          ordered: true,
          list: [
            "No perfil comercial, no campo de site: quem abre a conversa vê o link antes de perguntar.",
            "Na mensagem de saudação e na de ausência: quem chama fora do horário recebe o link e agenda na hora, sem esperar você.",
            "Numa resposta rápida (por exemplo, /horario): quando alguém pergunta, você responde com o link em dois toques.",
            "No status, junto com a arte dos horários livres do dia, que o painel gera com o QR code do seu link.",
          ],
        },
        {
          title: "Por que é melhor do que combinar horário na conversa",
          paragraphs: [
            "Na conversa, cada horário vira um vai e vem: “tem às 18h?”, “às 18h não, só 18h40”, “então deixa pra amanhã”. Enquanto isso o cliente da cadeira espera.",
            "No chat do MeetChat o cliente só vê horários que cabem de verdade para o serviço que escolheu, com o barbeiro que escolheu. Não tem como marcar dois clientes no mesmo horário do mesmo barbeiro.",
          ],
        },
        {
          title: "Você continua no WhatsApp para o que importa",
          paragraphs: [
            "O link não tira a conversa do WhatsApp: tira só a parte repetitiva. Cada agendamento chega para você com o nome e o WhatsApp do cliente, e o aviso aparece no celular na hora.",
          ],
        },
      ],
      faq: [
        {
          question: "O MeetChat responde as mensagens no meu WhatsApp?",
          answer:
            "Não. O MeetChat não se conecta ao seu WhatsApp nem envia mensagens por ele. Você coloca o link onde quiser, e o cliente agenda pelo chat do MeetChat.",
        },
        {
          question: "O cliente precisa baixar algum aplicativo?",
          answer: "Não. O link abre no navegador do celular, como uma conversa.",
        },
      ],
      updatedAt: "2026-10-16",
    },
    "agendar-pelo-instagram": {
      title: "Agendamento de barbearia pelo Instagram | MeetChat",
      description:
        "Transforme quem vê seus cortes no Instagram em cliente agendado: link de agendamento na bio, nos stories e nas respostas do direct da barbearia.",
      h1: "Agendamento pelo Instagram para barbearia",
      answer:
        "Para a barbearia receber agendamentos pelo Instagram, coloque o link do MeetChat na bio e use a figurinha de link nos stories. Quem viu o degradê no feed toca no link, escolhe o serviço e o barbeiro, e marca sem precisar mandar direct.",
      linkLabel: "agenda da barbearia no Instagram",
      sections: [
        {
          title: "O caminho do feed até a cadeira",
          paragraphs: [
            "O Instagram da barbearia é vitrine: o cliente vê o corte, gosta e quer marcar. Se o próximo passo for mandar direct e esperar resposta, parte dessa vontade se perde no caminho.",
            "Com o link na bio, o caminho fica curto: tocar no link, escolher “Corte + barba”, escolher o barbeiro, escolher o horário e informar nome e WhatsApp.",
          ],
        },
        {
          title: "Onde colocar o link",
          list: [
            "Na bio, como primeiro link.",
            "Nos stories, com a figurinha de link, de preferência sobre a arte com os horários livres de hoje e amanhã que o painel gera.",
            "Num destaque fixo chamado “Agendar”, para quem chega pelo perfil.",
            "Nas respostas rápidas do direct, para quem pergunta preço ou horário.",
          ],
        },
        {
          title: "Cada barbeiro com a própria vitrine",
          paragraphs: [
            "Se cada barbeiro tem o próprio público, o cliente escolhe com quem quer cortar no próprio chat. A agenda de cada um fica separada, e você vê tudo junto no painel.",
          ],
        },
      ],
      faq: [
        {
          question: "O agendamento abre dentro do Instagram?",
          answer:
            "Abre no navegador do próprio Instagram, sem instalar nada. O cliente agenda ali mesmo e volta para o feed.",
        },
        {
          question: "Dá para mostrar preços e fotos dos cortes?",
          answer:
            "Sim. Tocando na foto do chat, o cliente vê o perfil da barbearia com serviços, preços (se você quiser mostrar) e fotos dos trabalhos.",
        },
      ],
      updatedAt: "2026-10-16",
    },
  },
};
