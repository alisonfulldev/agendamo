import type { Metadata } from "next";

import { getCurrentBrand } from "@/brands/server";
import { brandUrl, hasRealDomain } from "@/brands/urls";
import { HomePage } from "@/components/home/home-page";
import { SalesPage } from "@/components/sales/sales-page";
import { HOME } from "@/content/home";
import { siteUrl } from "@/lib/site-url";

/**
 * Home: the short MeetChat sales page (src/content/home.ts). A niche that one day answers on its
 * own real domain shows its niche page there instead.
 */
async function homeBrand() {
  const domainBrand = await getCurrentBrand();
  return hasRealDomain(domainBrand) ? domainBrand : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const niche = await homeBrand();
  if (niche) {
    return {
      title: { absolute: `${niche.name} · ${niche.sales.title}` },
      description: niche.sales.subtitle,
      alternates: { canonical: brandUrl(niche, "/").split("?")[0] },
      openGraph: {
        title: niche.sales.title,
        description: niche.sales.subtitle,
        images: [{ url: "/og", width: 1200, height: 630 }],
      },
    };
  }
  return {
    title: { absolute: HOME.meta.title },
    description: HOME.meta.description,
    alternates: { canonical: siteUrl("/") },
    openGraph: {
      title: HOME.hero.title,
      description: HOME.meta.description,
      url: siteUrl("/"),
      siteName: "MeetChat",
      locale: "pt_BR",
      type: "website",
      images: [{ url: "/og", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function Home() {
  const niche = await homeBrand();
  if (niche) return <SalesPage brand={niche} signupHref="/cadastro" />;
  return <HomePage />;
}
