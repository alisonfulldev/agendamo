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
  { href: "/painel/vendas", label: "Vendas", group: "business", hint: "Artes, cupons e pacotes" },
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
  { href: "/painel/integracoes", label: "Integrações", group: "setup", hint: "Google Agenda" },
  { href: "/painel/notificacoes", label: "Notificações", staff: true, group: "setup" },
  { href: "/painel/plano", label: "Assinatura", group: "account" },
  { href: "/painel/conta", label: "Conta", staff: true, group: "account" },
];

export const NAV_GROUP_LABELS: Record<Exclude<NavGroup, "main">, string> = {
  business: "Meu negócio",
  setup: "Configurar",
  account: "Conta",
};

/** Menu items for this person: staff see fewer; an ended trial leaves only the plan and the account. */
export function visibleNav(isOwner: boolean, locked: boolean): NavItem[] {
  return PANEL_NAV.filter((item) => isOwner || item.staff).filter(
    (item) => !locked || item.href === "/painel/plano" || item.href === "/painel/conta",
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
