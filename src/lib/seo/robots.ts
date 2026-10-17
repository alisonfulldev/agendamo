/**
 * AI crawlers the business may want to allow or block (Fase 8). All are allowed by default: the
 * site wants to be cited by AI search. To block one, add its user agent to BLOCKED_CRAWLERS;
 * the robots.txt then gets a group with "Disallow: /" for it. Documented in docs/seo/playbook.md.
 */
export const AI_CRAWLERS = [
  { agent: "OAI-SearchBot", owner: "OpenAI", use: "busca do ChatGPT" },
  { agent: "ChatGPT-User", owner: "OpenAI", use: "visitas pedidas por usuários" },
  { agent: "GPTBot", owner: "OpenAI", use: "treino de modelos" },
  { agent: "Claude-SearchBot", owner: "Anthropic", use: "busca do Claude" },
  { agent: "Claude-User", owner: "Anthropic", use: "visitas pedidas por usuários" },
  { agent: "ClaudeBot", owner: "Anthropic", use: "treino de modelos" },
  { agent: "PerplexityBot", owner: "Perplexity", use: "busca" },
  { agent: "Perplexity-User", owner: "Perplexity", use: "visitas pedidas por usuários" },
  { agent: "Google-Extended", owner: "Google", use: "Gemini e treino (não afeta a Busca)" },
  { agent: "Applebot-Extended", owner: "Apple", use: "treino (não afeta a busca da Apple)" },
  { agent: "CCBot", owner: "Common Crawl", use: "base pública usada em treino" },
] as const;

/** User agents to block entirely. Empty = every crawler follows the rules for "*". */
export const BLOCKED_CRAWLERS: readonly string[] = [];

/** Private areas and states that must never be crawled. CSS/JS (/_next) stay open. */
export const DISALLOWED_PATHS = [
  "/painel",
  "/admin",
  "/api/",
  "/auth/",
  "/cancelar/",
  "/avaliar/",
  "/descadastrar",
  "/cadastro",
  "/entrar",
  "/recuperar-senha",
  "/redefinir-senha",
  "/demo",
  // Links that open the creation conversation: the same page, never a new one.
  "/*?criar=",
  "/*&criar=",
  "/*?nome=",
  "/*?ramo=",
] as const;

export function robotsTxt({
  production,
  sitemapUrl,
  blocked = BLOCKED_CRAWLERS,
}: {
  production: boolean;
  sitemapUrl: string;
  blocked?: readonly string[];
}): string {
  // Previews and development are never indexed.
  if (!production) return "User-agent: *\nDisallow: /\n";
  const lines = ["User-agent: *", "Allow: /", ...DISALLOWED_PATHS.map((p) => `Disallow: ${p}`)];
  for (const agent of blocked) lines.push("", `User-agent: ${agent}`, "Disallow: /");
  lines.push("", `Sitemap: ${sitemapUrl}`);
  return `${lines.join("\n")}\n`;
}
