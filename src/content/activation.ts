/**
 * Texts of the Meta ad page (/ativar, 2026-11-17): the person creates her real link, books
 * herself as a customer to see it working, and pays right after. No 14-day trial on this page.
 */
export const ACTIVATION = {
  meta: {
    title: "Veja sua agenda online funcionando",
    description:
      "Crie seu link de agendamento, marque um horário como se fosse seu cliente e veja tudo chegar para você.",
  },
  landing: {
    eyebrow: "Agenda online pelo chat",
    title: "Veja sua agenda funcionando antes de pagar",
    intro:
      "Em 1 minuto você cria o seu link de agendamento de verdade, marca um horário nele como se fosse seu cliente e vê o aviso chegar para você. Gostou? Ativa na hora pelo Pix.",
    cta: "Criar meu link e testar",
    steps: [
      {
        title: "Crie seu link",
        text: "Nome do negócio, área e e-mail. Os serviços e horários já vêm prontos.",
      },
      {
        title: "Seja seu cliente",
        text: "Abra o seu link, escolha um serviço e um horário e confirme.",
      },
      {
        title: "Veja chegar",
        text: "O horário entra na sua agenda e você recebe o aviso na hora.",
      },
      { title: "Ative pelo Pix", text: "Seus clientes passam a marcar sozinhos, 24h por dia." },
    ],
    noApp: "Seu cliente não baixa nada: o link abre direto no navegador do celular.",
    login: "Já tenho conta",
  },
  /** Lines of the creation conversation in this page's mode. */
  chat: {
    ready:
      "Seu chat está pronto ✨ Agora vamos criar a sua conta para você testar no seu link de verdade.",
    created: "🎉 Seu link está no ar, {nome}!",
    createdHint:
      "Agora o teste de verdade: marque um horário no seu link como se fosse seu cliente.",
    next: "Fazer meu agendamento de teste",
  },
  test: {
    title: "Agora seja seu cliente",
    intro:
      "Abra o seu link, escolha um serviço, um dia e um horário e confirme. Use o seu nome e o seu e-mail para ver a confirmação chegando como o seu cliente recebe.",
    open: "Abrir meu link e agendar",
    waiting: "Esperando o seu agendamento… esta tela atualiza sozinha.",
    note: "Este horário de teste fica na sua agenda: depois você pode cancelar no painel.",
    skip: "Pular o teste e ativar agora",
    ended: "O tempo da demonstração acabou. Ative agora para seus clientes marcarem sozinhos.",
  },
  result: {
    title: "Funcionou! 🎉",
    intro: "Foi isso que aconteceu agora no seu link:",
    booked: "Horário marcado na sua agenda",
    ownerNotice: "Você recebeu o aviso de novo agendamento (e-mail e, com o app, no celular).",
    customerNotice:
      "Seu cliente recebeu a confirmação por e-mail, com o link para remarcar ou cancelar sozinho.",
    reminder: "No dia anterior, ele recebe o lembrete automático, e falta menos.",
  },
  checkout: {
    title: "Ative para seus clientes agendarem assim",
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
