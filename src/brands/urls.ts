import { getBrandBaseUrl, type BrandConfig } from "@/brands";
import { BRAND_QUERY_PARAM } from "@/brands/host";
import { siteUrl, withoutQuery } from "@/lib/site-url";

/** True on the production deployment (Vercel), where each brand answers on its own domain. */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/** False while the brand still has the provisional "*.example.com" domain. */
export function hasRealDomain(brand: BrandConfig): boolean {
  return Boolean(brand.domains[0]) && !brand.domains[0]!.endsWith(".example.com");
}

/**
 * Absolute URL for links that leave the app (e-mails, QR codes, OG). Production uses the brand's
 * domain (rule 14). Development, previews and brands still on a provisional domain use
 * NEXT_PUBLIC_APP_URL plus ?brand=<key>, so links open with the right brand there too.
 */
export function brandUrl(brand: BrandConfig, path = "/"): string {
  if (isProductionDeployment() && hasRealDomain(brand))
    return new URL(path, getBrandBaseUrl(brand)).toString();
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  url.searchParams.set(BRAND_QUERY_PARAM, brand.key);
  return url.toString();
}

/**
 * Canonical (indexable) URL of a public page in a brand: the brand's own domain in production,
 * otherwise the shared MeetChat site. Never carries parameters (?brand=, ?criar=…).
 */
export function canonicalUrl(brand: BrandConfig, path = "/"): string {
  return withoutQuery(
    isProductionDeployment() && hasRealDomain(brand)
      ? new URL(path, getBrandBaseUrl(brand)).toString()
      : siteUrl(path),
  );
}

/** The niche's sales page (/barbearia…), or the MeetChat home for "Outro / Geral". */
export function nicheHubUrl(brand: BrandConfig): string {
  if (isProductionDeployment() && hasRealDomain(brand)) return canonicalUrl(brand, "/");
  return canonicalUrl(brand, brand.niche ? `/${brand.niche.route}` : "/");
}

/**
 * Public link of a business (/<slug>, /<slug>/perfil, with its own query like ?ref= or
 * ?agendar=1): the short address people share, never with ?brand= (since D2 the page shows in the
 * business's brand by itself). The brand's own domain in production, otherwise the shared site.
 */
export function businessUrl(brand: BrandConfig, path: string): string {
  const base =
    isProductionDeployment() && hasRealDomain(brand) ? getBrandBaseUrl(brand) : siteUrl("/");
  const url = new URL(path, base);
  url.searchParams.delete(BRAND_QUERY_PARAM);
  return url.toString();
}
