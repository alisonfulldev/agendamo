import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { NICHES, PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";

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
      className="flex min-h-full flex-1 flex-col items-center bg-background px-6 py-12 font-sans text-foreground"
    >
      <Link href="/" className="mb-8 flex items-center gap-2 font-heading text-lg font-semibold">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
        <img src={PLATFORM.logo} alt="" width={32} height={32} />
        Agendamo
      </Link>
      <h1 className="text-center text-3xl font-bold">Qual é o seu tipo de negócio?</h1>
      <p className="mt-2 mb-8 text-center text-muted-foreground">
        Os textos, serviços e cores já vêm prontos para a sua área. 30 dias grátis, sem cartão.
      </p>
      <ul className="grid w-full max-w-3xl gap-3 sm:grid-cols-2">
        {NICHES.map((brand) => (
          <li key={brand.key}>
            <Link
              href={`/cadastro?brand=${brand.key}`}
              data-theme-scope=""
              style={brandThemeStyle(brand)}
              className="flex items-center gap-4 rounded-2xl border bg-card p-5 text-card-foreground hover:border-primary"
            >
              <span className="size-3 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="flex-1">
                <span className="block font-semibold">{brand.niche!.label}</span>
                <span className="block text-sm text-muted-foreground">{brand.niche!.pitch}</span>
              </span>
              <ArrowRight className="size-5 text-primary" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted-foreground">
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
