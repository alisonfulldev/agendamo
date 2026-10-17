/**
 * Index coverage report (Fase 9/10). Compares the URLs in the sitemap with the pages that are
 * indexable when crawled from the home, and checks each sitemap URL:
 *   - answers 200 (no error, no redirect);
 *   - has no "noindex";
 *   - its canonical is itself;
 *   - exactly one <h1>, a <title> and a meta description;
 *   - every JSON-LD block parses and has no "undefined".
 * Also lists indexable pages found by links that are missing from the sitemap, and duplicated
 * titles or descriptions among sitemap pages.
 *
 *   node scripts/seo/report-index-coverage.mts [base=http://localhost:3000] [--strict]
 *
 * Canonicals are compared by path, so the report works against a local build whose
 * NEXT_PUBLIC_APP_URL points elsewhere. --strict exits with 1 on any problem (CI).
 */
import process from "node:process";

const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const strict = args.includes("--strict");
const MAX_PAGES = 3000;

const SKIP =
  /^\/(?:painel|admin|api|auth|cancelar|avaliar|descadastrar|cadastro|entrar|recuperar-senha|redefinir-senha|demo|og|icons|_next)(?:\/|$)|\.(?:svg|png|jpe?g|webp|ico|xml|txt|webmanifest|js|css)$/;

const clean = (path: string) => path.replace(/\/$/, "") || "/";
const locs = (xml: string) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.replace(/&amp;/g, "&"));
const attr = (tag: string, name: string) =>
  new RegExp(`\\b${name}="([^"]*)"`, "i").exec(tag)?.[1] ?? null;

interface Check {
  path: string;
  status: number;
  location: string | null;
  noindex: boolean;
  canonical: string | null;
  h1: number;
  title: string | null;
  description: string | null;
  jsonLdOk: boolean;
  links: string[];
}

async function check(path: string): Promise<Check> {
  const response = await fetch(`${base}${path}`, { redirect: "manual" });
  const html = (response.headers.get("content-type") ?? "").includes("text/html")
    ? await response.text()
    : "";
  const head = html.slice(0, html.indexOf("</head>") + 1 || undefined);
  const robots = /<meta[^>]+name="robots"[^>]*>/i.exec(head)?.[0];
  const canonicalTag = /<link[^>]+rel="canonical"[^>]*>/i.exec(head)?.[0];
  const descTag = /<meta[^>]+name="description"[^>]*>/i.exec(head)?.[0];
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let jsonLdOk = true;
  for (const block of blocks) {
    try {
      JSON.parse(block[1]!);
      if (/undefined/.test(block[1]!)) jsonLdOk = false;
    } catch {
      jsonLdOk = false;
    }
  }
  const links = new Set<string>();
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const tag = match[1]!;
    if (/\brel="[^"]*nofollow/i.test(tag)) continue;
    const href = attr(tag, "href");
    if (!href || /^(?:mailto|tel|#)/.test(href)) continue;
    try {
      const url = new URL(href.replace(/&amp;/g, "&"), `${base}${path}`);
      if (url.origin !== new URL(base).origin || url.search) continue;
      const target = clean(url.pathname);
      if (!SKIP.test(target)) links.add(target);
    } catch {
      // ignore malformed links
    }
  }
  return {
    path,
    status: response.status,
    location: response.headers.get("location"),
    noindex: Boolean(robots && /noindex/i.test(attr(robots, "content") ?? "")),
    canonical: canonicalTag ? attr(canonicalTag, "href") : null,
    h1: (html.match(/<h1[\s>]/gi) ?? []).length,
    title: /<title>([^<]*)<\/title>/i.exec(head)?.[1] ?? null,
    description: descTag ? attr(descTag, "content") : null,
    jsonLdOk,
    links: [...links],
  };
}

// 1. Sitemap URLs.
const index = await fetch(`${base}/sitemap.xml`).then((r) => r.text());
const files = locs(index).map((u) => new URL(u).pathname);
const inSitemap = new Set<string>();
for (const file of files) {
  const xml = await fetch(`${base}${file}`).then((r) => r.text());
  for (const loc of locs(xml)) inSitemap.add(clean(new URL(loc).pathname));
}

// 2. Crawl from the home and the sitemap.
const results = new Map<string, Check>();
const queue = ["/", ...inSitemap];
while (queue.length && results.size < MAX_PAGES) {
  const path = queue.shift()!;
  if (results.has(path)) continue;
  const result = await check(path);
  results.set(path, result);
  for (const link of result.links) if (!results.has(link)) queue.push(link);
}

const problems: string[] = [];
for (const path of inSitemap) {
  const r = results.get(path)!;
  if (r.status !== 200)
    problems.push(`${path}: status ${r.status}${r.location ? ` → ${r.location}` : ""}`);
  else {
    if (r.noindex) problems.push(`${path}: no sitemap, mas com noindex`);
    if (!r.canonical || clean(new URL(r.canonical).pathname) !== path)
      problems.push(`${path}: canonical ${r.canonical ?? "ausente"}`);
    if (r.h1 !== 1) problems.push(`${path}: ${r.h1} <h1>`);
    if (!r.title) problems.push(`${path}: sem <title>`);
    if (!r.description) problems.push(`${path}: sem meta description`);
    if (!r.jsonLdOk) problems.push(`${path}: JSON-LD inválido`);
  }
}

const missing = [...results.values()].filter(
  (r) =>
    r.status === 200 &&
    !r.noindex &&
    r.canonical &&
    clean(new URL(r.canonical).pathname) === r.path &&
    !inSitemap.has(r.path),
);
const brokenLinks = [...results.values()].filter(
  (r) => r.status >= 400 || (r.status >= 300 && r.status < 400),
);

const duplicates = (field: "title" | "description") => {
  const seen = new Map<string, string[]>();
  for (const path of inSitemap) {
    const value = results.get(path)?.[field];
    if (value) seen.set(value, [...(seen.get(value) ?? []), path]);
  }
  return [...seen.entries()].filter(([, paths]) => paths.length > 1);
};
for (const field of ["title", "description"] as const) {
  for (const [value, paths] of duplicates(field)) {
    problems.push(`${field} repetido em ${paths.join(", ")}: "${value.slice(0, 60)}"`);
  }
}

console.log(`Cobertura de índice de ${base}`);
console.log(
  `  ${inSitemap.size} URLs no sitemap (${files.length} arquivos), ${results.size} páginas verificadas.\n`,
);
console.log(`Problemas nas URLs do sitemap: ${problems.length}`);
for (const p of problems) console.log(`  ${p}`);
console.log(`\nIndexáveis encontradas por links e fora do sitemap: ${missing.length}`);
for (const r of missing) console.log(`  ${r.path}`);
console.log(`\nLinks internos para erro ou redirect: ${brokenLinks.length}`);
for (const r of brokenLinks)
  console.log(`  ${r.status} ${r.path}${r.location ? ` → ${r.location}` : ""}`);

if (strict && (problems.length || missing.length || brokenLinks.length)) process.exit(1);
