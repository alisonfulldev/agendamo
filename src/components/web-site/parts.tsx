import { AtSign, MapPin, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

import { formatBRL } from "@/lib/money";

import type { WebItem, WebSiteData } from "./types";

/** Shared pieces of the "Site ou Loja" templates: big type, wide spacing, WhatsApp everywhere. */
export const wide = "mx-auto w-full max-w-6xl px-5 sm:px-8";
export const display = "lp-title text-balance";

export const price = (item: Pick<WebItem, "priceCents">) =>
  item.priceCents === null ? null : formatBRL(item.priceCents);

/** The main button: opens the owner's WhatsApp with the ready message. */
export function WhatsAppButton({
  href,
  children,
  className = "",
  size = "lg",
}: {
  href: string | null;
  children: ReactNode;
  className?: string;
  size?: "lg" | "xl";
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-track="click_whatsapp"
      className={`inline-flex items-center justify-center gap-2.5 rounded-full bg-[var(--lp-cta-bg)] font-semibold text-[var(--lp-cta-fg)] shadow-lg transition-transform hover:scale-[1.03] ${
        size === "xl" ? "min-h-16 px-9 text-xl" : "min-h-14 px-7 text-lg"
      } ${className}`}
    >
      <MessageCircle className={size === "xl" ? "size-6" : "size-5"} aria-hidden />
      {children}
    </a>
  );
}

/** Round WhatsApp button that follows the visitor down the page. */
export function FloatingWhatsApp({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-track="click_whatsapp"
      aria-label="Falar no WhatsApp"
      className="fixed right-5 bottom-5 z-40 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl ring-4 ring-background transition-transform hover:scale-105"
    >
      <MessageCircle className="size-8" aria-hidden />
    </a>
  );
}

/** Logo (or the initials) and the name, for the top bar. */
export function Brand({ data, light = false }: { data: WebSiteData; light?: boolean }) {
  const initials = data.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex min-w-0 items-center gap-3">
      {data.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- R2 public image
        <img
          src={data.logoUrl}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-full object-cover shadow"
        />
      ) : (
        <span
          className={`flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${light ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"}`}
        >
          {initials}
        </span>
      )}
      <span className="truncate font-heading text-xl font-bold">{data.name}</span>
    </span>
  );
}

/** Photo gallery: big tiles, two columns on the phone. */
export function Gallery({ data, title = "Nosso trabalho" }: { data: WebSiteData; title?: string }) {
  if (!data.photos.length) return null;
  return (
    <section aria-labelledby="galeria" className="py-24">
      <div className={wide}>
        <h2 id="galeria" className={`${display} text-5xl sm:text-6xl`}>
          {title}
        </h2>
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {data.photos.map((photo, i) => (
            <li key={photo.url} className="aspect-[4/5] overflow-hidden rounded-3xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- R2 public image */}
              <img
                src={photo.url}
                alt={`${data.name}: foto ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Where and how to reach the business, with the big WhatsApp button. */
export function Contact({ data, className = "" }: { data: WebSiteData; className?: string }) {
  return (
    <section aria-labelledby="contato" className={`py-24 ${className}`}>
      <div className={`${wide} flex flex-col items-center gap-8 text-center`}>
        <h2 id="contato" className={`${display} text-5xl sm:text-7xl`}>
          Vamos conversar?
        </h2>
        <p className="max-w-2xl text-xl text-pretty opacity-90 sm:text-2xl">
          {data.store
            ? "Escolha seus produtos e mande o pedido. A gente responde rapidinho no WhatsApp."
            : "Mande uma mensagem e tire suas dúvidas. A gente responde rapidinho no WhatsApp."}
        </p>
        <WhatsAppButton href={data.whatsappHref} size="xl">
          {data.texts.cta === "Ver produtos" ? "Falar no WhatsApp" : data.texts.cta}
        </WhatsAppButton>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-lg">
          {data.place ? (
            <span className="flex items-center gap-2">
              <MapPin className="size-5" aria-hidden />
              {data.place}
            </span>
          ) : null}
          {data.instagramUrl ? (
            <a
              href={data.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-track="click_instagram"
              className="flex items-center gap-2 underline underline-offset-4"
            >
              <AtSign className="size-5" aria-hidden />
              Instagram
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Bottom line with the MeetChat badge (the product grows with it). */
export function Footer({ data, badge }: { data: WebSiteData; badge: ReactNode }) {
  return (
    <footer className="border-t py-10">
      <div className={`${wide} flex flex-col items-center gap-3 text-center text-sm opacity-80`}>
        <span>
          © {new Date().getFullYear()} {data.name}
        </span>
        {badge}
      </div>
    </footer>
  );
}

/** "Site feito com MeetChat": the small line at the bottom of every "Site ou Loja" site. */
export function WebBadge({ href, logo }: { href: string; logo: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs opacity-80 transition-opacity hover:opacity-100"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
      <img src={logo} alt="" width={14} height={14} className="rounded-sm" />
      <span>
        Site feito com <span className="font-semibold">MeetChat</span>
      </span>
    </a>
  );
}
