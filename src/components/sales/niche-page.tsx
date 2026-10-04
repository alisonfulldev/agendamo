import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBrand } from "@/brands";

import { SalesPage } from "./sales-page";

/** Metadata of a niche page (/beleza…). */
export function nicheMetadata(key: string): Metadata {
  const brand = getBrand(key);
  if (!brand?.niche) return {};
  return {
    title: { absolute: `Agendamo para ${brand.niche.label.toLowerCase()}` },
    description: brand.sales.subtitle,
    openGraph: {
      title: brand.sales.title,
      description: brand.sales.subtitle,
      images: [{ url: "/og", width: 1200, height: 630 }],
    },
  };
}

/** Niche landing page: same sales page, with the niche copy, theme and sign-up. */
export function NichePage({ brandKey }: { brandKey: string }) {
  const brand = getBrand(brandKey);
  if (!brand?.niche) notFound();
  return <SalesPage brand={brand} signupHref={`/cadastro?brand=${brand.key}`} />;
}
