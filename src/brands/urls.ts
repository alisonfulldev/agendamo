import { getBrandBaseUrl, type BrandConfig } from "@/brands";
import { BRAND_QUERY_PARAM } from "@/brands/host";

/** True on the production deployment (Vercel), where each brand answers on its own domain. */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Absolute URL for links that leave the app (e-mails, QR codes, OG). Production uses the brand's
 * domain (rule 14). Development and previews use NEXT_PUBLIC_APP_URL plus ?brand=<key>, so links
 * open with the right brand there too.
 */
export function brandUrl(brand: BrandConfig, path = "/"): string {
  if (isProductionDeployment()) return new URL(path, getBrandBaseUrl(brand)).toString();
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  url.searchParams.set(BRAND_QUERY_PARAM, brand.key);
  return url.toString();
}
