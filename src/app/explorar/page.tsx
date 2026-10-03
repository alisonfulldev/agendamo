import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentBrand } from "@/brands/server";
import { brandUrl } from "@/brands/urls";
import { Button } from "@/components/ui/button";
import { getPortalIndex } from "@/lib/portal/data";
import { slugify } from "@/lib/slug";

import { PortalTracker } from "./portal-tracker";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getCurrentBrand();
  return {
    title: `Encontre profissionais · ${brand.name}`,
    description: `Busque por cidade e serviço e agende com profissionais do ${brand.name}.`,
    alternates: { canonical: brandUrl(brand, "/explorar").split("?")[0] },
  };
}

const selectClass = "h-11 w-full rounded-lg border border-input bg-transparent px-2";

/** Portal home of the brand: search by city and service (Prompt 36). */
export default async function ExplorePage({ searchParams }: PageProps<"/explorar">) {
  const brand = await getCurrentBrand();
  const { cidade, servico } = await searchParams;
  if (typeof cidade === "string" && typeof servico === "string" && cidade && servico) {
    redirect(`/explorar/${slugify(cidade)}/${slugify(servico)}`);
  }
  const index = await getPortalIndex(brand.key);
  const cities = [...new Map(index.map((i) => [i.city_slug, i.city])).entries()];
  const services = [...new Map(index.map((i) => [i.service_slug, i.service_name])).entries()];
  const popular = index.filter((i) => i.businesses >= 3).slice(0, 24);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-12">
      <PortalTracker type="search" city={null} neighborhood={null} service={null} slugs={[]} />
      <div>
        <Link href="/" className="text-sm text-primary">
          {brand.name}
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Encontre um profissional perto de você</h1>
      </div>
      {index.length === 0 ? (
        <p className="text-muted-foreground">
          Ainda não há profissionais listados. Volte em breve!
        </p>
      ) : (
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" role="search">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Cidade
            <select name="cidade" className={selectClass} required defaultValue="">
              <option value="" disabled>
                Escolha
              </option>
              {cities.map(([slug, name]) => (
                <option key={slug} value={slug}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Serviço
            <select name="servico" className={selectClass} required defaultValue="">
              <option value="" disabled>
                Escolha
              </option>
              {services.map(([slug, name]) => (
                <option key={slug} value={slug}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" className="h-11 self-end">
            Buscar
          </Button>
        </form>
      )}
      {popular.length ? (
        <section aria-labelledby="populares">
          <h2 id="populares" className="mb-3 text-xl font-bold">
            Buscas populares
          </h2>
          <ul className="flex flex-wrap gap-2">
            {popular.map((i) => (
              <li key={`${i.city_slug}-${i.service_slug}`}>
                <Link
                  href={`/explorar/${i.city_slug}/${i.service_slug}`}
                  className="block rounded-full border bg-card px-3 py-1.5 text-sm hover:border-primary"
                >
                  {i.service_name} em {i.city}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
