/**
 * Internal link audit (Fase 6). Crawls the site from the home following internal links (the HTML
 * as served, no JavaScript), then reports:
 *   - orphans: sitemap URLs no crawled page links to;
 *   - deep pages: more than 3 clicks from the home;
 *   - broken links (4xx/5xx) and links to redirects;
 *   - approximate internal PageRank per page.
 *
 *   node scripts/seo/internal-links.mts [base=http://localhost:3000] [--strict] [--json]
 *
 * --strict exits with 1 when there are orphans, broken links or links to redirects (CI).
 * Uses only Node built-ins, so it runs against any build (local `next start` or production).
 */
import process from "node:process";

const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const strict = args.includes("--strict");
const asJson = args.includes("--json");
const MAX_PAGES = 3000;
const MAX_DEPTH_OK = 3;

/** Private or parameter states that are never crawled (same as robots.txt). */
const SKIP = [
  /^\/painel/,
  /^\/admin/,
  /^\/api\//,
  /^\/auth\//,
  /^\/cancelar\//,
  /^\/avaliar\//,
  /^\/descadastrar/,
  /^\/cadastro/,
  /^\/entrar/,
  /^\/recuperar-senha/,
  /^\/redefinir-senha/,
  /^\/demo/,
  /^\/og/,
  /^\/icons\//,
  /^\/_next\//,
  /\.(?:svg|png|jpe?g|webp|ico|xml|txt|webmanifest|js|css)$/,
];

interface Page {
  path: string;
  status: number;
  depth: number;
  location?: string;
  links: Set<string>;
}

function internalPath(href: string, from: string): string | null {
  if (/^(?:mailto|tel|javascript|data):/i.test(href) || href.startsWith("#")) return null;
  let url: URL;
  try {
    url = new URL(href, `${base}${from}`);
  } catch {
    return null;
  }
  if (url.origin !== new URL(base).origin) return null;
  // Parameter states (?criar=1, ?v=b…) are the same page; nofollow links are skipped below.
  if (url.search) return null;
  const path = url.pathname.replace(/\/$/, "") || "/";
  return SKIP.some((re) => re.test(path)) ? null : path;
}

function linksOf(html: string, from: string): Set<string> {
  const found = new Set<string>();
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const attrs = match[1]!;
    if (/\brel="[^"]*nofollow/i.test(attrs)) continue;
    const href = /\bhref="([^"]*)"/i.exec(attrs)?.[1];
    if (!href) continue;
    const path = internalPath(href.replace(/&amp;/g, "&"), from);
    if (path && path !== from) found.add(path);
  }
  return found;
}

async function fetchPage(
  path: string,
): Promise<{ status: number; html: string; location?: string }> {
  const response = await fetch(`${base}${path}`, { redirect: "manual" });
  const location = response.headers.get("location") ?? undefined;
  const type = response.headers.get("content-type") ?? "";
  const html = type.includes("text/html") ? await response.text() : "";
  return { status: response.status, html, location };
}

async function sitemapPaths(): Promise<string[]> {
  const locs = (xml: string) =>
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.replace(/&amp;/g, "&"));
  const index = await fetch(`${base}/sitemap.xml`).then((r) => (r.ok ? r.text() : ""));
  const files = locs(index).map((u) => new URL(u).pathname);
  const lists = await Promise.all(
    files.map((f) => fetch(`${base}${f}`).then((r) => (r.ok ? r.text() : ""))),
  );
  return [
    ...new Set(lists.flatMap(locs).map((u) => new URL(u).pathname.replace(/\/$/, "") || "/")),
  ];
}

function pageRank(pages: Map<string, Page>, iterations = 40, damping = 0.85): Map<string, number> {
  const nodes = [...pages.keys()].filter((p) => pages.get(p)!.status === 200);
  const n = nodes.length;
  let rank = new Map(nodes.map((p) => [p, 1 / n]));
  for (let i = 0; i < iterations; i++) {
    const next = new Map(nodes.map((p) => [p, (1 - damping) / n]));
    for (const p of nodes) {
      const out = [...pages.get(p)!.links].filter((l) => next.has(l));
      if (out.length === 0) {
        for (const q of nodes) next.set(q, next.get(q)! + (damping * rank.get(p)!) / n);
      } else {
        for (const q of out) next.set(q, next.get(q)! + (damping * rank.get(p)!) / out.length);
      }
    }
    rank = next;
  }
  return rank;
}

const pages = new Map<string, Page>();
const queue: { path: string; depth: number }[] = [{ path: "/", depth: 0 }];
while (queue.length && pages.size < MAX_PAGES) {
  const { path, depth } = queue.shift()!;
  if (pages.has(path)) continue;
  const { status, html, location } = await fetchPage(path);
  const links = status === 200 ? linksOf(html, path) : new Set<string>();
  pages.set(path, { path, status, depth, location, links });
  for (const link of links) if (!pages.has(link)) queue.push({ path: link, depth: depth + 1 });
}

const linkedFrom = new Map<string, string[]>();
for (const page of pages.values()) {
  for (const link of page.links) linkedFrom.set(link, [...(linkedFrom.get(link) ?? []), page.path]);
}
const inSitemap = await sitemapPaths();
const orphans = inSitemap.filter((p) => p !== "/" && !linkedFrom.has(p));
const deep = [...pages.values()].filter((p) => p.status === 200 && p.depth > MAX_DEPTH_OK);
const broken = [...pages.values()].filter((p) => p.status >= 400);
const redirects = [...pages.values()].filter((p) => p.status >= 300 && p.status < 400);
const rank = pageRank(pages);
const top = [...rank.entries()].sort((a, b) => b[1] - a[1]);

if (asJson) {
  console.log(
    JSON.stringify(
      {
        base,
        crawled: pages.size,
        orphans,
        deep: deep.map((p) => ({ path: p.path, depth: p.depth })),
        broken: broken.map((p) => ({
          path: p.path,
          status: p.status,
          from: linkedFrom.get(p.path),
        })),
        redirects: redirects.map((p) => ({
          path: p.path,
          to: p.location,
          from: linkedFrom.get(p.path),
        })),
        pageRank: top.map(([path, value]) => ({ path, value: Number(value.toFixed(5)) })),
      },
      null,
      2,
    ),
  );
} else {
  console.log(`Links internos de ${base}: ${pages.size} páginas rastreadas a partir da home.\n`);
  console.log(`Órfãs (no sitemap, sem link interno): ${orphans.length}`);
  for (const p of orphans) console.log(`  ${p}`);
  console.log(`\nA mais de ${MAX_DEPTH_OK} cliques da home: ${deep.length}`);
  for (const p of deep) console.log(`  ${p.path} (${p.depth} cliques)`);
  console.log(`\nLinks quebrados: ${broken.length}`);
  for (const p of broken)
    console.log(`  ${p.status} ${p.path} ← ${(linkedFrom.get(p.path) ?? []).join(", ")}`);
  console.log(`\nLinks para redirect: ${redirects.length}`);
  for (const p of redirects) console.log(`  ${p.status} ${p.path} → ${p.location}`);
  console.log(`\nPageRank interno (top 25):`);
  for (const [path, value] of top.slice(0, 25)) {
    console.log(`  ${(value * 100).toFixed(2).padStart(6)}%  ${path}`);
  }
}

if (strict && (orphans.length || broken.length || redirects.length)) process.exit(1);
