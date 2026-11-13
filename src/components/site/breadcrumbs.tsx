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

/** The trail's BreadcrumbList, for pages that put it in their own @graph. */
export function breadcrumbTrailNode(items: Crumb[], brand?: BrandConfig) {
  const trail: Crumb[] = [{ name: "Início", path: "/" }, ...items];
  const url = (path: string) => (brand ? canonicalUrl(brand, path) : withoutQuery(siteUrl(path)));
  return breadcrumbNode(trail.map((c) => ({ name: c.name, url: url(c.path) })));
}

/**
 * Breadcrumb trail (Início › … › current page). Its BreadcrumbList goes in a <script> of its own
 * unless `jsonLd` is false: pages with their own structured data add breadcrumbTrailNode() to
 * their @graph instead, so the page has a single JSON-LD block.
 */
export function Breadcrumbs({
  items,
  brand,
  jsonLd = true,
}: {
  items: Crumb[];
  brand?: BrandConfig;
  jsonLd?: boolean;
}) {
  const trail: Crumb[] = [{ name: "Início", path: "/" }, ...items];
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
      {jsonLd ? <JsonLd nodes={[breadcrumbTrailNode(items, brand)]} /> : null}
    </>
  );
}
