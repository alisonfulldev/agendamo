import {
  ArrowRight,
  Bell,
  CalendarCheck,
  Check,
  ChevronDown,
  CircleCheck,
  Link2,
  ListChecks,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { NICHES, type BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { DemoChat } from "@/components/sales/demo-chat";
import { FEATURE_VISUALS } from "@/components/sales/feature-visuals";
import { PlansTable } from "@/components/sales/plans-table";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { PLAN_PRICES, TRIAL_DAYS } from "@/lib/plans";

const SOCIAL_LABELS = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
} as const;

/** What changes with Agendamo (facts of the product, shared by every niche). */
const WITH_AGENDAMO = [
  "O cliente escolhe o horário livre sozinho, 24 horas por dia",
  "Confirmação e lembrete automáticos, sem você digitar nada",
  "Agenda organizada, sem horário duplicado nem anotação perdida",
];

const STEP_ICONS = [ListChecks, Link2, CalendarCheck];

/** Feature grid layout (6 tiles): wide, narrow, narrow, wide, half, half. */
const TILE_SPANS = [
  "md:col-span-4",
  "md:col-span-2",
  "md:col-span-2",
  "md:col-span-4",
  "md:col-span-3",
  "md:col-span-3",
];

function SectionHeading({
  eyebrow,
  title,
  text,
  id,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  id: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
      <h2 id={id} className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {text ? <p className="mt-4 text-lg text-pretty text-muted-foreground">{text}</p> : null}
    </div>
  );
}

/** "Primeira parte, segunda parte" → second part in the brand gradient. */
function HeroTitle({ title }: { title: string }) {
  const cut = title.indexOf(", ");
  if (cut === -1) return <>{title}</>;
  return (
    <>
      {title.slice(0, cut + 1)} <span className="text-brand-gradient">{title.slice(cut + 2)}</span>
    </>
  );
}

/**
 * Sales page of the Agendamo site: the generic home (PLATFORM) and each niche page (/beleza…).
 * Content and theme come from the brand file; the theme is scoped to the page, so a brand
 * remembered in the cookie never changes how these pages look.
 */
export function SalesPage({
  brand,
  signupHref,
  afterHero,
}: {
  brand: BrandConfig;
  /** Where "Testar grátis" goes: the niche's sign-up, or the niche picker on the generic home. */
  signupHref: string;
  afterHero?: ReactNode;
}) {
  const { sales } = brand;
  const isHome = !brand.niche;
  const socialLinks = Object.entries(brand.socialLinks).filter(
    (entry): entry is [keyof typeof SOCIAL_LABELS, string] => Boolean(entry[1]),
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: sales.subtitle,
    offers: [
      {
        "@type": "Offer",
        name: "Mensal",
        price: (PLAN_PRICES.monthly / 100).toFixed(2),
        priceCurrency: "BRL",
      },
      {
        "@type": "Offer",
        name: "Anual",
        price: (PLAN_PRICES.yearly / 100).toFixed(2),
        priceCurrency: "BRL",
      },
    ],
  };
  const nav = [
    ["#como-funciona", "Como funciona"],
    ["#recursos", "Recursos"],
    ...(isHome ? [["#nichos", "Nichos"]] : []),
    ["#preco", "Preço"],
    ["#duvidas", "Dúvidas"],
  ];
  const facts = [
    ["24 h", "por dia recebendo agendamentos"],
    ["5 min", "para colocar seu link no ar"],
    ["0", "aplicativos para o cliente instalar"],
    [formatBRL(Math.round(PLAN_PRICES.yearly / 12)).replace(",00", ""), "por mês no plano anual"],
  ];

  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(brand)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5 font-heading text-lg font-semibold">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
            <img src={brand.logo} alt="" width={32} height={32} />
            <span>{brand.name}</span>
            {brand.niche ? (
              <span className="hidden rounded-full border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground lg:inline">
                para {brand.niche.name.toLowerCase()}
              </span>
            ) : null}
          </Link>
          <nav aria-label="Seções" className="hidden items-center gap-1 md:flex">
            {nav.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost">
              <Link href="/entrar">Entrar</Link>
            </Button>
            <Button asChild className="hidden h-9 px-4 sm:inline-flex">
              <Link href={signupHref}>Testar grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <div className="site-glow absolute inset-0 -z-10" aria-hidden />
          <div className="site-grid absolute inset-0 -z-10" aria-hidden />
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pt-16 pb-20 md:pt-24 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col items-start gap-7">
              <span className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-sm font-medium shadow-sm backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                {brand.niche
                  ? `Agendamento online para ${brand.niche.name.toLowerCase()}`
                  : "Chat de agendamento para quem tem hora marcada"}
              </span>
              <h1 className="font-heading text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                <HeroTitle title={sales.title} />
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
                {sales.subtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="site-card-glow h-12 gap-2 px-6 text-base">
                  <Link href={signupHref}>
                    Testar {TRIAL_DAYS} dias grátis <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 bg-card/70 px-6 text-base"
                >
                  <a href="#como-funciona">Ver como funciona</a>
                </Button>
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {["30 dias grátis", "Sem cartão de crédito", "Cancele quando quiser"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <CircleCheck className="size-4 text-primary" aria-hidden />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="relative mx-auto">
              <div
                className="absolute -inset-10 -z-10 rounded-full bg-primary/15 blur-3xl"
                aria-hidden
              />
              <DemoChat
                data={{
                  businessName: sales.demo.businessName,
                  customerName: sales.demo.customerName,
                  dayLabel: sales.demo.dayLabel,
                  time: sales.demo.time,
                  services: brand.suggestedServices.slice(0, 3).map((s, i) => ({
                    name: s.name,
                    price: sales.demo.prices[i] ?? 0,
                  })),
                  messages: {
                    greeting: brand.chatMessages.greeting,
                    askDate: brand.chatMessages.askDate,
                    askTime: brand.chatMessages.askTime,
                    successConfirmed: brand.chatMessages.successConfirmed,
                  },
                  serviceTerm: brand.terms.service.singular,
                }}
              />
              <div
                className="animate-float absolute top-16 -left-28 hidden w-56 items-center gap-3 rounded-2xl border bg-card p-3 shadow-xl sm:flex"
                aria-hidden
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarCheck className="size-5" />
                </span>
                <span className="min-w-0 text-sm">
                  <span className="block font-semibold">Novo agendamento</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {sales.demo.customerName} · {sales.demo.time}
                  </span>
                </span>
              </div>
              <div
                className="animate-float-delayed absolute -right-24 bottom-24 hidden w-52 items-center gap-3 rounded-2xl border bg-card p-3 shadow-xl sm:flex"
                aria-hidden
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Bell className="size-5" />
                </span>
                <span className="text-sm">
                  <span className="block font-semibold">Lembrete enviado</span>
                  <span className="block text-xs text-muted-foreground">sem você digitar nada</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-6 pb-16">
            <dl className="grid grid-cols-2 divide-border rounded-2xl border bg-card/80 shadow-sm backdrop-blur md:grid-cols-4 md:divide-x">
              {facts.map(([value, label]) => (
                <div key={label} className="px-6 py-5 text-center">
                  <dt className="sr-only">{label}</dt>
                  <dd>
                    <span className="block font-heading text-3xl font-bold tracking-tight">
                      {value}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">{label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {afterHero}

        {/* Before / after */}
        <section aria-labelledby="antes-depois" className="border-y bg-muted/60">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <SectionHeading
              id="antes-depois"
              eyebrow="Antes e depois"
              title="Pare de agendar pelo WhatsApp na mão"
              text="Cada mensagem respondida é um atendimento que você deixou de fazer."
            />
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border bg-card p-8">
                <p className="mb-5 font-semibold text-muted-foreground">Sem o {brand.name}</p>
                <ul className="flex flex-col gap-4">
                  {sales.pains.map((pain) => (
                    <li key={pain} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <X className="size-3.5" aria-hidden />
                      </span>
                      <span className="text-pretty">{pain}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="site-card-glow rounded-3xl border-2 border-primary/40 bg-card p-8">
                <p className="mb-5 font-semibold text-primary">Com o {brand.name}</p>
                <ul className="flex flex-col gap-4">
                  {WITH_AGENDAMO.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3.5" aria-hidden />
                      </span>
                      <span className="text-pretty">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="como-funciona"
          aria-labelledby="how-it-works"
          className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24"
        >
          <SectionHeading
            id="how-it-works"
            eyebrow="Como funciona"
            title="No ar em 5 minutos, sem complicação"
          />
          <ol className="relative grid gap-10 md:grid-cols-3">
            <div
              className="absolute top-7 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
              aria-hidden
            />
            {sales.howItWorks.map((step, index) => {
              const Icon = STEP_ICONS[index % STEP_ICONS.length]!;
              return (
                <li key={step.title} className="relative flex flex-col items-center text-center">
                  <span className="relative mb-6 flex size-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
                    <Icon className="size-6 text-primary" aria-hidden />
                    <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                  </span>
                  <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                  <p className="max-w-xs text-pretty text-muted-foreground">{step.description}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Features */}
        <section
          id="recursos"
          aria-labelledby="benefits"
          className="scroll-mt-20 border-y bg-muted/60"
        >
          <div className="mx-auto max-w-6xl px-6 py-24">
            <SectionHeading
              id="benefits"
              eyebrow="Recursos"
              title="Tudo o que você precisa, num plano só"
              text="Agenda, chat, lembretes, sinal por Pix e financeiro. Sem módulos extras para pagar."
            />
            <ul className="grid gap-5 md:grid-cols-6">
              {sales.benefits.map((benefit, index) => {
                const Visual = FEATURE_VISUALS[index % FEATURE_VISUALS.length]!;
                return (
                  <li
                    key={benefit.title}
                    className={`group flex flex-col gap-5 rounded-3xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${TILE_SPANS[index % TILE_SPANS.length]}`}
                  >
                    <div>
                      <h3 className="mb-1.5 text-lg font-semibold">{benefit.title}</h3>
                      <p className="text-pretty text-muted-foreground">{benefit.description}</p>
                    </div>
                    <div className="mt-auto">
                      <Visual />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="preco"
          aria-labelledby="plans"
          className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24"
        >
          <SectionHeading
            id="plans"
            eyebrow="Preço"
            title="Um preço simples e justo"
            text={`${TRIAL_DAYS} dias grátis com tudo liberado. Depois, escolha mensal ou anual.`}
          />
          <PlansTable signupHref={signupHref} />
        </section>

        {sales.testimonials.length > 0 ? (
          <section aria-labelledby="testimonials" className="border-y bg-muted/60">
            <div className="mx-auto max-w-6xl px-6 py-24">
              <SectionHeading
                id="testimonials"
                eyebrow="Quem usa"
                title="Feito para o dia a dia de quem atende"
              />
              <ul className="grid gap-5 md:grid-cols-2">
                {sales.testimonials.map((testimonial) => (
                  <li
                    key={testimonial.name}
                    className="flex flex-col gap-5 rounded-3xl border bg-card p-8"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex gap-0.5" aria-label="5 estrelas">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <Star key={i} className="size-4 fill-primary text-primary" aria-hidden />
                        ))}
                      </span>
                      {testimonial.isExample ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                          Exemplo
                        </span>
                      ) : null}
                    </div>
                    <blockquote className="text-lg leading-relaxed text-pretty">
                      “{testimonial.quote}”
                    </blockquote>
                    <p className="flex items-center gap-3 text-sm">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {testimonial.name.charAt(0)}
                      </span>
                      <span>
                        <span className="block font-semibold">{testimonial.name}</span>
                        <span className="block text-muted-foreground">{testimonial.role}</span>
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* FAQ */}
        <section
          id="duvidas"
          aria-labelledby="faq"
          className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24"
        >
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">
                Dúvidas
              </p>
              <h2 id="faq" className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Perguntas frequentes
              </h2>
              <p className="mt-4 text-lg text-pretty text-muted-foreground">
                Tudo o que você precisa saber antes de começar. Teste {TRIAL_DAYS} dias sem
                compromisso.
              </p>
            </div>
            <div className="flex flex-col divide-y rounded-3xl border bg-card px-6">
              {sales.faq.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <ChevronDown
                      className="site-chevron size-5 shrink-0 text-muted-foreground transition-transform duration-200"
                      aria-hidden
                    />
                  </summary>
                  <p className="mt-3 leading-relaxed text-pretty text-muted-foreground">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="site-cta-panel relative isolate overflow-hidden rounded-[2rem] px-8 py-16 text-center text-primary-foreground shadow-2xl sm:px-16">
            <div className="site-grid absolute inset-0 -z-10 opacity-40" aria-hidden />
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-5xl">
              Comece hoje: em 5 minutos seu link está no ar
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg opacity-90">
              {TRIAL_DAYS} dias grátis com tudo liberado. Sem cartão, sem fidelidade.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="mt-8 h-12 gap-2 px-7 text-base shadow-lg"
            >
              <Link href={signupHref}>
                Testar {TRIAL_DAYS} dias grátis <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2.5 font-heading text-lg font-semibold">
              {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
              <img src={brand.logo} alt="" width={28} height={28} />
              {brand.name}
            </Link>
            <p className="max-w-xs text-sm text-pretty text-muted-foreground">
              Chat de agendamento para quem trabalha com hora marcada. Seus clientes agendam
              sozinhos, direto pelo link da bio.
            </p>
          </div>
          <nav aria-label="Produto" className="flex flex-col gap-2.5 text-sm">
            <p className="font-semibold">Produto</p>
            <a href="#como-funciona" className="text-muted-foreground hover:text-foreground">
              Como funciona
            </a>
            <a href="#recursos" className="text-muted-foreground hover:text-foreground">
              Recursos
            </a>
            <a href="#preco" className="text-muted-foreground hover:text-foreground">
              Preço
            </a>
            <Link href="/entrar" className="text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
          </nav>
          <nav aria-label="Nichos" className="flex flex-col gap-2.5 text-sm">
            <p className="font-semibold">Para quem</p>
            {NICHES.map((niche) => (
              <Link
                key={niche.key}
                href={`/${niche.niche!.route}`}
                className="text-muted-foreground hover:text-foreground"
              >
                {niche.niche!.name}
              </Link>
            ))}
          </nav>
          <nav aria-label="Institucional" className="flex flex-col gap-2.5 text-sm">
            <p className="font-semibold">Institucional</p>
            <Link href="/explorar" className="text-muted-foreground hover:text-foreground">
              Encontre profissionais
            </Link>
            <Link href="/termos" className="text-muted-foreground hover:text-foreground">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="text-muted-foreground hover:text-foreground">
              Privacidade
            </Link>
            {socialLinks.map(([network, url]) => (
              <a
                key={network}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                {SOCIAL_LABELS[network]}
              </a>
            ))}
          </nav>
        </div>
        <div className="border-t">
          <p className="mx-auto max-w-6xl px-6 py-5 text-sm text-muted-foreground">
            © 2026 {brand.name}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
