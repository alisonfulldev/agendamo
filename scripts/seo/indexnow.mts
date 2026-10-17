/**
 * Sends every URL of the live sitemap to IndexNow (run after a deploy that changed pages):
 *   INDEXNOW_KEY=... node scripts/seo/indexnow.mts [https://meetchat.com.br]
 * Reads the sitemap index and its files, then posts the URLs (up to 10 000 per request).
 * Uses only Node built-ins (no app imports), so it runs without a build.
 */
import process from "node:process";

const site = (process.argv[2] ?? process.env.SITE_URL ?? "https://meetchat.com.br").replace(
  /\/$/,
  "",
);
const key = process.env.INDEXNOW_KEY?.trim() ?? "";
if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) {
  console.error("INDEXNOW_KEY ausente ou inválida (8 a 128 letras, números ou hífens).");
  process.exit(1);
}

const locs = (xml: string) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.replace(/&amp;/g, "&"));

async function text(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} respondeu ${response.status}`);
  return response.text();
}

const host = new URL(site).host;
const keyFile = await fetch(`${site}/indexnow-key.txt`).then((r) => (r.ok ? r.text() : ""));
if (keyFile.trim() !== key) {
  console.error(
    `${site}/indexnow-key.txt não devolve a mesma chave. Configure INDEXNOW_KEY no deploy.`,
  );
  process.exit(1);
}

const files = locs(await text(`${site}/sitemap.xml`));
const urls = [
  ...new Set((await Promise.all(files.map(async (f) => locs(await text(f))))).flat()),
].filter((u) => new URL(u).host === host);
for (let start = 0; start < urls.length; start += 10_000) {
  const urlList = urls.slice(start, start + 10_000);
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation: `${site}/indexnow-key.txt`, urlList }),
  });
  console.log(`IndexNow: ${urlList.length} URLs → ${response.status}`);
}
console.log(`Pronto: ${urls.length} URLs de ${files.length} arquivos do sitemap.`);
