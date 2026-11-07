import "server-only";
import { webSections } from "@/content/web-site-sections";

import type { WebSiteData } from "@/components/web-site/types";
import {
  WEB_SITE_TEMPLATES,
  WEB_STORE_TEMPLATES,
  type SiteSettings,
  type WebTemplate,
} from "@/lib/db/types";
import type { PublicPage } from "@/lib/public/page";
import { publicUrl } from "@/lib/storage/r2";

import { loadCatalog } from "./catalog";
import { nichePhotos } from "./example";
import { webDefaults, webTexts, whatsappHref } from "./texts";

/** What the public site of a "Site ou Loja" business shows (2026-11-07). */
export async function webSiteData(
  data: PublicPage,
  settings: SiteSettings | null,
): Promise<WebSiteData> {
  const { business, page } = data;
  const store = business.product === "store";
  const allowed: readonly WebTemplate[] = store ? WEB_STORE_TEMPLATES : WEB_SITE_TEMPLATES;
  const template = allowed.includes(settings?.template as WebTemplate)
    ? (settings!.template as WebTemplate)
    : allowed[0]!;
  const texts = webTexts(
    webDefaults({ name: business.name, bio: page?.bio ?? null, city: page?.city ?? null, store }),
    settings,
  );
  const items = await loadCatalog(business.id, { onlyActive: true });
  const phone = page?.whatsapp_number?.replace(/\D/g, "") || null;
  const site: Omit<WebSiteData, "sections"> = {
    businessId: business.id,
    slug: business.slug,
    name: business.name,
    store,
    template,
    texts,
    whatsappHref: whatsappHref(phone, texts.message),
    phone,
    logoUrl: publicUrl(page?.avatar_key),
    // Until the owner sends her own, the top photo of her niche (a tattoo studio sees a tattoo).
    heroUrl:
      publicUrl(settings?.hero_image_key) ??
      publicUrl(page?.cover_key) ??
      nichePhotos(business.brand_key)?.hero ??
      null,
    bio: page?.bio ?? null,
    instagramUrl: page?.instagram_url ?? null,
    place: [page?.address, page?.neighborhood, page?.city].filter(Boolean).join(", "),
    photos: data.photos
      .map((p) => ({ url: publicUrl(p.key), width: p.width, height: p.height }))
      .filter((p): p is { url: string; width: number; height: number } => Boolean(p.url)),
    items: items
      .filter((item) => item.kind === (store ? "product" : "service"))
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        priceCents: item.price_cents,
        category: item.category,
        imageUrl: publicUrl(item.image_key),
        linkUrl: item.link_url,
      })),
  };
  return {
    ...site,
    sections: webSections({
      name: site.name,
      store: site.store,
      place: site.place,
      externalLinks: site.items.some((item) => item.linkUrl),
    }),
  };
}
