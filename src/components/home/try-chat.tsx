"use client";

import { ChevronDown, Send } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import type { InlineStart } from "@/components/creation/creation-chat";
import { hasSavedCreation } from "@/components/creation/creation-store";
import { useVisibleArea } from "@/components/creation/visible-area";
import { HERO_CHAT_TEXT } from "@/content/hero-demo";

// The creation conversation is loaded only when this section gets close (keeps the page light).
const loadConversation = () =>
  import("@/components/creation/creation-chat").then((m) => m.Conversation);
const Conversation = dynamic(loadConversation, {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-muted-foreground">digitando…</p>,
});

/**
 * "Veja como fica o seu link": the creation conversation embedded in the page (a card on phones,
 * a phone frame on computers), starting with the business name. On phones, from the first tap
 * it takes the whole screen (with "Recolher"), so the sign-up never happens in the small card.
 */
export function TryChat({
  ask,
  niche,
  photos,
  logo,
}: {
  ask: string;
  /** Niche page route (the conversation skips the "o que você faz?" question). */
  niche?: string;
  photos: boolean;
  logo: string;
}) {
  const [started, setStarted] = useState<InlineStart | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const arrivedAt = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const area = useVisibleArea();

  // Warm up the conversation code when the section gets close.
  useEffect(() => {
    arrivedAt.current = Date.now();
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void loadConversation();
          observer.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const begin = useCallback(
    (typed: string | null) => {
      setStarted({ ask, name: typed, niche, startedAt: arrivedAt.current || Date.now() });
      setExpanded(true);
    },
    [ask, niche],
  );

  // Phones: full screen while the conversation goes on (the page behind does not scroll).
  useEffect(() => {
    if (!expanded || window.innerWidth >= 768) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [expanded]);

  return (
    <div
      ref={cardRef}
      className="relative mx-auto h-[560px] w-full max-w-md md:h-[640px] md:w-[340px]"
    >
      <div
        className={
          expanded
            ? "fixed inset-x-0 top-0 z-50 flex h-dvh flex-col overflow-hidden bg-background md:static md:h-full md:rounded-[2.6rem] md:border-[10px] md:border-foreground md:shadow-2xl"
            : "flex h-full flex-col overflow-hidden rounded-3xl border bg-background shadow-xl md:rounded-[2.6rem] md:border-[10px] md:border-foreground md:shadow-2xl"
        }
        style={
          expanded && area
            ? { height: area.height, transform: `translateY(${area.top}px)` }
            : undefined
        }
      >
        {expanded ? (
          <button
            type="button"
            onClick={() => {
              inputRef.current?.blur();
              setExpanded(false);
            }}
            className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium shadow md:hidden"
          >
            <ChevronDown className="size-4" aria-hidden /> {HERO_CHAT_TEXT.collapse}
          </button>
        ) : null}
        {started ? (
          <Conversation photos={photos} inline={started} />
        ) : (
          <>
            <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground md:pt-5">
              {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
              <img src={logo} alt="" width={40} height={40} className="size-10 rounded-xl" />
              <span className="min-w-0">
                <span className="block font-semibold">MeetChat</span>
                <span className="block text-xs opacity-85">Monte seu link em 1 minuto</span>
              </span>
            </header>
            <div className="flex flex-1 flex-col justify-end gap-2 bg-muted/40 p-4">
              <div className="flex justify-start">
                <p className="max-w-[85%] rounded-2xl bg-card px-4 py-2.5 text-[16px] leading-snug text-card-foreground shadow-sm">
                  {ask}
                </p>
              </div>
            </div>
            <form
              className="flex items-center gap-2 border-t bg-card p-2"
              onSubmit={(e) => {
                e.preventDefault();
                const typed = name.trim();
                if (typed.length >= 2) begin(typed.slice(0, 120));
              }}
            >
              <label htmlFor="try-name" className="sr-only">
                Nome do negócio
              </label>
              <input
                ref={inputRef}
                id="try-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => (hasSavedCreation() ? begin(null) : setExpanded(true))}
                placeholder={HERO_CHAT_TEXT.placeholder}
                autoComplete="organization"
                maxLength={120}
                className="h-11 min-w-0 flex-1 rounded-full border bg-background px-4 text-[16px] outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <button
                type="submit"
                aria-label={HERO_CHAT_TEXT.send}
                disabled={name.trim().length < 2}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Send className="size-5" aria-hidden />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
