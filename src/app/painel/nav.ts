export type NavGroup = "main" | "business" | "setup" | "account";

export interface NavItem {
  href: string;
  label: string;
  /** Visible to staff members (others are owner-only). */
  staff?: boolean;
  /** Section in the phone's "Mais" list; "main" items are the bottom tabs. */
  group: NavGroup;
  /** Short note in the phone's "Mais" list. */
  hint?: string;
  /** Shown only while the Pix deposit is on (DEPOSITS_ENABLED). */
  deposits?: boolean;
  /** Stays in the menu in waiting mode (subscription and account). */
  waiting?: boolean;
}

export const PANEL_NAV: NavItem[] = [
  { href: "/painel", label: "Início", group: "main" },
  { href: "/painel/agenda", label: "Agenda", staff: true, group: "main" },
  { href: "/painel/clientes", label: "Clientes", staff: true, group: "main" },
  { href: "/painel/financeiro", label: "Financeiro", group: "main" },
  {
    href: "/painel/pagina",
    label: "Meu perfil",
    group: "business",
    hint: "Foto, serviços e preços",
  },
  {
    href: "/painel/vendas",
    label: "Vendas",
    group: "business",
    hint: "Artes, cupons e pacotes",
  },
  {
    href: "/painel/sinais",
    label: "Sinais pelo Pix",
    group: "business",
    hint: "Comprovantes para conferir",
    deposits: true,
  },
  { href: "/painel/avaliacoes", label: "Avaliações", group: "business" },
  { href: "/painel/estatisticas", label: "Estatísticas", group: "business" },
  { href: "/painel/radar", label: "Radar de demanda", group: "business" },
  {
    href: "/painel/configuracoes",
    label: "Configurações",
    group: "setup",
    hint: "Horários de atendimento e regras",
  },
  { href: "/painel/equipe", label: "Equipe", group: "setup" },
  {
    href: "/painel/integracoes",
    label: "Integrações",
    group: "setup",
    hint: "Google Agenda",
  },
  { href: "/painel/notificacoes", label: "Notificações", staff: true, group: "setup" },
  { href: "/painel/plano", label: "Assinatura", group: "account", waiting: true },
  { href: "/painel/conta", label: "Conta", staff: true, group: "account", waiting: true },
];

export const NAV_GROUP_LABELS: Record<Exclude<NavGroup, "main">, string> = {
  business: "Meu negócio",
  setup: "Configurar",
  account: "Conta",
};

export interface NavOptions {
  isOwner: boolean;
  /** Waiting mode: only the subscription and the account. */
  waiting: boolean;
  deposits: boolean;
}

/** Menu items for this person: staff see fewer (owner-only items are hidden). */
export function visibleNav({ isOwner, waiting, deposits }: NavOptions): NavItem[] {
  return PANEL_NAV.filter(
    (item) => (isOwner || item.staff) && (!waiting || item.waiting) && (deposits || !item.deposits),
  );
}

/** Tutorial target of a menu item: "nav-agenda", "nav-configuracoes"… ("nav-inicio" for /painel). */
export function navTourId(href: string): string {
  return `nav-${href === "/painel" ? "inicio" : href.split("/").pop()}`;
}

export function isActive(pathname: string, href: string): boolean {
  return href === "/painel"
    ? pathname === "/painel"
    : pathname === href || pathname.startsWith(`${href}/`);
}
