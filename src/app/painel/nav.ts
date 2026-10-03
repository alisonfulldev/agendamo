export interface NavItem {
  href: string;
  label: string;
  /** Visible to staff members (others are owner-only). */
  staff?: boolean;
}

export const PANEL_NAV: NavItem[] = [
  { href: "/painel", label: "Início" },
  { href: "/painel/agenda", label: "Agenda", staff: true },
  { href: "/painel/clientes", label: "Clientes", staff: true },
  { href: "/painel/financeiro", label: "Financeiro" },
  { href: "/painel/pagina", label: "Meu perfil" },
  { href: "/painel/vendas", label: "Vendas" },
  { href: "/painel/avaliacoes", label: "Avaliações" },
  { href: "/painel/estatisticas", label: "Estatísticas" },
  { href: "/painel/radar", label: "Radar de demanda" },
  { href: "/painel/equipe", label: "Equipe" },
  { href: "/painel/integracoes", label: "Integrações" },
  { href: "/painel/plano", label: "Assinatura" },
  { href: "/painel/configuracoes", label: "Configurações" },
  { href: "/painel/notificacoes", label: "Notificações", staff: true },
  { href: "/painel/conta", label: "Conta", staff: true },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/painel"
    ? pathname === "/painel"
    : pathname === href || pathname.startsWith(`${href}/`);
}
