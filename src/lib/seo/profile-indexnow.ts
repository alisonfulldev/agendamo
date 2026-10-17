import "server-only";

import { after } from "next/server";

import { getNiche } from "@/brands";
import { canonicalUrl } from "@/brands/urls";
import { isIndexable } from "@/lib/public/indexable";
import { getPublicPage } from "@/lib/public/page";

import { indexNowKey, submitIndexNow } from "./indexnow";

/**
 * After the response, tells IndexNow that a business profile changed, only when the profile is
 * indexable (complete). Called from the actions that change what the profile shows (page info,
 * services, photos, name and link), never from bookings. `previousSlug`: the old link after a
 * slug change, so engines drop it (it now answers 404).
 */
export function notifyProfileChanged(
  business: { slug: string; brand_key: string | null },
  previousSlug?: string,
): void {
  if (!indexNowKey()) return;
  after(async () => {
    const brand = getNiche(business.brand_key);
    const data = await getPublicPage(brand.key, business.slug).catch(() => null);
    const urls: string[] = [];
    if (data && isIndexable(data)) {
      urls.push(canonicalUrl(brand, `/${business.slug}/perfil`));
    }
    if (previousSlug && previousSlug !== business.slug) {
      urls.push(canonicalUrl(brand, `/${previousSlug}/perfil`));
    }
    if (urls.length > 0) await submitIndexNow(urls);
  });
}
