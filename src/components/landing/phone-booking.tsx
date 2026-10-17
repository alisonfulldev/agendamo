"use client";

import { Check, ChevronLeft, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { PhoneMock } from "@/content/copy/landing";

/** Example days and times (labels only: the mock never shows real dates). */
const DAYS = ["Amanhã", "Sexta", "Sábado"];
const TIMES = ["09:30", "14:00", "18:30"];
/** Stages: 0 service, 1 professional, 2 day, 3 time, 4 confirmed. */
const DONE = 4;
const STEP_MS = 1600;

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

interface Choice {
  service: number;
  professional: number;
  day: number;
  time: number;
}

function duration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h${rest}` : `${hours}h`;
}

/**
 * The booking chat as the customer sees it, as an example: plays the flow in a light loop while
 * on screen and answers to taps (tapping stops the autoplay). Fixed size (no layout shift); the
 * server renders the first step, so the phone is there without JavaScript.
 */
export function PhoneBooking({
  mock,
  label,
  messages,
}: {
  mock: PhoneMock;
  label: string;
  /** The niche's real chat texts ({business} already filled), so the mock speaks like the product. */
  messages: { greeting: string; askProfessional: string; askDate: string };
}) {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const askProfessional = mock.professionals.length > 1;
  const [stage, setStage] = useState(0);
  const [choice, setChoice] = useState<Choice>({ service: 0, professional: 0, day: 2, time: 1 });
  const [manual, setManual] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry!.isIntersecting), {
      threshold: 0.4,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Autoplay: pick the highlighted option of each step, then start over.
  useEffect(() => {
    if (reduced || manual || !visible) return;
    const timer = setTimeout(
      () => {
        if (stage >= DONE) {
          setStage(0);
          return;
        }
        setStage(stage === 0 && !askProfessional ? 2 : stage + 1);
      },
      stage >= DONE ? STEP_MS * 2.5 : STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [stage, reduced, manual, visible, askProfessional]);

  function pick(step: keyof Choice, index: number, next: number) {
    setManual(true);
    setChoice((c) => ({ ...c, [step]: index }));
    setStage(next);
  }

  const service = mock.services[choice.service]!;
  const professional = mock.professionals[choice.professional]!;
  const option = (active: boolean) =>
    `lp-press flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-left text-[15px] transition-colors ${
      active ? "border-primary bg-brand-100 font-semibold" : "bg-card hover:border-primary"
    }`;
  const bubble = "max-w-[88%] rounded-2xl rounded-tl-md bg-card px-3.5 py-2 text-[15px] shadow-sm";
  const answer = (text: string) => (
    <p className="lp-in ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-brand-200 px-3.5 py-2 text-[15px]">
      {text}
    </p>
  );

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className="lp-shadow-lg relative mx-auto h-[560px] w-[288px] shrink-0 rounded-[2.75rem] border-[9px] border-foreground bg-background sm:h-[600px] sm:w-[310px]"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[2.1rem]">
        <div className="flex items-center gap-2.5 bg-primary px-4 pt-5 pb-3 text-primary-foreground">
          <ChevronLeft className="size-5 opacity-80" aria-hidden />
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 font-semibold">
            {mock.business.charAt(0)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold">{mock.business}</span>
            <span className="block text-xs">Agenda online · exemplo</span>
          </span>
        </div>

        <div
          aria-live="polite"
          className="flex flex-1 flex-col gap-2.5 overflow-hidden bg-muted p-3"
        >
          <p className={bubble}>{messages.greeting}</p>
          {stage === 0 ? (
            <div className="flex flex-col gap-2">
              {mock.services.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  className={option(i === choice.service)}
                  onClick={() => pick("service", i, askProfessional ? 1 : 2)}
                >
                  <span>{s.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {duration(s.minutes)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            answer(service.name)
          )}
          {stage === 0 ? (
            <p className="mt-auto text-center text-xs text-muted-foreground">
              Toque num serviço para ver o resto do agendamento
            </p>
          ) : null}

          {stage >= 1 && askProfessional ? (
            <>
              <p className={`lp-in ${bubble}`}>{messages.askProfessional}</p>
              {stage === 1 ? (
                <div className="lp-in grid grid-cols-2 gap-2">
                  {mock.professionals.map((p, i) => (
                    <button
                      key={p}
                      type="button"
                      className={option(i === choice.professional)}
                      onClick={() => pick("professional", i, 2)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              ) : (
                answer(professional)
              )}
            </>
          ) : null}

          {stage >= 2 && stage < DONE ? (
            <>
              <p className={`lp-in ${bubble}`}>{messages.askDate}</p>
              <div className="lp-in flex gap-1.5">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={i === choice.day}
                    className={`lp-press min-h-11 flex-1 rounded-full border px-2 text-sm ${
                      i === choice.day
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card"
                    }`}
                    onClick={() => pick("day", i, 3)}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {stage === 3 ? (
                <div className="lp-in grid grid-cols-3 gap-1.5">
                  {TIMES.map((t, i) => (
                    <button
                      key={t}
                      type="button"
                      className={`${option(i === choice.time)} justify-center px-1 tabular-nums`}
                      onClick={() => pick("time", i, DONE)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}

          {stage >= DONE ? (
            <>
              {answer(`${DAYS[choice.day]}, ${TIMES[choice.time]}`)}
              <div className="lp-in mt-1 rounded-2xl border border-success/30 bg-card p-3.5">
                <p className="flex items-center gap-2 font-semibold text-success">
                  <span className="flex size-6 items-center justify-center rounded-full bg-success text-background">
                    <Check className="size-4" aria-hidden />
                  </span>
                  Horário confirmado
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {service.name}
                  {askProfessional ? ` com ${professional}` : ""}, {DAYS[choice.day].toLowerCase()}{" "}
                  às <span className="tabular-nums">{TIMES[choice.time]}</span>.
                </p>
              </div>
              {manual || reduced ? (
                <button
                  type="button"
                  onClick={() => {
                    setStage(0);
                    setManual(false);
                  }}
                  className="lp-press mx-auto mt-1 flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <Play className="size-3.5" aria-hidden /> Ver de novo
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
