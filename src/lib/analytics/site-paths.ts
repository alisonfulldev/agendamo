/**
 * Google tag (Analytics) only on the MeetChat sales site (decided 2026-10-24): home, niche pages,
 * prices, guides, help, tools, sign-up and sign-in. Never on a business's link (/<slug>, the
 * owners' clients), the panel, the admin or the one-click pages from e-mails.
 */
export const GOOGLE_TAG_ID = "G-C0JT6XWNSM";

/** First path segments of the sales site that are not niche pages. */
export const SITE_SECTIONS = [
  "agendamento",
  "ajuda",
  "cadastro",
  "comecar",
  "comparar",
  "consultorios",
  "entrar",
  "explorar",
  "ferramentas",
  "precos",
  "privacidade",
  "recuperar-senha",
  "recursos",
  "redefinir-senha",
  "termos",
] as const;

/** First segments that are never measured (panel, admin, links from e-mails, internals). */
export const UNTRACKED_SECTIONS = [
  "admin",
  "api",
  "auth",
  "avaliar",
  "cancelar",
  "demo",
  "descadastrar",
  "icons",
  "og",
  "painel",
  "sitemap",
] as const;

/**
 * True when the page belongs to the sales site. `nicheRoutes` are the niche pages (/barbearia…);
 * any other single name is a business link and stays out.
 */
export function isSitePath(pathname: string, nicheRoutes: readonly string[]): boolean {
  const first = pathname.split("/").filter(Boolean)[0];
  if (!first) return true;
  return (SITE_SECTIONS as readonly string[]).includes(first) || nicheRoutes.includes(first);
}
