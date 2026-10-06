// Dependency-free so it can run in the browser without bundling the brand configs.

/** Internal request header set by the proxy. Never trust it from the client. */
export const BRAND_HEADER = "x-brand";
/** Query param and cookie used to pick a brand on localhost and Vercel previews. */
export const BRAND_QUERY_PARAM = "brand";
export const BRAND_COOKIE = "brand";

/** Lowercase, without port, trailing dot or leading "www.". */
export function normalizeHost(host: string | null | undefined): string {
  if (!host) return "";
  let value = host.trim().toLowerCase();
  if (value.startsWith("[")) {
    value = value.slice(0, value.indexOf("]") + 1);
  } else {
    value = value.split(":")[0]!;
  }
  if (value.endsWith(".")) value = value.slice(0, -1);
  if (value.startsWith("www.")) value = value.slice(4);
  return value;
}

/** Host of the main site (NEXT_PUBLIC_APP_URL, e.g. meetchat.com.br), without www. */
function appHost(): string | null {
  try {
    const url = process.env.NEXT_PUBLIC_APP_URL;
    return url ? normalizeHost(new URL(url).host) : null;
  } catch {
    return null;
  }
}

/**
 * Hosts where the brand can be picked with ?brand= / cookie: local dev, Vercel previews and the
 * main site domain (one domain serves every niche; niche pages and sign-up pick the brand).
 */
export function isBrandSelectableHost(normalizedHost: string): boolean {
  return (
    normalizedHost === appHost() ||
    normalizedHost === "localhost" ||
    normalizedHost.endsWith(".localhost") ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "[::1]" ||
    normalizedHost.endsWith(".vercel.app")
  );
}

/**
 * True when navigating to `url` would switch brands on a localhost / preview host.
 * The root layout (theme on <html>) is kept on client-side navigations, so a brand
 * switch must be a full page load.
 */
export function needsFullReloadForBrand(url: URL, currentBrandKey: string | undefined): boolean {
  const requested = url.searchParams.get(BRAND_QUERY_PARAM);
  return (
    requested !== null &&
    requested !== currentBrandKey &&
    isBrandSelectableHost(normalizeHost(url.host))
  );
}
