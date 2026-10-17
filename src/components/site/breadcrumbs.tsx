import Link from "next/link";

import type { BrandConfig } from "@/brands";
import { canonicalUrl } from "@/brands/urls";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbNode } from "@/lib/seo/structured-data";
import { siteUrl, withoutQuery } from "@/lib/site-url";

export interface Crumb {
  name: string;
  /** Clean path ("/precos"), on the MeetChat site or on the given brand's domain. */
  path: string;
}

/** Breadcrumb trail (Início › … › current page) with its BreadcrumbList structured data. */
export function Breadcrumbs({ items, brand }: { items: Crumb[]; brand?: BrandConfig }) {
  const trail: Crumb[] = [{ name: "Início", path: "/" }, ...items];
  const url = (path: string) => (brand ? canonicalUrl(brand, path) : withoutQuery(siteUrl(path)));
  return (
    <>
      <nav aria-label="Você está em" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          {trail.map((crumb, index) => {
            const last = index === trail.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="text-foreground">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link href={crumb.path} className="hover:text-foreground">
                      {crumb.name}
                    </Link>
                    <span aria-hidden>›</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd nodes={[breadcrumbNode(trail.map((c) => ({ name: c.name, url: url(c.path) })))]} />
    </>
  );
}
