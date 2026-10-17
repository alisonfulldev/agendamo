import Link from "next/link";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SitePage } from "@/components/site/site-page";
import { COMPARISONS, COMPARISONS_INDEX } from "@/content/comparisons";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: COMPARISONS_INDEX.title,
  description: COMPARISONS_INDEX.description,
  path: "/comparar",
});

/** Index of the comparisons (/comparar). */
export default function ComparisonsIndexPage() {
  return (
    <SitePage template="comparar">
      <Breadcrumbs items={[{ name: "Comparativos", path: "/comparar" }]} />
      <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        {COMPARISONS_INDEX.h1}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{COMPARISONS_INDEX.intro}</p>
      <ul className="mt-8 grid gap-4">
        {COMPARISONS.filter((c) => c.published).map((c) => (
          <li key={c.slug}>
            <Link
              href={`/comparar/${c.slug}`}
              className="flex flex-col gap-1 rounded-2xl border bg-card p-5 transition-colors hover:border-primary"
            >
              <span className="font-semibold">{c.h1}</span>
              <span className="text-sm text-muted-foreground">{c.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SitePage>
  );
}
