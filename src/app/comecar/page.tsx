import { ArrowRight, CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { NICHE_ICONS, nichesByGroup } from "@/components/sales/niche-cards";

export const metadata: Metadata = {
  title: { absolute: "Comece grátis · Agendamo" },
  robots: { index: false },
};

/** "Testar grátis" on the generic home: pick the niche, then sign up in it. */
export default function StartPage() {
  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(PLATFORM)}
      className="relative isolate flex min-h-full flex-1 flex-col items-center overflow-hidden bg-background px-6 py-14 font-sans text-foreground"
    >
      <div className="site-glow absolute inset-0 -z-10" aria-hidden />
      <div className="site-grid absolute inset-0 -z-10" aria-hidden />
      <Link href="/" className="mb-12 flex items-center gap-2.5 font-heading text-lg font-semibold">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
        <img src={PLATFORM.logo} alt="" width={32} height={32} />
        Agendamo
      </Link>
      <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">
        Passo 1 de 2
      </p>
      <h1 className="text-center text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Qual é o seu tipo de negócio?
      </h1>
      <p className="mt-4 mb-10 max-w-xl text-center text-lg text-pretty text-muted-foreground">
        Os textos, serviços e cores já vêm prontos para a sua área.
      </p>
      <div className="flex w-full max-w-4xl flex-col gap-8">
        {nichesByGroup().map((section) => (
          <div key={section.group}>
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {section.label}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.niches.map((brand) => {
                const niche = brand.niche!;
                const Icon = NICHE_ICONS[niche.icon];
                return (
                  <li key={brand.key}>
                    <Link
                      href={`/cadastro?brand=${brand.key}`}
                      data-theme-scope=""
                      style={brandThemeStyle(brand)}
                      className="group flex h-full items-center gap-3 rounded-2xl border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="flex-1 text-sm font-semibold">{niche.label}</span>
                      <ArrowRight
                        className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-1"
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
      <ul className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {["30 dias grátis", "Sem cartão de crédito", "Cancele quando quiser"].map((item) => (
          <li key={item} className="flex items-center gap-1.5">
            <CircleCheck className="size-4 text-primary" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/entrar"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
