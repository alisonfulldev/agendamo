import {
  Bell,
  CalendarCheck,
  CalendarX,
  Check,
  ChevronDown,
  Ghost,
  LayoutDashboard,
  Link2,
  type LucideIcon,
  Moon,
  MousePointerClick,
  Smartphone,
} from "lucide-react";
import Link from "next/link";

import { PLATFORM, type BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { HOME, type HomeContent } from "@/content/home";
import { formatBRL } from "@/lib/money";
import { PLAN_PRICES, PRICE_TEXT } from "@/lib/plans";
import { siteUrl } from "@/lib/site-url";
import { isStorageConfigured } from "@/lib/storage/r2";

import { CreationChat } from "@/components/creation/creation-chat";
import { OpenCreationLink } from "@/components/creation/open-creation";

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

const reais = (cents: number) => formatBRL(cents).replace(/,00$/, "");

/** Structured data for search engines: the app with its price, the FAQ and the breadcrumb. */
function jsonLd(content: HomeContent, niche?: { route: string; name: string }) {
  const page = siteUrl(niche ? `/${niche.route}` : "/");
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: niche ? `MeetChat para ${niche.name.toLowerCase()}` : "MeetChat",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: page,
      description: content.meta.description,
      offers: {
        "@type": "Offer",
        price: (PLAN_PRICES.monthly / 100).toFixed(2),
        priceCurrency: "BRL",
      },
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
}: {
  content?: HomeContent;
  brand?: BrandConfig;
  /** Niche page: its route (conversation preset) and name (header, structured data). */
  niche?: { route: string; name: string };
} = {}) {
  const { hero } = content;
  const route = niche?.route;
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
        {/* Top */}
        <section id="topo" className="relative isolate overflow-hidden">
          <div className="site-glow absolute inset-0 -z-10" aria-hidden />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-8 pb-16 md:pt-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col items-start gap-6">
              <span className="rounded-full border bg-card px-3 py-1 text-sm font-medium">
                {hero.badge}
              </span>
              <h1 className="font-heading text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {hero.title}
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
                {hero.subtitle}
              </p>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <OpenCreationLink
                  niche={route}
                  className="site-card-glow flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {hero.primaryCta}
                </OpenCreationLink>
                <OpenCreationLink
                  niche={route}
                  className="flex h-12 items-center justify-center rounded-xl border bg-card px-6 text-base font-semibold transition-colors hover:bg-muted"
                >
                  {hero.secondaryCta}
                </OpenCreationLink>
              </div>
              <p className="text-sm text-muted-foreground">{hero.note}</p>
            </div>
            <PhoneDemo examples={content.demo} />
          </div>
        </section>

        {content.intro ? (
          <section aria-labelledby="sobre" className="mx-auto max-w-3xl px-5 py-14">
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

        {/* Pain */}
        <section aria-labelledby="dor" className="border-y bg-muted/50">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2
              id="dor"
              className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-balance"
            >
              {content.pains.title}
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {content.pains.items.map((item) => {
                const Icon = ICONS[item.icon]!;
                return (
                  <li
                    key={item.text}
                    className="flex items-start gap-3 rounded-2xl border bg-card p-5"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <p className="pt-2 font-medium text-pretty">{item.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="como" className="mx-auto max-w-6xl px-5 py-16">
          <h2 id="como" className="text-center text-3xl font-bold tracking-tight">
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

        {/* Gains */}
        <section aria-labelledby="ganhos" className="border-y bg-muted/50">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="ganhos" className="text-center text-3xl font-bold tracking-tight">
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
          </div>
        </section>

        {/* Audience */}
        <section aria-labelledby="para-quem" className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 id="para-quem" className="text-3xl font-bold tracking-tight">
            {content.audience.title}
          </h2>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {content.audience.chips.map((chip) => (
              <li key={chip.label}>
                <Link
                  href={chip.href}
                  className="inline-flex h-11 items-center rounded-full border bg-card px-5 font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {chip.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing */}
        <section aria-labelledby="preco" className="border-y bg-muted/50">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="preco" className="text-center text-3xl font-bold tracking-tight">
              {content.pricing.title}
            </h2>
            <p className="mt-3 text-center text-lg text-muted-foreground">
              {content.pricing.tagline}
            </p>
            <div className="site-card-glow mx-auto mt-10 flex max-w-md flex-col gap-5 rounded-3xl border-2 border-primary/40 bg-card p-7">
              <div>
                <p className="font-semibold">{content.pricing.planName}</p>
                <p className="mt-3 flex items-baseline gap-1">
                  <span className="font-heading text-5xl font-bold tracking-tight">
                    {reais(PLAN_PRICES.monthly)}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  ou {PRICE_TEXT.yearlyPerMonth} no plano anual ({PRICE_TEXT.yearly})
                </p>
                <p className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {content.pricing.trial}
                </p>
              </div>
              <ul className="flex flex-col gap-2.5 text-sm">
                {content.pricing.includes.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">{content.pricing.extra}</p>
              <OpenCreationLink
                niche={route}
                className="flex h-12 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {hero.primaryCta}
              </OpenCreationLink>
            </div>
          </div>
        </section>

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
        <section className="mx-auto max-w-6xl px-5 pb-20">
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

      <StickyCta targetId="topo" label={hero.primaryCta} niche={route} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd(content, niche)).replace(/</g, "\u003c"),
        }}
      />
      <CreationChat photos={isStorageConfigured()} />
    </div>
  );
}
