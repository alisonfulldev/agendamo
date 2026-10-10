"use client";

import { Bell, ChevronDown, Send } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { InlineStart } from "@/components/creation/creation-chat";
import { useVisibleArea } from "@/components/creation/visible-area";
import {
  hasSavedCreation,
  isCreationOpen,
  registerInlineCreation,
  subscribeCreation,
} from "@/components/creation/creation-store";
import { HERO_CHAT_TEXT, type HeroDemo } from "@/content/hero-demo";

// The creation conversation is only loaded when it is needed (keeps the top of the page light).
const loadConversation = () =>
  import("@/components/creation/creation-chat").then((m) => m.Conversation);
const Conversation = dynamic(loadConversation, {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-muted-foreground">digitando…</p>,
});

/** Demo stages: 0 greeting, 1 service, 2 ask day, 3 day, 4 confirmed, 5 notification, 6 ask. */
const LAST = 6;
const TIMELINE_MS = [0, 700, 1500, 2500, 3400, 4200, 5000];

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Next Saturday from today: "Sábado (18/10), 10h". */
function saturdayLabel(): string {
  const date = new Date();
  date.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7 || 7));
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `Sábado (${dd}/${mm}), 10h`;
}

function Bubble({
  from,
  still = false,
  children,
}: {
  from: "system" | "user";
  /** The first balloon (from the server) shows at once, without the entrance animation. */
  still?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex ${from === "user" ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[16px] leading-snug shadow-sm ${
          still ? "" : "motion-safe:animate-in motion-safe:fade-in"
        } ${
          from === "user" ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

/**
 * The top of the home and of the niche pages: a chat that plays a short booking once (the first
 * balloon comes from the server, so it is never empty), then asks the business name and becomes
 * the creation conversation right here. On phones the card grows to almost full screen while the
 * conversation goes on; on the computer it stays in the phone frame.
 */
export function HeroChat({
  demo,
  niche,
  photos,
  logo,
}: {
  demo: HeroDemo;
  /** MeetChat logo (passed in, so the brand configs stay off the browser bundle). */
  logo: string;
  /** Niche page route (the conversation skips the "o que você faz?" question). */
  niche?: string;
  photos: boolean;
}) {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const opened = useSyncExternalStore(subscribeCreation, isCreationOpen, () => false);
  const [stage, setStage] = useState(0);
  const [started, setStarted] = useState<InlineStart | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const arrivedAt = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const area = useVisibleArea();

  const shown = reduced ? LAST : stage;

  // The demo plays once, about 5 seconds (still and complete with reduced motion).
  useEffect(() => {
    if (!arrivedAt.current) arrivedAt.current = Date.now();
    if (reduced || stage >= LAST) return;
    const timer = setTimeout(
      () => setStage(stage + 1),
      TIMELINE_MS[stage + 1]! - TIMELINE_MS[stage]!,
    );
    return () => clearTimeout(timer);
  }, [stage, reduced]);

  // Keep the newest balloon in view (inside the card only, never scrolling the page).
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [shown, reduced]);

  // Warm up the conversation code once the question is on screen.
  useEffect(() => {
    if (shown >= LAST) void loadConversation();
  }, [shown]);

  const begin = useCallback(
    (typed: string | null) => {
      setStarted({
        ask: HERO_CHAT_TEXT.ask,
        name: typed,
        niche,
        startedAt: arrivedAt.current || Date.now(),
      });
      setExpanded(true);
    },
    [niche],
  );

  // ?criar=1 / ?nome= / ?ramo= (and a conversation to resume) open right at the right question.
  useEffect(() => {
    if (opened && !started) {
      queueMicrotask(() => begin(null));
      cardRef.current?.scrollIntoView({ block: "center" });
    }
  }, [opened, started, begin]);

  // Calls to action of the rest of the page come here: scroll, skip the demo, activate the name.
  useEffect(() => {
    registerInlineCreation(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (started || hasSavedCreation()) {
        if (!started) begin(null);
        setExpanded(true);
        return;
      }
      setStage(LAST);
      setExpanded(true);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 400);
    });
    return () => registerInlineCreation(null);
  }, [started, begin]);

  const day = shown >= 3 ? saturdayLabel() : "";
  // Phones: from the first tap the chat takes the whole screen (the same conversation, just
  // bigger), so the sign-up never happens inside the small card. Computers keep the phone frame.
  const fullscreen = expanded;

  // The page behind does not scroll while the chat is full screen on a phone.
  useEffect(() => {
    if (!fullscreen || window.innerWidth >= 768) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);

  return (
    <div
      ref={cardRef}
      className="relative mx-auto h-[70svh] max-h-[640px] min-h-[420px] w-full md:h-[640px] md:w-[340px]"
    >
      <div
        className={
          fullscreen
            ? "fixed inset-x-0 top-0 z-50 flex h-dvh flex-col overflow-hidden bg-background md:static md:h-full md:rounded-[2.6rem] md:border-[10px] md:border-foreground md:shadow-2xl"
            : "flex h-full flex-col overflow-hidden rounded-3xl border bg-background shadow-xl md:rounded-[2.6rem] md:border-[10px] md:border-foreground md:shadow-2xl"
        }
        style={
          fullscreen && area
            ? { height: area.height, transform: `translateY(${area.top}px)` }
            : undefined
        }
      >
        {fullscreen ? (
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
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 font-semibold">
                {demo.business.charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">
                  {demo.business} · {demo.subtitle}
                </span>
                <span className="block text-xs opacity-85">online</span>
              </span>
            </header>
            <div className="relative flex min-h-0 flex-1 flex-col">
              {shown >= 5 ? (
                <div
                  role="status"
                  className="absolute inset-x-3 top-2 z-10 flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 text-sm font-medium text-card-foreground shadow-lg motion-safe:animate-in motion-safe:slide-in-from-top-4"
                >
                  <Bell className="size-4 shrink-0 text-primary" aria-hidden />
                  {HERO_CHAT_TEXT.notification(demo)}
                </div>
              ) : null}
              <div
                ref={logRef}
                className="relative flex flex-1 flex-col gap-2 overflow-y-auto p-4"
                role="log"
              >
                <div className={shown >= 5 ? "mt-12" : undefined} />
                <Bubble from="system" still>
                  {HERO_CHAT_TEXT.greeting.replace("{business}", demo.business)}
                </Bubble>
                {shown >= 1 ? <Bubble from="user">{demo.service}</Bubble> : null}
                {shown >= 2 ? <Bubble from="system">{HERO_CHAT_TEXT.askDay}</Bubble> : null}
                {shown >= 3 ? <Bubble from="user">{day}</Bubble> : null}
                {shown >= 4 ? <Bubble from="system">{HERO_CHAT_TEXT.confirmed}</Bubble> : null}
                {shown >= LAST ? (
                  <div className="mt-2 flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
                      <img src={logo} alt="" width={16} height={16} className="rounded" />
                      MeetChat
                    </span>
                    <Bubble from="system">{HERO_CHAT_TEXT.ask}</Bubble>
                  </div>
                ) : null}
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
              <label htmlFor="hero-name" className="sr-only">
                Nome do negócio
              </label>
              <input
                ref={inputRef}
                id="hero-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => {
                  if (hasSavedCreation()) begin(null);
                  else {
                    setStage(LAST);
                    setExpanded(true);
                  }
                }}
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
