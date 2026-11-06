import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { GuideCta } from "@/components/site/guide-article";
import { SitePage } from "@/components/site/site-page";
import { SITE_AGENDA_INDEX, SITE_AGENDA_PAGES } from "@/content/site-agenda-pages";
import { pageMetadata } from "@/lib/seo/metadata";
import { organizationNode } from "@/lib/seo/structured-data";

export const metadata = pageMetadata({
  title: SITE_AGENDA_INDEX.title,
  description: SITE_AGENDA_INDEX.description,
  path: "/site-e-agenda",
  socialTitle: SITE_AGENDA_INDEX.h1,
});

/** Hub of the "Site + agenda online" pages (2026-11-06): one link per area. */
export default function SiteAgendaHub() {
  return (
    <SitePage template="site-e-agenda">
      <Breadcrumbs items={[{ name: "Site + agenda online", path: "/site-e-agenda" }]} />
      <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {SITE_AGENDA_INDEX.h1}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
        {SITE_AGENDA_INDEX.intro}
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {SITE_AGENDA_PAGES.map((page) => (
          <li key={page.slug}>
            <Link
              href={`/site-e-agenda/${page.slug}`}
              className="flex h-full flex-col rounded-2xl border bg-card p-5 hover:border-primary"
            >
              <span className="font-semibold">{page.h1}</span>
              <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {page.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <GuideCta
        title="Seu site + agenda online, pronto para testar agora."
        label="Comece grátis, sem cartão"
      />
      <JsonLd nodes={[organizationNode()]} />
    </SitePage>
  );
}
