import { NICHES } from "@/brands";
import { publishedArticles } from "@/content/articles";
import { COMPARISONS } from "@/content/comparisons";
import { HOME } from "@/content/home";
import { INTENT_PAGES } from "@/content/intent-pages";
import { nicheHomeContent } from "@/content/niche-pages";
import { publishedTopics } from "@/content/niche-guides";
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
    "MeetChat é um chat de agendamento para negócios com hora marcada no Brasil: o cliente toca no link (Instagram, WhatsApp, Google ou site), escolhe o serviço, o profissional e um horário livre e confirma, sem baixar aplicativo. Inclui agenda por profissional, confirmação e lembrete por e-mail, sinal pelo Pix pago direto ao profissional e financeiro simples.",
    "",
    `- Preços: ${PRICING.meta.description}`,
    "- O MeetChat não envia mensagens por WhatsApp: o link é divulgado pelo próprio profissional.",
    "",
    "## Principais páginas",
    "",
    line("Início", "/", HOME.meta.description),
    line("Preços", "/precos", PRICING.meta.description),
    "",
    "## Por área",
    "",
    ...niches.map((b) =>
      line(b.niche!.name, `/${b.niche!.route}`, nicheHomeContent(b).meta.description),
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
