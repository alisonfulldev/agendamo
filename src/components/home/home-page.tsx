import {
  Bell,
  CalendarCheck,
  CalendarX,
  Check,
  ChevronDown,
  Ghost,
  LayoutDashboard,
  Link2,
  type LucideIcon,
  Moon,
  MousePointerClick,
  Smartphone,
} from "lucide-react";
import Link from "next/link";

import { PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { HOME } from "@/content/home";
import { formatBRL } from "@/lib/money";
import { PLAN_PRICES, PRICE_TEXT } from "@/lib/plans";
import { isStorageConfigured } from "@/lib/storage/r2";

import { CreationChat } from "@/components/creation/creation-chat";
import { OpenCreationLink } from "@/components/creation/open-creation";

import { PhoneDemo } from "./phone-demo";
import { StickyCta } from "./sticky-cta";

const ICONS: Record<string, LucideIcon> = {
  moon: Moon,
  ghost: Ghost,
  "calendar-x": CalendarX,
  "calendar-check": CalendarCheck,
  bell: Bell,
  smartphone: Smartphone,
  link: Link2,
  layout: LayoutDashboard,
  pointer: MousePointerClick,
};

const reais = (cents: number) => formatBRL(cents).replace(/,00$/, "");

/**
 * Home page: short sales page. Every call to action opens the creation conversation over the
 * page (?criar=1). Texts live in src/content/home.ts.
 */
export function HomePage() {
  const { hero } = HOME;
  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(PLATFORM)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
          <img src={PLATFORM.logo} alt="" width={30} height={30} />
          MeetChat
        </Link>
        <Link
          href="/entrar"
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Entrar
        </Link>
      </header>

      <main className="flex-1">
        {/* Top */}
        <section id="topo" className="relative isolate overflow-hidden">
          <div className="site-glow absolute inset-0 -z-10" aria-hidden />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-8 pb-16 md:pt-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col items-start gap-6">
              <span className="rounded-full border bg-card px-3 py-1 text-sm font-medium">
                {hero.badge}
              </span>
              <h1 className="font-heading text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {hero.title}
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
                {hero.subtitle}
              </p>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <OpenCreationLink className="site-card-glow flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  {hero.primaryCta}
                </OpenCreationLink>
                <OpenCreationLink className="flex h-12 items-center justify-center rounded-xl border bg-card px-6 text-base font-semibold transition-colors hover:bg-muted">
                  {hero.secondaryCta}
                </OpenCreationLink>
              </div>
              <p className="text-sm text-muted-foreground">{hero.note}</p>
            </div>
            <PhoneDemo examples={HOME.demo} />
          </div>
        </section>

        {/* Pain */}
        <section aria-labelledby="dor" className="border-y bg-muted/50">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2
              id="dor"
              className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-balance"
            >
              {HOME.pains.title}
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {HOME.pains.items.map((item) => {
                const Icon = ICONS[item.icon]!;
                return (
                  <li
                    key={item.text}
                    className="flex items-start gap-3 rounded-2xl border bg-card p-5"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <p className="pt-2 font-medium text-pretty">{item.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="como" className="mx-auto max-w-6xl px-5 py-16">
          <h2 id="como" className="text-center text-3xl font-bold tracking-tight">
            {HOME.steps.title}
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {HOME.steps.items.map((text, index) => (
              <li key={text} className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="max-w-xs text-lg font-medium text-pretty">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Gains */}
        <section aria-labelledby="ganhos" className="border-y bg-muted/50">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="ganhos" className="text-center text-3xl font-bold tracking-tight">
              {HOME.gains.title}
            </h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HOME.gains.items.map((item) => {
                const Icon = ICONS[item.icon]!;
                return (
                  <li
                    key={item.text}
                    className="flex items-center gap-4 rounded-2xl border bg-card p-5"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <p className="font-medium text-pretty">{item.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Audience */}
        <section aria-labelledby="para-quem" className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 id="para-quem" className="text-3xl font-bold tracking-tight">
            {HOME.audience.title}
          </h2>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {HOME.audience.chips.map((chip) => (
              <li key={chip.label}>
                <Link
                  href={chip.href}
                  className="inline-flex h-11 items-center rounded-full border bg-card px-5 font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {chip.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing */}
        <section aria-labelledby="preco" className="border-y bg-muted/50">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="preco" className="text-center text-3xl font-bold tracking-tight">
              {HOME.pricing.title}
            </h2>
            <p className="mt-3 text-center text-lg text-muted-foreground">{HOME.pricing.tagline}</p>
            <div className="site-card-glow mx-auto mt-10 flex max-w-md flex-col gap-5 rounded-3xl border-2 border-primary/40 bg-card p-7">
              <div>
                <p className="font-semibold">{HOME.pricing.planName}</p>
                <p className="mt-3 flex items-baseline gap-1">
                  <span className="font-heading text-5xl font-bold tracking-tight">
                    {reais(PLAN_PRICES.monthly)}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  ou {PRICE_TEXT.yearlyPerMonth} no plano anual ({PRICE_TEXT.yearly})
                </p>
                <p className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {HOME.pricing.trial}
                </p>
              </div>
              <ul className="flex flex-col gap-2.5 text-sm">
                {HOME.pricing.includes.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">{HOME.pricing.extra}</p>
              <OpenCreationLink className="flex h-12 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                {hero.primaryCta}
              </OpenCreationLink>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq" className="mx-auto max-w-3xl px-5 py-16">
          <h2 id="faq" className="text-center text-3xl font-bold tracking-tight">
            {HOME.faq.title}
          </h2>
          <div className="mt-8 flex flex-col divide-y rounded-2xl border bg-card px-5">
            {HOME.faq.items.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
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
        </section>

        {/* Closing */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="site-cta-panel flex flex-col items-center gap-6 rounded-3xl px-6 py-14 text-center text-primary-foreground">
            <h2 className="max-w-xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {HOME.closing.title}
            </h2>
            <OpenCreationLink className="flex h-12 items-center justify-center rounded-xl bg-background px-7 text-base font-semibold text-foreground shadow-lg">
              {HOME.closing.cta}
            </OpenCreationLink>
          </div>
        </section>
      </main>

      <footer className="border-t pb-24 md:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 MeetChat</p>
          <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-5">
            {HOME.footer.links.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      <StickyCta targetId="topo" label={hero.primaryCta} />
      <CreationChat photos={isStorageConfigured()} />
    </div>
  );
}
