import { AtSign, ExternalLink, MapPin, Star } from "lucide-react";
import type { ReactNode } from "react";

import { PLATFORM } from "@/brands";
import { MeetChatBadge } from "@/components/chat/meetchat-badge";
import { brandUrl } from "@/brands/urls";
import { formatBRL, formatDuration } from "@/lib/money";
import { instagramHandle } from "@/lib/social";
import { publicUrl } from "@/lib/storage/r2";

import type { LoadedBusinessPage } from "./load";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function mapsUrl(parts: (string | null | undefined)[]) {
  const query = parts.filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function Card({ title, id, children }: { title?: string; id?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="bg-card px-5 py-4">
      {title ? (
        <h2 id={id} className="mb-3 text-sm font-medium text-muted-foreground">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Business profile in the style of a messaging app's contact info: big photo, name, quick
 * actions, then about, services and prices, photos, reviews, address and links.
 * Shown inside the chat (tap on the photo) and alone at /<slug>/perfil.
 */
export function ProfileView({
  loaded,
  chatAction,
}: {
  loaded: LoadedBusinessPage;
  /** "Agendar" / "Pedir horário": back to the conversation. */
  chatAction: ReactNode;
}) {
  const { data, brand } = loaded;
  const { business, page } = data;
  const avatar = publicUrl(page?.avatar_key);
  const cover = publicUrl(page?.cover_key);
  const showPrices = page?.show_prices ?? true;
  const servicesById = new Map(data.services.map((s) => [s.id, s]));
  const terms = brand.terms;
  const place = [page?.neighborhood, page?.city].filter(Boolean).join(", ");
  const hasAddress = Boolean(page?.address || page?.city);

  return (
    <div className="flex flex-col gap-2 bg-muted pb-6">
      <header
        className={`flex flex-col items-center gap-2 bg-card px-5 pb-5 text-center ${cover ? "" : "pt-6"}`}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- R2 public URL
          <img
            src={cover}
            alt=""
            width={800}
            height={300}
            className="-mx-5 aspect-[3/1] w-[calc(100%+2.5rem)] max-w-none object-cover"
          />
        ) : null}
        <div
          className={`size-32 overflow-hidden rounded-full bg-muted ${cover ? "-mt-16 ring-4 ring-card" : ""}`}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- R2 public URL
            <img
              src={avatar}
              alt={business.name}
              width={128}
              height={128}
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center font-heading text-5xl font-bold text-primary">
              {business.name.charAt(0)}
            </span>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-semibold">{business.name}</h1>
        {place ? <p className="text-sm text-muted-foreground">{place}</p> : null}
        {data.rating.count > 0 ? (
          <a href="#avaliacoes" className="flex items-center gap-1 text-sm">
            <Star className="size-4 fill-primary text-primary" aria-hidden />
            <span className="font-semibold">{data.rating.average?.toLocaleString("pt-BR")}</span>
            <span className="text-muted-foreground">({data.rating.count} avaliações)</span>
          </a>
        ) : null}

        <div className="mt-3 flex w-full max-w-sm justify-center gap-2">
          {chatAction}
          {hasAddress ? (
            <a
              href={mapsUrl([page?.address, page?.neighborhood, page?.city])}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium text-primary hover:bg-muted"
            >
              <MapPin className="size-5" aria-hidden /> Como chegar
            </a>
          ) : null}
          {page?.instagram_url ? (
            <a
              href={page.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              data-track="click_instagram"
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium text-primary hover:bg-muted"
            >
              <AtSign className="size-5" aria-hidden /> Instagram
            </a>
          ) : null}
        </div>
      </header>

      {page?.bio ? (
        <Card title="Sobre">
          <p className="whitespace-pre-line">{page.bio}</p>
        </Card>
      ) : null}

      {data.services.length > 0 ? (
        <Card title={`${capitalize(terms.service.plural)} e preços`} id="servicos">
          <ul className="-my-2 divide-y">
            {data.combos.map((combo) => {
              const parts = combo.service_ids.map((id) => servicesById.get(id)).filter(Boolean);
              const duration = parts.reduce((sum, s) => sum + s!.duration_minutes, 0);
              return (
                <li key={combo.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-medium">
                      {combo.name}{" "}
                      <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                        Combo
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {parts.map((s) => s!.name).join(" + ")} · {formatDuration(duration)}
                    </p>
                  </div>
                  {showPrices ? (
                    <p className="shrink-0 font-semibold">{formatBRL(combo.price_cents)}</p>
                  ) : null}
                </li>
              );
            })}
            {data.services.map((service) => (
              <li key={service.id} className="flex items-start justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(service.duration_minutes)}
                    {service.description ? ` · ${service.description}` : ""}
                  </p>
                </div>
                {showPrices ? (
                  <p className="shrink-0 font-semibold">
                    {service.price_cents > 0 ? formatBRL(service.price_cents) : "Sob consulta"}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {data.photos.length > 0 ? (
        <Card title={`Fotos · ${data.photos.length}`} id="fotos">
          <ul className="grid grid-cols-3 gap-1">
            {data.photos.map((photo, index) => (
              <li key={photo.id} className="overflow-hidden rounded-md bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- R2 public URL, lazy loaded */}
                <img
                  src={publicUrl(photo.key) ?? ""}
                  alt={`Trabalho ${index + 1} de ${business.name}`}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square size-full object-cover"
                />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {data.reviews.length > 0 ? (
        <section id="avaliacoes" aria-labelledby="avaliacoes-titulo" className="bg-card px-5 py-4">
          <h2 id="avaliacoes-titulo" className="mb-1 text-sm font-medium text-muted-foreground">
            Avaliações
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Nota {data.rating.average?.toLocaleString("pt-BR")} de 5 · {data.rating.count}{" "}
            avaliações de {terms.customer.plural} verificadas
          </p>
          <ul className="flex flex-col gap-3">
            {data.reviews.map((review) => (
              <li key={review.id} className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {review.first_name || capitalize(terms.customer.singular)}
                  </p>
                  <p aria-label={`${review.rating} de 5 estrelas`} className="text-primary">
                    {"★".repeat(review.rating)}
                    <span className="text-muted-foreground">{"★".repeat(5 - review.rating)}</span>
                  </p>
                </div>
                {review.comment ? <p className="mt-1">{review.comment}</p> : null}
                {review.reply ? (
                  <p className="mt-2 rounded-md bg-card p-2 text-sm">
                    <span className="font-medium">Resposta: </span>
                    {review.reply}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasAddress ? (
        <Card title="Endereço">
          <a
            href={mapsUrl([page?.address, page?.neighborhood, page?.city])}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3"
          >
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <span>
              {[page?.address, page?.neighborhood, page?.city].filter(Boolean).join(" · ")}
              <span className="block text-sm text-primary">Abrir no mapa</span>
            </span>
          </a>
        </Card>
      ) : null}

      {page?.instagram_url || data.links.length > 0 ? (
        <Card title="Links">
          <ul className="-my-2 divide-y">
            {page?.instagram_url ? (
              <li>
                <a
                  href={page.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="click_instagram"
                  className="flex items-center gap-3 py-2.5"
                >
                  <AtSign className="size-5 text-primary" aria-hidden />
                  {instagramHandle(page.instagram_url) ?? "Instagram"}
                </a>
              </li>
            ) : null}
            {data.links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="click_link"
                  className="flex items-center gap-3 py-2.5"
                >
                  <ExternalLink className="size-5 text-primary" aria-hidden />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {loaded.features.removeBranding ? null : (
        <div className="flex justify-center pt-2">
          <MeetChatBadge href={brandUrl(brand, "/")} logo={PLATFORM.logo} />
        </div>
      )}
    </div>
  );
}
