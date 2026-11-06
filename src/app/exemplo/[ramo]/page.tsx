import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NICHES, PLATFORM, type BrandConfig } from "@/brands";
import { nicheHubUrl } from "@/brands/urls";
import { BrandScope } from "@/components/brand-scope";
import { BusinessSite } from "@/components/business-site/business-site";
import { EXAMPLE_COPY, SHOWCASE_SLUGS } from "@/content/site-examples";
import { getCurrentBrand } from "@/brands/server";
import type { SiteTemplate } from "@/lib/db/types";
import { exampleName, examplePage } from "@/lib/public/example-site";
import { getPublicPage } from "@/lib/public/page";
import { getSiteSettings } from "@/lib/public/site";

export const metadata: Metadata = { title: "Site de exemplo", robots: { index: false } };

/**
 * Example site of a niche for WhatsApp sales (2026-11-06): both templates (?modelo=elegante) and
 * a booking button that opens the booking simulation (nothing is booked). A niche with a showcase
 * business shows that one instead. Out of search engines.
 */
export default async function ExampleSitePage({
  params,
  searchParams,
}: PageProps<"/exemplo/[ramo]">) {
  const { ramo } = await params;
  const { modelo, nome } = await searchParams;
  const ownName = exampleName(nome);
  const nameQuery = ownName ? `nome=${encodeURIComponent(ownName)}` : "";
  const niche = NICHES.find((b) => b.niche!.route === ramo);
  if (!niche) notFound();
  const template: SiteTemplate = modelo === "elegante" ? "elegant" : "vibrant";
  const other: SiteTemplate = template === "elegant" ? "vibrant" : "elegant";
  const domainBrand = await getCurrentBrand();

  // With the person's own name (sales chat), always the generated example.
  const showcase = ownName ? undefined : SHOWCASE_SLUGS[niche.key];
  const real = showcase ? await getPublicPage(niche.key, showcase) : null;
  const data = real ?? examplePage(niche, ownName);
  const settings = real ? await getSiteSettings(real.business.slug, real.business.id) : null;
  const chatHref = real
    ? `/${real.business.slug}`
    : `/exemplo/${ramo}/agendar${query(template === "elegant" ? "modelo=elegante" : "", nameQuery)}`;

  return (
    <BrandScope brand={niche} current={domainBrand}>
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-foreground px-4 py-2 text-center text-sm text-background">
        <span className="font-semibold">
          {EXAMPLE_COPY.banner} · {EXAMPLE_COPY.templateName[template]}
        </span>
        <Link
          href={`/exemplo/${ramo}${query(other === "elegant" ? "modelo=elegante" : "", nameQuery)}`}
          className="underline underline-offset-4"
        >
          {EXAMPLE_COPY.switchTo[other]}
        </Link>
      </div>
      <BusinessSite
        template={template}
        data={data}
        brand={niche}
        settings={settings}
        chatHref={chatHref}
        badgeHref={nicheHubUrl(niche)}
        logo={PLATFORM.logo}
        // A photo of the niche where the owner's own photo goes (example only).
        exampleHeroUrl={real ? undefined : `/examples/${niche.key}.webp`}
      />
    </BrandScope>
  );
}

/** "?a&b" from the non-empty parts. */
function query(...parts: string[]): string {
  const joined = parts.filter(Boolean).join("&");
  return joined ? `?${joined}` : "";
}
