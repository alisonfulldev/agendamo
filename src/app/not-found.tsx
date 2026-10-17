import type { Metadata } from "next";
import Link from "next/link";

import { getBrand, PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: { absolute: "Página não encontrada · MeetChat" },
  robots: { index: false, follow: true },
};

/** Most searched areas, offered as a way out of a broken link. */
const POPULAR = ["beauty", "barber", "nails", "aesthetics", "psychology"]
  .map((key) => getBrand(key))
  .filter((brand) => brand?.niche);

/** Site-wide 404 (real 404 status): ways back to the main areas of the site. */
export default function NotFound() {
  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(PLATFORM)}
      className="flex min-h-full flex-1 flex-col bg-background font-sans text-foreground"
    >
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start px-5 py-16">
        <p className="font-heading text-5xl font-bold text-primary">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Página não encontrada</h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">
          O endereço pode ter sido digitado errado ou a página mudou de lugar. Se o link veio de um
          negócio, confira com ele o endereço certo.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="flex h-12 items-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground hover:opacity-90"
          >
            Ir para o início
          </Link>
          <Link
            href="/precos"
            className="flex h-12 items-center rounded-xl border bg-card px-6 font-semibold hover:border-primary"
          >
            Ver preços
          </Link>
        </div>
        <h2 className="mt-12 text-sm font-semibold text-muted-foreground">Áreas mais procuradas</h2>
        <ul className="mt-3 flex flex-wrap gap-2.5">
          {POPULAR.map((brand) => (
            <li key={brand!.key}>
              <Link
                href={`/${brand!.niche!.route}`}
                className="inline-flex h-10 items-center rounded-full border bg-card px-4 text-sm font-medium hover:border-primary hover:text-primary"
              >
                {brand!.niche!.name}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
