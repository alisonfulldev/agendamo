import { Activity, ArrowRight, Brain, Flower2, Scissors, Sparkles } from "lucide-react";
import Link from "next/link";

import { NICHES, type BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";

export const NICHE_ICONS: Record<NonNullable<BrandConfig["niche"]>["icon"], typeof Sparkles> = {
  sparkles: Sparkles,
  scissors: Scissors,
  flower: Flower2,
  brain: Brain,
  activity: Activity,
};

/** One card per niche: each opens its own page (/beleza…) and its own sign-up. */
export function NicheCards({ heading = "Feito para o seu tipo de negócio" }: { heading?: string }) {
  return (
    <section
      id="nichos"
      aria-labelledby="nichos-titulo"
      className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24"
    >
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">Nichos</p>
        <h2
          id="nichos-titulo"
          className="text-3xl font-bold tracking-tight text-balance sm:text-4xl"
        >
          {heading}
        </h2>
        <p className="mt-4 text-lg text-pretty text-muted-foreground">
          Textos, serviços e exemplos prontos para cada área. Escolha a sua.
        </p>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {NICHES.map((brand) => {
          const niche = brand.niche!;
          const Icon = NICHE_ICONS[niche.icon];
          return (
            <li key={brand.key}>
              <div
                data-theme-scope=""
                style={brandThemeStyle(brand)}
                className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border bg-card p-6 text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className="absolute -top-16 -right-16 size-40 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100 md:opacity-0"
                  aria-hidden
                />
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-6" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                    {niche.name}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-balance">{niche.label}</h3>
                  <p className="mt-2 text-sm text-pretty text-muted-foreground">{niche.pitch}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                  <Link
                    href={`/cadastro?brand=${brand.key}`}
                    className="rounded-lg bg-button px-3.5 py-2 text-button-foreground transition-opacity hover:opacity-90"
                  >
                    Testar grátis
                  </Link>
                  <Link
                    href={`/${niche.route}`}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    Ver como funciona
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
