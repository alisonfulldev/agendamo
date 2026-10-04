import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { NICHES } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";

/** One card per niche: each opens its own page (/beleza…) and its own sign-up. */
export function NicheCards({ heading = "Feito para o seu tipo de negócio" }: { heading?: string }) {
  return (
    <section id="nichos" aria-labelledby="nichos-titulo" className="mx-auto max-w-5xl px-6 py-14">
      <h2 id="nichos-titulo" className="mb-2 text-center text-3xl font-bold">
        {heading}
      </h2>
      <p className="mb-8 text-center text-muted-foreground">
        Textos, serviços e exemplos prontos para cada área. Escolha a sua.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NICHES.map((brand) => (
          <li key={brand.key}>
            <div
              data-theme-scope=""
              style={brandThemeStyle(brand)}
              className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 text-card-foreground"
            >
              <span className="h-1.5 w-12 rounded-full bg-primary" aria-hidden />
              <h3 className="text-lg font-semibold">{brand.niche!.label}</h3>
              <p className="flex-1 text-sm text-muted-foreground">{brand.niche!.pitch}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                <Link
                  href={`/${brand.niche!.route}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  Ver como funciona <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href={`/cadastro?brand=${brand.key}`}
                  className="rounded-lg bg-button px-3 py-1.5 text-button-foreground hover:opacity-90"
                >
                  Testar grátis
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
