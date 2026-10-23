import { CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";

import { brandUrl } from "@/brands/urls";
import { BrandScope } from "@/components/brand-scope";
import { JsonLd } from "@/components/seo/json-ld";
import { getDirectoryCities } from "@/lib/directory/data";
import { slugify } from "@/lib/slug";

import { BackToChatButton } from "../chat-home";
import {
  businessGone,
  withoutBrandParam,
  businessStructuredData,
  businessMetadata,
  loadBusinessPage,
  themeOverride,
} from "../load";
import { PageTracker } from "../page-tracker";
import { ProfileView } from "../profile-view";

export async function generateMetadata({ params }: PageProps<"/[slug]/perfil">): Promise<Metadata> {
  const { slug } = await params;
  return businessMetadata(await loadBusinessPage(slug));
}

/** Standalone profile (portal, Google): the same info shown when the photo is tapped in the chat. */
export default async function BusinessProfilePage({
  params,
  searchParams,
}: PageProps<"/[slug]/perfil">) {
  const { slug } = await params;
  const clean = withoutBrandParam(`/${slug}/perfil`, await searchParams);
  if (clean) permanentRedirect(clean);
  const loaded = await loadBusinessPage(slug);
  if (!loaded) return businessGone(slug);
  const { data, brand, domainBrand } = loaded;
  if (loaded.wrongDomain) permanentRedirect(brandUrl(brand, `/${data.business.slug}/perfil`));

  // Link to the niche's directory page of the profile's city, when that page is indexable.
  const citySlug = data.page?.city ? slugify(data.page.city) : "";
  const directory =
    brand.niche && citySlug
      ? (await getDirectoryCities(brand.key)).find((c) => c.citySlug === citySlug && c.indexable)
      : undefined;

  const label = "Agendar";
  const override = themeOverride(loaded);

  return (
    <BrandScope
      brand={brand}
      current={domainBrand}
      style={override}
      className="flex min-h-[100dvh] justify-center bg-muted"
    >
      <JsonLd nodes={businessStructuredData(loaded, { breadcrumb: true })} />
      <PageTracker businessId={data.business.id} />
      <main className="w-full max-w-xl pb-24">
        <ProfileView
          loaded={loaded}
          chatAction={<BackToChatButton slug={data.business.slug} label={label} />}
        />
        {directory ? (
          <p className="px-4 pt-4 text-center text-sm">
            <Link
              href={`/${brand.niche!.route}/${directory.citySlug}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Mais {brand.niche!.name.toLowerCase()} em {directory.city}
            </Link>
          </p>
        ) : null}
      </main>
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-xl bg-gradient-to-t from-muted via-muted to-transparent px-4 pt-6 pb-4">
        <Link
          href={`/${data.business.slug}`}
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-button text-lg font-medium text-button-foreground shadow-lg hover:opacity-90"
        >
          <CalendarCheck className="size-5" aria-hidden /> {label}
        </Link>
      </div>
    </BrandScope>
  );
}
