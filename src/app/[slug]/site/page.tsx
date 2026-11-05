import type { Metadata } from "next";
import { permanentRedirect, redirect } from "next/navigation";

import { PLATFORM } from "@/brands";
import { brandUrl, nicheHubUrl } from "@/brands/urls";
import { BrandScope } from "@/components/brand-scope";
import { BusinessSite } from "@/components/business-site/business-site";
import { siteTexts } from "@/components/business-site/site-view";
import { JsonLd } from "@/components/seo/json-ld";
import { isIndexable } from "@/lib/public/indexable";
import { getSiteSettings } from "@/lib/public/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { publicUrl } from "@/lib/storage/r2";

import { businessGone, businessStructuredData, loadBusinessPage, withoutBrandParam } from "../load";
import { PageTracker } from "../page-tracker";

export async function generateMetadata({ params }: PageProps<"/[slug]/site">): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadBusinessPage(slug);
  if (!loaded || !loaded.features.site) {
    return { title: "Página não encontrada", robots: { index: false } };
  }
  const { data, brand } = loaded;
  const settings = await getSiteSettings(data.business.slug, data.business.id);
  const city = data.page?.city ? ` em ${data.page.city}` : "";
  const niche = brand.niche ? `: ${brand.niche.name}${city}` : city ? `:${city}` : "";
  const image =
    publicUrl(settings?.hero_image_key) ??
    publicUrl(data.page?.cover_key) ??
    publicUrl(data.page?.avatar_key);
  return pageMetadata({
    title: `${data.business.name}${niche} | Agende online`,
    description: data.page?.bio ?? siteTexts(data, brand, settings).subtitle,
    path: `/${data.business.slug}/site`,
    brand,
    siteName: data.business.name,
    socialTitle: settings?.hero_title ?? data.business.name,
    image: image ? { url: image } : null,
    index: isIndexable(data),
  });
}

/**
 * The business site ("Site + Agenda", 2026-11-05): live in the trial and on the "Site + Agenda"
 * plan (checked on the server, rule 6). Otherwise the link sends visitors to the booking chat
 * (307: the site comes back when the owner subscribes).
 */
export default async function BusinessSitePage({
  params,
  searchParams,
}: PageProps<"/[slug]/site">) {
  const { slug } = await params;
  const clean = withoutBrandParam(`/${slug}/site`, await searchParams);
  if (clean) permanentRedirect(clean);
  const loaded = await loadBusinessPage(slug);
  if (!loaded) return businessGone(slug);
  const { data, brand, domainBrand } = loaded;
  if (loaded.wrongDomain) permanentRedirect(brandUrl(brand, `/${data.business.slug}/site`));
  if (!loaded.features.site) redirect(`/${data.business.slug}`);

  const settings = await getSiteSettings(data.business.slug, data.business.id);

  return (
    <BrandScope brand={brand} current={domainBrand}>
      <JsonLd nodes={businessStructuredData(loaded, { breadcrumb: true })} />
      <PageTracker businessId={data.business.id} />
      <BusinessSite
        data={data}
        brand={brand}
        settings={settings}
        chatHref={`/${data.business.slug}`}
        badgeHref={nicheHubUrl(brand)}
        logo={PLATFORM.logo}
      />
    </BrandScope>
  );
}
