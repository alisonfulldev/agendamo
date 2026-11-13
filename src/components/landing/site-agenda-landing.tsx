import { ArrowRight, CalendarCheck, Check } from "lucide-react";
import Link from "next/link";

import type { BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { LazyCreationChat } from "@/components/creation/lazy-creation-chat";
import { StickyCta } from "@/components/home/sticky-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteTracker } from "@/components/seo/site-tracker";
import { Breadcrumbs, breadcrumbTrailNode, type Crumb } from "@/components/site/breadcrumbs";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { EXAMPLE_GALLERY, EXAMPLE_NAMES } from "@/content/site-examples";
import type { SiteAgendaPage } from "@/content/site-agenda-pages";
import { SITE_PRICE_TEXT, TRIAL_DAYS } from "@/lib/plans";
import { faqNode, organizationNode } from "@/lib/seo/structured-data";
import { isStorageConfigured } from "@/lib/storage/r2";

import { container, CtaButton, FaqAccordion } from "./sections";

/*
 * "Site + agenda online" pages (2026-11-06) in the landing style of the niche pages: color blocks,
 * big titles and a phone with an example site of the niche. Same text as the content file (SEO):
 * one H1, the answer, each section as a block, the price, the FAQ (FAQPage data) and the links.
 */

const h2 = "lp-title text-[2.3rem] leading-[1.02] text-balance sm:text-[3.25rem]";
const CTA = "Comece grátis, sem cartão";
const NOTE = `${TRIAL_DAYS} dias grátis para testar. Depois, ${SITE_PRICE_TEXT.monthly}, sem fidelidade.`;

/** A phone showing an example site of the niche (photo, name and the "Agendar" button). */
export function PhoneSite({ brandKey, name }: { brandKey: string; name: string }) {
  return (
    <div className="lp-plain mx-auto w-[280px] sm:w-[320px]" aria-hidden>
      <div className="overflow-hidden rounded-[2.75rem] border-[10px] border-[color:var(--lp-deep)] bg-background shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <span className="truncate text-sm font-bold">{name}</span>
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            Agendar
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- static example photo */}
        <img
          src={`/examples/${brandKey}.webp`}
          alt=""
          width={900}
          height={1125}
          className="aspect-[4/4.2] w-full object-cover"
        />
        <div className="flex flex-col items-center gap-3 px-5 py-5 text-center">
          <p className="lp-title text-2xl leading-tight">{name}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
            <CalendarCheck className="size-4" />
            Agendar horário
          </span>
        </div>
      </div>
    </div>
  );
}

function Shell({
  brand,
  badge,
  crumbs,
  niche,
  children,
  faq,
}: {
  brand: BrandConfig;
  badge?: string;
  crumbs: Crumb[];
  niche?: string;
  children: React.ReactNode;
  faq: readonly { question: string; answer: string }[];
}) {
  return (
    <div
      data-theme-scope=""
      data-lp="niche"
      style={brandThemeStyle(brand)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <div className="lp-lime lp-hero">
        <SiteHeader badge={badge} logo={brand.logo} pill />
      </div>
      <main className="flex-1">
        <div className="lp-lime lp-hero">
          <div className={`${container} pt-3`}>
            <Breadcrumbs items={crumbs} jsonLd={false} />
          </div>
        </div>
        {children}
      </main>
      <SiteFooter />
      <StickyCta hideOn={["cta-topo", "cta-final"]} label={CTA} niche={niche} />
      <LazyCreationChat photos={isStorageConfigured()} />
      <SiteTracker template="site-e-agenda" niche={niche ? brand.key : null} />
      <JsonLd
        nodes={[organizationNode(), breadcrumbTrailNode(crumbs), faq.length ? faqNode(faq) : null]}
      />
    </div>
  );
}

function Hero({
  title,
  subtitle,
  niche,
  brandKey,
  exampleName,
  exampleHref,
}: {
  title: string;
  subtitle: string;
  niche?: string;
  brandKey: string;
  exampleName: string;
  exampleHref?: string;
}) {
  return (
    <section className="lp-lime lp-hero relative overflow-hidden">
      <div
        className={`${container} grid items-center gap-12 pt-8 pb-16 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-24`}
      >
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-sm font-semibold">
            <span className="size-1.5 rounded-full bg-[color:var(--lp-deep)]" aria-hidden />
            Site + agenda online
          </p>
          <h1 className="lp-title mt-5 text-[2.6rem] leading-[0.98] text-balance sm:text-6xl lg:text-[4.1rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed font-medium text-pretty sm:text-xl">
            {subtitle}
          </p>
          <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <CtaButton niche={niche} id="cta-topo">
              {CTA}
            </CtaButton>
            {exampleHref ? (
              <Link
                href={exampleHref}
                className="inline-flex min-h-[56px] items-center gap-2 rounded-full border-2 border-current px-6 font-bold"
              >
                Ver um site de exemplo
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            ) : null}
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">{NOTE}</p>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold lg:justify-start">
            {["Pronto para o Google", "Agenda 24h", "Sem fidelidade"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="size-4" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <PhoneSite brandKey={brandKey} name={exampleName} />
      </div>
    </section>
  );
}

function PriceBlock({ paragraphs, niche }: { paragraphs: readonly string[]; niche?: string }) {
  return (
    <section aria-labelledby="preco" className="lp-deep">
      <div className={`${container} grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-2`}>
        <div className="text-center lg:text-left">
          <h2 id="preco" className={h2}>
            Quanto custa
          </h2>
          <p className="lp-title mt-6 text-[4.5rem] leading-none text-[color:var(--lp-heading)] sm:text-[6rem]">
            {SITE_PRICE_TEXT.monthly}
          </p>
          <p className="mt-2 text-lg font-semibold">
            ou {SITE_PRICE_TEXT.yearly} no anual · sem fidelidade
          </p>
        </div>
        <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
          {paragraphs.map((p) => (
            <p key={p} className="text-lg leading-relaxed text-pretty">
              {p}
            </p>
          ))}
          <CtaButton niche={niche}>{CTA}</CtaButton>
        </div>
      </div>
    </section>
  );
}

/** One area: /site-e-agenda/<profissão>. */
export function SiteAgendaLanding({
  page,
  brand,
  others,
}: {
  page: SiteAgendaPage;
  brand: BrandConfig;
  others: { label: string; href: string }[];
}) {
  const niche = brand.niche;
  const path = `/site-e-agenda/${page.slug}`;
  const exampleName = EXAMPLE_NAMES[brand.key] ?? brand.niche?.name ?? "Seu negócio";
  const gallery = Math.min(EXAMPLE_GALLERY[brand.key] ?? 0, 4);
  const price = page.sections.find((s) => s.title === "Quanto custa");
  const body = page.sections.filter((s) => s !== price);
  const tones = ["lp-soft", "lp-brand", "lp-soft"];

  return (
    <Shell
      brand={brand}
      badge={niche?.name}
      crumbs={[
        { name: "Site + agenda online", path: "/site-e-agenda" },
        { name: page.label, path },
      ]}
      niche={niche?.route}
      faq={page.faq}
    >
      <Hero
        title={page.h1}
        subtitle={page.answer}
        niche={niche?.route}
        brandKey={brand.key}
        exampleName={exampleName}
        exampleHref={niche ? `/exemplo/${niche.route}` : undefined}
      />

      {body.map((section, i) => (
        <section key={section.title} className={tones[i % tones.length]}>
          <div className={`${container} py-20 sm:py-24`}>
            <h2 className={`${h2} max-w-3xl text-center lg:text-left`}>{section.title}</h2>
            {section.list ? (
              <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.list.map((item) => (
                  <li key={item} className="lp-lift flex items-start gap-3 rounded-3xl bg-card p-6">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--lp-cta-bg)] text-[color:var(--lp-cta-fg)]">
                      <Check className="size-4" aria-hidden />
                    </span>
                    <span className="text-lg leading-snug font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-8 grid gap-8 lg:grid-cols-2">
                {section.paragraphs?.map((p) => (
                  <p key={p} className="text-lg leading-relaxed text-pretty">
                    {p}
                  </p>
                ))}
              </div>
            )}
            {i === 1 && gallery ? (
              <ul
                className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
                aria-label="Exemplo de galeria"
              >
                {Array.from({ length: gallery }, (_, n) => (
                  <li key={n}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- static example photo */}
                    <img
                      src={`/examples/gallery/${brand.key}-${n + 1}.webp`}
                      alt=""
                      width={700}
                      height={700}
                      loading="lazy"
                      className="aspect-square w-full rounded-3xl object-cover"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}

      {price ? <PriceBlock paragraphs={price.paragraphs ?? []} niche={niche?.route} /> : null}

      <FaqAccordion title="Perguntas frequentes" items={page.faq} />

      <section className="lp-soft">
        <div className={`${container} py-14`}>
          <h2 className="lp-title text-2xl">Site + agenda para outras áreas</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {[
              ...(niche
                ? [{ label: `MeetChat para ${niche.name.toLowerCase()}`, href: `/${niche.route}` }]
                : []),
              { label: "Preços", href: "/precos" },
              ...others,
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex h-10 items-center rounded-full border bg-card px-4 text-sm font-semibold hover:border-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="cta-final" className="lp-deep">
        <div className={`${container} flex flex-col items-center gap-6 py-20 text-center sm:py-28`}>
          <h2 className="lp-title max-w-3xl text-[2.6rem] leading-[1] text-balance sm:text-6xl">
            Seu site + agenda no ar hoje
          </h2>
          <CtaButton niche={niche?.route}>{CTA}</CtaButton>
          <p className="max-w-md text-sm text-muted-foreground">{NOTE}</p>
        </div>
      </section>
    </Shell>
  );
}

/** The index: /site-e-agenda, with a card per area. */
export function SiteAgendaHubLanding({
  brand,
  h1,
  intro,
  pages,
}: {
  brand: BrandConfig;
  h1: string;
  intro: string;
  pages: readonly (SiteAgendaPage & { brand: BrandConfig })[];
}) {
  return (
    <Shell
      brand={brand}
      crumbs={[{ name: "Site + agenda online", path: "/site-e-agenda" }]}
      faq={[]}
    >
      <Hero title={h1} subtitle={intro} brandKey="beauty" exampleName="Studio Bela" />
      <section aria-labelledby="areas" className="lp-soft">
        <div className={`${container} py-20 sm:py-24`}>
          <h2 id="areas" className={`${h2} text-center lg:text-left`}>
            Escolha a sua área
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/site-e-agenda/${page.slug}`}
                  className="lp-lift flex h-full flex-col overflow-hidden rounded-3xl bg-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- static example photo */}
                  <img
                    src={`/examples/${page.brand.key}.webp`}
                    alt=""
                    width={900}
                    height={1125}
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <span className="flex flex-1 flex-col gap-1 p-5">
                    <span className="text-lg font-bold">{page.h1}</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-[color:var(--lp-link)]">
                      Ver como fica <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section id="cta-final" className="lp-deep">
        <div className={`${container} flex flex-col items-center gap-6 py-20 text-center sm:py-28`}>
          <h2 className="lp-title max-w-3xl text-[2.6rem] leading-[1] text-balance sm:text-6xl">
            Seu site + agenda no ar hoje
          </h2>
          <CtaButton>{CTA}</CtaButton>
          <p className="max-w-md text-sm text-muted-foreground">{NOTE}</p>
        </div>
      </section>
    </Shell>
  );
}
