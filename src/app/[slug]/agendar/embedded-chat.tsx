"use client";

import { useEffect, useRef } from "react";

import { BookingChat } from "../booking-chat";

/** Chat page shown inside the external-site modal: reports its height and asks the parent to close. */
export function EmbeddedChat({
  slug,
  businessId,
  businessName,
  avatarUrl,
  embedded,
}: {
  slug: string;
  businessId: string;
  businessName: string;
  avatarUrl: string | null;
  embedded: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Escape inside the iframe never reaches the host page: forward it as a close request.
  useEffect(() => {
    if (!embedded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") window.parent.postMessage({ type: "lively:close" }, "*");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [embedded]);

  useEffect(() => {
    if (!embedded || !ref.current) return;
    const observer = new ResizeObserver(() => {
      window.parent.postMessage(
        { type: "lively:height", height: document.documentElement.scrollHeight },
        "*",
      );
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [embedded]);

  return (
    <div ref={ref} className="mx-auto flex h-[100dvh] w-full max-w-xl flex-col">
      <BookingChat
        slug={slug}
        businessId={businessId}
        businessName={businessName}
        avatarUrl={avatarUrl}
        onClose={
          embedded ? () => window.parent.postMessage({ type: "lively:close" }, "*") : undefined
        }
      />
    </div>
  );
}
