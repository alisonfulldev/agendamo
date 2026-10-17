import Link from "next/link";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SitePage } from "@/components/site/site-page";
import { TOOLS, TOOLS_INDEX } from "@/content/tools";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: TOOLS_INDEX.title,
  description: TOOLS_INDEX.description,
  path: "/ferramentas",
});

/** Index of the free tools (/ferramentas). */
export default function ToolsIndexPage() {
  return (
    <SitePage template="ferramenta">
      <Breadcrumbs items={[{ name: "Ferramentas", path: "/ferramentas" }]} />
      <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        {TOOLS_INDEX.h1}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{TOOLS_INDEX.intro}</p>
      <ul className="mt-8 grid gap-4">
        {TOOLS.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/ferramentas/${tool.slug}`}
              className="flex flex-col gap-1 rounded-2xl border bg-card p-5 transition-colors hover:border-primary"
            >
              <span className="font-semibold">{tool.label}</span>
              <span className="text-sm text-muted-foreground">{tool.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SitePage>
  );
}
