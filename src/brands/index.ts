import { acupuncture } from "./acupuncture";
import { aesthetics } from "./aesthetics";
import { autoDetailing } from "./auto-detailing";
import { barber } from "./barber";
import { beauty } from "./beauty";
import { chiropractic } from "./chiropractic";
import { consulting } from "./consulting";
import { dentistry } from "./dentistry";
import { general } from "./general";
import { integrativeTherapy } from "./integrative-therapy";
import { lashBrow } from "./lash-brow";
import { massageTherapy } from "./massage-therapy";
import { medical } from "./medical";
import { nails } from "./nails";
import { nutrition } from "./nutrition";
import { occupationalTherapy } from "./occupational-therapy";
import { osteopathy } from "./osteopathy";
import { personalTrainer } from "./personal-trainer";
import { petGrooming } from "./pet-grooming";
import { photography } from "./photography";
import { physio } from "./physio";
import { pilates } from "./pilates";
import { platform } from "./platform";
import { podiatry } from "./podiatry";
import { psychoanalysis } from "./psychoanalysis";
import { psychology } from "./psychology";
import { psychopedagogy } from "./psychopedagogy";
import { speechTherapy } from "./speech-therapy";
import { sportsCourt } from "./sports-court";
import { tattoo } from "./tattoo";
import { tutoring } from "./tutoring";
import { veterinary } from "./veterinary";
import { yoga } from "./yoga";
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
  nails,
  lashBrow,
  tattoo,
  psychology,
  psychoanalysis,
  physio,
  nutrition,
  speechTherapy,
  occupationalTherapy,
  psychopedagogy,
  dentistry,
  medical,
  podiatry,
  chiropractic,
  osteopathy,
  acupuncture,
  massageTherapy,
  integrativeTherapy,
  pilates,
  yoga,
  personalTrainer,
  petGrooming,
  veterinary,
  tutoring,
  photography,
  consulting,
  autoDetailing,
  sportsCourt,
  general,
]);

/**
 * The MeetChat product (generic home page). Validated like a brand but kept out of BRANDS: it is
 * not a niche, so no business, domain lookup or ?brand= ever resolves to it.
 */
export const PLATFORM: BrandConfig = parseBrands([platform])[0]!;

/** Niche brands that have a landing page on the MeetChat site (/psicologia…). */
export const NICHES = BRANDS.filter((brand) => brand.niche);

const brandsByKey = new Map(BRANDS.map((brand) => [brand.key, brand]));
const brandsByDomain = new Map(
  BRANDS.flatMap((brand) => brand.domains.map((domain) => [domain, brand] as const)),
);

export function getBrand(key: string | null | undefined): BrandConfig | undefined {
  return key ? brandsByKey.get(key) : undefined;
}

/** "Outro / Geral": fallback niche of a business (see getNiche). */
export const GENERAL_NICHE: BrandConfig = getBrand("general")!;

/**
 * Niche (brand) of a business: its brand_key, or "Outro / Geral" when the key is empty, unknown
 * or of a removed niche. Every business-facing screen, e-mail and notice resolves it here.
 */
export function getNiche(key: string | null | undefined): BrandConfig {
  return getBrand(key) ?? GENERAL_NICHE;
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
