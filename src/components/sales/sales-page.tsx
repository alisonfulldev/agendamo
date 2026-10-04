import { Check, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { NICHES, type BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { DemoChat } from "@/components/sales/demo-chat";
import { PlansTable } from "@/components/sales/plans-table";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { PLAN_PRICES, TRIAL_DAYS } from "@/lib/plans";

const SOCIAL_LABELS = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
} as const;

/**
 * Sales page of the Agendamo site: the generic home (PLATFORM) and each niche page (/beleza…).
 * Content and theme come from the brand file; the theme is scoped to the page, so a brand
 * remembered in the cookie never changes how these pages look.
 */
export function SalesPage({
  brand,
  signupHref,
  afterHero,
}: {
  brand: BrandConfig;
  /** Where "Testar grátis" goes: the niche's sign-up, or the niche picker on the generic home. */
  signupHref: string;
  afterHero?: ReactNode;
}) {
  const { sales } = brand;
  const socialLinks = Object.entries(brand.socialLinks).filter(
    (entry): entry is [keyof typeof SOCIAL_LABELS, string] => Boolean(entry[1]),
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: sales.subtitle,
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
  };

  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(brand)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
          <img src={brand.logo} alt="" width={32} height={32} />
          <span>{brand.name}</span>
          {brand.niche ? (
            <span className="hidden rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground sm:inline">
              {brand.niche.label}
            </span>
          ) : null}
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          <Button asChild variant="ghost">
            <Link href="/entrar">Entrar</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href={signupHref}>Testar grátis</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-12 md:grid-cols-[1fr_auto] md:py-16">
          <div className="flex flex-col items-start gap-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{sales.title}</h1>
            <p className="max-w-xl text-lg text-muted-foreground">{sales.subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href={signupHref}>Testar {TRIAL_DAYS} dias grátis</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <a href="#como-funciona">Ver como funciona</a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Sem cartão. Depois, {formatBRL(PLAN_PRICES.monthly)}/mês ou{" "}
              {formatBRL(Math.round(PLAN_PRICES.yearly / 12))}/mês no plano anual.
            </p>
          </div>
          <DemoChat
            data={{
              businessName: sales.demo.businessName,
              customerName: sales.demo.customerName,
              dayLabel: sales.demo.dayLabel,
              time: sales.demo.time,
              services: brand.suggestedServices.slice(0, 3).map((s, i) => ({
                name: s.name,
                price: sales.demo.prices[i] ?? 0,
              })),
              messages: {
                greeting: brand.chatMessages.greeting,
                askDate: brand.chatMessages.askDate,
                askTime: brand.chatMessages.askTime,
                successConfirmed: brand.chatMessages.successConfirmed,
              },
              serviceTerm: brand.terms.service.singular,
            }}
          />
        </section>

        {afterHero}

        <section aria-labelledby="dores" className="bg-muted">
          <div className="mx-auto max-w-5xl px-6 py-14">
            <h2 id="dores" className="mb-8 text-center text-3xl font-bold">
              Chega de…
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {sales.pains.map((pain) => (
                <li
                  key={pain}
                  className="flex items-start gap-3 rounded-xl border bg-card p-5 text-card-foreground"
                >
                  <X className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
                  <span className="font-medium">{pain}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="como-funciona"
          aria-labelledby="how-it-works"
          className="mx-auto max-w-5xl px-6 py-16"
        >
          <h2 id="how-it-works" className="mb-8 text-center text-3xl font-bold">
            Como funciona
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {sales.howItWorks.map((step, index) => (
              <li key={step.title} className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary font-heading font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="benefits" className="bg-muted">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 id="benefits" className="mb-8 text-center text-3xl font-bold">
              Tudo isso num plano só
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sales.benefits.map((benefit) => (
                <li
                  key={benefit.title}
                  className="rounded-xl border bg-card p-6 text-card-foreground"
                >
                  <Check className="mb-3 size-6 text-primary" aria-hidden />
                  <h3 className="mb-2 text-lg font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="planos" aria-labelledby="plans" className="mx-auto max-w-5xl px-6 py-16">
          <h2 id="plans" className="mb-2 text-center text-3xl font-bold">
            Preço simples
          </h2>
          <p className="mb-8 text-center text-muted-foreground">
            {TRIAL_DAYS} dias grátis com tudo liberado. Depois, escolha mensal ou anual.
          </p>
          <PlansTable />
        </section>

        {sales.testimonials.length > 0 ? (
          <section aria-labelledby="testimonials" className="bg-muted">
            <div className="mx-auto max-w-5xl px-6 py-16">
              <h2 id="testimonials" className="mb-8 text-center text-3xl font-bold">
                Quem usa
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {sales.testimonials.map((testimonial) => (
                  <li
                    key={testimonial.name}
                    className="flex flex-col gap-3 rounded-xl border bg-card p-6 text-card-foreground"
                  >
                    {testimonial.isExample ? (
                      <span className="self-start rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                        Exemplo
                      </span>
                    ) : null}
                    <blockquote className="text-lg">“{testimonial.quote}”</blockquote>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.name}, {testimonial.role}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="faq" className="mx-auto max-w-3xl px-6 py-16">
          <h2 id="faq" className="mb-8 text-center text-3xl font-bold">
            Perguntas frequentes
          </h2>
          <div className="flex flex-col gap-3">
            {sales.faq.map((item) => (
              <details
                key={item.question}
                className="rounded-xl border bg-card p-4 text-card-foreground"
              >
                <summary className="cursor-pointer font-medium">{item.question}</summary>
                <p className="mt-2 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-14 text-center">
            <h2 className="text-3xl font-bold">Comece hoje: em 5 minutos seu link está no ar</h2>
            <p className="opacity-90">
              {TRIAL_DAYS} dias grátis, sem cartão. Cancele quando quiser.
            </p>
            <Button asChild size="lg" variant="secondary" className="h-12 px-6 text-base">
              <Link href={signupHref}>Testar {TRIAL_DAYS} dias grátis</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>{brand.name}</p>
          <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-4">
            {NICHES.map((niche) => (
              <Link
                key={niche.key}
                href={`/${niche.niche!.route}`}
                className="hover:text-foreground"
              >
                {niche.niche!.name}
              </Link>
            ))}
            <Link href="/explorar" className="hover:text-foreground">
              Encontre profissionais
            </Link>
            <Link href="/termos" className="hover:text-foreground">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-foreground">
              Privacidade
            </Link>
            {socialLinks.map(([network, url]) => (
              <a
                key={network}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                {SOCIAL_LABELS[network]}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
