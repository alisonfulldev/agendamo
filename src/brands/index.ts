import { aesthetics } from "./aesthetics";
import { barber } from "./barber";
import { beauty } from "./beauty";
import { physio } from "./physio";
import { psychology } from "./psychology";
import { brandConfigSchema, type BrandConfig } from "./schema";

export type { BrandConfig } from "./schema";

/** Validates every brand file and checks that keys and domains are unique. Throws on any problem. */
export function parseBrands(inputs: readonly unknown[]): BrandConfig[] {
  const brands = inputs.map((input, index) => {
    const result = brandConfigSchema.safeParse(input);
    if (!result.success) {
      const label = (input as { key?: unknown })?.key ?? `#${index}`;
      const issues = result.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      throw new Error(`Invalid brand config "${String(label)}":\n${issues}`);
    }
    return result.data;
  });

  const keys = new Set<string>();
  const domains = new Map<string, string>();
  for (const brand of brands) {
    if (keys.has(brand.key)) throw new Error(`Duplicate brand key "${brand.key}"`);
    keys.add(brand.key);
    for (const domain of brand.domains) {
      const owner = domains.get(domain);
      if (owner) throw new Error(`Domain "${domain}" used by brands "${owner}" and "${brand.key}"`);
      domains.set(domain, brand.key);
    }
  }

  return brands;
}

// Validated once, when this module is first loaded (server start, proxy, build).
export const BRANDS: readonly BrandConfig[] = parseBrands([
  beauty,
  barber,
  aesthetics,
  psychology,
  physio,
]);

const brandsByKey = new Map(BRANDS.map((brand) => [brand.key, brand]));
const brandsByDomain = new Map(
  BRANDS.flatMap((brand) => brand.domains.map((domain) => [domain, brand] as const)),
);

export function getBrand(key: string | null | undefined): BrandConfig | undefined {
  return key ? brandsByKey.get(key) : undefined;
}

export function getBrandByDomain(domain: string): BrandConfig | undefined {
  return brandsByDomain.get(domain);
}

/** Brand for unknown hosts: DEFAULT_BRAND env when it names a valid brand, else "beauty". */
export const DEFAULT_BRAND: BrandConfig =
  getBrand(process.env.DEFAULT_BRAND) ?? getBrand("beauty")!;

/** Absolute base URL of a brand, used for links in e-mails, metadata etc. */
export function getBrandBaseUrl(brand: BrandConfig): URL {
  return new URL(`https://${brand.domains[0]}`);
}
