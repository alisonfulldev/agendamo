import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronDown,
  MapPin,
  MessageCircle,
  Star,
} from "lucide-react";
import type { CSSProperties } from "react";

import type { BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { MeetChatBadge } from "@/components/chat/meetchat-badge";
import type { SiteSettings } from "@/lib/db/types";
import { formatBRL, formatDuration } from "@/lib/money";
import type { PublicPage } from "@/lib/public/page";
import { resolveSections, type SiteSectionKey } from "@/lib/public/site";
import { publicUrl } from "@/lib/storage/r2";

/*
 * The business site (/<slug>/site, "Site + Agenda"): one template for everyone, in the landing
 * style of the MeetChat site (color blocks, big titles, made for phones). Built from the business
 * data; the owner changes colors, the top photo, texts and sections in "Meu site". Every
 * "Agendar" opens the business chat.
 */

const container = "mx-auto w-full max-w-5xl px-5 sm:px-8";
const h2 = "lp-title text-[2.1rem] leading-[1.04] text-balance sm:text-5xl";
const cta =
  "lp-press inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--lp-cta-bg)] px-7 text-center text-[17px] font-bold text-[color:var(--lp-cta-fg)] transition-opacity hover:opacity-90 sm:w-auto";

export interface SiteViewProps {
  data: PublicPage;
  brand: BrandConfig;
  settings: SiteSettings | null;
  /** Link of the booking chat (/<slug>). */
  chatHref: string;
  /** Link of the MeetChat niche page (badge). */
  badgeHref: string;
  logo: string;
}

/** The brand theme with the owner's colors on top (site color, else the page's own color). */
export function siteTheme(
  brand: BrandConfig,
  settings: SiteSettings | null,
  pageColor: string | null,
): CSSProperties {
  const primary = settings?.primary_color ?? pageColor;
  return brandThemeStyle({
    ...brand,
    theme: {
      ...brand.theme,
      ...(primary ? { primary, button: primary } : {}),
      ...(settings?.accent_color ? { highlight: settings.accent_color } : {}),
    },
  });
}

/** Default texts when the owner did not write her own. */
export function siteTexts(data: PublicPage, brand: BrandConfig, settings: SiteSettings | null) {
  return {
    title: settings?.hero_title ?? data.business.name,
    subtitle:
      settings?.hero_subtitle ??
      `Escolha o ${brand.terms.service.singular} e um horário livre: você agenda em 1 minuto, a qualquer hora, sem baixar aplicativo.`,
    cta: settings?.cta_label ?? "Agendar horário",
  };
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function SiteView({ data, brand, settings, chatHref, badgeHref, logo }: SiteViewProps) {
  const { business, page } = data;
  const texts = siteTexts(data, brand, settings);
  const heroImage =
    publicUrl(settings?.hero_image_key) ??
    publicUrl(page?.cover_key) ??
    publicUrl(data.photos[0]?.key) ??
    publicUrl(page?.avatar_key);
  const avatar = publicUrl(page?.avatar_key);
  const sections = resolveSections(settings?.sections ?? null).filter((s) => s.visible);
  const showPrices = page?.show_prices ?? true;
  const terms = brand.terms;
  const whatsapp = page?.whatsapp_number
    ? `https://wa.me/${page.whatsapp_number.replace(/\D/g, "")}`
    : null;
  const place = [page?.address, page?.neighborhood, page?.city].filter(Boolean).join(", ");

  // Blocks alternate colors in the order the owner chose.
  const tones = ["lp-soft", "lp-deep", "lp-lime", "lp-brand"];
  let toneIndex = 0;
  const nextTone = () => tones[toneIndex++ % tones.length]!;

  const render: Record<SiteSectionKey, () => React.ReactNode> = {
    about: () =>
      page?.bio ? (
        <section key="about" aria-labelledby="sobre" className={nextTone()}>
          <div className={`${container} grid items-center gap-10 py-20 md:grid-cols-[1fr_auto]`}>
            <div>
              <h2 id="sobre" className={h2}>
                Sobre {business.name}
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed whitespace-pre-line text-pretty">
                {page.bio}
              </p>
            </div>
            {avatar && avatar !== heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- R2 public image
              <img
                src={avatar}
                alt={business.name}
                width={220}
                height={220}
                className="mx-auto size-44 rounded-full object-cover shadow-lg md:size-56"
              />
            ) : null}
          </div>
        </section>
      ) : null,
    services: () =>
      data.services.length ? (
        <section key="services" aria-labelledby="servicos" className={nextTone()}>
          <div className={`${container} py-20`}>
            <h2 id="servicos" className={`${h2} text-center`}>
              {capitalize(terms.service.plural)}
              {showPrices ? " e preços" : ""}
            </h2>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {data.services.map((service) => (
                <li key={service.id}>
                  <a
                    href={chatHref}
                    data-track="click_book"
                    className="lp-lift flex h-full items-center justify-between gap-4 rounded-3xl bg-card p-5"
                  >
                    <span className="min-w-0">
                      <span className="block text-lg font-bold">{service.name}</span>
                      {service.description ? (
                        <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                          {service.description}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {formatDuration(service.duration_minutes)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      {showPrices && service.price_cents > 0 ? (
                        <span className="block text-lg font-bold">
                          {formatBRL(service.price_cents)}
                        </span>
                      ) : null}
                      <span className="text-sm font-semibold text-[color:var(--lp-link)]">
                        Agendar
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null,
    photos: () =>
      data.photos.length ? (
        <section key="photos" aria-labelledby="fotos" className={nextTone()}>
          <div className={`${container} py-20`}>
            <h2 id="fotos" className={`${h2} text-center`}>
              Nossos trabalhos
            </h2>
            <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
              {data.photos.slice(0, 12).map((photo, i) => (
                <li key={photo.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- R2 public image */}
                  <img
                    src={publicUrl(photo.key)!}
                    alt={`${business.name}: foto ${i + 1}`}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    className="aspect-square w-full rounded-3xl object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null,
    reviews: () =>
      data.reviews.length ? (
        <section key="reviews" aria-labelledby="avaliacoes" className={nextTone()}>
          <div className={`${container} py-20`}>
            <h2 id="avaliacoes" className={`${h2} text-center`}>
              O que dizem
            </h2>
            {data.rating.average ? (
              <p className="mt-4 flex items-center justify-center gap-2 text-lg font-semibold">
                <Star className="size-5 fill-current" aria-hidden />
                {data.rating.average.toFixed(1).replace(".", ",")} de 5 · {data.rating.count}{" "}
                {data.rating.count === 1 ? "avaliação" : "avaliações"}
              </p>
            ) : null}
            <ul className="mt-10 grid gap-3 md:grid-cols-2">
              {data.reviews.slice(0, 6).map((review) => (
                <li key={review.id} className="rounded-3xl bg-card p-6">
                  <p aria-label={`${review.rating} de 5 estrelas`} className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`size-4 ${i < review.rating ? "fill-current" : "opacity-30"}`}
                        aria-hidden
                      />
                    ))}
                  </p>
                  {review.comment ? (
                    <p className="mt-3 leading-relaxed text-pretty">“{review.comment}”</p>
                  ) : null}
                  <p className="mt-3 text-sm font-semibold">{review.first_name}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null,
    how: () => (
      <section key="how" aria-labelledby="como" className={nextTone()}>
        <div className={`${container} py-20`}>
          <h2 id="como" className={`${h2} text-center`}>
            Agende em 1 minuto
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              `Toque em “${texts.cta}”`,
              `Escolha o ${terms.service.singular} e um horário livre`,
              "Pronto: você recebe a confirmação e um lembrete",
            ].map((step, i) => (
              <li
                key={step}
                className="flex flex-col items-center gap-3 rounded-[2rem] bg-card p-7 text-center"
              >
                <span className="lp-title flex size-12 items-center justify-center rounded-full bg-[color:var(--lp-cta-bg)] text-xl text-[color:var(--lp-cta-fg)]">
                  {i + 1}
                </span>
                <p className="text-lg font-semibold text-pretty">{step}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Sem baixar aplicativo e sem criar conta.
          </p>
        </div>
      </section>
    ),
    location: () =>
      place ? (
        <section key="location" aria-labelledby="onde" className={nextTone()}>
          <div className={`${container} py-20 text-center`}>
            <h2 id="onde" className={h2}>
              Onde estamos
            </h2>
            <p className="mt-5 flex items-center justify-center gap-2 text-lg">
              <MapPin className="size-5 shrink-0" aria-hidden />
              {place}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-current px-6 font-bold"
            >
              Ver no mapa <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        </section>
      ) : null,
    faq: () => (
      <section key="faq" aria-labelledby="duvidas" className={`${container} max-w-3xl py-20`}>
        <h2 id="duvidas" className={`${h2} text-center`}>
          Dúvidas
        </h2>
        <div className="mt-10 flex flex-col gap-3">
          {[
            {
              q: "Preciso baixar algum aplicativo?",
              a: `Não. Você agenda pelo navegador do celular, numa conversa rápida: escolhe o ${terms.service.singular}, o dia e um horário livre.`,
            },
            {
              q: "Recebo confirmação?",
              a: "Sim. Você recebe a confirmação na hora e um lembrete antes do horário, com opção de remarcar ou cancelar.",
            },
            {
              q: "Posso agendar fora do horário comercial?",
              a: "Pode. A agenda fica aberta 24 horas e só mostra horários realmente livres.",
            },
          ].map((item) => (
            <details key={item.q} className="group rounded-3xl bg-muted px-5 py-2 sm:px-7">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  className="site-chevron size-5 shrink-0 text-muted-foreground transition-transform"
                  aria-hidden
                />
              </summary>
              <p className="pb-4 leading-relaxed text-pretty text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    ),
  };

  return (
    <div
      data-theme-scope=""
      data-lp="niche"
      style={siteTheme(brand, settings, page?.primary_color_override ?? null)}
      className="flex min-h-[100dvh] flex-col bg-background font-sans text-foreground"
    >
      {/* Top bar over the first block */}
      <div className="lp-lime lp-hero">
        <div className="mx-auto w-full max-w-5xl px-3 pt-3 sm:px-8 sm:pt-4">
          <header className="lp-plain flex h-16 items-center justify-between gap-2 rounded-full bg-[color:var(--brand-surface)] pr-2 pl-3 shadow-sm">
            <span className="flex min-w-0 items-center gap-2 font-bold">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- R2 public image
                <img
                  src={avatar}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 rounded-full object-cover"
                />
              ) : null}
              <span className="truncate">{business.name}</span>
            </span>
            <a
              href={chatHref}
              data-track="click_book"
              className="inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full bg-[color:var(--lp-deep)] px-5 text-sm font-bold text-[color:var(--brand-ink-light)]"
            >
              <CalendarCheck className="size-4" aria-hidden />
              Agendar
            </a>
          </header>
        </div>
      </div>

      <main className="flex-1">
        <section className="lp-lime lp-hero">
          <div
            className={`${container} grid items-center gap-10 pt-10 pb-16 sm:pt-14 md:grid-cols-[1.1fr_0.9fr] md:pb-24`}
          >
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              {brand.niche ? (
                <p className="rounded-full border bg-card/70 px-3 py-1 text-sm font-semibold">
                  {brand.niche.name}
                  {page?.city ? ` · ${page.city}` : ""}
                </p>
              ) : null}
              <h1 className="lp-title mt-5 text-[2.75rem] leading-[0.98] text-balance sm:text-6xl lg:text-[4.25rem]">
                {texts.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed font-medium text-pretty sm:text-xl">
                {texts.subtitle}
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <a href={chatHref} data-track="click_book" className={cta}>
                  {texts.cta}
                  <ArrowRight className="size-5" aria-hidden />
                </a>
                {whatsapp ? (
                  <a
                    href={whatsapp}
                    data-track="click_whatsapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full border-2 border-current px-6 font-bold"
                  >
                    <MessageCircle className="size-5" aria-hidden />
                    WhatsApp
                  </a>
                ) : null}
              </div>
              <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold md:justify-start">
                {["Agende 24h", "Sem baixar app", "Confirmação na hora"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="size-4" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- R2 public image (the LCP)
              <img
                src={heroImage}
                alt={business.name}
                width={720}
                height={720}
                fetchPriority="high"
                className="aspect-[4/5] w-full max-w-md justify-self-center rounded-[2.5rem] object-cover shadow-2xl md:max-w-none"
              />
            ) : null}
          </div>
        </section>

        {sections.map((s) => render[s.key]())}

        <section className="lp-deep">
          <div className={`${container} flex flex-col items-center gap-6 py-20 text-center`}>
            <h2 className="lp-title max-w-3xl text-[2.5rem] leading-[1] text-balance sm:text-6xl">
              Vamos marcar seu horário?
            </h2>
            <a href={chatHref} data-track="click_book" className={cta}>
              {texts.cta}
              <ArrowRight className="size-5" aria-hidden />
            </a>
          </div>
        </section>
      </main>

      <footer className="flex flex-col items-center gap-3 px-5 py-8 text-center text-sm text-muted-foreground">
        <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {page?.instagram_url ? (
            <a
              href={page.instagram_url}
              data-track="click_instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Instagram
            </a>
          ) : null}
          {whatsapp ? (
            <a
              href={whatsapp}
              data-track="click_whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              WhatsApp
            </a>
          ) : null}
          {data.links.slice(0, 4).map((link) => (
            <a
              key={link.id}
              href={link.url}
              data-track="click_link"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {link.label}
            </a>
          ))}
        </p>
        <p>
          © {new Date().getFullYear()} {business.name}
        </p>
        <MeetChatBadge href={badgeHref} logo={logo} niche={brand.niche?.name} discreet />
      </footer>
    </div>
  );
}
