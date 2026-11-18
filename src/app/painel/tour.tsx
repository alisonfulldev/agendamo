"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePanelWords } from "@/components/panel/use-panel-words";
import { ACTIVATION_PAY_STEP, TOUR_STEPS, TOUR_TEXT, type TourStep } from "@/content/tour";

import { finishTourAction, tourPendingAction } from "./tour-actions";

const STEP_KEY = "lv_tour_step";
const DIM = "color-mix(in oklab, var(--foreground) 65%, transparent)";
/** Space around the lit element. */
const PAD = 6;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function readStep(): number | null {
  try {
    const raw = sessionStorage.getItem(STEP_KEY);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

function writeStep(index: number | null) {
  try {
    if (index === null) sessionStorage.removeItem(STEP_KEY);
    else sessionStorage.setItem(STEP_KEY, String(index));
  } catch {
    // Storage blocked: the tutorial still runs, it just does not survive a reload.
  }
}

/** First visible element with data-tour=`id` (the phone and the computer menus both have one). */
function findTarget(id: string): HTMLElement | null {
  for (const element of document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return element;
  }
  return null;
}

/** A plan offered on the last step of the ad page's tutorial. */
export interface TourPlan {
  tier: "complete" | "site";
  name: string;
  price: string;
}

/**
 * First-access tutorial (src/content/tour.ts). Starts by itself for accounts created in the
 * sign-up conversation, or with ?tour=1 ("Ver tutorial" on Início). The step survives page
 * changes (the panel layout stays mounted) and reloads (sessionStorage).
 *
 * `plans`: account from the Meta ad page (/ativar) not paid yet. The tutorial is mandatory (no
 * "Pular tutorial", only forward) and its last step is the payment: choosing a plan closes the
 * panel and opens the Pix on /ativar.
 */
export function PanelTour({ plans = null }: { plans?: TourPlan[] | null }) {
  const mandatory = plans !== null;
  const steps: TourStep[] = mandatory
    ? [...TOUR_STEPS.filter((s) => s.id !== "done"), ACTIVATION_PAY_STEP]
    : TOUR_STEPS;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [index, setIndex] = useState<number | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  const { t } = usePanelWords();
  const step = index === null ? null : steps[index];

  const current = useRef<number | null>(null);
  const go = useCallback((next: number | null) => {
    writeStep(next);
    // Same step again (e.g. "Ver tutorial" while on it): keep its lit element.
    if (current.current === next) return;
    current.current = next;
    setTarget(null);
    setRect(null);
    setIndex(next);
  }, []);

  const finish = useCallback(() => {
    go(null);
    void finishTourAction().catch(() => undefined);
  }, [go]);

  const advance = useCallback(() => {
    if (index === null) return;
    if (index + 1 >= steps.length) finish();
    else go(index + 1);
  }, [index, finish, go, steps.length]);

  const replay = searchParams.get("tour") === "1";

  // "Ver tutorial" (?tour=1): from the first step; the address is cleaned right away.
  useEffect(() => {
    if (!replay) return;
    router.replace(pathname);
    queueMicrotask(() => go(0));
  }, [replay, router, pathname, go]);

  // Once per panel load: a tutorial in progress (reload) or a new account.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tour") === "1") return;
    let cancelled = false;
    const saved = readStep();
    if (saved !== null && saved < steps.length) {
      queueMicrotask(() => go(saved));
      return;
    }
    tourPendingAction()
      .then((pending) => {
        if (pending && !cancelled) go(0);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per panel load
  }, [go]);

  // On the step's page (it waits there, never redirects), find its element, or skip the step when
  // this screen has none.
  useEffect(() => {
    if (!step || !step.target) return;
    if (step.path && pathname !== step.path) return;
    const started = Date.now();
    const timer = setInterval(() => {
      const element = findTarget(step.target!);
      if (element) {
        clearInterval(timer);
        element.scrollIntoView({ block: "center", behavior: "smooth" });
        setTarget(element);
        // A page that is still loading gets more time than an element missing from this screen.
      } else if (Date.now() - started > (step.path ? 4000 : 1200)) {
        clearInterval(timer);
        advance();
      }
    }, 150);
    return () => clearInterval(timer);
  }, [step, pathname, advance]);

  // Follow the element (scroll, resize, menus opening) and advance when it is tapped.
  useEffect(() => {
    if (!target || !step) return;
    let frame = 0;
    const track = () => {
      const r = target.getBoundingClientRect();
      setRect((previous) =>
        previous &&
        previous.top === r.top &&
        previous.left === r.left &&
        previous.width === r.width &&
        previous.height === r.height
          ? previous
          : { top: r.top, left: r.left, width: r.width, height: r.height },
      );
      frame = requestAnimationFrame(track);
    };
    frame = requestAnimationFrame(track);
    const onTap = () => advance();
    if (step.advance === "tap") target.addEventListener("click", onTap);
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener("click", onTap);
    };
  }, [target, step, advance]);

  if (!step || index === null) return null;
  // Waiting for the step's page or element.
  if ((step.path && pathname !== step.path) || (step.target && !rect)) return null;

  const counter = TOUR_TEXT.step
    .replace("{n}", String(index + 1))
    .replace("{total}", String(steps.length));
  const last = index + 1 >= steps.length;

  /** Last step of the ad page's tutorial: the panel closes and the Pix opens on /ativar. */
  async function pay(tier: TourPlan["tier"]) {
    writeStep(null);
    await finishTourAction().catch(() => undefined);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/ativar?plano=${tier}`);
  }

  const balloon = (style?: React.CSSProperties) => (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      style={style}
      className="pointer-events-auto absolute inset-x-4 mx-auto max-w-sm rounded-2xl bg-card p-5 text-card-foreground shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
    >
      <p className="text-xs font-semibold text-primary">{counter}</p>
      <p id="tour-title" className="mt-1 text-lg font-semibold">
        {t(step.title)}
      </p>
      <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{t(step.text)}</p>
      {step.id === ACTIVATION_PAY_STEP.id && plans ? (
        <div className="mt-4 flex flex-col gap-2">
          {plans.map((plan, i) => (
            <Button
              key={plan.tier}
              type="button"
              size="lg"
              variant={i === 0 ? "default" : "outline"}
              className="h-auto justify-between py-3"
              onClick={() => void pay(plan.tier)}
            >
              <span>{plan.name}</span>
              <span className="font-bold">{plan.price}</span>
            </Button>
          ))}
          <p className="text-center text-xs text-muted-foreground">{TOUR_TEXT.payNote}</p>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-3">
          {mandatory ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={finish}
              className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              {TOUR_TEXT.skip}
            </button>
          )}
          {step.advance === "next" ? (
            <Button type="button" onClick={advance}>
              {index === 0 ? TOUR_TEXT.start : last ? TOUR_TEXT.finish : TOUR_TEXT.next}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );

  // No element: the balloon in the middle, over the dimmed screen.
  if (!rect) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center"
        style={{ background: DIM }}
        data-testid="tour"
      >
        {balloon({ position: "relative" })}
      </div>
    );
  }

  const hole = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
  const viewport = typeof window === "undefined" ? 800 : window.innerHeight;
  // Below the element, above it, or (element taller than the screen) at the bottom of the screen.
  const BALLOON = 230;
  const placement: React.CSSProperties =
    hole.top + hole.height + 14 + BALLOON < viewport
      ? { top: Math.max(hole.top + hole.height + 14, 16) }
      : hole.top - 14 - BALLOON > 0
        ? { bottom: viewport - hole.top + 14 }
        : { bottom: 16 };
  const block = "pointer-events-auto absolute";

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" data-testid="tour">
      {/* The lit element: everything around it is dimmed and does not take taps. */}
      <div
        className="absolute rounded-xl ring-4 ring-primary motion-safe:animate-pulse"
        style={{ ...hole, boxShadow: `0 0 0 9999px ${DIM}` }}
        aria-hidden
      />
      <div className={block} style={{ top: 0, left: 0, right: 0, height: Math.max(hole.top, 0) }} />
      <div
        className={block}
        style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }}
      />
      <div
        className={block}
        style={{ top: hole.top, left: 0, width: Math.max(hole.left, 0), height: hole.height }}
      />
      <div
        className={block}
        style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }}
      />
      {balloon(placement)}
    </div>
  );
}
