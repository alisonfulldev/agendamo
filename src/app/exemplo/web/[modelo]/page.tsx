import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GENERAL_NICHE, PLATFORM } from "@/brands";
import { getCurrentBrand } from "@/brands/server";
import { BrandScope } from "@/components/brand-scope";
import { siteTheme } from "@/components/business-site/site-view";
import { WebBadge } from "@/components/web-site/parts";
import { WebSite } from "@/components/web-site/web-site";
import { WEB_SITE_TEMPLATES, WEB_STORE_TEMPLATES, type WebTemplate } from "@/lib/db/types";
import { exampleName } from "@/lib/public/example-site";
import { webExample } from "@/lib/web/example";

export const metadata: Metadata = { title: "Modelo de site", robots: { index: false } };

const TEMPLATES: readonly string[] = [...WEB_SITE_TEMPLATES, ...WEB_STORE_TEMPLATES];

/**
 * A "Site ou Loja" template with the person's business name (/exemplo/web/<modelo>?nome=), opened
 * over the sales chat (2026-11-07). Out of search engines; nothing is stored.
 */
export default async function WebExamplePage({
  params,
  searchParams,
}: {
  params: Promise<{ modelo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { modelo } = await params;
  if (!TEMPLATES.includes(modelo)) notFound();
  const { nome } = await searchParams;
  const domainBrand = await getCurrentBrand();
  const data = webExample(modelo as WebTemplate, exampleName(nome) ?? "Seu Negócio");
  return (
    <BrandScope brand={GENERAL_NICHE} current={domainBrand}>
      <div className="sticky top-0 z-50 bg-foreground px-4 py-2 text-center text-sm font-semibold text-background">
        {data.store ? "Prévia da sua loja" : "Prévia do seu site"} · você edita tudo depois de
        publicar
      </div>
      <WebSite
        data={data}
        theme={siteTheme(GENERAL_NICHE, null, null)}
        badge={<WebBadge href="/" logo={PLATFORM.logo} />}
      />
    </BrandScope>
  );
}
