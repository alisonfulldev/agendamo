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

import { NICHES, PLATFORM, type BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { HOME_DEMO, heroDemoFor } from "@/content/hero-demo";
import { HOME, type HomeContent } from "@/content/home";
import { PLAN_PRICES } from "@/lib/plans";
import { siteUrl } from "@/lib/site-url";
import { isStorageConfigured } from "@/lib/storage/r2";

import { LazyCreationChat } from "@/components/creation/lazy-creation-chat";
import { OpenCreationLink } from "@/components/creation/open-creation";
import { PlanCards } from "@/components/sales/plan-cards";

import { PhoneDemo } from "./phone-demo";
import { StickyCta } from "./sticky-cta";
import { TryChat } from "./try-chat";

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

/** Structured data for search engines: the app with its price, the FAQ and the breadcrumb. */
function jsonLd(content: HomeContent, niche?: { route: string; name: string }) {
  const page = siteUrl(niche ? `/${niche.route}` : "/");
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "MeetChat",
      url: siteUrl("/"),
      logo: siteUrl(PLATFORM.logo),
      email: "contato@brandcodesolutions.com.br",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: niche ? `MeetChat para ${niche.name.toLowerCase()}` : "MeetChat",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: page,
      description: content.meta.description,
      offers: [
        { "@type": "Offer", name: "Grátis", price: "0.00", priceCurrency: "BRL" },
        {
          "@type": "Offer",
          name: "Agenda",
          price: (PLAN_PRICES.agenda.monthly / 100).toFixed(2),
          priceCurrency: "BRL",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: (PLAN_PRICES.pro.monthly / 100).toFixed(2),
          priceCurrency: "BRL",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: content.faq.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "MeetChat", item: siteUrl("/") },
        ...(niche ? [{ "@type": "ListItem", position: 2, name: niche.name, item: page }] : []),
      ],
    },
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
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
          <img src={brand.logo} alt="" width={30} height={30} />
          MeetChat
          {niche ? (
            <span className="rounded-full border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {niche.name}
            </span>
          ) : null}
        </Link>
        <Link
          href="/entrar"
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Entrar
        </Link>
      </header>

      <main className="flex-1">
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

        {/* Try it: the creation conversation embedded */}
        <section aria-labelledby="teste" className="border-y bg-muted/40">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 md:grid-cols-2">
            <div className="text-center md:text-left">
              <h2 id="teste" className="text-3xl font-bold tracking-tight text-balance">
                {content.tryIt.title}
              </h2>
              <p className="mt-3 text-lg text-pretty text-muted-foreground">
                {content.tryIt.subtitle}
              </p>
            </div>
            <TryChat
              ask={content.tryIt.ask}
              niche={route}
              photos={isStorageConfigured()}
              logo={PLATFORM.logo}
            />
          </div>
        </section>

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
        <section aria-labelledby="lembrete" className="below-fold mx-auto max-w-3xl px-5 pb-16 text-center">
          <h2 id="lembrete" className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            {content.reminders.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">
            {content.reminders.text}
          </p>
        </section>

        {/* Pricing */}
        <section aria-labelledby="preco" className="below-fold border-y bg-muted/50">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="preco" className="text-center text-3xl font-bold tracking-tight">
              {content.pricing.title}
            </h2>
            <p className="mt-3 text-center text-lg text-muted-foreground">
              {content.pricing.tagline}
            </p>
            <div className="mt-10">
              <PlanCards niche={route} />
            </div>
            <p className="mt-4 text-center">
              <Link
                href="/precos"
                className="inline-block py-2 font-medium text-primary underline underline-offset-4"
              >
                Ver todos os detalhes dos preços
              </Link>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq" className="below-fold mx-auto max-w-3xl px-5 py-16">
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
        <section className="below-fold mx-auto max-w-6xl px-5 pb-20">
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

      <nav aria-labelledby="areas" className="below-fold mx-auto w-full max-w-6xl px-5 pb-10">
        <h2 id="areas" className="text-sm font-semibold text-muted-foreground">
          Agendamento online por área
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {NICHES.map((b) => (
            <li key={b.key}>
              <Link
                href={`/${b.niche!.route}`}
                className="text-muted-foreground hover:text-foreground"
              >
                {b.niche!.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <footer className="border-t pb-24 md:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 MeetChat</p>
          <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-5">
            {content.footer.links.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      <StickyCta targetId="cta-topo" label={hero.primaryCta} niche={route} />
      <LazyCreationChat photos={isStorageConfigured()} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd(content, niche)).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
