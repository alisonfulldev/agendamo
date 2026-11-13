import { NICHES } from "@/brands";
import { NICHE_GROUPS } from "@/brands/schema";
import { publishedArticles } from "@/content/articles";
import { COMPARISONS } from "@/content/comparisons";
import { COMPANY, COMPANY_PLACE, MEETCHAT_SUMMARY } from "@/content/company";
import { HOME } from "@/content/home";
import { INTENT_PAGES } from "@/content/intent-pages";
import { SITE_AGENDA_INDEX, SITE_AGENDA_PAGES } from "@/content/site-agenda-pages";
import { WEB_HUBS, WEB_PAGES, webPagePath } from "@/content/web-landing-pages";
import { nicheHomeContent } from "@/content/niche-pages";
import { publishedTopics } from "@/content/niche-guides";
import { ABOUT } from "@/content/about";
import { PRICING } from "@/content/pricing";
import { TOOLS } from "@/content/tools";
import { siteUrl, withoutQuery } from "@/lib/site-url";

import { passesQualityGate } from "./quality";

const url = (path: string) => withoutQuery(siteUrl(path));
const line = (title: string, path: string, description: string) =>
  `- [${title}](${url(path)}): ${description}`;

/**
 * Content of /llms.txt (experimental): what MeetChat is, in a few facts, and links to the main
 * indexable pages with their descriptions. Only pages that pass the quality gate.
 */
export function llmsTxt(): string {
  const niches = NICHES.filter((b) => passesQualityGate(`/${b.niche!.route}`));
  return [
    "# MeetChat",
    "",
    `> ${HOME.meta.description}`,
    "",
    MEETCHAT_SUMMARY,
    "",
    `O MeetChat é um produto da ${COMPANY.name} (${COMPANY_PLACE}), software house fundada em ${COMPANY.foundingYear} por ${COMPANY.founder.name}: ${COMPANY.url}`,
    "",
    "## Para quem é",
    "",
    "Negócios e profissionais que trabalham com hora marcada no Brasil:",
    ...NICHE_GROUPS.map((group) =>
      niches.filter((b) => b.niche!.group === group).map((b) => b.niche!.label),
    )
      .filter((labels) => labels.length > 0)
      .map((labels) => `- ${labels.join(", ")}`),
    "",
    "## Planos",
    "",
    `- ${PRICING.meta.description}`,
    ...PRICING.tiers.map((t) => `- ${t.name}: ${t.price}. ${t.summary}`),
    "- O MeetChat não envia mensagens por WhatsApp: o link é divulgado pelo próprio profissional.",
    "",
    "## Principais páginas",
    "",
    line("Início", "/", HOME.meta.description),
    line("Preços", "/precos", PRICING.meta.description),
    line("Sobre o MeetChat", "/sobre", ABOUT.description),
    "",
    "## Por área",
    "",
    ...niches.map((b) =>
      line(b.niche!.name, `/${b.niche!.route}`, nicheHomeContent(b).meta.description),
    ),
    "",
    "## Site + agenda online por área",
    "",
    line("Site + agenda online", "/site-e-agenda", SITE_AGENDA_INDEX.description),
    ...SITE_AGENDA_PAGES.filter((p) => passesQualityGate(`/site-e-agenda/${p.slug}`)).map((p) =>
      line(p.h1, `/site-e-agenda/${p.slug}`, p.description),
    ),
    "",
    "## Site profissional e loja virtual (sem agenda)",
    "",
    ...Object.values(WEB_HUBS).map((hub) => line(hub.label, hub.path, hub.description)),
    ...WEB_PAGES.filter((p) => passesQualityGate(webPagePath(p))).map((p) =>
      line(p.h1, webPagePath(p), p.description),
    ),
    "",
    "## Guias",
    "",
    ...INTENT_PAGES.map((p) => line(p.label, `/agendamento/${p.slug}`, p.description)),
    ...publishedTopics()
      .filter((t) => passesQualityGate(t.path))
      .map((t) => line(t.page.h1, t.path, t.page.description)),
    "",
    "## Ferramentas",
    "",
    ...TOOLS.map((t) => line(t.label, `/ferramentas/${t.slug}`, t.description)),
    "",
    "## Artigos e ajuda",
    "",
    ...publishedArticles().map((a) => line(a.h1, `/${a.section}/${a.slug}`, a.description)),
    "",
    "## Comparativos",
    "",
    ...COMPARISONS.filter((c) => c.published).map((c) =>
      line(c.h1, `/comparar/${c.slug}`, c.description),
    ),
    "",
  ].join("\n");
}
