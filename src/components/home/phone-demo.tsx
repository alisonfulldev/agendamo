"use client";

import { Bell } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

interface DemoExample {
  business: string;
  customer: string;
  service: string;
  times: readonly string[];
}

const STEP_MS = 1100;
const HOLD_MS = 2600;
/** Stages: 0 greeting, 1 service, 2 ask day, 3 day, 4 times, 5 time, 6 confirmed, 7 notification. */
const LAST_STAGE = 7;

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** "Terça-feira, 7 de outubro" for tomorrow (the demo always books from today on). */
function tomorrowLabel(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Phone on the home page: a booking played in a loop (one niche example after another), ending on
 * the owner's "Novo agendamento" notification. Still and complete with prefers-reduced-motion.
 */
export function PhoneDemo({ examples }: { examples: readonly DemoExample[] }) {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const [stage, setStage] = useState(0);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(
      () => {
        if (stage < LAST_STAGE) setStage(stage + 1);
        else {
          setStage(0);
          setIndex((i) => (i + 1) % examples.length);
        }
      },
      stage === LAST_STAGE ? HOLD_MS : STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [stage, reduced, examples.length]);

  const shown = reduced ? LAST_STAGE : stage;
  const example = examples[reduced ? 0 : index]!;
  const time = example.times[1]!;
  const day = tomorrowLabel();

  return (
    <div
      className="relative mx-auto w-[300px] rounded-[2.6rem] bg-foreground p-2.5 shadow-2xl"
      aria-label={`Exemplo: ${example.customer} agenda ${example.service} em ${example.business}`}
      role="img"
    >
      <div className="flex h-[560px] flex-col overflow-hidden rounded-[2rem] bg-background">
        <div className="flex items-center gap-3 bg-primary px-4 pt-6 pb-3 text-primary-foreground">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/20 font-semibold">
            {example.business.charAt(0)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{example.business}</span>
            <span className="block text-xs opacity-80">Agendamento online</span>
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-end gap-2 p-3 text-sm" aria-hidden>
          <Bubble show={shown >= 0}>
            Oi! Você está na agenda de {example.business}. Qual serviço você quer agendar?
          </Bubble>
          <Bubble show={shown >= 1} me>
            {example.service}
          </Bubble>
          <Bubble show={shown >= 2}>Qual dia fica melhor pra você?</Bubble>
          <Bubble show={shown >= 3} me>
            <span suppressHydrationWarning>{day}</span>
          </Bubble>
          {shown >= 4 ? (
            <div className="flex flex-col gap-1.5">
              <Bubble show>Horários livres:</Bubble>
              <div className="flex justify-end gap-1.5">
                {example.times.map((t) => (
                  <span
                    key={t}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                      shown >= 5 && t === time
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card"
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <Bubble show={shown >= 6}>
            Prontinho, {example.customer}! Seu horário está confirmado.
          </Bubble>
        </div>
      </div>

      <div
        className={`absolute inset-x-5 top-9 flex items-start gap-3 rounded-2xl border bg-card p-3 text-card-foreground shadow-xl transition-all duration-500 ${
          shown >= LAST_STAGE ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
        aria-hidden
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Bell className="size-4" />
        </span>
        <span className="min-w-0 text-xs">
          <span className="block text-sm font-semibold">Novo agendamento</span>
          <span className="block truncate text-muted-foreground" suppressHydrationWarning>
            {example.customer} · {example.service} · {time}
          </span>
        </span>
      </div>
    </div>
  );
}

function Bubble({
  show,
  me,
  children,
}: {
  show: boolean;
  me?: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <span
        className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm motion-safe:animate-in motion-safe:fade-in ${
          me ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
        }`}
      >
        {children}
      </span>
    </div>
  );
}
