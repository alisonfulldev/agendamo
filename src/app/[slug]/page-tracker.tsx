"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { track } from "@/lib/tracking/client";
import type { PageEventType } from "@/lib/tracking/events";

const NOTICE_KEY = "lv_cookie_notice";

/** One view per page load, clicks on [data-track] elements, and the cookie notice. */
export function PageTracker({
  businessId,
  noticePosition = "bottom",
}: {
  businessId: string;
  /** "top" on the chat, so the notice never covers the message bar. */
  noticePosition?: "top" | "bottom";
}) {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    track(businessId, "view");
    const onClick = (event: MouseEvent) => {
      const element = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      const type = element?.dataset.track as PageEventType | undefined;
      if (type) track(businessId, type);
    };
    document.addEventListener("click", onClick);
    let dismissed = true;
    try {
      dismissed = localStorage.getItem(NOTICE_KEY) === "1";
    } catch {
      // Storage blocked: do not insist.
    }
    const timer = dismissed ? undefined : setTimeout(() => setShowNotice(true), 0);
    return () => {
      document.removeEventListener("click", onClick);
      if (timer) clearTimeout(timer);
    };
  }, [businessId]);

  if (!showNotice) return null;
  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className={`fixed inset-x-3 ${noticePosition === "top" ? "top-16" : "bottom-3"} z-40 mx-auto flex max-w-xl items-center gap-3 rounded-xl border bg-card p-3 text-sm shadow-lg`}
    >
      <p className="flex-1 text-muted-foreground">
        Usamos um cookie anônimo só para contar visitas. Nenhum dado pessoal é guardado.
      </p>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          try {
            localStorage.setItem(NOTICE_KEY, "1");
          } catch {
            // ignore
          }
          setShowNotice(false);
        }}
      >
        Entendi
      </Button>
    </div>
  );
}
