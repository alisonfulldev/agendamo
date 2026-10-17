import type { Metadata } from "next";
import Link from "next/link";

import type { BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { canonicalUrl } from "@/brands/urls";
import { LazyCreationChat } from "@/components/creation/lazy-creation-chat";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteTracker } from "@/components/seo/site-tracker";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { GuideCta } from "@/components/site/guide-article";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { priceRange, type cityListing } from "@/lib/directory/build";
import { formatBRL } from "@/lib/money";
import { pageMetadata } from "@/lib/seo/metadata";
import { itemListNode, organizationNode } from "@/lib/seo/structured-data";
import { isStorageConfigured, publicUrl } from "@/lib/storage/r2";

type Listing = NonNullable<ReturnType<typeof cityListing>>;

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

/** Metadata of a directory page: indexable only from DIRECTORY_CONFIG.minIndexable profiles. */
export function cityMetadata(brand: BrandConfig, listing: Listing): Metadata {
  const niche = brand.niche!;
  const full = `${niche.name} em ${listing.city}: agende online | MeetChat`;
  const anyPrice = listing.businesses.some((b) => priceRange(b));
  return pageMetadata({
    title: full.length <= 65 ? full : `${niche.name} em ${listing.city}: agende online`,
    description: `${listing.count} ${plural(listing.count, "perfil", "perfis")} de ${niche.name.toLowerCase()} em ${listing.city} com agendamento online: veja serviços${anyPrice ? ", preços" : ""} e marque pelo chat, 24h.`,
    path: `/${niche.route}/${listing.citySlug}`,
    image: { url: `/og?nicho=${brand.key}`, width: 1200, height: 630 },
    index: listing.indexable,
  });
}

/**
 * Directory page (/{nicho}/{cidade}): the niche's complete profiles in the city, alphabetical,
 * built only from real data the owners chose to show.
 */
export function NicheCityPage({ brand, listing }: { brand: BrandConfig; listing: Listing }) {
  const niche = brand.niche!;
  const hub = `/${niche.route}`;
  const path = `${hub}/${listing.citySlug}`;

  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(brand)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <SiteHeader badge={niche.name} logo={brand.logo} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pt-4 pb-16">
        <Breadcrumbs
          items={[
            { name: niche.name, path: hub },
            { name: listing.city, path },
          ]}
        />
        <h1 className="mt-6 font-heading text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
          {niche.label} em {listing.city}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-pretty text-muted-foreground">
          {listing.count} {plural(listing.count, "perfil", "perfis")} de {niche.name.toLowerCase()}{" "}
          em {listing.city} com agendamento online pelo MeetChat. Veja os serviços e marque direto
          pelo chat de cada negócio.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Em ordem alfabética. Aparecem só perfis completos de quem aceitou aparecer nas buscas.
        </p>

        <ul className="mt-8 grid gap-4">
          {listing.businesses.map((business) => {
            const avatar = publicUrl(business.avatarKey);
            const range = priceRange(business);
            return (
              <li key={business.slug} className="flex gap-4 rounded-2xl border bg-card p-4 sm:p-5">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- owner photo from R2, already compressed
                  <img
                    src={avatar}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    className="size-16 shrink-0 rounded-full object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">
                    <Link href={`/${business.slug}/perfil`} className="hover:text-primary">
                      {business.name}
                    </Link>
                  </h2>
                  {business.neighborhood ? (
                    <p className="text-sm text-muted-foreground">{business.neighborhood}</p>
                  ) : null}
                  {business.bio ? (
                    <p className="mt-2 line-clamp-2 text-pretty text-muted-foreground">
                      {business.bio}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm">
                    {business.services
                      .slice(0, 4)
                      .map((s) => s.name)
                      .join(" · ")}
                    {business.services.length > 4 ? " · …" : ""}
                  </p>
                  {range ? (
                    <p className="mt-1 text-sm font-medium">
                      {range.min === range.max
                        ? formatBRL(range.min)
                        : `De ${formatBRL(range.min)} a ${formatBRL(range.max)}`}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/${business.slug}`}
                      className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      Agendar
                    </Link>
                    <Link
                      href={`/${business.slug}/perfil`}
                      className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium hover:border-primary"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-8">
          <Link href={hub} className="font-medium text-primary underline-offset-4 hover:underline">
            Agendamento online para {niche.name.toLowerCase()}
          </Link>
        </p>
        <GuideCta
          title={`Atende ${niche.name.toLowerCase()} em ${listing.city}? Crie seu link de agendamento.`}
          niche={niche.route}
          label={`Criar meu link de ${niche.name.toLowerCase()}`}
        />
      </main>
      <SiteFooter />
      <LazyCreationChat photos={isStorageConfigured()} />
      <SiteTracker template="diretorio" niche={brand.key} />
      <JsonLd
        nodes={[
          organizationNode(),
          itemListNode(
            listing.businesses.map((b) => ({
              name: b.name,
              url: canonicalUrl(brand, `/${b.slug}/perfil`),
            })),
          ),
        ]}
      />
    </div>
  );
}
