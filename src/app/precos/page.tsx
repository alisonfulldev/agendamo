import { Check, ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { CreationChat } from "@/components/creation/creation-chat";
import { OpenCreationLink } from "@/components/creation/open-creation";
import { HOME } from "@/content/home";
import { PRICING } from "@/content/pricing";
import { PLAN_PRICES } from "@/lib/plans";
import { siteUrl } from "@/lib/site-url";
import { isStorageConfigured } from "@/lib/storage/r2";

export const metadata: Metadata = {
  title: { absolute: PRICING.meta.title },
  description: PRICING.meta.description,
  alternates: { canonical: siteUrl("/precos") },
  openGraph: {
    title: PRICING.meta.title,
    description: PRICING.meta.description,
    url: siteUrl("/precos"),
    siteName: "MeetChat",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/og", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "MeetChat",
    description: PRICING.meta.description,
    url: siteUrl("/precos"),
    offers: [
      {
        "@type": "Offer",
        name: "Mensal",
        price: (PLAN_PRICES.monthly / 100).toFixed(2),
        priceCurrency: "BRL",
      },
      {
        "@type": "Offer",
        name: "Anual",
        price: (PLAN_PRICES.yearly / 100).toFixed(2),
        priceCurrency: "BRL",
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PRICING.faq.items.map((item) => ({
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
      { "@type": "ListItem", position: 2, name: "Preços", item: siteUrl("/precos") },
    ],
  },
];

const cta =
  "flex h-12 items-center justify-center rounded-xl bg-primary px-7 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90";

/** Pricing page: the single plan, monthly vs yearly, what is included, add-ons and billing FAQ. */
export default function PricingPage() {
  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(PLATFORM)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
          <img src={PLATFORM.logo} alt="" width={30} height={30} />
          MeetChat
        </Link>
        <Link
          href="/entrar"
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Entrar
        </Link>
      </header>

      <main className="flex-1">
        <section className="relative isolate overflow-hidden">
          <div className="site-glow absolute inset-0 -z-10" aria-hidden />
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-5 pt-10 pb-12 text-center md:pt-16">
            <h1 className="font-heading text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl">
              {PRICING.hero.title}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
              {PRICING.hero.subtitle}
            </p>
            <OpenCreationLink className={cta}>{PRICING.hero.cta}</OpenCreationLink>
          </div>
        </section>

        <section aria-label="Planos" className="mx-auto max-w-4xl px-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {PRICING.cycles.map((cycle) => (
              <div
                key={cycle.name}
                className={
                  cycle.highlight
                    ? "site-card-glow flex flex-col gap-2 rounded-3xl border-2 border-primary/40 bg-card p-7"
                    : "flex flex-col gap-2 rounded-3xl border bg-card p-7"
                }
              >
                <p className="flex items-center justify-between font-semibold">
                  {cycle.name}
                  {cycle.highlight ? (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Mais econômico
                    </span>
                  ) : null}
                </p>
                <p className="flex items-baseline gap-1">
                  <span className="font-heading text-5xl font-bold tracking-tight">
                    {cycle.price}
                  </span>
                  <span className="text-muted-foreground">{cycle.period}</span>
                </p>
                <p className="text-sm text-muted-foreground">{cycle.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="inclui" className="mx-auto max-w-4xl px-5 py-14">
          <h2 id="inclui" className="text-center text-3xl font-bold tracking-tight">
            {PRICING.includesTitle}
          </h2>
          <ul className="mt-8 grid gap-3 rounded-3xl border bg-card p-7 text-sm sm:grid-cols-2">
            {PRICING.includes.map((item) => (
              <li key={item} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="adicionais" className="mx-auto max-w-4xl px-5 pb-14">
          <h2 id="adicionais" className="text-center text-3xl font-bold tracking-tight">
            {PRICING.extrasTitle}
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {PRICING.extras.map((extra) => (
              <div key={extra.name} className="flex flex-col gap-2 rounded-3xl border bg-card p-6">
                <p className="font-semibold">{extra.name}</p>
                <p className="font-heading text-xl font-bold">{extra.price}</p>
                <p className="text-sm text-muted-foreground">{extra.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq" className="mx-auto max-w-3xl px-5 pb-16">
          <h2 id="faq" className="text-center text-3xl font-bold tracking-tight">
            {PRICING.faq.title}
          </h2>
          <div className="mt-8 flex flex-col divide-y rounded-2xl border bg-card px-5">
            {PRICING.faq.items.map((item) => (
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

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="site-cta-panel flex flex-col items-center gap-6 rounded-3xl px-6 py-14 text-center text-primary-foreground">
            <h2 className="max-w-xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {PRICING.closing.title}
            </h2>
            <OpenCreationLink className="flex h-12 items-center justify-center rounded-xl bg-background px-7 text-base font-semibold text-foreground shadow-lg">
              {PRICING.closing.cta}
            </OpenCreationLink>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 MeetChat</p>
          <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-5">
            {HOME.footer.links.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <CreationChat photos={isStorageConfigured()} />
    </div>
  );
}
