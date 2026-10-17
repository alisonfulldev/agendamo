import type { Metadata } from "next";

import { getCurrentBrand } from "@/brands/server";
import { hasRealDomain } from "@/brands/urls";
import { HomePage } from "@/components/home/home-page";
import { SalesPage } from "@/components/sales/sales-page";
import { HOME } from "@/content/home";
import { pageMetadata } from "@/lib/seo/metadata";

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

export default async function Home({ searchParams }: PageProps<"/">) {
  const niche = await homeBrand();
  if (niche) return <SalesPage brand={niche} signupHref="/cadastro" />;
  // A/B test of the title and the button: ?v=b (recorded with the demonstration and sign-up).
  const { v } = await searchParams;
  return <HomePage variant={v === "b" ? "b" : "a"} />;
}
