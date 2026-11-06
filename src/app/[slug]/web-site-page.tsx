import type { Metadata } from "next";

import { PLATFORM } from "@/brands";
import { brandUrl } from "@/brands/urls";
import { BrandScope } from "@/components/brand-scope";
import { siteTheme } from "@/components/business-site/site-view";
import { WebBadge } from "@/components/web-site/parts";
import { WebSite, WebSiteWaiting } from "@/components/web-site/web-site";
import { getSiteSettings } from "@/lib/public/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { publicUrl } from "@/lib/storage/r2";
import { webSiteData } from "@/lib/web/site-data";
import { webDefaults, webTexts, whatsappHref } from "@/lib/web/texts";

import type { LoadedBusinessPage } from "./load";
import { PageTracker } from "./page-tracker";

/**
 * The business link of a "Site ou Loja" account (2026-11-07): opens straight into its site or
 * store. In waiting mode (no subscription) only the name and the WhatsApp stay.
 */
export async function WebSitePage({ loaded }: { loaded: LoadedBusinessPage }) {
  const { data, brand, domainBrand, features } = loaded;
  const settings = await getSiteSettings(data.business.slug, data.business.id);
  const theme = siteTheme(brand, settings, data.page?.primary_color_override ?? null);
  // "Site feito com MeetChat", to the product's page (its public page comes in a next phase).
  const badge = <WebBadge href={brandUrl(brand, "/")} logo={PLATFORM.logo} />;

  if (!features.active) {
    const store = data.business.product === "store";
    const texts = webTexts(
      webDefaults({ name: data.business.name, bio: null, city: null, store }),
      settings,
    );
    return (
      <BrandScope brand={brand} current={domainBrand}>
        <PageTracker businessId={data.business.id} />
        <WebSiteWaiting
          name={data.business.name}
          whatsappHref={whatsappHref(data.page?.whatsapp_number, texts.message)}
          theme={theme}
          badge={badge}
        />
      </BrandScope>
    );
  }

  return (
    <BrandScope brand={brand} current={domainBrand}>
      <PageTracker businessId={data.business.id} />
      <WebSite data={await webSiteData(data, settings)} theme={theme} badge={badge} />
    </BrandScope>
  );
}

/** Title, description and image of a "Site ou Loja" site; indexed while live with an about text. */
export async function webSiteMetadata(loaded: LoadedBusinessPage): Promise<Metadata> {
  const { data, brand, features } = loaded;
  const settings = await getSiteSettings(data.business.slug, data.business.id);
  const store = data.business.product === "store";
  const city = data.page?.city ? ` em ${data.page.city}` : "";
  const texts = webTexts(
    webDefaults({
      name: data.business.name,
      bio: data.page?.bio ?? null,
      city: data.page?.city ?? null,
      store,
    }),
    settings,
  );
  const image =
    publicUrl(settings?.hero_image_key) ??
    publicUrl(data.page?.cover_key) ??
    publicUrl(data.page?.avatar_key);
  return pageMetadata({
    title: `${data.business.name}${city}`,
    description: data.page?.bio?.slice(0, 160) ?? texts.subtitle,
    path: `/${data.business.slug}`,
    brand,
    siteName: data.business.name,
    socialTitle: texts.title,
    image: image ? { url: image } : null,
    // Rule 12: only a live site with real content goes to the search engines.
    index: features.active && Boolean(data.page?.bio && data.page.bio.length >= 80),
  });
}
