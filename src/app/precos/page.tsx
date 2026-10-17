import { Check, Minus } from "lucide-react";

import { PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { LazyCreationChat } from "@/components/creation/lazy-creation-chat";
import { OpenCreationLink } from "@/components/creation/open-creation";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteTracker } from "@/components/seo/site-tracker";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { PRICING } from "@/content/pricing";
import { pageMetadata } from "@/lib/seo/metadata";
import { faqNode, organizationNode, softwareApplicationNode } from "@/lib/seo/structured-data";
import { siteUrl } from "@/lib/site-url";
import { isStorageConfigured } from "@/lib/storage/r2";

export const metadata = pageMetadata({
  title: PRICING.meta.title,
  description: PRICING.meta.description,
  path: "/precos",
});

/**
 * Prices (D1, 2026-10-16): the free WhatsApp mode and the paid plan, with values read from
 * src/lib/plans.ts through src/content/pricing.ts. Replaces the old redirect to the home.
 */
export default function PricingPage() {
  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(PLATFORM)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pt-4 pb-16">
        <Breadcrumbs items={[{ name: "Preços", path: "/precos" }]} />
        <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {PRICING.title}
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
          {PRICING.intro}
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {PRICING.tiers.map((tier) => (
            <section
              key={tier.name}
              aria-labelledby={`plano-${tier.id}`}
              className={`flex flex-col rounded-2xl border bg-card p-6 ${tier.highlight ? "border-primary shadow-sm" : ""}`}
            >
              <h2 id={`plano-${tier.id}`} className="text-xl font-bold">
                {tier.name}
              </h2>
              <p className="mt-1 text-muted-foreground">{tier.summary}</p>
              <p className="mt-5 text-3xl font-bold tracking-tight">{tier.price}</p>
              {tier.priceNote ? (
                <p className="mt-1 text-sm text-muted-foreground">{tier.priceNote}</p>
              ) : null}
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {tier.items.map((item) => (
                  <li key={item.text} className="flex gap-3">
                    {item.included ? (
                      <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-label="Incluso" />
                    ) : (
                      <Minus
                        className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                        aria-label="Não incluso"
                      />
                    )}
                    <span className={item.included ? "" : "text-muted-foreground"}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start gap-2">
          <OpenCreationLink className="flex min-h-[52px] items-center justify-center rounded-xl bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
            {PRICING.cta}
          </OpenCreationLink>
          <p className="text-sm text-muted-foreground">{PRICING.ctaNote}</p>
        </div>

        <section aria-labelledby="duvidas" className="mt-16 max-w-3xl">
          <h2 id="duvidas" className="text-2xl font-bold tracking-tight">
            Dúvidas sobre preços
          </h2>
          <dl className="mt-6 flex flex-col gap-6">
            {PRICING.faq.map((item) => (
              <div key={item.question}>
                <dt className="font-semibold">{item.question}</dt>
                <dd className="mt-1 leading-relaxed text-pretty text-muted-foreground">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter />
      <LazyCreationChat photos={isStorageConfigured()} />
      <SiteTracker template="precos" />
      <JsonLd
        nodes={[
          organizationNode(),
          softwareApplicationNode({ url: siteUrl("/"), description: PRICING.meta.description }),
          faqNode(PRICING.faq),
        ]}
      />
    </div>
  );
}
