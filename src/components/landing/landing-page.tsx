import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PLATFORM, type BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { LazyCreationChat } from "@/components/creation/lazy-creation-chat";
import { StickyCta } from "@/components/home/sticky-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteTracker } from "@/components/seo/site-tracker";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import type { LandingCopy } from "@/content/copy/landing";
import { siteUrl } from "@/lib/site-url";
import { isStorageConfigured } from "@/lib/storage/r2";
import {
  faqNode,
  organizationNode,
  softwareApplicationNode,
  websiteNode,
} from "@/lib/seo/structured-data";

import {
  ClosingCta,
  CompareTable,
  container,
  FaqAccordion,
  Hero,
  NicheGrid,
  Objections,
  PainDoors,
  PainScenes,
  PlansTeaser,
  StoryRows,
} from "./sections";

export interface LinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

/**
 * Redesigned landing page (docs/design/direction.md): the home (no `niche`) or a niche hub with
 * its own copy (src/content/copy/landing.ts). Same SEO as before: one H1, the FAQ shown is the
 * FAQPage data, breadcrumb on niche pages, and every CTA opens the creation conversation.
 */
export function LandingPage({
  copy,
  description,
  faq,
  brand = PLATFORM,
  niche,
  extras = [],
}: {
  copy: LandingCopy;
  /** Meta description (SoftwareApplication data). */
  description: string;
  faq: { title: string; items: readonly { question: string; answer: string }[] };
  brand?: BrandConfig;
  /** Niche hub: route and name. */
  niche?: { route: string; name: string };
  /** Niche hub: guides, tools, cities and related areas. */
  extras?: LinkGroup[];
}) {
  const page = siteUrl(niche ? `/${niche.route}` : "/");
  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(brand)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <SiteHeader badge={niche?.name} logo={brand.logo} />
      <main className="flex-1">
        {niche ? (
          <div className={`${container} pt-1`}>
            <Breadcrumbs items={[{ name: niche.name, path: `/${niche.route}` }]} />
          </div>
        ) : null}
        <Hero copy={copy} niche={niche?.route} />
        {copy.doors ? <PainDoors doors={copy.doors} /> : null}
        {copy.pains ? <PainScenes pains={copy.pains} /> : null}
        <StoryRows story={copy.story} mock={copy.mock} />
        <CompareTable compare={copy.compare} />
        {niche ? null : <NicheGrid title="Feito para quem trabalha com hora marcada" />}
        <Objections objections={copy.objections} />
        <PlansTeaser />
        {extras.length ? <ExtraLinks groups={extras} /> : null}
        <FaqAccordion title={faq.title} items={faq.items} />
        <ClosingCta closing={copy.closing} note={copy.hero.note} niche={niche?.route} />
      </main>
      <SiteFooter />
      <StickyCta hideOn={["cta-topo", "cta-final"]} label={copy.hero.cta} niche={niche?.route} />
      <LazyCreationChat photos={isStorageConfigured()} />
      <SiteTracker template={niche ? "nicho" : "home"} niche={niche ? brand.key : null} />
      <JsonLd
        nodes={[
          organizationNode(),
          niche ? null : websiteNode(),
          softwareApplicationNode({
            name: niche ? `MeetChat para ${niche.name.toLowerCase()}` : "MeetChat",
            url: page,
            description,
          }),
          faqNode(faq.items),
        ]}
      />
    </div>
  );
}

/** Niche hub: guides, tools, cities and related areas, as compact link groups. */
function ExtraLinks({ groups }: { groups: LinkGroup[] }) {
  return (
    <section aria-label="Guias, ferramentas e áreas próximas" className="lp-warm py-16 sm:py-20">
      <div className={`${container} grid gap-10 sm:grid-cols-2 lg:grid-cols-4`}>
        {groups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="font-heading text-xl font-semibold">{group.title}</h2>
            <ul className="mt-4 flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group block py-2 font-medium text-foreground hover:text-primary"
                  >
                    {link.label}
                    <ArrowRight
                      className="ml-1.5 inline size-4 align-[-2px] text-primary transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </section>
  );
}
