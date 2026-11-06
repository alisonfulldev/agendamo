import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";

import { Brand, Contact, display, Footer, Gallery, price, WhatsAppButton, wide } from "./parts";
import type { WebSiteData } from "./types";

/** wa.me link asking about one service. */
function askAbout(data: WebSiteData, service: string): string | null {
  if (!data.phone) return null;
  const text = `Olá! Vi o site de ${data.name} e quero saber mais sobre: ${service}.`;
  return `https://wa.me/${data.phone}?text=${encodeURIComponent(text)}`;
}

/**
 * "Impacto" (2026-11-07): full-screen photo with a dark veil and huge titles, services in big
 * color cards, about, gallery and a closing block in the brand color.
 */
export function SiteBold({ data, badge }: { data: WebSiteData; badge: ReactNode }) {
  return (
    <div className="lp-plain bg-background text-[17px] text-foreground sm:text-lg">
      <header className="lp-deep relative isolate overflow-hidden">
        {data.heroUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- R2 public image */}
            <img
              src={data.heroUrl}
              alt=""
              className="absolute inset-0 -z-20 h-full w-full object-cover"
            />
            <span
              aria-hidden
              className="absolute inset-0 -z-10 bg-[color-mix(in_oklch,var(--lp-deep)_68%,transparent)]"
            />
          </>
        ) : null}
        <div className={`${wide} flex items-center justify-between gap-4 py-6`}>
          <Brand data={data} light />
          <WhatsAppButton href={data.whatsappHref} className="hidden sm:inline-flex">
            WhatsApp
          </WhatsAppButton>
        </div>
        <div className={`${wide} flex min-h-[78svh] flex-col justify-center gap-8 py-20`}>
          <h1 className={`${display} max-w-4xl text-6xl text-[var(--lp-heading)] sm:text-8xl`}>
            {data.texts.title}
          </h1>
          <p className="max-w-2xl text-xl leading-relaxed text-pretty sm:text-2xl">
            {data.texts.subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <WhatsAppButton href={data.whatsappHref} size="xl">
              {data.texts.cta}
            </WhatsAppButton>
            {data.items.length ? (
              <a
                href="#servicos"
                className="inline-flex min-h-16 items-center gap-2 rounded-full border-2 border-current px-8 text-xl font-semibold"
              >
                Ver serviços
                <ArrowRight className="size-5" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>
      </header>

      {data.items.length ? (
        <section id="servicos" aria-labelledby="servicos-titulo" className="lp-soft py-24">
          <div className={wide}>
            <h2 id="servicos-titulo" className={`${display} text-5xl sm:text-7xl`}>
              O que fazemos
            </h2>
            <ul className="mt-14 grid gap-5 md:grid-cols-2">
              {data.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm"
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- R2 public image
                    <img
                      src={item.imageUrl}
                      alt=""
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover"
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col gap-3 p-7 sm:p-8">
                    <h3 className="font-heading text-3xl font-bold">{item.name}</h3>
                    {item.description ? (
                      <p className="text-lg leading-relaxed whitespace-pre-line opacity-85">
                        {item.description}
                      </p>
                    ) : null}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                      <span className="text-2xl font-bold text-primary">{price(item) ?? ""}</span>
                      {askAbout(data, item.name) ? (
                        <a
                          href={askAbout(data, item.name)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-track="click_whatsapp"
                          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground"
                        >
                          Quero saber mais
                          <ArrowRight className="size-4" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {data.bio ? (
        <section aria-labelledby="sobre" className="py-24">
          <div className={`${wide} grid items-center gap-12 md:grid-cols-[1.1fr_1fr]`}>
            <div>
              <h2 id="sobre" className={`${display} text-5xl sm:text-7xl`}>
                Quem somos
              </h2>
              <p className="mt-8 text-xl leading-relaxed whitespace-pre-line text-pretty sm:text-2xl">
                {data.bio}
              </p>
            </div>
            {(data.photos[0] ?? data.logoUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element -- R2 public image
              <img
                src={data.photos[0]?.url ?? data.logoUrl!}
                alt={data.name}
                loading="lazy"
                className="aspect-[4/5] w-full rounded-[2.5rem] object-cover shadow-2xl"
              />
            ) : null}
          </div>
        </section>
      ) : null}

      <Gallery data={{ ...data, photos: data.bio ? data.photos.slice(1) : data.photos }} />
      <Contact data={data} className="lp-brand" />
      <Footer data={data} badge={badge} />
    </div>
  );
}

/**
 * "Clean" (2026-11-07): light and airy, text beside a big rounded photo, services as a numbered
 * list with prices, about, gallery and a soft closing block.
 */
export function SiteClean({ data, badge }: { data: WebSiteData; badge: ReactNode }) {
  return (
    <div className="lp-plain bg-background text-[17px] text-foreground sm:text-lg">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className={`${wide} flex items-center justify-between gap-4 py-4`}>
          <Brand data={data} />
          <WhatsAppButton href={data.whatsappHref} className="hidden sm:inline-flex">
            WhatsApp
          </WhatsAppButton>
        </div>
      </header>

      <section className="py-16 sm:py-24">
        <div className={`${wide} grid items-center gap-12 lg:grid-cols-2`}>
          <div className="flex flex-col gap-8">
            <h1 className={`${display} text-6xl sm:text-7xl lg:text-8xl`}>{data.texts.title}</h1>
            <p className="max-w-xl text-xl leading-relaxed text-pretty text-muted-foreground sm:text-2xl">
              {data.texts.subtitle}
            </p>
            <div>
              <WhatsAppButton href={data.whatsappHref} size="xl">
                {data.texts.cta}
              </WhatsAppButton>
            </div>
          </div>
          {data.heroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- R2 public image
            <img
              src={data.heroUrl}
              alt=""
              className="aspect-[4/5] w-full rounded-[3rem] object-cover shadow-2xl lg:aspect-[5/6]"
            />
          ) : (
            <div
              aria-hidden
              className="lp-soft hidden aspect-[5/6] items-center justify-center rounded-[3rem] lg:flex"
            >
              <span className={`${display} px-10 text-center text-7xl opacity-80`}>
                {data.name}
              </span>
            </div>
          )}
        </div>
      </section>

      {data.items.length ? (
        <section aria-labelledby="servicos" className="lp-soft py-24">
          <div className={wide}>
            <h2 id="servicos" className={`${display} text-5xl sm:text-7xl`}>
              Serviços
            </h2>
            <ol className="mt-14 flex flex-col divide-y rounded-[2rem] bg-card px-6 shadow-sm sm:px-10">
              {data.items.map((item, i) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:gap-8"
                >
                  <span className="font-heading text-4xl font-bold text-primary tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">
                    <span className="block font-heading text-2xl font-bold sm:text-3xl">
                      {item.name}
                    </span>
                    {item.description ? (
                      <span className="mt-2 block text-lg leading-relaxed whitespace-pre-line text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  {price(item) ? (
                    <span className="text-2xl font-bold whitespace-nowrap">{price(item)}</span>
                  ) : null}
                  {askAbout(data, item.name) ? (
                    <a
                      href={askAbout(data, item.name)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-track="click_whatsapp"
                      aria-label={`Perguntar sobre ${item.name} no WhatsApp`}
                      className="inline-flex size-14 shrink-0 items-center justify-center self-start rounded-full bg-primary text-primary-foreground sm:self-auto"
                    >
                      <ArrowRight className="size-6" aria-hidden />
                    </a>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {data.bio ? (
        <section aria-labelledby="sobre" className="py-24">
          <div className={`${wide} max-w-4xl`}>
            <h2 id="sobre" className={`${display} text-5xl sm:text-7xl`}>
              Sobre {data.name}
            </h2>
            <p className="mt-8 text-xl leading-relaxed whitespace-pre-line text-pretty sm:text-2xl">
              {data.bio}
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-3">
              {["Atendimento próximo", "Resposta rápida", "Sem compromisso"].map((point) => (
                <li key={point} className="flex items-center gap-3 text-lg font-medium">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-5" aria-hidden />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <Gallery data={data} title="Galeria" />
      <Contact data={data} className="lp-soft" />
      <Footer data={data} badge={badge} />
    </div>
  );
}
