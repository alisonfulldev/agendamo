/**
 * Panel menu (reorganized on 2026-11-05): 7 sections instead of 17 items. A section with more than
 * one screen shows its screens as tabs at the top of the page (SectionTabs); on the phone the
 * bottom bar has Início, Agenda, Clientes and "Mais", which lists the other sections.
 */

export interface NavItem {
  href: string;
  label: string;
  /** Visible to staff members (others are owner-only). */
  staff?: boolean;
  /** Short note in the phone's "Mais" list. */
  hint?: string;
  /** Shown only while the Pix deposit is on (DEPOSITS_ENABLED). */
  deposits?: boolean;
  /** Stays in the menu in waiting mode (subscription and account). */
  waiting?: boolean;
}

export interface NavSection {
  key: "home" | "agenda" | "customers" | "finance" | "page" | "sell" | "settings";
  label: string;
  /** Bottom bar on the phone (the others are in "Mais"). */
  tab?: boolean;
  items: NavItem[];
}

export const PANEL_SECTIONS: NavSection[] = [
  { key: "home", label: "Início", tab: true, items: [{ href: "/painel", label: "Início" }] },
  {
    key: "agenda",
    label: "Agenda",
    tab: true,
    items: [{ href: "/painel/agenda", label: "Agenda", staff: true }],
  },
  {
    key: "customers",
    label: "Clientes",
    tab: true,
    items: [{ href: "/painel/clientes", label: "Clientes", staff: true }],
  },
  {
    key: "finance",
    label: "Financeiro",
    items: [
      { href: "/painel/financeiro", label: "Financeiro", hint: "Entradas, saídas e resultado" },
      {
        href: "/painel/sinais",
        label: "Sinais pelo Pix",
        hint: "Comprovantes para conferir",
        deposits: true,
      },
    ],
  },
  {
    key: "page",
    label: "Minha página",
    items: [
      { href: "/painel/pagina", label: "Meu perfil", hint: "Foto, serviços, preços e fotos" },
      { href: "/painel/site", label: "Meu site", hint: "Cores, foto e textos do site" },
    ],
  },
  {
    key: "sell",
    label: "Vender mais",
    items: [
      { href: "/painel/vendas", label: "Vendas", hint: "Artes, cupons e pacotes" },
      { href: "/painel/avaliacoes", label: "Avaliações" },
      { href: "/painel/estatisticas", label: "Estatísticas" },
      { href: "/painel/radar", label: "Radar de demanda" },
    ],
  },
  {
    key: "settings",
    label: "Ajustes",
    items: [
      {
        href: "/painel/configuracoes",
        label: "Configurações",
        hint: "Horários de atendimento e regras",
      },
      { href: "/painel/equipe", label: "Equipe" },
      { href: "/painel/integracoes", label: "Integrações", hint: "Google Agenda" },
      { href: "/painel/notificacoes", label: "Notificações", staff: true },
      { href: "/painel/plano", label: "Assinatura", waiting: true },
      { href: "/painel/conta", label: "Conta", staff: true, waiting: true },
    ],
  },
];

export interface NavOptions {
  isOwner: boolean;
  /** Waiting mode: only the subscription and the account. */
  waiting: boolean;
  deposits: boolean;
  /** Niche wording (panelWords): health niches have no sales labels. */
  labels: { sellSection: string; salesTitle: string };
}

function visibleItem(item: NavItem, { isOwner, waiting, deposits }: NavOptions): boolean {
  return (
    (isOwner || Boolean(item.staff)) &&
    (!waiting || Boolean(item.waiting)) &&
    (deposits || !item.deposits)
  );
}

/** Sections with the screens this person can open (staff and waiting mode see fewer). */
export function visibleSections(options: NavOptions): NavSection[] {
  const { labels } = options;
  return PANEL_SECTIONS.map((section) => ({
    ...section,
    label: section.key === "sell" ? labels.sellSection : section.label,
    items: section.items
      .filter((item) => visibleItem(item, options))
      .map((item) =>
        item.href === "/painel/vendas" ? { ...item, label: labels.salesTitle } : item,
      ),
  })).filter((section) => section.items.length > 0);
}

/** Section of the current page (its screens become tabs). */
export function sectionOf(sections: NavSection[], pathname: string): NavSection | undefined {
  return sections.find((section) => section.items.some((item) => isActive(pathname, item.href)));
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
