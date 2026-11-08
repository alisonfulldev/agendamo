import { ArrowRight, Check, MessageCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";

import type { BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteTracker } from "@/components/seo/site-tracker";
import { Breadcrumbs, type Crumb } from "@/components/site/breadcrumbs";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { EXAMPLE_GALLERY } from "@/content/site-examples";
import {
  WEB_HUBS,
  WEB_PRICE,
  webPagePath,
  type WebLandingKind,
  type WebLandingPage,
} from "@/content/web-landing-pages";
import { faqNode, organizationNode } from "@/lib/seo/structured-data";

import { container, FaqAccordion } from "./sections";

/*
 * "Site ou Loja" search pages (2026-11-08) in the landing style: color blocks, big titles and a
 * phone with an example site or store. Same text as the content file (SEO). Every button opens
 * the sales chat of the product (/criar-site), never the booking sign-up.
 */

const h2 = "lp-title text-[2.3rem] leading-[1.02] text-balance sm:text-[3.25rem]";
const NOTE = `${WEB_PRICE.monthly}, sem taxa de criação e sem fidelidade.`;
const CTA: Record<WebLandingKind, string> = {
  site: "Criar meu site",
  store: "Criar minha loja",
};

/** The main button: the "Site ou Loja" sales chat. */
function ChatButton({ kind, id }: { kind: WebLandingKind; id?: string }) {
  return (
    <div id={id}>
      <Link
        href="/criar-site"
        className="lp-press inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--lp-cta-bg)] px-7 py-3 text-center text-[17px] font-bold text-[color:var(--lp-cta-fg)] transition-opacity hover:opacity-90 sm:w-auto"
      >
        {CTA[kind]}
        <ArrowRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}

/** Photos of the niche that illustrate the page (the top one and a few for the store grid). */
function photos(nicheKey: string | null, kind: WebLandingKind) {
  const key = nicheKey ?? (kind === "site" ? "consulting" : null);
  if (!key || !EXAMPLE_GALLERY[key]) return null;
  return {
    hero: `/examples/${key}.webp`,
    grid: Array.from(
      { length: 4 },
      (_, i) => `/examples/gallery/${key}-${(i % (EXAMPLE_GALLERY[key] ?? 1)) + 1}.webp`,
    ),
  };
}

/** A phone with an example: a site with the WhatsApp button, or a store with its products. */
function Phone({
  kind,
  name,
  nicheKey,
}: {
  kind: WebLandingKind;
  name: string;
  nicheKey: string | null;
}) {
  const pics = photos(nicheKey, kind);
  return (
    <div className="lp-plain mx-auto w-[280px] sm:w-[320px]" aria-hidden>
      <div className="overflow-hidden rounded-[2.75rem] border-[10px] border-[color:var(--lp-deep)] bg-background shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <span className="truncate text-sm font-bold">{name}</span>
          <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            {kind === "store" ? (
              <ShoppingBag className="size-3" />
            ) : (
              <MessageCircle className="size-3" />
            )}
            {kind === "store" ? "Sacolinha" : "WhatsApp"}
          </span>
        </div>
        {kind === "site" ? (
          <>
            {pics ? (
              // eslint-disable-next-line @next/next/no-img-element -- static example photo
              <img
                src={pics.hero}
                alt=""
                width={900}
                height={1125}
                className="aspect-[4/4.2] w-full object-cover"
              />
            ) : (
              <div className="lp-soft aspect-[4/4.2] w-full" />
            )}
            <div className="flex flex-col items-center gap-3 px-5 py-5 text-center">
              <p className="lp-title text-2xl leading-tight">{name}</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
                <MessageCircle className="size-4" />
                Falar no WhatsApp
              </span>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-3">
            {/* Stores sell anything: neutral product tiles, never photos of another niche. */}
            {[null, null, null, null].map((src, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-card">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- static example photo
                  <img
                    src={src}
                    alt=""
                    width={300}
                    height={300}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="lp-soft aspect-square w-full" />
                )}
                <div className="flex flex-col gap-1 p-2">
                  <span className="h-2 w-3/4 rounded bg-foreground/20" />
                  <span className="text-xs font-bold text-primary">R$ {29 + i * 20},90</span>
                  <span className="rounded-full bg-primary py-1 text-center text-[10px] font-bold text-primary-foreground">
                    + Adicionar
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Shell({
  brand,
  kind,
  crumbs,
  faq,
  children,
}: {
  brand: BrandConfig;
  kind: WebLandingKind;
  crumbs: Crumb[];
  faq: readonly { question: string; answer: string }[];
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme-scope=""
      data-lp="niche"
      style={brandThemeStyle(brand)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <div className="lp-lime lp-hero">
        <SiteHeader badge={WEB_HUBS[kind].label} logo={brand.logo} pill />
      </div>
      <main className="flex-1">
        <div className="lp-lime lp-hero">
          <div className={`${container} pt-3`}>
            <Breadcrumbs items={crumbs} />
          </div>
        </div>
        {children}
      </main>
      <SiteFooter />
      <SiteTracker template={kind === "site" ? "site-profissional" : "loja-virtual"} niche={null} />
      <JsonLd nodes={[organizationNode(), faq.length ? faqNode(faq) : null]} />
    </div>
  );
}

function Hero({
  kind,
  title,
  subtitle,
  nicheKey,
  exampleName,
  exampleHref,
}: {
  kind: WebLandingKind;
  title: string;
  subtitle: string;
  nicheKey: string | null;
  exampleName: string;
  exampleHref: string;
}) {
  return (
    <section className="lp-lime lp-hero relative overflow-hidden">
      <div
        className={`${container} grid items-center gap-12 pt-8 pb-16 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-24`}
      >
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-sm font-semibold">
            <span className="size-1.5 rounded-full bg-[color:var(--lp-deep)]" aria-hidden />
            {WEB_HUBS[kind].label} · {WEB_PRICE.monthly}
          </p>
          <h1 className="lp-title mt-5 text-[2.6rem] leading-[0.98] text-balance sm:text-6xl lg:text-[4.1rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed font-medium text-pretty sm:text-xl">
            {subtitle}
          </p>
          <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <ChatButton kind={kind} id="cta-topo" />
            <Link
              href={exampleHref}
              className="inline-flex min-h-[56px] items-center gap-2 rounded-full border-2 border-current px-6 font-bold"
            >
              Ver um exemplo
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">{NOTE}</p>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold lg:justify-start">
            {(kind === "site"
              ? ["Pronto para o Google", "Botão de WhatsApp", "Sem fidelidade"]
              : ["Pedido no WhatsApp", "Sem taxa por venda", "Sem fidelidade"]
            ).map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="size-4" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <Phone kind={kind} name={exampleName} nicheKey={nicheKey} />
      </div>
    </section>
  );
}

function PriceBlock({ kind, paragraphs }: { kind: WebLandingKind; paragraphs: readonly string[] }) {
  return (
    <section aria-labelledby="preco" className="lp-deep">
      <div className={`${container} grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-2`}>
        <div className="text-center lg:text-left">
          <h2 id="preco" className={h2}>
            Quanto custa
          </h2>
          <p className="lp-title mt-6 text-[4.5rem] leading-none text-[color:var(--lp-heading)] sm:text-[6rem]">
            {WEB_PRICE.monthly}
          </p>
          <p className="mt-2 text-lg font-semibold">
            ou {WEB_PRICE.yearly} no anual · sem fidelidade
          </p>
        </div>
        <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
          {paragraphs.map((p) => (
            <p key={p} className="text-lg leading-relaxed text-pretty">
              {p}
            </p>
          ))}
          <ChatButton kind={kind} />
        </div>
      </div>
    </section>
  );
}

function FinalCta({ kind }: { kind: WebLandingKind }) {
  return (
    <section id="cta-final" className="lp-deep">
      <div className={`${container} flex flex-col items-center gap-6 py-20 text-center sm:py-28`}>
        <h2 className="lp-title max-w-3xl text-[2.6rem] leading-[1] text-balance sm:text-6xl">
          {kind === "site" ? "Seu site no ar hoje" : "Sua loja no ar hoje"}
        </h2>
        <ChatButton kind={kind} />
        <p className="max-w-md text-sm text-muted-foreground">{NOTE}</p>
      </div>
    </section>
  );
}

/** Example of a template in the page's niche (opened by "Ver um exemplo"). */
function exampleHref(kind: WebLandingKind, route: string | null, name: string): string {
  const params = new URLSearchParams({ nome: name });
  if (route) params.set("ramo", route);
  return `/exemplo/web/${kind === "site" ? "site_bold" : "store_showcase"}?${params.toString()}`;
}

/** One kind of business: /site-profissional/<tipo> or /loja-virtual/<tipo>. */
export function WebLanding({
  page,
  brand,
  others,
}: {
  page: WebLandingPage;
  brand: BrandConfig;
  others: { label: string; href: string }[];
}) {
  const hub = WEB_HUBS[page.kind];
  const price = page.sections.find((s) => s.title === "Quanto custa");
  const body = page.sections.filter((s) => s !== price);
  const tones = ["lp-soft", "lp-brand", "lp-soft"];
  const name = page.kind === "site" ? "Seu Negócio" : "Sua Loja";

  return (
    <Shell
      brand={brand}
      kind={page.kind}
      crumbs={[
        { name: hub.label, path: hub.path },
        { name: page.label, path: webPagePath(page) },
      ]}
      faq={page.faq}
    >
      <Hero
        kind={page.kind}
        title={page.h1}
        subtitle={page.answer}
        nicheKey={page.nicheKey}
        exampleName={name}
        exampleHref={exampleHref(page.kind, brand.niche?.route ?? null, name)}
      />

      {body.map((section, i) => (
        <section key={section.title} className={tones[i % tones.length]}>
          <div className={`${container} py-20 sm:py-24`}>
            <h2 className={`${h2} max-w-3xl text-center lg:text-left`}>{section.title}</h2>
            {section.list ? (
              <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </section>
      ))}

      {price ? <PriceBlock kind={page.kind} paragraphs={price.paragraphs ?? []} /> : null}

      <FaqAccordion title="Perguntas frequentes" items={page.faq} />

      <section className="lp-soft">
        <div className={`${container} py-14`}>
          <h2 className="lp-title text-2xl">
            {page.kind === "site" ? "Site para outras áreas" : "Loja virtual para outros ramos"}
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {[{ label: hub.label, href: hub.path }, ...others].map((link) => (
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

      <FinalCta kind={page.kind} />
    </Shell>
  );
}

/** The hubs: /site-profissional and /loja-virtual, with a card per kind of business. */
export function WebHubLanding({
  kind,
  brand,
  pages,
  faq,
}: {
  kind: WebLandingKind;
  brand: BrandConfig;
  pages: readonly WebLandingPage[];
  faq: readonly { question: string; answer: string }[];
}) {
  const hub = WEB_HUBS[kind];
  return (
    <Shell brand={brand} kind={kind} crumbs={[{ name: hub.label, path: hub.path }]} faq={faq}>
      <Hero
        kind={kind}
        title={hub.h1}
        subtitle={hub.intro}
        nicheKey={kind === "site" ? "consulting" : "beauty"}
        exampleName={kind === "site" ? "Seu Negócio" : "Sua Loja"}
        exampleHref={exampleHref(kind, null, kind === "site" ? "Seu Negócio" : "Sua Loja")}
      />
      <section aria-labelledby="tipos" className="lp-soft">
        <div className={`${container} py-20 sm:py-24`}>
          <h2 id="tipos" className={`${h2} text-center lg:text-left`}>
            {kind === "site" ? "Escolha a sua área" : "Escolha o seu ramo"}
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={webPagePath(page)}
                  className="lp-lift flex h-full flex-col gap-1 rounded-3xl bg-card p-6"
                >
                  <span className="text-lg font-bold">{page.h1}</span>
                  <span className="text-sm text-muted-foreground">{page.description}</span>
                  <span className="mt-2 flex items-center gap-1 text-sm font-semibold text-[color:var(--lp-link)]">
                    Ver como fica <ArrowRight className="size-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <PriceBlock
        kind={kind}
        paragraphs={[
          kind === "site"
            ? "Seu site com serviços, fotos, endereço e botão de WhatsApp em todas as partes. Você edita tudo pelo celular."
            : "Seus produtos com fotos, preços e categorias. O pedido chega pronto no seu WhatsApp, sem taxa por venda.",
          "Quer algo feito sob medida? Uma pessoa da nossa equipe cria o seu, a partir de R$ 197.",
        ]}
      />
      {faq.length ? <FaqAccordion title="Perguntas frequentes" items={faq} /> : null}
      <FinalCta kind={kind} />
    </Shell>
  );
}
