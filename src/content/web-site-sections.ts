/**
 * Extra sections of the "Site ou Loja" sites (2026-11-07), so they read like full sites: what the
 * business offers, how to hire or buy, and common questions. Neutral texts: nothing the owner may
 * not offer (delivery, payment methods, hours) is promised; everything ends on the WhatsApp.
 */
export interface WebSections {
  highlights: { title: string; text: string }[];
  stepsTitle: string;
  steps: { title: string; text: string }[];
  faq: { question: string; answer: string }[];
}

export function webSections(input: {
  name: string;
  store: boolean;
  place: string;
  /** Some products link to where they are sold (Shopee, Mercado Livre…). */
  externalLinks: boolean;
}): WebSections {
  const where = input.place
    ? `Estamos em ${input.place}. Fale com a gente pelo WhatsApp para combinar.`
    : "Fale com a gente pelo WhatsApp e a gente combina tudo com você.";
  if (input.store) {
    return {
      highlights: [
        { title: "Pedido pelo WhatsApp", text: "Escolha, mande a lista e pronto. Sem cadastro." },
        { title: "Atendimento de verdade", text: "Uma pessoa responde e tira suas dúvidas." },
        { title: "Do seu jeito", text: "Entrega ou retirada, combinadas direto com a loja." },
      ],
      stepsTitle: "Como comprar",
      steps: [
        { title: "Escolha", text: "Veja os produtos e toque em Adicionar no que você quer." },
        {
          title: "Monte a sacolinha",
          text: input.externalLinks
            ? "Junte os itens na sacolinha (ou compre direto na loja parceira, quando tiver o botão)."
            : "Junte os itens e as quantidades na sacolinha.",
        },
        { title: "Envie no WhatsApp", text: "O pedido chega pronto, com a lista e o total." },
      ],
      faq: [
        {
          question: "Como faço um pedido?",
          answer:
            "Toque em Adicionar nos produtos, abra a sacolinha e toque em Enviar pedido no WhatsApp. A lista chega pronta para a loja.",
        },
        {
          question: "Como é o pagamento?",
          answer:
            "A loja combina o pagamento com você pelo WhatsApp, depois de confirmar o pedido.",
        },
        {
          question: "Vocês entregam?",
          answer: `Entrega ou retirada são combinadas pelo WhatsApp. ${where}`,
        },
        {
          question: "Preciso criar conta?",
          answer: "Não. Você escolhe e manda o pedido direto, sem cadastro e sem senha.",
        },
      ],
    };
  }
  return {
    highlights: [
      {
        title: "Atendimento próximo",
        text: "Cada cliente é atendido com atenção, do começo ao fim.",
      },
      { title: "Resposta rápida", text: "Fale direto no WhatsApp, sem formulário e sem espera." },
      { title: "Sem compromisso", text: "Tire suas dúvidas e peça um orçamento à vontade." },
    ],
    stepsTitle: "Como funciona",
    steps: [
      { title: "Escolha", text: "Veja os serviços e escolha o que você precisa." },
      { title: "Fale com a gente", text: "Toque no botão e mande sua mensagem pelo WhatsApp." },
      { title: "Pronto", text: "A gente responde, combina os detalhes e cuida do resto." },
    ],
    faq: [
      {
        question: "Como faço para contratar?",
        answer: `É só tocar em qualquer botão do site: a conversa com ${input.name} abre no WhatsApp.`,
      },
      {
        question: "Vocês fazem orçamento?",
        answer:
          "Sim. Conte o que você precisa pelo WhatsApp e receba as informações sem compromisso.",
      },
      { question: "Onde vocês atendem?", answer: where },
      {
        question: "Quais as formas de pagamento?",
        answer: "O pagamento é combinado direto com você, pelo WhatsApp, do jeito mais prático.",
      },
    ],
  };
}
