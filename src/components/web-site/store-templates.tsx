import { ArrowDown } from "lucide-react";
import type { ReactNode } from "react";

import {
  Brand,
  Contact,
  display,
  Faq,
  Footer,
  Gallery,
  Highlights,
  Steps,
  WhatsAppButton,
  wide,
} from "./parts";
import { StoreCatalog } from "./store-catalog";
import type { WebSiteData } from "./types";

function Catalog({ data, variant }: { data: WebSiteData; variant: "showcase" | "clean" }) {
  return (
    <StoreCatalog
      slug={data.slug}
      storeName={data.name}
      phone={data.phone}
      items={data.items}
      variant={variant}
      preview={data.businessId === "example"}
    />
  );
}

/**
 * "Vitrine" (2026-11-07): a big color banner with the photo, then the products in bold cards with
 * category chips and the bag; about, gallery and a closing block in the brand color.
 */
export function StoreShowcase({ data, badge }: { data: WebSiteData; badge: ReactNode }) {
  return (
    <div className="lp-plain bg-background text-[17px] text-foreground sm:text-lg">
      <header className="lp-brand">
        <div className={`${wide} flex items-center justify-between gap-4 py-6`}>
          <Brand data={data} light />
          <WhatsAppButton href={data.whatsappHref} className="hidden sm:inline-flex">
            WhatsApp
          </WhatsAppButton>
        </div>
        <div className={`${wide} grid items-center gap-10 pt-8 pb-20 lg:grid-cols-[1.15fr_1fr]`}>
          <div className="flex flex-col gap-8">
            <h1 className={`${display} text-6xl text-[var(--lp-heading)] sm:text-8xl`}>
              {data.texts.title}
            </h1>
            <p className="max-w-xl text-xl leading-relaxed text-pretty sm:text-2xl">
              {data.texts.subtitle}
            </p>
            <div>
              <a
                href="#produtos"
                className="inline-flex min-h-16 items-center gap-2.5 rounded-full bg-[var(--lp-cta-bg)] px-9 text-xl font-semibold text-[var(--lp-cta-fg)] shadow-lg transition-transform hover:scale-[1.03]"
              >
                {data.texts.cta}
                <ArrowDown className="size-6" aria-hidden />
              </a>
            </div>
          </div>
          {data.heroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- R2 public image
            <img
              src={data.heroUrl}
              alt=""
              className="aspect-square w-full rotate-2 rounded-[2.5rem] object-cover shadow-2xl"
            />
          ) : null}
        </div>
      </header>

      <Highlights items={data.sections.highlights} />
      <section id="produtos" aria-labelledby="produtos-titulo" className="py-20">
        <div className={wide}>
          <h2 id="produtos-titulo" className={`${display} mb-10 text-5xl sm:text-7xl`}>
            Produtos
          </h2>
          {data.items.length ? (
            <Catalog data={data} variant="showcase" />
          ) : (
            <p className="text-xl text-muted-foreground">Em breve, novidades por aqui.</p>
          )}
        </div>
      </section>

      <Steps title={data.sections.stepsTitle} steps={data.sections.steps} className="lp-soft" />
      {data.bio ? (
        <section aria-labelledby="sobre" className="py-24">
          <div className={`${wide} max-w-4xl`}>
            <h2 id="sobre" className={`${display} text-5xl sm:text-7xl`}>
              Sobre a loja
            </h2>
            <p className="mt-8 text-xl leading-relaxed whitespace-pre-line text-pretty sm:text-2xl">
              {data.bio}
            </p>
          </div>
        </section>
      ) : null}

      <Gallery data={data} title="Nossa loja" />
      <Faq items={data.sections.faq} className="lp-soft" />
      <Contact data={data} className="lp-brand" />
      <Footer data={data} badge={badge} />
    </div>
  );
}

/**
 * "Clean" store (2026-11-07): boutique style, light, a wide photo under the name, tall product
 * photos without boxes, the bag, about and a soft closing block.
 */
export function StoreClean({ data, badge }: { data: WebSiteData; badge: ReactNode }) {
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

      <section className="pt-14 pb-10 sm:pt-20">
        <div className={`${wide} flex flex-col items-center gap-7 text-center`}>
          <h1 className={`${display} max-w-4xl text-6xl sm:text-8xl`}>{data.texts.title}</h1>
          <p className="max-w-2xl text-xl leading-relaxed text-pretty text-muted-foreground sm:text-2xl">
            {data.texts.subtitle}
          </p>
          <a
            href="#produtos"
            className="inline-flex min-h-16 items-center gap-2.5 rounded-full bg-primary px-9 text-xl font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.03]"
          >
            {data.texts.cta}
            <ArrowDown className="size-6" aria-hidden />
          </a>
        </div>
        {data.heroUrl ? (
          <div className={`${wide} mt-14`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- R2 public image */}
            <img
              src={data.heroUrl}
              alt=""
              className="aspect-[16/10] w-full rounded-[2.5rem] object-cover shadow-xl sm:aspect-[21/9]"
            />
          </div>
        ) : null}
      </section>

      <Highlights items={data.sections.highlights} className="lp-soft" />
      <section id="produtos" aria-labelledby="produtos-titulo" className="py-16">
        <div className={wide}>
          <h2 id="produtos-titulo" className={`${display} mb-10 text-center text-5xl sm:text-6xl`}>
            Coleção
          </h2>
          {data.items.length ? (
            <Catalog data={data} variant="clean" />
          ) : (
            <p className="text-center text-xl text-muted-foreground">
              Em breve, novidades por aqui.
            </p>
          )}
        </div>
      </section>

      <Steps title={data.sections.stepsTitle} steps={data.sections.steps} className="lp-soft" />
      {data.bio ? (
        <section aria-labelledby="sobre" className="py-24">
          <div className={`${wide} max-w-3xl text-center`}>
            <h2 id="sobre" className={`${display} text-5xl sm:text-6xl`}>
              Sobre nós
            </h2>
            <p className="mt-8 text-xl leading-relaxed whitespace-pre-line text-pretty sm:text-2xl">
              {data.bio}
            </p>
          </div>
        </section>
      ) : null}

      <Gallery data={data} title="Inspiração" />
      <Faq items={data.sections.faq} />
      <Contact data={data} className="lp-soft" />
      <Footer data={data} badge={badge} />
    </div>
  );
}
