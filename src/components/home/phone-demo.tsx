"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { HERO_CHAT_TEXT, type HeroDemo } from "@/content/hero-demo";

/** Stages: 0 greeting (from the server), 1 service, 2 ask day + chips, 3 day, 4 confirmed, 5 notification. */
const LAST = 5;
const TIMELINE_MS = [0, 900, 1900, 3200, 4400, 5800];

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** The next days by name (no dates), always with Saturday: "Sexta", "Sábado", "Segunda"… */
function dayChips(): string[] {
  const names = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const today = new Date().getDay();
  const next = [1, 2, 3].map((i) => names[(today + i) % 7]!);
  return next.includes("Sábado") ? next : [...next.slice(0, 2), "Sábado"];
}

function Bubble({
  from,
  still = false,
  children,
}: {
  from: "business" | "customer";
  still?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex ${from === "customer" ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm ${
          still
            ? ""
            : "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1"
        } ${from === "customer" ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"}`}
      >
        {children}
      </p>
    </div>
  );
}

/**
 * Phone mockup with a short booking played once (about 6 s): service, day, confirmation and, only
 * then, the owner's notification sliding over the top like a system notification. The first
 * balloon comes from the server (never empty); still and complete with reduced motion; the size
 * is fixed, so nothing jumps when it plays.
 */
export function PhoneDemo({ demo, logo }: { demo: HeroDemo; logo: string }) {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const [stage, setStage] = useState(0);
  const [chips, setChips] = useState<string[]>([]);
  const shown = reduced ? LAST : stage;

  useEffect(() => {
    queueMicrotask(() => setChips(dayChips()));
  }, []);

  useEffect(() => {
    if (reduced || stage >= LAST) return;
    const timer = setTimeout(
      () => setStage(stage + 1),
      TIMELINE_MS[stage + 1]! - TIMELINE_MS[stage]!,
    );
    return () => clearTimeout(timer);
  }, [stage, reduced]);

  return (
    <div
      role="group"
      aria-label={`Exemplo: um cliente agenda ${demo.service} em ${demo.business} e o profissional recebe o aviso`}
      className="relative mx-auto h-[540px] w-[280px] shrink-0 rounded-[2.6rem] border-[10px] border-foreground bg-background shadow-xl md:h-[600px] md:w-[310px]"
    >
      {shown >= LAST ? (
        <div className="absolute inset-x-2 top-2 z-10 flex items-start gap-2 rounded-2xl bg-card/95 px-3 py-2.5 text-left text-card-foreground shadow-lg backdrop-blur motion-safe:animate-in motion-safe:slide-in-from-top-6 motion-safe:fade-in">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
          <img src={logo} alt="" width={22} height={22} className="mt-0.5 rounded-md" />
          <p className="text-[13px] leading-snug">
            <span className="block font-semibold">MeetChat</span>
            {HERO_CHAT_TEXT.notification(demo)}
          </p>
        </div>
      ) : null}
      <div className="flex h-full flex-col overflow-hidden rounded-[2rem]">
        <div className="flex items-center gap-3 bg-primary px-4 pt-6 pb-3 text-primary-foreground">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 font-semibold">
            {demo.business.charAt(0)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{demo.business}</span>
            <span className="block text-xs opacity-85">{HERO_CHAT_TEXT.headerNote}</span>
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-start gap-2 bg-muted/40 p-3 pt-5">
          <Bubble from="business" still>
            {HERO_CHAT_TEXT.greeting}
          </Bubble>
          {shown >= 1 ? <Bubble from="customer">{demo.service}</Bubble> : null}
          {shown >= 2 ? (
            <>
              <Bubble from="business">{HERO_CHAT_TEXT.askDay}</Bubble>
              <div className="flex flex-wrap gap-1.5 pl-1">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className={`rounded-full border px-3 py-1 text-[13px] ${
                      chip === "Sábado" && shown >= 3
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "bg-card"
                    }`}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </>
          ) : null}
          {shown >= 3 ? <Bubble from="customer">{HERO_CHAT_TEXT.answerDay}</Bubble> : null}
          {shown >= 4 ? <Bubble from="business">{HERO_CHAT_TEXT.confirmed(demo)}</Bubble> : null}
          <div className="flex h-7 items-center justify-center">
            {shown >= LAST && !reduced ? (
              <button
                type="button"
                onClick={() => setStage(0)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" aria-hidden /> {HERO_CHAT_TEXT.replay}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
