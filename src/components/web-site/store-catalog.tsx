"use client";

import { ExternalLink, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { formatBRL } from "@/lib/money";

import type { WebItem } from "./types";

type Bag = Record<string, number>;

/** "Comprar na Shopee", "Comprar no Mercado Livre"… from where the product is sold. */
function buyLabel(url: string): string {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  if (host.includes("shopee")) return "Comprar na Shopee";
  if (host.includes("mercadolivre") || host.includes("mercadolibre"))
    return "Comprar no Mercado Livre";
  if (host.includes("amazon")) return "Comprar na Amazon";
  if (host.includes("magazineluiza") || host.includes("magalu")) return "Comprar na Magalu";
  if (host.includes("shein")) return "Comprar na Shein";
  return "Comprar";
}

/**
 * Catalog of a store ("Site ou Loja", 2026-11-07): category chips, big product cards and a bag.
 * "Enviar pedido" opens the owner's WhatsApp with the list and the total; there is no checkout,
 * nothing is saved on the server (the bag lives in this browser only).
 */
export function StoreCatalog({
  slug,
  storeName,
  phone,
  items,
  variant,
  preview = false,
}: {
  slug: string;
  storeName: string;
  phone: string | null;
  items: WebItem[];
  variant: "showcase" | "clean";
  /** The example in the sales chat (no WhatsApp yet). */
  preview?: boolean;
}) {
  const storageKey = `mc_bag_${slug}`;
  const [bag, setBag] = useState<Bag>({});
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [noPhoneNote, setNoPhoneNote] = useState(false);

  // The bag survives a reload on this phone (browser only, never sent to the server).
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Bag;
        const known = new Set(items.map((i) => i.id));
        setBag(Object.fromEntries(Object.entries(saved).filter(([id]) => known.has(id))));
      } catch {
        // Storage blocked or broken: an empty bag.
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [storageKey, items]);

  const change = (id: string, delta: number) =>
    setBag((current) => {
      const next = { ...current, [id]: Math.max(0, (current[id] ?? 0) + delta) };
      if (!next[id]) delete next[id];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Not saved: the bag still works on this page.
      }
      return next;
    });

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter((c): c is string => Boolean(c)))],
    [items],
  );
  const shown = category ? items.filter((i) => i.category === category) : items;
  const lines = items.filter((i) => bag[i.id]);
  const count = lines.reduce((sum, i) => sum + bag[i.id]!, 0);
  const total = lines.reduce((sum, i) => sum + (i.priceCents ?? 0) * bag[i.id]!, 0);
  const priced = lines.every((i) => i.priceCents !== null);

  const orderHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        [
          `Olá! Quero fazer um pedido na ${storeName}:`,
          "",
          ...lines.map(
            (i) =>
              `• ${bag[i.id]}× ${i.name}${i.priceCents !== null ? ` (${formatBRL(i.priceCents)})` : ""}`,
          ),
          "",
          priced ? `Total: ${formatBRL(total)}` : "",
        ]
          .filter((line, index, all) => line !== "" || all[index - 1] !== "")
          .join("\n")
          .trim(),
      )}`
    : null;

  const clean = variant === "clean";

  return (
    <>
      {categories.length > 1 ? (
        <div className="-mx-5 mb-10 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`min-h-12 shrink-0 rounded-full border-2 px-6 text-lg font-semibold whitespace-nowrap transition-colors ${
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary"
              }`}
            >
              {c ?? "Tudo"}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {shown.map((item) => {
          const inBag = bag[item.id] ?? 0;
          return (
            <li
              key={item.id}
              className={`flex flex-col overflow-hidden ${clean ? "" : "rounded-3xl bg-card shadow-sm"}`}
            >
              <div
                className={`relative overflow-hidden bg-muted ${clean ? "aspect-[3/4] rounded-[1.75rem]" : "aspect-square"}`}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- R2 public image
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center p-4 text-center font-heading text-2xl font-bold opacity-60">
                    {item.name}
                  </span>
                )}
              </div>
              <div className={`flex flex-1 flex-col gap-2 ${clean ? "pt-4" : "p-4 sm:p-5"}`}>
                <h3 className="font-heading text-lg leading-snug font-bold sm:text-2xl">
                  {item.name}
                </h3>
                {item.description ? (
                  <p className="line-clamp-3 text-sm opacity-80 sm:text-base">{item.description}</p>
                ) : null}
                <div className="mt-auto flex flex-col gap-3 pt-2">
                  {item.priceCents !== null ? (
                    <span className="text-xl font-bold text-primary sm:text-2xl">
                      {formatBRL(item.priceCents)}
                    </span>
                  ) : null}
                  {item.linkUrl ? (
                    // Sold elsewhere (Shopee, Mercado Livre…): straight there, not the bag.
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-track="click_link"
                      className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-4 text-base font-semibold text-primary-foreground sm:text-lg"
                    >
                      <ExternalLink className="size-5" aria-hidden />
                      {buyLabel(item.linkUrl)}
                    </a>
                  ) : inBag ? (
                    <span className="flex min-h-12 items-center justify-between rounded-full border-2 border-primary px-1">
                      <button
                        type="button"
                        onClick={() => change(item.id, -1)}
                        aria-label={`Tirar um ${item.name}`}
                        className="flex size-10 items-center justify-center rounded-full hover:bg-muted"
                      >
                        <Minus className="size-5" />
                      </button>
                      <span className="text-lg font-bold tabular-nums">{inBag}</span>
                      <button
                        type="button"
                        onClick={() => change(item.id, 1)}
                        aria-label={`Mais um ${item.name}`}
                        className="flex size-10 items-center justify-center rounded-full hover:bg-muted"
                      >
                        <Plus className="size-5" />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => change(item.id, 1)}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-4 text-base font-semibold text-primary-foreground sm:text-lg"
                    >
                      <Plus className="size-5" aria-hidden />
                      Adicionar
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {count > 0 ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex min-h-16 max-w-xl items-center justify-between gap-3 rounded-full bg-primary px-6 text-lg font-semibold text-primary-foreground shadow-2xl"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="size-6" aria-hidden />
            Sacolinha ({count})
          </span>
          <span>{priced ? formatBRL(total) : "Ver pedido"}</span>
        </button>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklch,var(--foreground)_45%,transparent)] sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sacolinha"
            className="lp-plain flex max-h-[88svh] w-full max-w-lg flex-col rounded-t-[2rem] bg-background p-6 shadow-2xl sm:rounded-[2rem]"
          >
            <div className="flex items-center justify-between">
              <h2 id="sacolinha" className="font-heading text-3xl font-bold">
                Sua sacolinha
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="flex size-11 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="size-6" />
              </button>
            </div>
            <ul className="mt-5 flex flex-col divide-y overflow-y-auto">
              {lines.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-4">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-semibold">{item.name}</span>
                    {item.priceCents !== null ? (
                      <span className="text-muted-foreground">
                        {formatBRL(item.priceCents * bag[item.id]!)}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => change(item.id, -1)}
                      aria-label={`Tirar um ${item.name}`}
                      className="flex size-10 items-center justify-center rounded-full border"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center text-lg font-bold tabular-nums">
                      {bag[item.id]}
                    </span>
                    <button
                      type="button"
                      onClick={() => change(item.id, 1)}
                      aria-label={`Mais um ${item.name}`}
                      className="flex size-10 items-center justify-center rounded-full border"
                    >
                      <Plus className="size-4" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            {priced && lines.length ? (
              <p className="mt-4 flex items-center justify-between border-t pt-4 text-xl font-bold">
                <span>Total</span>
                <span>{formatBRL(total)}</span>
              </p>
            ) : null}
            {orderHref && lines.length ? (
              <a
                href={orderHref}
                target="_blank"
                rel="noopener noreferrer"
                data-track="click_whatsapp"
                className="mt-5 flex min-h-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground"
              >
                Enviar pedido no WhatsApp
              </a>
            ) : lines.length ? (
              // No WhatsApp yet (the preview in the sales chat): the button explains what it does.
              <>
                <button
                  type="button"
                  onClick={() => setNoPhoneNote(true)}
                  className="mt-5 flex min-h-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground"
                >
                  Enviar pedido no WhatsApp
                </button>
                {noPhoneNote ? (
                  <p role="status" className="mt-3 text-center font-medium">
                    {preview
                      ? "Na sua loja, este botão manda o pedido com a lista e o total para o seu WhatsApp."
                      : "Esta loja ainda não informou o WhatsApp. Tente mais tarde."}
                  </p>
                ) : null}
              </>
            ) : null}
            <p className="mt-3 text-center text-sm text-muted-foreground">
              O pagamento e a entrega você combina direto com a loja.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
