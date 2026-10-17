import { ArrowRight, Check, ChevronDown, Minus } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import type { BrandConfig } from "@/brands";
import { OpenCreationLink } from "@/components/creation/open-creation";
import { NICHE_ICONS, nichesByGroup } from "@/components/sales/niche-cards";
import type { LandingCopy, PhoneMock } from "@/content/copy/landing";
import { PLAN_NAME, TRIAL_DAYS } from "@/lib/plans";

import { MockVisualFor } from "./mocks";
import { PhoneBooking } from "./phone-booking";

/** Width and gutters shared by every landing section (12-column feel, 20 px gutter on phones). */
export const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";
const h2 =
  "lp-display font-heading text-[1.9rem] leading-[1.1] font-semibold text-balance sm:text-[2.75rem]";
const kicker = "text-sm font-semibold tracking-wide text-primary uppercase";

export function CtaButton({
  children,
  niche,
  id,
  inverted = false,
}: {
  children: ReactNode;
  /** Niche route: the creation conversation opens with the niche chosen. */
  niche?: string;
  id?: string;
  inverted?: boolean;
}) {
  return (
    <div id={id}>
      <OpenCreationLink
        niche={niche}
        className={`lp-press inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-center text-base font-semibold shadow-sm transition-opacity hover:opacity-90 sm:w-auto ${
          // Inside .lp-invert, --foreground is the light color: use the theme text color directly.
          inverted
            ? "bg-background text-[color:var(--brand-text)]"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {children}
        <ArrowRight className="size-5" aria-hidden />
      </OpenCreationLink>
    </div>
  );
}

/** First screen: the pain or result in the visitor's words, mechanism + honest condition, CTA, phone. */
export function Hero({
  copy,
  niche,
  brand,
}: {
  copy: LandingCopy;
  niche?: string;
  /** Brand of the page: its real chat messages go into the phone mock. */
  brand: BrandConfig;
}) {
  const { hero } = copy;
  const fill = (text: string) => text.replaceAll("{business}", copy.mock.business);
  // Long headlines get a slightly smaller size so they keep 3–4 lines on desktop.
  const long = hero.title.length > 48;
  return (
    <section className="lp-hero-light relative overflow-hidden">
      <div
        className={`${container} grid items-center gap-10 pt-6 pb-16 sm:pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-24`}
      >
        <div className="flex flex-col items-start">
          <p className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-sm font-medium text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            {hero.eyebrow}
          </p>
          <h1
            className={`lp-display mt-4 font-heading leading-[1.05] font-semibold text-balance ${
              long
                ? "text-[2.25rem] sm:text-5xl lg:text-[3.25rem]"
                : "text-[2.5rem] sm:text-6xl lg:text-[4rem]"
            }`}
          >
            {hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            {hero.subtitle}
          </p>
          <div className="mt-7 w-full sm:w-auto">
            <CtaButton niche={niche} id="cta-topo">
              {hero.cta}
            </CtaButton>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">{hero.note}</p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
            {hero.trust.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="size-4 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <PhoneBooking
          mock={copy.mock}
          messages={{
            greeting: fill(brand.chatMessages.greeting),
            askProfessional: fill(brand.chatMessages.askProfessional),
            askDate: fill(brand.chatMessages.askDate),
          }}
          label={`Exemplo de agendamento em ${copy.mock.business}: escolher serviço, profissional, dia e horário`}
        />
      </div>
    </section>
  );
}

/** Home: one door per common pain, each leading to its guide. */
export function PainDoors({ doors }: { doors: NonNullable<LandingCopy["doors"]> }) {
  return (
    <section aria-labelledby="dores" className="py-16 sm:py-24">
      <div className={container}>
        <h2 id="dores" className={h2}>
          {doors.title}
        </h2>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {doors.items.map((door, index) => (
            <li key={door.href} className="lp-reveal">
              <Link
                href={door.href}
                className={`lp-lift group flex h-full flex-col rounded-3xl border p-6 hover:border-primary ${
                  index === 1 ? "lp-warm" : "bg-card"
                }`}
              >
                <span className="font-heading text-2xl leading-snug font-semibold text-balance">
                  {door.pain}
                </span>
                <span className="mt-4 flex-1 leading-relaxed text-muted-foreground">
                  {door.answer}
                </span>
                <span className="mt-6 inline-flex items-center gap-1.5 font-semibold text-primary">
                  {door.label}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Niche: concrete scenes of the niche's pains and what changes with the link. */
export function PainScenes({ pains }: { pains: NonNullable<LandingCopy["pains"]> }) {
  return (
    <section aria-labelledby="dores" className="py-16 sm:py-24">
      <div className={container}>
        <h2 id="dores" className={h2}>
          {pains.title}
        </h2>
        <ol className="mt-10 grid gap-4 lg:grid-cols-3">
          {pains.items.map((pain) => (
            <li
              key={pain.scene}
              className="lp-reveal flex flex-col overflow-hidden rounded-3xl border bg-card"
            >
              <p className="flex-1 p-6 text-lg leading-relaxed text-pretty">{pain.scene}</p>
              <p className="lp-warm flex gap-2.5 border-t p-6 leading-relaxed">
                <Check className="mt-1 size-5 shrink-0 text-success" aria-hidden />
                {pain.relief}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** "How your day changes": rows alternating text and a product mock. */
export function StoryRows({ story, mock }: { story: LandingCopy["story"]; mock: PhoneMock }) {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como"
      className="lp-warm scroll-mt-4 py-16 sm:py-24"
    >
      <div className={container}>
        <h2 id="como" className={`${h2} max-w-2xl`}>
          {story.title}
        </h2>
        <ol className="mt-12 flex flex-col gap-16 sm:gap-24">
          {story.rows.map((row, index) => (
            <li key={row.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
              <div className={`lp-reveal ${index % 2 ? "md:order-2" : ""}`}>
                <p className={kicker}>
                  <span className="tabular-nums">{index + 1}</span> · {row.kicker}
                </p>
                <h3 className="lp-display mt-3 font-heading text-2xl leading-tight font-semibold text-balance sm:text-3xl">
                  {row.title}
                </h3>
                <p className="mt-4 max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground">
                  {row.text}
                </p>
              </div>
              <div className={`flex justify-center ${index % 2 ? "md:order-1" : ""}`}>
                <MockVisualFor visual={row.visual} mock={mock} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Before × after: WhatsApp/notebook against the link. */
export function CompareTable({ compare }: { compare: LandingCopy["compare"] }) {
  return (
    <section aria-labelledby="comparacao" className="py-16 sm:py-24">
      <div className={container}>
        <h2 id="comparacao" className={`${h2} max-w-2xl`}>
          {compare.title}
        </h2>
        <div className="lp-reveal mt-10 overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-[15px]">
            <caption className="sr-only">{compare.title}</caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="hidden p-4 font-semibold sm:table-cell sm:w-1/4">
                  <span className="sr-only">Situação</span>
                </th>
                <th scope="col" className="p-4 font-semibold text-muted-foreground">
                  {compare.before}
                </th>
                <th scope="col" className="bg-brand-50 p-4 font-semibold text-primary">
                  {compare.after}
                </th>
              </tr>
            </thead>
            <tbody>
              {compare.rows.map((row) => (
                <Fragment key={row.label}>
                  {/* Phones: the situation is a row of its own above the two columns. */}
                  <tr className="border-t sm:hidden">
                    <th scope="colgroup" colSpan={2} className="px-4 pt-4 pb-1 font-semibold">
                      {row.label}
                    </th>
                  </tr>
                  <tr className="align-top sm:border-t">
                    <th scope="row" className="hidden p-4 font-semibold sm:table-cell">
                      {row.label}
                    </th>
                    <td className="p-4 pt-2 text-muted-foreground sm:pt-4">
                      <span className="flex gap-2">
                        <Minus className="mt-1 size-4 shrink-0" aria-hidden />
                        {row.before}
                      </span>
                    </td>
                    <td className="bg-brand-50 p-4 pt-2 sm:pt-4">
                      <span className="flex gap-2">
                        <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden />
                        {row.after}
                      </span>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/** Every niche by group, linking to its page. */
export function NicheGrid({ title }: { title: string }) {
  return (
    <section
      id="profissoes"
      aria-labelledby="areas-titulo"
      className="lp-warm scroll-mt-4 py-16 sm:py-24"
    >
      <div className={container}>
        <h2 id="areas-titulo" className={`${h2} max-w-2xl`}>
          {title}
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {nichesByGroup().map((group) => (
            <div key={group.group}>
              <h3 className={kicker}>{group.label}</h3>
              <ul className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-1">
                {group.niches.map((brand: BrandConfig) => {
                  const Icon = NICHE_ICONS[brand.niche!.icon];
                  return (
                    <li key={brand.key}>
                      <Link
                        href={`/${brand.niche!.route}`}
                        className="lp-lift group flex min-h-11 items-center gap-2.5 rounded-2xl border bg-card px-3 py-2 text-[15px] hover:border-primary md:px-4"
                      >
                        <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                        <span className="flex-1 font-medium">{brand.niche!.name}</span>
                        <ArrowRight
                          className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-1 md:block"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Objections answered before the CTA. */
export function Objections({ objections }: { objections: LandingCopy["objections"] }) {
  return (
    <section aria-labelledby="objecoes" className="py-16 sm:py-24">
      <div className={`${container} grid gap-10 lg:grid-cols-[0.8fr_1.2fr]`}>
        <h2 id="objecoes" className={h2}>
          {objections.title}
        </h2>
        <dl className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
          {objections.items.map((item) => (
            <div key={item.question} className="lp-reveal border-t pt-5">
              <dt className="font-heading text-xl font-semibold">{item.question}</dt>
              <dd className="mt-2 leading-relaxed text-muted-foreground">
                {item.answer}
                {item.href ? (
                  <>
                    {" "}
                    <Link
                      href={item.href}
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Ver preços
                    </Link>
                  </>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** The two levels without values (values only on /precos). */
export function PlansTeaser() {
  return (
    <section aria-labelledby="planos" className="pb-16 sm:pb-24">
      <div className={container}>
        <div className="grid gap-4 rounded-[2rem] border bg-card p-6 sm:p-10 lg:grid-cols-[1fr_1fr_auto] lg:items-center lg:gap-10">
          <div>
            <h2 id="planos" className="font-heading text-2xl font-semibold">
              Comece grátis. Assine quando fizer sentido.
            </h2>
            <p className="mt-2 text-muted-foreground">
              Todo cadastro começa com {TRIAL_DAYS} dias do plano {PLAN_NAME}, sem cartão.
            </p>
          </div>
          <ul className="grid gap-3 text-[15px]">
            <li className="rounded-2xl bg-muted p-4">
              <b>Grátis (modo WhatsApp).</b> Seu link no ar; o cliente escolhe serviço, dia e turno
              e chama você no WhatsApp com a mensagem pronta.
            </li>
            <li className="rounded-2xl bg-brand-50 p-4">
              <b>{PLAN_NAME}.</b> O cliente marca sozinho e o horário já entra na agenda, com
              lembretes, equipe e sinal pelo Pix.
            </li>
          </ul>
          <Link
            href="/precos"
            className="lp-press inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 font-semibold hover:border-primary"
          >
            Ver preços <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** FAQ as an accordion; answers stay in the HTML (and match the FAQPage data). */
export function FaqAccordion({
  title,
  items,
}: {
  title: string;
  items: readonly { question: string; answer: string }[];
}) {
  return (
    <section aria-labelledby="faq" className="py-16 sm:py-24">
      <div className={`${container} max-w-3xl`}>
        <h2 id="faq" className={h2}>
          {title}
        </h2>
        <div className="mt-8 flex flex-col divide-y rounded-3xl border bg-card px-5 sm:px-7">
          {items.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
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
      </div>
    </section>
  );
}

/** Final CTA on the inverted (dark) section, repeating the page's promise. */
export function ClosingCta({
  closing,
  note,
  niche,
}: {
  closing: LandingCopy["closing"];
  note: string;
  niche?: string;
}) {
  return (
    <section id="cta-final" className="px-5 pb-16 sm:px-8 sm:pb-24">
      <div className="lp-invert mx-auto flex max-w-6xl flex-col items-start gap-5 overflow-hidden rounded-[2rem] px-5 py-14 sm:px-14 sm:py-20">
        <h2 className="lp-display max-w-2xl font-heading text-[2.25rem] leading-[1.05] font-semibold text-balance sm:text-6xl">
          {closing.title}
        </h2>
        <p className="max-w-xl text-lg text-muted-foreground">{closing.subtitle}</p>
        <div className="w-full sm:w-auto">
          <CtaButton niche={niche} inverted>
            {closing.cta}
          </CtaButton>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">{note}</p>
      </div>
    </section>
  );
}
