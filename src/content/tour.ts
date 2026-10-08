/**
 * First-access tutorial of the panel, like a game: the screen dims, only the element of the step
 * lights up and the person taps it to go on. `target` is a data-tour attribute; steps with a
 * `path` wait for that page. A step whose target does not exist on this screen is skipped (e.g.
 * "Mais" exists only on the phone).
 */
export interface TourStep {
  id: string;
  title: string;
  text: string;
  target?: string;
  path?: string;
  /** "tap": the person taps the lit element; "next": a button in the balloon. */
  advance: "tap" | "next";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Este é o seu painel! 👋",
    text: "Vamos conhecer em 1 minuto? É só tocar onde estiver aceso.",
    path: "/painel",
    advance: "next",
  },
  {
    id: "agenda-tab",
    title: "Sua agenda",
    text: "Agora toque em Agenda.",
    target: "nav-agenda",
    advance: "tap",
  },
  {
    id: "agenda",
    title: "Aqui caem os agendamentos",
    text: "Cada horário marcado pelo chat aparece aqui na hora, e você recebe um aviso.",
    path: "/painel/agenda",
    advance: "next",
  },
  {
    id: "more",
    title: "Mais opções",
    text: "Toque em Mais para ver o resto do painel.",
    target: "nav-more",
    advance: "tap",
  },
  {
    id: "settings-item",
    title: "Seus horários",
    text: "Toque em Configurações.",
    target: "nav-configuracoes",
    advance: "tap",
  },
  {
    id: "hours",
    title: "Dias e horários de atendimento",
    text: "Confira aqui quando você atende. O chat só oferece horários dentro do seu expediente.",
    target: "hours",
    path: "/painel/configuracoes",
    advance: "next",
  },
  {
    id: "home-tab",
    title: "De volta ao início",
    text: "Toque em Início.",
    target: "nav-inicio",
    advance: "tap",
  },
  {
    id: "link",
    title: "Seu link de agendamento",
    text: "É por ele que seus clientes marcam horário. Toque em Copiar link.",
    target: "link-copy",
    path: "/painel",
    advance: "tap",
  },
  {
    id: "chat",
    title: "Veja como seus clientes veem",
    text: "Toque em Ver chat para abrir o seu chat de agendamento. Depois, é só voltar para esta aba.",
    target: "view-chat",
    advance: "tap",
  },
  {
    id: "done",
    title: "Pronto! 🎉",
    text: "Agora é divulgar seu link onde seus clientes estiverem: WhatsApp, Instagram, Facebook, botões do seu site…",
    advance: "next",
  },
];

export const TOUR_TEXT = {
  start: "Começar",
  next: "Próximo",
  finish: "Concluir",
  skip: "Pular tutorial",
  step: "{n} de {total}",
  replay: "Ver tutorial",
};
