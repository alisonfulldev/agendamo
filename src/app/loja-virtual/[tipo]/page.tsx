import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getNiche, PLATFORM } from "@/brands";
import { WebLanding } from "@/components/landing/web-landing";
import { getWebPage, WEB_PAGES, webPagePath } from "@/content/web-landing-pages";
import { pageMetadata } from "@/lib/seo/metadata";
import { passesQualityGate } from "@/lib/seo/quality";

export const dynamicParams = false;

export function generateStaticParams() {
  return WEB_PAGES.filter((p) => p.kind === "store").map((p) => ({ tipo: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string }>;
}): Promise<Metadata> {
  const page = getWebPage("store", (await params).tipo);
  if (!page) return {};
  const path = webPagePath(page);
  return pageMetadata({
    title: page.title,
    description: page.description,
    path,
    socialTitle: page.h1,
    index: passesQualityGate(path),
  });
}

/** One kind of business ("Site ou Loja", 2026-11-08), from src/content/web-landing-pages.ts. */
export default async function WebTypePage({ params }: { params: Promise<{ tipo: string }> }) {
  const page = getWebPage("store", (await params).tipo);
  if (!page) notFound();
  return (
    <WebLanding
      page={page}
      brand={page.nicheKey ? getNiche(page.nicheKey) : PLATFORM}
      others={WEB_PAGES.filter((p) => p.kind === "store" && p.slug !== page.slug).map((p) => ({
        label: p.label,
        href: webPagePath(p),
      }))}
    />
  );
}
