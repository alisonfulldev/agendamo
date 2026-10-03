"use client";

import { useEffect } from "react";

import { getSessionId } from "@/lib/tracking/client";

function send(body: Record<string, unknown>) {
  try {
    const payload = JSON.stringify({ sessionId: getSessionId(), ...body });
    if (
      !navigator.sendBeacon?.(
        "/api/portal-events",
        new Blob([payload], { type: "application/json" }),
      )
    ) {
      void fetch("/api/portal-events", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      });
    }
  } catch {
    // never break the page
  }
}

/** One "view" with the listed businesses (appearances), plus clicks on [data-portal-slug] cards. */
export function PortalTracker({
  type,
  city,
  neighborhood,
  service,
  slugs,
}: {
  type: "search" | "view";
  city: string | null;
  neighborhood: string | null;
  service: string | null;
  slugs: string[];
}) {
  const key = slugs.join(",");
  useEffect(() => {
    send({ type, city, neighborhood, service, slugs: key ? key.split(",") : [] });
    const onClick = (event: MouseEvent) => {
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-portal-slug]");
      if (card?.dataset.portalSlug)
        send({ type: "click", city, neighborhood, service, slugs: [card.dataset.portalSlug] });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [type, city, neighborhood, service, key]);
  return null;
}
