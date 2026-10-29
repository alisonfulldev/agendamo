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

/*
 * Landing sections in color blocks (2026-10-28, docs/design/direction.md): each section is a
 * full-width block (.lp-lime, .lp-deep, .lp-brand, .lp-soft in globals.css) with big heavy titles
 * (.lp-title), centered on phones. Only the look changed: same headings, text and links (SEO).
 */

/** Width and gutters shared by every landing section (20 px gutter on phones). */
export const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";
const h2 = "lp-title text-[2.4rem] leading-[1.02] text-balance sm:text-[3.5rem] lg:text-[4rem]";
const kicker = "font-sans text-sm font-bold tracking-wide text-[color:var(--lp-link)] uppercase";
/** Section heading block: centered on phones, left on large screens. */
const headingWrap = "text-center lg:text-left";

export function CtaButton({
  children,
  niche,
  id,
}: {
  children: ReactNode;
  /** Niche route: the creation conversation opens with the niche chosen. */
  niche?: string;
  id?: string;
  /** Kept for callers; the block the button is in now sets its colors. */
  inverted?: boolean;
}) {
  return (
    <div id={id}>
      <OpenCreationLink
        niche={niche}
        className="lp-press inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--lp-cta-bg)] px-7 py-3 text-center text-[17px] font-bold text-[color:var(--lp-cta-fg)] transition-opacity hover:opacity-90 sm:w-auto"
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
  // Long headlines get a slightly smaller size so they keep 3–4 lines.
  const long = hero.title.length > 48;
  return (
    <section className="lp-lime lp-hero relative overflow-hidden">
      <div
        className={`${container} grid items-center gap-12 pt-8 pb-16 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-24`}
      >
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-sm font-semibold">
            <span className="size-1.5 rounded-full bg-[color:var(--lp-deep)]" aria-hidden />
            {hero.eyebrow}
          </p>
          <h1
            className={`lp-title mt-5 leading-[0.98] text-balance ${
              long
                ? "text-[2.75rem] sm:text-6xl lg:text-[4.25rem]"
                : "text-[3.1rem] sm:text-7xl lg:text-[5.25rem]"
            }`}
          >
            {hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed font-medium text-pretty sm:text-xl">
            {hero.subtitle}
          </p>
          <div className="mt-8 w-full sm:w-auto">
            <CtaButton niche={niche} id="cta-topo">
              {hero.cta}
            </CtaButton>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">{hero.note}</p>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold lg:justify-start">
            {hero.trust.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="size-4" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="lp-plain">
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
      </div>
    </section>
  );
}

/** Home: one door per common pain, each leading to its guide. */
export function PainDoors({ doors }: { doors: NonNullable<LandingCopy["doors"]> }) {
  return (
    <section aria-labelledby="dores" className="lp-deep py-20 sm:py-28">
      <div className={container}>
        <h2 id="dores" className={`${h2} ${headingWrap}`}>
          {doors.title}
        </h2>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {doors.items.map((door, index) => (
            <li key={door.href} className="lp-reveal">
              <Link
                href={door.href}
                className={`lp-lift group flex h-full flex-col rounded-[2rem] p-7 ${
                  index === 1 ? "lp-lime" : "bg-card"
                }`}
              >
                <span className="lp-title text-[1.75rem] leading-[1.08] text-balance">
                  {door.pain}
                </span>
                <span className="mt-4 flex-1 text-[17px] leading-relaxed text-muted-foreground">
                  {door.answer}
                </span>
                <span className="mt-6 inline-flex items-center gap-1.5 font-bold text-[color:var(--lp-link)]">
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
    <section aria-labelledby="dores" className="lp-deep py-20 sm:py-28">
      <div className={container}>
        <h2 id="dores" className={`${h2} ${headingWrap}`}>
          {pains.title}
        </h2>
        <ol className="mt-12 grid gap-4 lg:grid-cols-3">
          {pains.items.map((pain) => (
            <li
              key={pain.scene}
              className="lp-reveal flex flex-col overflow-hidden rounded-[2rem] bg-card"
            >
              <p className="flex-1 p-7 text-lg leading-relaxed text-pretty">{pain.scene}</p>
              <p className="lp-lime flex gap-2.5 p-7 leading-relaxed font-medium">
                <Check className="mt-1 size-5 shrink-0" aria-hidden />
                {pain.relief}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Colors of the story rows, in turn: each row is its own block. */
const STORY_BLOCKS = ["lp-soft", "lp-brand", "lp-lime", "lp-deep"] as const;

/** "How your day changes": one color block per row, alternating text and a product mock. */
export function StoryRows({ story, mock }: { story: LandingCopy["story"]; mock: PhoneMock }) {
  return (
    <section id="como-funciona" aria-labelledby="como" className="scroll-mt-4">
      <div className="lp-soft pt-20 sm:pt-28">
        <div className={container}>
          <h2 id="como" className={`${h2} ${headingWrap} lg:max-w-3xl`}>
            {story.title}
          </h2>
        </div>
      </div>
      <ol>
        {story.rows.map((row, index) => (
          <li
            key={row.title}
            className={`${STORY_BLOCKS[index % STORY_BLOCKS.length]} ${index === 0 ? "pt-12 pb-20 sm:pb-28" : "py-20 sm:py-28"}`}
          >
            <div className={`${container} grid items-center gap-10 md:grid-cols-2 md:gap-16`}>
              <div
                className={`lp-reveal text-center md:text-left ${index % 2 ? "md:order-2" : ""}`}
              >
                <p className={kicker}>
                  <span className="tabular-nums">{index + 1}</span> · {row.kicker}
                </p>
                <h3 className="lp-title mt-3 text-[2rem] leading-[1.05] text-balance sm:text-5xl">
                  {row.title}
                </h3>
                <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground md:mx-0">
                  {row.text}
                </p>
              </div>
              <div className={`lp-plain flex justify-center ${index % 2 ? "md:order-1" : ""}`}>
                <MockVisualFor visual={row.visual} mock={mock} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Before × after: WhatsApp/notebook against the link. */
export function CompareTable({ compare }: { compare: LandingCopy["compare"] }) {
  return (
    <section aria-labelledby="comparacao" className="py-20 sm:py-28">
      <div className={container}>
        <h2 id="comparacao" className={`${h2} ${headingWrap} lg:max-w-3xl`}>
          {compare.title}
        </h2>
        <div className="lp-reveal mt-12 overflow-hidden rounded-[2rem] border bg-card">
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
                <th scope="col" className="lp-lime p-4 font-bold">
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
                    <td className="bg-brand-50 p-4 pt-2 font-medium sm:pt-4">
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
      className="lp-brand scroll-mt-4 py-20 sm:py-28"
    >
      <div className={container}>
        <h2 id="areas-titulo" className={`${h2} ${headingWrap} lg:max-w-3xl`}>
          {title}
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                        className="lp-lift group flex min-h-12 items-center gap-2.5 rounded-full bg-card px-4 py-2 text-[15px]"
                      >
                        <Icon className="size-5 shrink-0 text-[color:var(--lp-link)]" aria-hidden />
                        <span className="flex-1 font-semibold">{brand.niche!.name}</span>
                        <ArrowRight
                          className="hidden size-4 transition-transform group-hover:translate-x-1 md:block"
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
    <section aria-labelledby="objecoes" className="lp-lime py-20 sm:py-28">
      <div className={`${container} grid gap-12 lg:grid-cols-[0.8fr_1.2fr]`}>
        <h2 id="objecoes" className={`${h2} ${headingWrap}`}>
          {objections.title}
        </h2>
        <dl className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
          {objections.items.map((item) => (
            <div key={item.question} className="lp-reveal border-t-2 pt-5">
              <dt className="lp-title text-2xl leading-tight">{item.question}</dt>
              <dd className="mt-2 text-[17px] leading-relaxed text-muted-foreground">
                {item.answer}
                {item.href ? (
                  <>
                    {" "}
                    <Link
                      href={item.href}
                      className="font-bold text-[color:var(--lp-link)] underline underline-offset-4"
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
    <section aria-labelledby="planos" className="py-20 sm:py-28">
      <div className={container}>
        <div className="lp-soft grid gap-6 rounded-[2rem] p-7 sm:p-12 lg:grid-cols-[1fr_1fr_auto] lg:items-center lg:gap-10">
          <div className="text-center lg:text-left">
            <h2 id="planos" className="lp-title text-[2rem] leading-[1.05] sm:text-4xl">
              Comece grátis. Assine quando fizer sentido.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Todo cadastro começa com {TRIAL_DAYS} dias do plano {PLAN_NAME}, sem cartão.
            </p>
          </div>
          <ul className="grid gap-3 text-[15px]">
            <li className="rounded-3xl bg-card p-5">
              <b>Grátis (modo WhatsApp).</b> Seu link no ar; o cliente escolhe serviço, dia e turno
              e chama você no WhatsApp com a mensagem pronta.
            </li>
            <li className="lp-lime rounded-3xl p-5">
              <b>{PLAN_NAME}.</b> O cliente marca sozinho e o horário já entra na agenda, com
              lembretes, equipe e sinal pelo Pix.
            </li>
          </ul>
          <Link
            href="/precos"
            className="lp-press inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-foreground px-6 font-bold"
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
    <section aria-labelledby="faq" className="py-20 sm:py-28">
      <div className={`${container} max-w-3xl`}>
        <h2 id="faq" className={`${h2} text-center`}>
          {title}
        </h2>
        <div className="mt-10 flex flex-col gap-3">
          {items.map((item) => (
            <details key={item.question} className="group rounded-3xl bg-muted px-5 py-2 sm:px-7">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  className="site-chevron size-5 shrink-0 text-muted-foreground transition-transform"
                  aria-hidden
                />
              </summary>
              <p className="pb-4 leading-relaxed text-pretty text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Final CTA on the deep block, repeating the page's promise. */
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
    <section id="cta-final" className="lp-deep">
      <div
        className={`${container} flex flex-col items-center gap-6 py-20 text-center sm:py-28 lg:items-start lg:text-left`}
      >
        <h2 className="lp-title max-w-3xl text-[2.75rem] leading-[1] text-balance sm:text-7xl">
          {closing.title}
        </h2>
        <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">{closing.subtitle}</p>
        <div className="w-full sm:w-auto">
          <CtaButton niche={niche}>{closing.cta}</CtaButton>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">{note}</p>
      </div>
    </section>
  );
}
