import Link from "next/link";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SitePage } from "@/components/site/site-page";
import { INTENT_INDEX, INTENT_PAGES } from "@/content/intent-pages";
import { formatPageDate } from "@/content/site-pages";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: INTENT_INDEX.title,
  description: INTENT_INDEX.description,
  path: "/agendamento",
});

/** Index of the cross-niche guides (/agendamento). */
export default function IntentIndexPage() {
  return (
    <SitePage template="agendamento">
      <Breadcrumbs items={[{ name: "Guias de agendamento", path: "/agendamento" }]} />
      <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        {INTENT_INDEX.h1}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Atualizado em {formatPageDate(INTENT_INDEX.updatedAt)}
      </p>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{INTENT_INDEX.intro}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {INTENT_PAGES.map((page) => (
          <li key={page.slug}>
            <Link
              href={`/agendamento/${page.slug}`}
              className="flex h-full flex-col gap-1 rounded-2xl border bg-card p-5 transition-colors hover:border-primary"
            >
              <span className="font-semibold">{page.h1}</span>
              <span className="text-sm text-muted-foreground">{page.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SitePage>
  );
}
