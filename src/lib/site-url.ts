/**
 * Absolute URL on the main site (NEXT_PUBLIC_APP_URL, e.g. https://meetchat.com.br): canonical
 * links, sitemap, robots and structured data. One domain serves every niche page.
 */
export function siteUrl(path = "/"): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://meetchat.com.br";
  return new URL(path, base).toString();
}

/** Same URL without parameters and fragment (canonicals, sitemaps). */
export function withoutQuery(url: string): string {
  const clean = new URL(url);
  clean.search = "";
  clean.hash = "";
  return clean.toString();
}
