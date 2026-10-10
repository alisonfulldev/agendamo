import type { LockedFeature } from "@/lib/plans";

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
  /** Paid feature: on the Grátis plan the item shows a lock and opens the subscription modal. */
  feature?: LockedFeature;
}

export const PANEL_NAV: NavItem[] = [
  { href: "/painel", label: "Início", group: "main" },
  { href: "/painel/agenda", label: "Agenda", staff: true, group: "main" },
  { href: "/painel/clientes", label: "Clientes", staff: true, group: "main", feature: "customers" },
  { href: "/painel/financeiro", label: "Financeiro", group: "main", feature: "finance" },
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
    feature: "salesTools",
  },
  { href: "/painel/avaliacoes", label: "Avaliações", group: "business", feature: "reviews" },
  { href: "/painel/estatisticas", label: "Estatísticas", group: "business", feature: "stats" },
  { href: "/painel/radar", label: "Radar de demanda", group: "business", feature: "stats" },
  {
    href: "/painel/configuracoes",
    label: "Configurações",
    group: "setup",
    hint: "Horários de atendimento e regras",
  },
  { href: "/painel/equipe", label: "Equipe", group: "setup", feature: "anyProfessional" },
  {
    href: "/painel/integracoes",
    label: "Integrações",
    group: "setup",
    hint: "Google Agenda",
    feature: "googleCalendar",
  },
  { href: "/painel/notificacoes", label: "Notificações", staff: true, group: "setup" },
  { href: "/painel/plano", label: "Assinatura", group: "account" },
  { href: "/painel/conta", label: "Conta", staff: true, group: "account" },
];

export const NAV_GROUP_LABELS: Record<Exclude<NavGroup, "main">, string> = {
  business: "Meu negócio",
  setup: "Configurar",
  account: "Conta",
};

/** Menu items for this person: staff see fewer (owner-only items are hidden). */
export function visibleNav(isOwner: boolean): NavItem[] {
  return PANEL_NAV.filter((item) => isOwner || item.staff);
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
