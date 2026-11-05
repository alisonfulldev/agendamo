import { ArrowRight, MapPin, Star } from "lucide-react";

import { MeetChatBadge } from "@/components/chat/meetchat-badge";
import { formatBRL, formatDuration } from "@/lib/money";
import type { SiteSectionKey } from "@/lib/public/site";

import { capitalize, photoUrl, siteContent, siteTheme, type SiteViewProps } from "./site-view";

/*
 * "Elegante" template of the business site (2026-11-06): light background, a large photo, serif
 * titles (Fraunces), thin lines and plenty of white space. Same data, sections and edits as the
 * "Vibrante" one; only the look changes. Every "Agendar" opens the business chat.
 */

const serif = "[font-family:var(--font-fraunces),Georgia,serif] font-semibold tracking-tight";
const container = "mx-auto w-full max-w-5xl px-6 sm:px-10";
const eyebrow = "text-xs font-semibold tracking-[0.25em] text-primary uppercase";
const h2 = `${serif} mt-3 text-3xl leading-tight text-balance sm:text-4xl`;
const button =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90";

function Heading({ id, kicker, title }: { id: string; kicker: string; title: string }) {
  return (
    <div className="text-center">
      <p className={eyebrow}>{kicker}</p>
      <h2 id={id} className={h2}>
        {title}
      </h2>
      <span className="mx-auto mt-5 block h-px w-12 bg-primary/60" aria-hidden />
    </div>
  );
}

export function ElegantSiteView({
  data,
  brand,
  settings,
  chatHref,
  badgeHref,
  logo,
  exampleHeroUrl,
}: SiteViewProps) {
  const { business, page } = data;
  const { texts, heroImage, avatar, sections, showPrices, whatsapp, place, faq } = siteContent(
    data,
    brand,
    settings,
    exampleHeroUrl,
  );
  const terms = brand.terms;

  const render: Record<SiteSectionKey, () => React.ReactNode> = {
    about: () =>
      page?.bio ? (
        <section key="about" aria-labelledby="sobre" className="py-20">
          <div className={`${container} flex max-w-3xl flex-col items-center gap-8 text-center`}>
            {avatar && avatar !== heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- R2 public image
              <img
                src={avatar}
                alt={business.name}
                width={160}
                height={160}
                className="size-32 rounded-full object-cover"
              />
            ) : null}
            <Heading id="sobre" kicker="Sobre" title={business.name} />
            <p className="text-lg leading-relaxed whitespace-pre-line text-muted-foreground text-pretty">
              {page.bio}
            </p>
          </div>
        </section>
      ) : null,
    services: () =>
      data.services.length ? (
        <section key="services" aria-labelledby="servicos" className="bg-card py-20">
          <div className={`${container} max-w-3xl`}>
            <Heading
              id="servicos"
              kicker={showPrices ? "Serviços e preços" : "Serviços"}
              title={capitalize(terms.service.plural)}
            />
            <ul className="mt-12 divide-y border-y">
              {data.services.map((service) => (
                <li key={service.id}>
                  <a
                    href={chatHref}
                    data-track="click_book"
                    className="group flex items-baseline gap-4 py-5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className={`${serif} block text-xl`}>{service.name}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {formatDuration(service.duration_minutes)}
                        {service.description ? ` · ${service.description}` : ""}
                      </span>
                    </span>
                    {showPrices && service.price_cents > 0 ? (
                      <span className="shrink-0 text-lg tabular-nums">
                        {formatBRL(service.price_cents)}
                      </span>
                    ) : null}
                    <ArrowRight
                      className="size-4 shrink-0 self-center text-primary opacity-60 transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null,
    photos: () =>
      data.photos.length ? (
        <section key="photos" aria-labelledby="fotos" className="py-20">
          <div className={container}>
            <Heading id="fotos" kicker="Galeria" title="Nossos trabalhos" />
            <ul className="mt-12 grid grid-cols-2 gap-2 md:grid-cols-3">
              {data.photos.slice(0, 20).map((photo, i) => (
                <li key={photo.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- R2 public image */}
                  <img
                    src={photoUrl(photo.key)}
                    alt={`${business.name}: foto ${i + 1}`}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null,
    reviews: () =>
      data.reviews.length ? (
        <section key="reviews" aria-labelledby="avaliacoes" className="bg-card py-20">
          <div className={`${container} max-w-3xl`}>
            <Heading id="avaliacoes" kicker="Depoimentos" title="O que dizem" />
            {data.rating.average ? (
              <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Star className="size-4 fill-current text-primary" aria-hidden />
                {data.rating.average.toFixed(1).replace(".", ",")} de 5 · {data.rating.count}{" "}
                {data.rating.count === 1 ? "avaliação" : "avaliações"}
              </p>
            ) : null}
            <ul className="mt-10 flex flex-col gap-10">
              {data.reviews.slice(0, 4).map((review) => (
                <li key={review.id} className="text-center">
                  {review.comment ? (
                    <p
                      className={`${serif} text-xl leading-relaxed font-normal italic text-pretty`}
                    >
                      “{review.comment}”
                    </p>
                  ) : null}
                  <p
                    className="mt-3 text-sm tracking-wide text-muted-foreground"
                    aria-label={`${review.rating} de 5 estrelas`}
                  >
                    {"★".repeat(review.rating)} · {review.first_name}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null,
    how: () => (
      <section key="how" aria-labelledby="como" className="py-20">
        <div className={container}>
          <Heading id="como" kicker="Simples assim" title="Agende em 1 minuto" />
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              `Toque em “${texts.cta}”`,
              `Escolha o ${terms.service.singular} e um horário livre`,
              "Receba a confirmação e um lembrete",
            ].map((step, i) => (
              <li key={step} className="text-center">
                <span className={`${serif} block text-5xl text-primary`}>{i + 1}</span>
                <p className="mt-3 text-pretty text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    ),
    location: () =>
      place ? (
        <section key="location" aria-labelledby="onde" className="bg-card py-20">
          <div className={`${container} text-center`}>
            <Heading id="onde" kicker="Endereço" title="Onde estamos" />
            <p className="mt-8 flex items-center justify-center gap-2 text-lg">
              <MapPin className="size-5 shrink-0 text-primary" aria-hidden />
              {place}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-primary underline underline-offset-4"
            >
              Ver no mapa
            </a>
          </div>
        </section>
      ) : null,
    faq: () => (
      <section key="faq" aria-labelledby="duvidas" className="py-20">
        <div className={`${container} max-w-3xl`}>
          <Heading id="duvidas" kicker="Dúvidas" title="Perguntas frequentes" />
          <div className="mt-10 divide-y border-y">
            {faq.map((item) => (
              <details key={item.q} className="group py-2">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-lg [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    className="text-2xl leading-none text-primary transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="pb-4 leading-relaxed text-pretty text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div
      data-theme-scope=""
      style={siteTheme(brand, settings, page?.primary_color_override ?? null)}
      className="flex min-h-[100dvh] flex-col bg-background font-sans text-foreground"
    >
      <header className="border-b">
        <div className={`${container} flex h-16 items-center justify-between gap-3`}>
          <span className={`${serif} truncate text-xl`}>{business.name}</span>
          <a
            href={chatHref}
            data-track="click_book"
            className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-primary px-5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Agendar
          </a>
        </div>
      </header>

      <main className="flex-1">
        <section className={`${container} grid items-center gap-10 py-12 md:grid-cols-2 md:py-20`}>
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- R2 public image (the LCP)
            <img
              src={heroImage}
              alt={business.name}
              width={720}
              height={900}
              fetchPriority="high"
              className="aspect-[4/5] w-full object-cover md:order-2"
            />
          ) : null}
          <div className="text-center md:text-left">
            {brand.niche ? (
              <p className={eyebrow}>
                {brand.niche.name}
                {page?.city ? ` · ${page.city}` : ""}
              </p>
            ) : null}
            <h1 className={`${serif} mt-4 text-[2.6rem] leading-[1.05] text-balance sm:text-6xl`}>
              {texts.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
              {texts.subtitle}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:items-start">
              <a href={chatHref} data-track="click_book" className={button}>
                {texts.cta}
                <ArrowRight className="size-4" aria-hidden />
              </a>
              {whatsapp ? (
                <a
                  href={whatsapp}
                  data-track="click_whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[52px] items-center px-4 text-sm font-semibold underline underline-offset-4"
                >
                  Falar no WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </section>

        {sections.map((s) => render[s.key]())}

        <section className="border-t py-20">
          <div className={`${container} flex flex-col items-center gap-6 text-center`}>
            <h2 className={`${serif} text-3xl sm:text-5xl`}>Vamos marcar seu horário?</h2>
            <a href={chatHref} data-track="click_book" className={button}>
              {texts.cta}
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        </section>
      </main>

      <footer className="flex flex-col items-center gap-3 border-t px-5 py-8 text-center text-sm text-muted-foreground">
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
        </p>
        <p>
          © {new Date().getFullYear()} {business.name}
        </p>
        <MeetChatBadge href={badgeHref} logo={logo} niche={brand.niche?.name} discreet />
      </footer>
    </div>
  );
}
