import { DEFAULT_BRAND, getBrand, getBrandByDomain, type BrandConfig } from "@/brands";
import { isBrandSelectableHost, normalizeHost } from "@/brands/host";

export {
  BRAND_COOKIE,
  BRAND_HEADER,
  BRAND_QUERY_PARAM,
  isBrandSelectableHost,
  normalizeHost,
} from "@/brands/host";

export interface BrandSelection {
  brandParam?: string | null;
  brandCookie?: string | null;
}

/**
 * Resolves the brand for a request host.
 * - Production domains map to their brand; ?brand= and the cookie are ignored.
 * - On localhost / previews: valid ?brand= wins, then the cookie, then DEFAULT_BRAND.
 * - Unknown hosts fall back to DEFAULT_BRAND.
 */
export function getBrandByHost(
  host: string | null | undefined,
  { brandParam, brandCookie }: BrandSelection = {},
): BrandConfig {
  const normalized = normalizeHost(host);

  const byDomain = getBrandByDomain(normalized);
  if (byDomain) return byDomain;

  if (isBrandSelectableHost(normalized)) {
    return getBrand(brandParam) ?? getBrand(brandCookie) ?? DEFAULT_BRAND;
  }

  return DEFAULT_BRAND;
}
