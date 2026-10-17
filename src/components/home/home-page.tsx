import {
  Bell,
  CalendarCheck,
  CalendarX,
  ChevronDown,
  Clock,
  Ghost,
  LayoutDashboard,
  Link2,
  type LucideIcon,
  MessageCircle,
  Moon,
  MousePointerClick,
  Smartphone,
} from "lucide-react";
import Link from "next/link";

import { PLATFORM, type BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { HOME_DEMO, heroDemoFor } from "@/content/hero-demo";
import { HOME, type HomeContent } from "@/content/home";
import { siteUrl } from "@/lib/site-url";
import {
  faqNode,
  organizationNode,
  softwareApplicationNode,
  websiteNode,
} from "@/lib/seo/structured-data";
import { isStorageConfigured } from "@/lib/storage/r2";

import { LazyCreationChat } from "@/components/creation/lazy-creation-chat";
import { OpenCreationLink } from "@/components/creation/open-creation";

import { JsonLd } from "@/components/seo/json-ld";
import { SiteTracker } from "@/components/seo/site-tracker";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";

import { PhoneDemo } from "./phone-demo";
import { StickyCta } from "./sticky-cta";

const ICONS: Record<string, LucideIcon> = {
  moon: Moon,
  ghost: Ghost,
  "calendar-x": CalendarX,
  "calendar-check": CalendarCheck,
  bell: Bell,
  smartphone: Smartphone,
  link: Link2,
  layout: LayoutDashboard,
  pointer: MousePointerClick,
};

/**
 * Structured data: MeetChat (organization, and the site on the home), the app with the two price
 * levels of /precos and the FAQ shown on the page (niche pages add the breadcrumb's own).
 */
function structuredData(content: HomeContent, niche?: { route: string; name: string }) {
  const page = siteUrl(niche ? `/${niche.route}` : "/");
  return [
    organizationNode(),
    niche ? null : websiteNode(),
    softwareApplicationNode({
      name: niche ? `MeetChat para ${niche.name.toLowerCase()}` : "MeetChat",
      url: page,
      description: content.meta.description,
    }),
    faqNode(content.faq.items),
  ];
}

/**
 * Sales page: the home (default texts) and each niche page (its own texts, theme and examples).
 * Every call to action opens the creation conversation over the page (?criar=1, with the niche
 * already chosen on niche pages).
 */
export function HomePage({
  content = HOME,
  brand = PLATFORM,
  niche,
  variant = "a",
}: {
  content?: HomeContent;
  brand?: BrandConfig;
  /** Niche page: its route (conversation preset) and name (header, structured data). */
  niche?: { route: string; name: string };
  /** A/B test of the title and the button (?v=b). */
  variant?: "a" | "b";
} = {}) {
  const hero =
    variant === "b" && content.hero.variantB
      ? { ...content.hero, ...content.hero.variantB }
      : content.hero;
  const route = niche?.route;
  const demo = niche ? heroDemoFor(brand) : HOME_DEMO;
  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(brand)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <SiteHeader badge={niche?.name} logo={brand.logo} />

      <main className="flex-1">
        {niche ? (
          <div className="mx-auto max-w-6xl px-5 pt-1">
            <Breadcrumbs items={[{ name: niche.name, path: `/${niche.route}` }]} />
          </div>
        ) : null}
        {/* Top: what it is in 3 seconds, the product working and one main button. */}
        <section id="topo">
          <div className="mx-auto grid max-w-6xl items-start gap-8 px-5 pt-2 pb-12 md:items-center md:gap-12 md:pt-12 md:pb-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col items-start">
              <p className="text-sm font-semibold text-primary">{hero.eyebrow}</p>
              <h1 className="mt-2 font-heading text-[2rem] leading-[1.12] font-bold tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-[3.5rem]">
                {hero.title}
              </h1>
              <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-pretty text-muted-foreground md:text-lg">
                {hero.subtitle}
              </p>
              <div id="cta-topo" className="mt-5 w-full sm:w-auto">
                <OpenCreationLink
                  niche={route}
                  className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
                >
                  {hero.primaryCta}
                </OpenCreationLink>
              </div>
              <p className="mt-2.5 text-[13px] text-muted-foreground sm:text-sm">{hero.note}</p>
              <a
                href="#como-funciona"
                className="mt-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Ver como funciona
              </a>
              <ul className="mt-8 hidden flex-col gap-3 text-lg md:flex">
                {hero.points.map((point, i) => {
                  const Icon = [Clock, Bell, MessageCircle][i % 3]!;
                  return (
                    <li key={point} className="flex items-center gap-3">
                      <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                      {point}
                    </li>
                  );
                })}
              </ul>
            </div>
            <PhoneDemo demo={demo} logo={PLATFORM.logo} />
          </div>
        </section>

        {/* Niches */}
        <section aria-labelledby="nichos" className="border-y bg-muted/40">
          <div className="mx-auto max-w-6xl px-5 py-10 text-center">
            <h2 id="nichos" className="text-xl font-bold tracking-tight text-balance sm:text-2xl">
              {content.audience.title}
            </h2>
            <ul className="mt-5 flex flex-wrap justify-center gap-2.5">
              {content.audience.chips.map((chip) => (
                <li key={chip.label}>
                  <Link
                    href={chip.href}
                    className="inline-flex h-10 items-center rounded-full border bg-card px-4 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                  >
                    {chip.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section
          id="como-funciona"
          aria-labelledby="como"
          className="below-fold mx-auto max-w-6xl scroll-mt-4 px-5 py-16"
        >
          <h2 id="como" className="text-center text-3xl font-bold tracking-tight text-balance">
            {content.steps.title}
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {content.steps.items.map((text, index) => (
              <li key={text} className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="max-w-xs text-lg font-medium text-pretty">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {content.intro ? (
          <section aria-labelledby="sobre" className="below-fold mx-auto max-w-3xl px-5 pb-14">
            <h2 id="sobre" className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              {content.intro.title}
            </h2>
            {content.intro.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ) : null}

        {content.notes ? (
          <section aria-labelledby="nicho" className="below-fold mx-auto max-w-3xl px-5 pb-14">
            <h2 id="nicho" className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              {content.notes.title}
            </h2>
            <ul className="mt-5 flex list-disc flex-col gap-3 pl-6 text-lg leading-relaxed text-muted-foreground marker:text-primary">
              {content.notes.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Gains */}
        <section aria-labelledby="ganhos" className="below-fold mx-auto max-w-6xl px-5 py-16">
          <h2 id="ganhos" className="text-center text-3xl font-bold tracking-tight text-balance">
            {content.gains.title}
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.gains.items.map((item) => {
              const Icon = ICONS[item.icon]!;
              return (
                <li
                  key={item.text}
                  className="flex items-center gap-4 rounded-2xl border bg-card p-5"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <p className="font-medium text-pretty">{item.text}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Reminders */}
        <section
          aria-labelledby="lembrete"
          className="below-fold mx-auto max-w-3xl px-5 pb-16 text-center"
        >
          <h2 id="lembrete" className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            {content.reminders.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">
            {content.reminders.text}
          </p>
        </section>

        {content.cities ? (
          <nav aria-labelledby="cidades" className="mx-auto max-w-3xl px-5 pb-16">
            <h2 id="cidades" className="text-2xl font-bold tracking-tight text-balance">
              {content.cities.title}
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {content.cities.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex h-10 items-center rounded-full border bg-card px-4 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {content.guides ? (
          <nav aria-labelledby="guias" className="mx-auto max-w-3xl px-5 pb-16">
            <h2 id="guias" className="text-2xl font-bold tracking-tight text-balance">
              {content.guides.title}
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {content.guides.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex h-full items-center rounded-2xl border bg-card p-4 font-medium transition-colors hover:border-primary hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {/* FAQ */}
        <section aria-labelledby="faq" className="mx-auto max-w-3xl px-5 py-16">
          <h2 id="faq" className="text-center text-3xl font-bold tracking-tight">
            {content.faq.title}
          </h2>
          <div className="mt-8 flex flex-col divide-y rounded-2xl border bg-card px-5">
            {content.faq.items.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown
                    className="site-chevron size-5 shrink-0 text-muted-foreground transition-transform"
                    aria-hidden
                  />
                </summary>
                <p className="mt-2 leading-relaxed text-pretty text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing */}
        <section id="cta-final" className="mx-auto max-w-6xl px-5 pb-20">
          <div className="site-cta-panel flex flex-col items-center gap-6 rounded-3xl px-6 py-14 text-center text-primary-foreground">
            <h2 className="max-w-xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {content.closing.title}
            </h2>
            <OpenCreationLink
              niche={route}
              className="flex h-12 items-center justify-center rounded-xl bg-background px-7 text-base font-semibold text-foreground shadow-lg"
            >
              {content.closing.cta}
            </OpenCreationLink>
          </div>
        </section>
      </main>

      <SiteFooter links={content.footer.links} />

      <StickyCta hideOn={["cta-topo", "cta-final"]} label={hero.primaryCta} niche={route} />
      <LazyCreationChat photos={isStorageConfigured()} />
      <SiteTracker template={niche ? "nicho" : "home"} niche={niche ? brand.key : null} />
      <JsonLd nodes={structuredData(content, niche)} />
    </div>
  );
}
