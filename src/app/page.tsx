import type { Metadata } from "next";

import { PLATFORM } from "@/brands";
import { getCurrentBrand } from "@/brands/server";
import { brandUrl, hasRealDomain } from "@/brands/urls";
import { NicheCards } from "@/components/sales/niche-cards";
import { SalesPage } from "@/components/sales/sales-page";

/**
 * Home: the generic Agendamo page (what the system does, for every niche). A niche that one day
 * answers on its own real domain shows its niche page there instead.
 */
async function homeBrand() {
  const domainBrand = await getCurrentBrand();
  return hasRealDomain(domainBrand) ? domainBrand : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const niche = await homeBrand();
  const brand = niche ?? PLATFORM;
  return {
    title: { absolute: `${brand.name} · ${brand.sales.title}` },
    description: brand.sales.subtitle,
    alternates: niche ? { canonical: brandUrl(niche, "/").split("?")[0] } : undefined,
    openGraph: {
      title: brand.sales.title,
      description: brand.sales.subtitle,
      images: [{ url: "/og", width: 1200, height: 630 }],
    },
  };
}

export default async function Home() {
  const niche = await homeBrand();
  if (niche) return <SalesPage brand={niche} signupHref="/cadastro" />;
  return <SalesPage brand={PLATFORM} signupHref="/comecar" afterHero={<NicheCards />} />;
}
