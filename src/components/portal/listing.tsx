import { Star } from "lucide-react";
import Link from "next/link";

import type { BrandConfig } from "@/brands";
import { formatBRL } from "@/lib/money";
import type { PortalListingItem } from "@/lib/portal/data";
import { publicUrl } from "@/lib/storage/r2";

import { PortalTracker } from "@/app/explorar/portal-tracker";

/** Portal listing body with unique content generated from real data (Prompt 36). */
export function PortalListing({
  brand,
  serviceName,
  placeName,
  citySlug,
  neighborhoodSlug,
  serviceSlug,
  items,
  reviews,
  related,
}: {
  brand: BrandConfig;
  serviceName: string;
  placeName: string;
  citySlug: string;
  neighborhoodSlug: string | null;
  serviceSlug: string;
  items: PortalListingItem[];
  reviews: { business_name: string; rating: number; comment: string }[];
  related: { href: string; label: string }[];
}) {
  const prices = items.map((i) => i.min_price_cents).filter((p) => p > 0);
  const min = prices.length ? Math.min(...prices) : null;
  const max = prices.length ? Math.max(...prices) : null;
  const professionals = items.reduce((sum, i) => sum + i.professionals, 0);
  const faq = [
    min !== null && max !== null
      ? {
          q: `Quanto custa ${serviceName.toLowerCase()} em ${placeName}?`,
          a: `Entre os ${items.length} negócios listados, os preços começam em ${formatBRL(min)} e vão até ${formatBRL(max)} (valor “a partir de” de cada um).`,
        }
      : null,
    {
      q: `Quantos profissionais fazem ${serviceName.toLowerCase()} em ${placeName}?`,
      a: `${items.length} negócios, com ${professionals} profissional(is) no total.`,
    },
    {
      q: "Como agendar?",
      a: "Escolha um negócio, veja horários e preços na página e agende pelo chat ou peça um horário. Leva menos de um minuto.",
    },
  ].filter(Boolean) as { q: string; a: string }[];

  return (
    <>
      <PortalTracker
        type="view"
        city={citySlug}
        neighborhood={neighborhoodSlug}
        service={serviceSlug}
        slugs={items.map((i) => i.slug)}
      />
      <p className="text-muted-foreground">
        {items.length} {items.length === 1 ? "negócio" : "negócios"}
        {min !== null ? ` · a partir de ${formatBRL(min)}` : ""} · {professionals} profissional(is)
      </p>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/${item.slug}/perfil`}
              data-portal-slug={item.slug}
              className={`flex gap-4 rounded-xl border bg-card p-4 hover:border-primary ${item.featured ? "ring-2 ring-primary" : ""}`}
            >
              <div className="size-16 shrink-0 overflow-hidden rounded-full bg-muted">
                {item.avatar_key ? (
                  // eslint-disable-next-line @next/next/no-img-element -- R2 public URL
                  <img
                    src={publicUrl(item.avatar_key) ?? ""}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {item.name}{" "}
                  {item.featured ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      Destaque
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[item.neighborhood, item.city].filter(Boolean).join(", ")}
                  {item.rating !== null && item.reviews > 0 ? (
                    <span className="ml-2 inline-flex items-center gap-0.5">
                      <Star className="size-3.5 fill-primary text-primary" aria-hidden />{" "}
                      {item.rating.toLocaleString("pt-BR")} ({item.reviews})
                    </span>
                  ) : null}
                </p>
                {item.bio ? <p className="mt-1 line-clamp-2 text-sm">{item.bio}</p> : null}
                <p className="mt-1 text-sm font-medium">
                  {serviceName} a partir de {formatBRL(item.min_price_cents)} ·{" "}
                  <span className="text-primary">Agendar</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {reviews.length ? (
        <section aria-labelledby="avaliacoes-recentes">
          <h2 id="avaliacoes-recentes" className="mb-3 text-xl font-bold">
            Avaliações recentes de {brand.terms.customer.plural} verificadas
          </h2>
          <ul className="flex flex-col gap-2">
            {reviews.map((r, i) => (
              <li key={i} className="rounded-xl border bg-card p-3 text-sm">
                <span className="text-primary" aria-label={`${r.rating} de 5`}>
                  {"★".repeat(r.rating)}
                </span>{" "}
                <span className="font-medium">{r.business_name}</span>
                <p className="mt-1">{r.comment}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="perguntas">
        <h2 id="perguntas" className="mb-3 text-xl font-bold">
          Perguntas frequentes
        </h2>
        {faq.map((item) => (
          <details key={item.q} className="mb-2 rounded-xl border bg-card p-3">
            <summary className="cursor-pointer font-medium">{item.q}</summary>
            <p className="mt-2 text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </section>

      {related.length ? (
        <nav aria-label="Buscas relacionadas" className="flex flex-wrap gap-2">
          {related.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-full border bg-card px-3 py-1.5 text-sm hover:border-primary"
            >
              {r.label}
            </Link>
          ))}
        </nav>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
