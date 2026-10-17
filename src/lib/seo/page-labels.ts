import { NICHES } from "@/brands";
import { publishedArticles } from "@/content/articles";
import { COMPARISONS } from "@/content/comparisons";
import { INTENT_PAGES } from "@/content/intent-pages";
import { publishedTopics } from "@/content/niche-guides";
import { TOOLS } from "@/content/tools";

/** Readable name of an internal page, for "related" links. Null for unknown paths. */
export function pageLabel(path: string): string | null {
  return labels().get(path) ?? null;
}

let cache: Map<string, string> | null = null;

function labels(): Map<string, string> {
  if (cache) return cache;
  cache = new Map<string, string>([
    ["/", "Início"],
    ["/precos", "Preços"],
    ["/privacidade", "Política de privacidade"],
    ["/termos", "Termos de uso"],
    ["/agendamento", "Guias de agendamento"],
    ["/ferramentas", "Ferramentas grátis"],
    ["/comparar", "Comparativos"],
    ["/recursos", "Recursos"],
    ["/ajuda", "Central de ajuda"],
    ...NICHES.map(
      (b) =>
        [`/${b.niche!.route}`, `Agendamento online para ${b.niche!.name.toLowerCase()}`] as [
          string,
          string,
        ],
    ),
    ...publishedTopics().map((t) => [t.path, t.page.h1] as [string, string]),
    ...INTENT_PAGES.map((p) => [`/agendamento/${p.slug}`, p.h1] as [string, string]),
    ...TOOLS.map((t) => [`/ferramentas/${t.slug}`, t.label] as [string, string]),
    ...COMPARISONS.filter((c) => c.published).map(
      (c) => [`/comparar/${c.slug}`, c.h1] as [string, string],
    ),
    ...publishedArticles().map((a) => [`/${a.section}/${a.slug}`, a.h1] as [string, string]),
  ]);
  return cache;
}
