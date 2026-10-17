import type { Metadata } from "next";

import { getCurrentBrand } from "@/brands/server";
import { hasRealDomain } from "@/brands/urls";
import { LandingPage } from "@/components/landing/landing-page";
import { SalesPage } from "@/components/sales/sales-page";
import { HOME_LANDING } from "@/content/copy/landing";
import { HOME } from "@/content/home";
import { experimentVariant } from "@/lib/experiments-server";
import { pageMetadata } from "@/lib/seo/metadata";

/**
 * Home: the MeetChat landing page (copy in src/content/copy/landing.ts; metadata and FAQ in
 * src/content/home.ts). A niche that one day answers on its own real domain shows its niche page
 * there instead.
 */
async function homeBrand() {
  const domainBrand = await getCurrentBrand();
  return hasRealDomain(domainBrand) ? domainBrand : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const niche = await homeBrand();
  if (niche) {
    return pageMetadata({
      title: `${niche.name} · ${niche.sales.title}`,
      description: niche.sales.subtitle,
      path: "/",
      brand: niche,
      siteName: niche.name,
      socialTitle: niche.sales.title,
    });
  }
  return pageMetadata({
    title: HOME.meta.title,
    description: HOME.meta.description,
    path: "/",
    socialTitle: HOME.hero.title,
  });
}

export default async function Home() {
  const niche = await homeBrand();
  if (niche) return <SalesPage brand={niche} signupHref="/cadastro" />;
  return (
    <LandingPage
      copy={HOME_LANDING}
      description={HOME.meta.description}
      faq={HOME.faq}
      experiment={await experimentVariant("/")}
    />
  );
}
