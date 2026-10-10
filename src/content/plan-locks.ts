import type { LockedFeature } from "@/lib/plans";

/** What each paid feature does, shown with the lock on the Grátis plan (page and modal). */
export const LOCKED_FEATURES: Record<
  LockedFeature,
  { title: string; description: string; bullets: string[] }
> = {
  customers: {
    title: "Clientes",
    description: "A lista de quem já agendou com você, com histórico, observações e contato.",
    bullets: ["Histórico de cada cliente", "Importar e exportar a lista", "Bloquear quem falta"],
  },
  finance: {
    title: "Financeiro",
    description: "Entradas dos atendimentos concluídos, lançamentos manuais e custos, mês a mês.",
    bullets: [
      "Receita automática dos atendimentos",
      "Custos e lançamentos",
      "Exportar para planilha",
    ],
  },
  salesTools: {
    title: "Vendas",
    description: "Ferramentas para encher a agenda: artes, cupons, pacotes e lista de espera.",
    bullets: ["Artes com seus horários livres", "Cupons e pacotes", "Lista de espera e indicações"],
  },
  packagesAndCombos: {
    title: "Pacotes e combos",
    description: "Venda vários atendimentos juntos, com preço especial.",
    bullets: ["Combos no chat", "Pacotes com saldo por cliente"],
  },
  reviews: {
    title: "Avaliações",
    description: "Peça avaliação depois do atendimento e mostre as melhores no seu perfil.",
    bullets: ["Pedido automático de avaliação", "Responder e ocultar"],
  },
  stats: {
    title: "Estatísticas",
    description: "Visitas ao seu link, agendamentos e os horários mais procurados.",
    bullets: ["Visitas e agendamentos", "Radar de demanda"],
  },
  googleCalendar: {
    title: "Integrações",
    description: "Google Agenda sincronizado e o chat de agendamento no seu site.",
    bullets: ["Seus compromissos bloqueiam horários", "Botão de agendar no seu site"],
  },
  embed: {
    title: "Chat no seu site",
    description: "Coloque o botão de agendar no seu site, com o chat abrindo por cima.",
    bullets: ["Funciona em qualquer site", "Mesmo chat do seu link"],
  },
  anyProfessional: {
    title: "Equipe",
    description: "Mais de um profissional, cada um com a própria agenda, e salas ou macas.",
    bullets: ["Agenda por profissional", "Permissões da equipe", "Recursos compartilhados"],
  },
};

export const LOCK_TEXT = {
  badge: "Disponível no Agenda e no Pro",
  plans: "Ver planos",
  trial: "Testar 7 dias grátis",
  denied: "Esse recurso faz parte dos planos Agenda e Pro.",
};
