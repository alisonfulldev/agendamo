import {
  ArrowRight,
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
  // Color blocks of the landing pages (globals.css .lp-*): only the look changed, same headings,
  // texts and links as before (SEO). On a niche page every block uses the niche palette.
  const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";
  const h2 = "lp-title text-[2.2rem] leading-[1.03] text-balance sm:text-5xl";
  const cta =
    "lp-press inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--lp-cta-bg)] px-7 text-center text-[17px] font-bold text-[color:var(--lp-cta-fg)] transition-opacity hover:opacity-90 sm:w-auto";
  const chip =
    "lp-lift inline-flex min-h-11 items-center rounded-full bg-card px-4 text-sm font-semibold";
  return (
    <div
      data-theme-scope=""
      data-lp={niche ? "niche" : "home"}
      style={brandThemeStyle(brand)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <div className="lp-lime lp-hero">
        <SiteHeader badge={niche?.name} logo={brand.logo} pill />
      </div>

      <main className="flex-1">
        {niche ? (
          <div className="lp-lime lp-hero">
            <div className={`${container} pt-3`}>
              <Breadcrumbs items={[{ name: niche.name, path: `/${niche.route}` }]} />
            </div>
          </div>
        ) : null}
        {/* Top: what it is in 3 seconds, the product working and one main button. */}
        <section id="topo" className="lp-lime lp-hero">
          <div
            className={`${container} grid items-center gap-12 pt-8 pb-16 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-24`}
          >
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-sm font-semibold">
                {hero.eyebrow}
              </p>
              <h1 className="lp-title mt-5 text-[2.75rem] leading-[0.98] text-balance sm:text-6xl lg:text-[4.5rem]">
                {hero.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed font-medium text-pretty sm:text-xl">
                {hero.subtitle}
              </p>
              <div id="cta-topo" className="mt-8 w-full sm:w-auto">
                <OpenCreationLink niche={route} className={cta}>
                  {hero.primaryCta}
                  <ArrowRight className="size-5" aria-hidden />
                </OpenCreationLink>
              </div>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">{hero.note}</p>
              <a
                href="#como-funciona"
                className="mt-2 text-sm font-semibold underline underline-offset-4"
              >
                Ver como funciona
              </a>
              <ul className="mt-8 hidden flex-col gap-3 text-lg font-medium md:flex">
                {hero.points.map((point, i) => {
                  const Icon = [Clock, Bell, MessageCircle][i % 3]!;
                  return (
                    <li key={point} className="flex items-center gap-3">
                      <Icon className="size-5 shrink-0" aria-hidden />
                      {point}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="lp-plain">
              <PhoneDemo demo={demo} logo={PLATFORM.logo} />
            </div>
          </div>
        </section>

        {/* Niches */}
        <section aria-labelledby="nichos" className="lp-deep">
          <div className={`${container} py-16 text-center sm:py-20`}>
            <h2 id="nichos" className={h2}>
              {content.audience.title}
            </h2>
            <ul className="mt-8 flex flex-wrap justify-center gap-2.5">
              {content.audience.chips.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={chip}>
                    {item.label}
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
          className="below-fold lp-soft scroll-mt-4"
        >
          <div className={`${container} py-20 sm:py-28`}>
            <h2 id="como" className={`${h2} text-center`}>
              {content.steps.title}
            </h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {content.steps.items.map((text, index) => (
                <li
                  key={text}
                  className="flex flex-col items-center gap-4 rounded-[2rem] bg-card p-7 text-center"
                >
                  <span className="lp-title flex size-14 items-center justify-center rounded-full bg-[color:var(--lp-cta-bg)] text-2xl text-[color:var(--lp-cta-fg)]">
                    {index + 1}
                  </span>
                  <p className="max-w-xs text-lg font-semibold text-pretty">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {content.intro ? (
          <section aria-labelledby="sobre" className="below-fold">
            <div className={`${container} max-w-3xl py-20 sm:py-24`}>
              <h2 id="sobre" className={h2}>
                {content.intro.title}
              </h2>
              {content.intro.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        {content.notes ? (
          <section aria-labelledby="nicho" className="below-fold lp-lime">
            <div className={`${container} max-w-3xl py-20 sm:py-24`}>
              <h2 id="nicho" className={h2}>
                {content.notes.title}
              </h2>
              <ul className="mt-6 flex list-disc flex-col gap-3 pl-6 text-lg leading-relaxed">
                {content.notes.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* Gains */}
        <section aria-labelledby="ganhos" className="below-fold lp-brand">
          <div className={`${container} py-20 sm:py-28`}>
            <h2 id="ganhos" className={`${h2} text-center`}>
              {content.gains.title}
            </h2>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.gains.items.map((item) => {
                const Icon = ICONS[item.icon]!;
                return (
                  <li
                    key={item.text}
                    className="flex items-center gap-4 rounded-[2rem] bg-card p-6"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--lp-cta-bg)] text-[color:var(--lp-cta-fg)]">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <p className="text-[17px] font-semibold text-pretty">{item.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Reminders */}
        <section aria-labelledby="lembrete" className="below-fold lp-soft">
          <div className={`${container} max-w-3xl py-20 text-center sm:py-24`}>
            <h2 id="lembrete" className={h2}>
              {content.reminders.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground">
              {content.reminders.text}
            </p>
          </div>
        </section>

        {content.cities ? (
          <nav aria-labelledby="cidades" className={`${container} max-w-3xl pt-20`}>
            <h2 id="cidades" className="lp-title text-3xl">
              {content.cities.title}
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {content.cities.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={`${chip} border`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {content.guides ? (
          <nav aria-labelledby="guias" className={`${container} max-w-3xl pt-20`}>
            <h2 id="guias" className="lp-title text-3xl">
              {content.guides.title}
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {content.guides.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="lp-lift flex h-full items-center rounded-3xl bg-muted p-5 font-semibold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {/* FAQ */}
        <section aria-labelledby="faq" className={`${container} max-w-3xl py-20 sm:py-28`}>
          <h2 id="faq" className={`${h2} text-center`}>
            {content.faq.title}
          </h2>
          <div className="mt-10 flex flex-col gap-3">
            {content.faq.items.map((item) => (
              <details key={item.question} className="group rounded-3xl bg-muted px-5 py-2 sm:px-7">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown
                    className="site-chevron size-5 shrink-0 text-muted-foreground transition-transform"
                    aria-hidden
                  />
                </summary>
                <p className="pb-4 leading-relaxed text-pretty text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing */}
        <section id="cta-final" className="lp-deep">
          <div
            className={`${container} flex flex-col items-center gap-7 py-20 text-center sm:py-28`}
          >
            <h2 className="lp-title max-w-3xl text-[2.75rem] leading-[1] text-balance sm:text-7xl">
              {content.closing.title}
            </h2>
            <div className="w-full sm:w-auto">
              <OpenCreationLink niche={route} className={cta}>
                {content.closing.cta}
                <ArrowRight className="size-5" aria-hidden />
              </OpenCreationLink>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <StickyCta hideOn={["cta-topo", "cta-final"]} label={hero.primaryCta} niche={route} />
      <LazyCreationChat photos={isStorageConfigured()} />
      <SiteTracker template={niche ? "nicho" : "home"} niche={niche ? brand.key : null} />
      <JsonLd nodes={structuredData(content, niche)} />
    </div>
  );
}
