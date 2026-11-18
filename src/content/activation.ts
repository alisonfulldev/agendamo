/**
 * Texts of the Meta ad page (/ativar, 2026-11-17): an animated tutorial (a customer booking, then
 * the panel step by step), then the account and the payment right away. No 14-day trial here.
 */
export const ACTIVATION = {
  meta: {
    title: "Veja como funciona a agenda online",
    description:
      "Veja um cliente agendando sozinho pelo link e o que aparece no seu painel, passo a passo.",
  },
  landing: {
    eyebrow: "Agenda online pelo chat",
    title: "Seu cliente agenda sozinho, 24h por dia",
    intro: "Veja em 1 minuto como funciona: do cliente agendando ao seu painel.",
    cta: "Quero o meu",
    ctaHint: "Você cria seu link em 1 minuto e ativa na hora pelo Pix.",
    noApp: "Seu cliente não baixa nada: o link abre direto no navegador do celular.",
    login: "Já tenho conta",
  },
  /** The animated tutorial: one caption per step (the screens are drawn in tutorial.tsx). */
  tutorial: {
    label: "Tutorial: como funciona",
    stepOf: "Passo {n} de {total}",
    previous: "Voltar",
    next: "Próximo",
    pause: "Pausar",
    play: "Continuar",
    replay: "Ver de novo",
    customer: "Juliana",
    steps: [
      {
        title: "O cliente abre o seu link",
        text: "Pelo Instagram, WhatsApp ou Google. Abre uma conversa com a cara do seu negócio.",
      },
      {
        title: "Escolhe o serviço",
        text: "Com a duração e o preço que você definiu.",
      },
      {
        title: "Escolhe o dia e um horário livre",
        text: "Só aparecem os horários vagos da sua agenda. Nada de marcar em cima de outro.",
      },
      {
        title: "Confirma em segundos",
        text: "Nome e WhatsApp, e pronto: ele recebe a confirmação com o link para remarcar ou cancelar.",
      },
      {
        title: "Você recebe o aviso na hora",
        text: "No celular e no e-mail, a cada novo agendamento. Sem responder mensagem.",
      },
      {
        title: "No painel, já está na sua agenda",
        text: "O dia organizado, com cada horário, serviço e cliente.",
      },
      {
        title: "Lembrete automático no dia anterior",
        text: "O cliente recebe o lembrete sozinho, e falta menos.",
      },
      {
        title: "Clientes e faturamento num lugar só",
        text: "Histórico de cada cliente e quanto entrou no mês, sem planilha.",
      },
    ],
    end: "Pronto para ter o seu?",
  },
  /** Lines of the creation conversation in this page's mode. */
  chat: {
    ready: "Seu chat está pronto ✨ Agora é só criar sua conta para conhecer o seu painel.",
    created: "🎉 Sua conta está criada, {nome}!",
    createdHint: "Agora vamos conhecer o seu painel em 1 minuto.",
    next: "Conhecer meu painel",
  },
  /** Right after the account: to the panel, where the mandatory tutorial ends on the payment. */
  panel: {
    title: "Sua conta está criada! 🎉",
    intro:
      "Agora conheça o seu painel em 1 minuto, passo a passo. No fim, você escolhe seu plano e ativa pelo Pix.",
    cta: "Conhecer meu painel",
  },
  checkout: {
    created: "Falta só ativar! 🚀",
    yourLink: "Este é o seu link de agendamento:",
    title: "Ative para seus clientes agendarem",
    intro:
      "Enquanto não ativar, seu link manda os pedidos para o seu WhatsApp e nada fica marcado sozinho.",
    choosePlan: "Escolha o plano",
    monthly: "Mensal",
    yearly: "Anual",
    payerName: "Nome ou razão social (para a nota)",
    payerDocument: "CPF ou CNPJ",
    pay: "Ativar com Pix",
    paying: "Gerando o Pix…",
    automatic:
      "Pague pelo app do banco e confirme o Pix Automático: as próximas mensalidades são debitadas sozinhas. Você pode cancelar quando quiser, pelo painel ou pelo banco.",
    refund:
      "Pela lei, você tem 7 dias para desistir da compra pela internet e receber o valor de volta.",
  },
  done: {
    title: "Sua agenda está no ar! 🎉",
    intro:
      "Pagamento confirmado. Seus clientes já podem marcar sozinhos pelo seu link, 24h por dia.",
    share: "Coloque o link na bio do Instagram e na saudação do WhatsApp.",
    panel: "Entrar no meu painel",
  },
} as const;
