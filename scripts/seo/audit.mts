/**
 * Content audit of every sitemap URL, by group (sitemap file): status, words of the main content,
 * number of <h1>, canonical, title and description length, schema types, JSON-LD errors, visible
 * and structured dates and headings phrased as questions. Ends with what is still weak.
 *
 *   node scripts/seo/audit.mts [base=http://localhost:3000] [--all]
 *
 * --all lists every page (default: the summary per group and the weak pages). Works against a
 * local build: sitemap URLs are fetched on `base`, whatever domain they carry.
 * Uses only Node built-ins (no app imports), so it runs without a build.
 */
import process from "node:process";

const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const listAll = args.includes("--all");
const CONCURRENCY = 6;

/** Thresholds of "weak" (rules of thumb, not Google limits). */
const MIN_WORDS = 300;
const TITLE = { min: 25, max: 65 };
const DESCRIPTION = { min: 70, max: 165 };

const locs = (xml: string) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.replace(/&amp;/g, "&"));
const attr = (tag: string, name: string) =>
  new RegExp(`\\b${name}="([^"]*)"`, "i").exec(tag)?.[1] ?? null;
const decode = (text: string) =>
  text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
const textOf = (html: string) =>
  decode(
    html
      .replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).trim();

interface Page {
  group: string;
  path: string;
  status: number;
  words: number;
  h1: number;
  canonicalOk: boolean;
  title: number;
  description: number;
  types: string[];
  jsonLdErrors: string[];
  visibleDate: boolean;
  dateModified: boolean;
  questions: number;
  headings: number;
}

/** Every @type in the JSON-LD, nested ones included, and the problems found. */
function inspectJsonLd(html: string): { types: string[]; errors: string[]; dateModified: boolean } {
  const types = new Set<string>();
  const errors: string[] = [];
  const ids = new Map<string, string>();
  let dateModified = false;
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    const type = record["@type"];
    const typeName = Array.isArray(type) ? type.join("+") : typeof type === "string" ? type : "";
    if (typeName) types.add(typeName);
    if ("dateModified" in record) dateModified = true;
    const id = record["@id"];
    if (typeof id === "string" && typeName) {
      const seen = ids.get(id);
      if (seen && seen !== typeName) errors.push(`@id ${id} usado por ${seen} e ${typeName}`);
      ids.set(id, typeName);
    }
    Object.values(record).forEach(walk);
  };
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const block of blocks) {
    const raw = block[1]!;
    if (/undefined|NaN/.test(raw)) errors.push("valor undefined/NaN");
    try {
      const data = JSON.parse(raw) as Record<string, unknown>;
      if (data["@context"] !== "https://schema.org") errors.push("sem @context schema.org");
      walk(data);
    } catch {
      errors.push("JSON inválido");
    }
  }
  if (blocks.length > 1) errors.push(`${blocks.length} blocos JSON-LD (esperado 1 @graph)`);
  return { types: [...types], errors, dateModified };
}

async function audit(group: string, path: string): Promise<Page> {
  const response = await fetch(`${base}${path}`, { redirect: "manual" });
  const html = (response.headers.get("content-type") ?? "").includes("text/html")
    ? await response.text()
    : "";
  const head = html.slice(0, html.indexOf("</head>") + 1 || undefined);
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? "";
  const canonical = /<link[^>]+rel="canonical"[^>]*>/i.exec(head)?.[0];
  const canonicalHref = canonical ? attr(canonical, "href") : null;
  const descTag = /<meta[^>]+name="description"[^>]*>/i.exec(head)?.[0];
  const headings = [...html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map((m) =>
    textOf(m[1]!),
  );
  const jsonLd = inspectJsonLd(html);
  return {
    group,
    path,
    status: response.status,
    words: main ? textOf(main).split(" ").filter(Boolean).length : 0,
    h1: (html.match(/<h1[\s>]/gi) ?? []).length,
    canonicalOk: canonicalHref !== null && new URL(canonicalHref).pathname === path,
    title: decode(/<title>([^<]*)<\/title>/i.exec(head)?.[1] ?? "").length,
    description: decode((descTag ? attr(descTag, "content") : null) ?? "").length,
    types: jsonLd.types,
    jsonLdErrors: jsonLd.errors,
    visibleDate: /<time\b[^>]*datetime=/i.test(main),
    dateModified: jsonLd.dateModified,
    questions: headings.filter((h) => h.endsWith("?")).length,
    headings: headings.length,
  };
}

function weaknesses(p: Page): string[] {
  const out: string[] = [];
  if (p.status !== 200) return [`status ${p.status}`];
  if (p.words < MIN_WORDS) out.push(`${p.words} palavras`);
  if (p.h1 !== 1) out.push(`${p.h1} <h1>`);
  if (!p.canonicalOk) out.push("canonical diferente da URL");
  if (p.title < TITLE.min || p.title > TITLE.max) out.push(`title com ${p.title} caracteres`);
  if (p.description < DESCRIPTION.min || p.description > DESCRIPTION.max)
    out.push(`description com ${p.description} caracteres`);
  if (p.types.length === 0) out.push("sem schema");
  out.push(...p.jsonLdErrors.map((e) => `JSON-LD: ${e}`));
  if (!p.visibleDate) out.push("sem data visível (<time>)");
  if (p.questions === 0) out.push("nenhum título em forma de pergunta");
  return out;
}

// 1. Sitemap files and their URLs (fetched on `base`).
const index = await fetch(`${base}/sitemap.xml`).then((r) => r.text());
const jobs: { group: string; path: string }[] = [];
for (const file of locs(index).map((u) => new URL(u).pathname)) {
  const group = file.replace(/^\/sitemap\//, "").replace(/\.xml$/, "");
  const xml = await fetch(`${base}${file}`).then((r) => r.text());
  for (const loc of locs(xml)) jobs.push({ group, path: new URL(loc).pathname });
}

// 2. Audit, a few pages at a time.
const pages: Page[] = [];
for (let i = 0; i < jobs.length; i += CONCURRENCY) {
  const batch = jobs.slice(i, i + CONCURRENCY);
  pages.push(...(await Promise.all(batch.map((j) => audit(j.group, j.path)))));
}

// 3. Summary per group.
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)]! : 0;
};
const percent = (part: number, total: number) =>
  total ? `${Math.round((part / total) * 100)}%` : "-";
const groups = [...new Set(pages.map((p) => p.group))];
console.log(`Auditoria de ${pages.length} URLs do sitemap em ${base}\n`);
console.table(
  Object.fromEntries(
    groups.map((group) => {
      const list = pages.filter((p) => p.group === group);
      const ok = list.filter((p) => p.status === 200);
      return [
        group,
        {
          urls: list.length,
          "200": ok.length,
          "palavras (mediana)": median(ok.map((p) => p.words)),
          "h1 = 1": percent(ok.filter((p) => p.h1 === 1).length, ok.length),
          canonical: percent(ok.filter((p) => p.canonicalOk).length, ok.length),
          "title (mediana)": median(ok.map((p) => p.title)),
          "description (mediana)": median(ok.map((p) => p.description)),
          schema: [...new Set(ok.flatMap((p) => p.types))]
            .filter((t) => !["ListItem", "Question", "Answer", "ImageObject", "Offer"].includes(t))
            .join(", "),
          "erros JSON-LD": ok.filter((p) => p.jsonLdErrors.length).length,
          "data visível": percent(ok.filter((p) => p.visibleDate).length, ok.length),
          dateModified: percent(ok.filter((p) => p.dateModified).length, ok.length),
          "com pergunta": percent(ok.filter((p) => p.questions > 0).length, ok.length),
        },
      ];
    }),
  ),
);

if (listAll) {
  console.log("\nTodas as páginas:");
  for (const p of pages) {
    console.log(
      `${p.status} ${p.path} · ${p.words} palavras · h1 ${p.h1} · title ${p.title} · desc ${p.description} · ${p.types.join(", ") || "sem schema"} · ${p.questions}/${p.headings} títulos em pergunta`,
    );
  }
}

// 4. What is still weak.
const weak = pages.map((p) => ({ p, issues: weaknesses(p) })).filter((w) => w.issues.length);
const tally = new Map<string, number>();
for (const { issues } of weak) {
  for (const issue of issues) {
    const kind = issue.replace(/\d+/g, "N");
    tally.set(kind, (tally.get(kind) ?? 0) + 1);
  }
}
console.log(`\nPontos fracos (${weak.length} de ${pages.length} páginas):`);
for (const [kind, count] of [...tally].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${count}× ${kind}`);
}
console.log("\nPor página:");
for (const { p, issues } of weak) console.log(`  [${p.group}] ${p.path}: ${issues.join("; ")}`);
