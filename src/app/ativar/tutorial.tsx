"use client";

import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Mail,
  Pause,
  Play,
  RotateCcw,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { getNiche, type BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { trackMeta } from "@/components/google-tag";
import { ACTIVATION } from "@/content/activation";
import { EXAMPLE_NAMES } from "@/content/site-examples";
import { formatDuration } from "@/lib/money";

const T = ACTIVATION.tutorial;
/** Time on each step before moving on by itself. */
const STEP_MS = 5200;
const TICK_MS = 100;
const TIME = "14:30";

const fill = (template: string, vars: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");

/** Same believable price as the example sites (R$ 5 steps from the duration). */
const priceOf = (minutes: number) => Math.max(40, Math.round((minutes * 1.6) / 5) * 5);

/** Fades an element in after `delay` ms (shown at once with reduced motion). */
function appear(
  delay: number,
  from: "bottom" | "top" = "bottom",
): {
  className: string;
  style: CSSProperties;
} {
  return {
    className: `motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 ${from === "top" ? "motion-safe:slide-in-from-top-6" : "motion-safe:slide-in-from-bottom-2"}`,
    style: { animationDelay: `${delay}ms`, animationFillMode: "both" },
  };
}

interface Example {
  niche: BrandConfig;
  business: string;
  services: { name: string; minutes: number; price: number }[];
  chosen: { name: string; minutes: number; price: number };
}

function exampleOf(nicheKey: string): Example {
  const niche = getNiche(nicheKey);
  const services = niche.suggestedServices.slice(0, 4).map((s) => ({
    name: s.name,
    minutes: s.durationMinutes,
    price: priceOf(s.durationMinutes),
  }));
  return {
    niche,
    // The general ad (no ?area=) gets a neutral example name, not "Seu negócio".
    business: EXAMPLE_NAMES[niche.key] ?? "Espaço Aurora",
    services,
    chosen: services[1] ?? services[0]!,
  };
}

/**
 * Animated tutorial of the ad page: a customer booking on the chat link, then what the owner gets
 * (notice, agenda, reminder, customers and revenue), in the colors and services of the ad's
 * niche. Moves on by itself (pause, back and next by hand); the last step sends ViewContent.
 */
export function Tutorial({ nicheKey }: { nicheKey: string }) {
  const example = exampleOf(nicheKey);
  const total = T.steps.length;
  const [{ step, elapsed, ended }, setProgress] = useState({ step: 0, elapsed: 0, ended: false });
  const [playing, setPlaying] = useState(true);
  const sent = useRef(false);

  // One clock: each tick moves the bar, and a full bar moves to the next step (or ends).
  useEffect(() => {
    if (!playing || ended) return;
    const timer = setInterval(
      () =>
        setProgress((p) => {
          if (p.elapsed + TICK_MS < STEP_MS) return { ...p, elapsed: p.elapsed + TICK_MS };
          if (p.step < total - 1) return { step: p.step + 1, elapsed: 0, ended: false };
          return { ...p, elapsed: STEP_MS, ended: true };
        }),
      TICK_MS,
    );
    return () => clearInterval(timer);
  }, [playing, ended, total]);

  // Watched to the end: a signal for the campaign (people who saw how it works).
  useEffect(() => {
    if (step === total - 1 && !sent.current) {
      sent.current = true;
      trackMeta("ViewContent", { key: "tutorial" });
    }
  }, [step, total]);

  function go(next: number) {
    setProgress({ step: Math.max(0, Math.min(total - 1, next)), elapsed: 0, ended: false });
  }

  const caption = T.steps[step]!;
  return (
    <section aria-label={T.label} className="flex flex-col gap-4">
      {/* Progress, one segment per step (like stories). */}
      <div className="flex gap-1" aria-hidden>
        {T.steps.map((s, i) => (
          <span key={s.title} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-primary"
              style={{
                width:
                  i < step || (i === step && ended)
                    ? "100%"
                    : i === step
                      ? `${(elapsed / STEP_MS) * 100}%`
                      : "0%",
              }}
            />
          </span>
        ))}
      </div>

      <div className="flex justify-center">
        <Phone niche={example.niche}>
          <Screen key={step} step={step} example={example} />
        </Phone>
      </div>

      <div className="min-h-[6.5rem] text-center" aria-live="polite">
        <p className="text-sm font-medium text-muted-foreground">
          {fill(T.stepOf, { n: String(step + 1), total: String(total) })}
        </p>
        <p className="mt-1 text-xl font-bold text-balance">{caption.title}</p>
        <p className="mt-1 text-pretty text-muted-foreground">{caption.text}</p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => go(step - 1)}
          disabled={step === 0}
          className="flex h-11 items-center gap-1 rounded-full border px-4 text-sm font-medium disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden /> {T.previous}
        </button>
        {ended ? (
          <button
            type="button"
            onClick={() => go(0)}
            className="flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium"
          >
            <RotateCcw className="size-4" aria-hidden /> {T.replay}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? T.pause : T.play}
            className="flex size-11 items-center justify-center rounded-full border"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            step === total - 1
              ? setProgress((p) => ({ ...p, elapsed: STEP_MS, ended: true }))
              : go(step + 1)
          }
          disabled={ended}
          className="flex h-11 items-center gap-1 rounded-full border px-4 text-sm font-medium disabled:opacity-40"
        >
          {T.next} <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

/** Phone frame in the niche's colors. */
function Phone({ niche, children }: { niche: BrandConfig; children: ReactNode }) {
  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(niche)}
      className="relative h-[500px] w-[290px] overflow-hidden rounded-[2.4rem] border-[9px] border-foreground bg-background font-sans text-foreground shadow-2xl"
      aria-hidden
    >
      <span className="absolute top-1.5 left-1/2 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-foreground" />
      {children}
    </div>
  );
}

function Screen({ step, example }: { step: number; example: Example }) {
  switch (step) {
    case 0:
      return <ChatOpen example={example} />;
    case 1:
      return <ChatService example={example} />;
    case 2:
      return <ChatTime example={example} />;
    case 3:
      return <ChatConfirm example={example} />;
    case 4:
      return <Notice example={example} />;
    case 5:
      return <Agenda example={example} />;
    case 6:
      return <Reminder example={example} />;
    default:
      return <Numbers example={example} />;
  }
}

/* ---------- Customer side: the chat ---------- */

function ChatChrome({ example, children }: { example: Example; children: ReactNode }) {
  const initials = example.business
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("");
  return (
    <div className="flex h-full flex-col bg-muted/40">
      <div className="flex items-center gap-2.5 bg-primary px-3 pt-7 pb-2.5 text-primary-foreground">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-semibold">
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{example.business}</span>
          <span className="block text-[11px] opacity-85">online agora</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-3 text-[13px] leading-snug">
        {children}
      </div>
    </div>
  );
}

function Bot({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const a = appear(delay);
  return (
    <p
      className={`max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-card px-3 py-2 text-card-foreground shadow-sm ${a.className}`}
      style={a.style}
    >
      {children}
    </p>
  );
}

function Me({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const a = appear(delay);
  return (
    <p
      className={`max-w-[80%] self-end rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground shadow-sm ${a.className}`}
      style={a.style}
    >
      {children}
    </p>
  );
}

/** An option button; `tapAt` draws the touch on it (ring and dot) after that many ms. */
function Option({
  children,
  delay = 0,
  tapAt,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  tapAt?: number;
  className?: string;
}) {
  const a = appear(delay);
  const tap = tapAt !== undefined ? appear(tapAt) : null;
  return (
    <span
      className={`relative rounded-xl border bg-card px-3 py-2 font-medium text-card-foreground ${a.className} ${className}`}
      style={a.style}
    >
      {children}
      {tap ? (
        <span
          className={`absolute inset-0 rounded-xl bg-primary/10 ring-2 ring-primary ${tap.className}`}
          style={tap.style}
        >
          <span className="absolute top-1/2 right-3 size-5 -translate-y-1/2 rounded-full bg-foreground/25 ring-4 ring-foreground/10" />
        </span>
      ) : null}
    </span>
  );
}

function ChatOpen({ example }: { example: Example }) {
  return (
    <ChatChrome example={example}>
      <Bot delay={300}>
        {fill(example.niche.chatMessages.greeting, { business: example.business })}
      </Bot>
      <div className="flex flex-col gap-1.5">
        {example.services.map((s, i) => (
          <Option key={s.name} delay={900 + i * 250}>
            {s.name}
            <span className="font-normal text-muted-foreground">
              {" "}
              · {formatDuration(s.minutes)}
            </span>
          </Option>
        ))}
      </div>
    </ChatChrome>
  );
}

function ChatService({ example }: { example: Example }) {
  return (
    <ChatChrome example={example}>
      <Bot>{fill(example.niche.chatMessages.greeting, { business: example.business })}</Bot>
      <div className="flex flex-col gap-1.5">
        {example.services.map((s) => (
          <Option key={s.name} tapAt={s === example.chosen ? 1100 : undefined}>
            {s.name}
            <span className="font-normal text-muted-foreground">
              {" "}
              · {formatDuration(s.minutes)} · R$ {s.price}
            </span>
          </Option>
        ))}
      </div>
      <Me delay={2000}>{example.chosen.name}</Me>
    </ChatChrome>
  );
}

function ChatTime({ example }: { example: Example }) {
  const days = ["Hoje", "Amanhã", "Sexta", "Sábado"];
  const times = ["09:00", "10:30", "11:00", TIME, "15:00", "16:30"];
  return (
    <ChatChrome example={example}>
      <Me>{example.chosen.name}</Me>
      <Bot delay={200}>{example.niche.chatMessages.askDate}</Bot>
      <div className="grid grid-cols-2 gap-1.5">
        {days.map((d) => (
          <Option
            key={d}
            delay={500}
            tapAt={d === "Amanhã" ? 1300 : undefined}
            className="text-center"
          >
            {d}
          </Option>
        ))}
      </div>
      <Bot delay={2100}>
        {fill(example.niche.chatMessages.askTime, { date: "amanhã" }).replace(
          "em amanhã",
          "para amanhã",
        )}
      </Bot>
      <div className="grid grid-cols-3 gap-1.5">
        {times.map((t) => (
          <Option
            key={t}
            delay={2500}
            tapAt={t === TIME ? 3500 : undefined}
            className="px-1 text-center"
          >
            {t}
          </Option>
        ))}
      </div>
    </ChatChrome>
  );
}

function ChatConfirm({ example }: { example: Example }) {
  return (
    <ChatChrome example={example}>
      <Bot>{example.niche.chatMessages.askName}</Bot>
      <Me delay={500}>{T.customer} Alves</Me>
      <Bot delay={1000}>{example.niche.chatMessages.askPhone}</Bot>
      <Me delay={1500}>(11) 98765-4321</Me>
      <Bot delay={2000}>
        Confere: {example.chosen.name}, amanhã às {TIME}, R$ {example.chosen.price}
      </Bot>
      <Option delay={2400} tapAt={3000} className="bg-primary text-center text-primary-foreground">
        Confirmar agendamento
      </Option>
      <Bot delay={3600}>
        {fill(example.niche.chatMessages.successConfirmed, { customerName: T.customer })}
      </Bot>
    </ChatChrome>
  );
}

/* ---------- Owner side ---------- */

function Hint({ children, delay }: { children: ReactNode; delay: number }) {
  const a = appear(delay);
  return (
    <p className={`text-center text-muted-foreground ${a.className}`} style={a.style}>
      {children}
    </p>
  );
}

function Notice({ example }: { example: Example }) {
  const n = appear(700, "top");
  const n2 = appear(2600, "top");
  return (
    <div className="flex h-full flex-col items-center bg-gradient-to-b from-foreground/85 to-foreground/60 px-3 pt-14 text-background">
      <p className="text-5xl font-light tabular-nums">14:02</p>
      <p className="mt-1 text-sm opacity-80">quinta-feira</p>
      <div
        className={`mt-8 flex w-full items-start gap-2.5 rounded-2xl bg-background/95 p-3 text-foreground shadow-xl ${n.className}`}
        style={n.style}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Bell className="size-4" />
        </span>
        <span className="min-w-0 text-[13px] leading-snug">
          <span className="flex justify-between text-[11px] text-muted-foreground">
            <span>MeetChat</span>
            <span>agora</span>
          </span>
          <span className="block font-semibold">Novo agendamento 🎉</span>
          <span className="block text-muted-foreground">
            {example.chosen.name} · amanhã às {TIME} · {T.customer}
          </span>
        </span>
      </div>
      <div
        className={`mt-2 flex w-full items-start gap-2.5 rounded-2xl bg-background/95 p-3 text-foreground shadow-xl ${n2.className}`}
        style={n2.style}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          <Mail className="size-4" />
        </span>
        <span className="min-w-0 text-[13px] leading-snug">
          <span className="block text-[11px] text-muted-foreground">E-mail</span>
          <span className="block font-semibold">Novo agendamento: {example.chosen.name}</span>
          <span className="block text-muted-foreground">{example.business}</span>
        </span>
      </div>
    </div>
  );
}

function PanelChrome({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-muted/40">
      <div className="flex items-center gap-2 border-b bg-card px-3 pt-7 pb-2.5">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          {icon}
        </span>
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Painel
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-3 text-[13px]">{children}</div>
    </div>
  );
}

function Agenda({ example }: { example: Example }) {
  const others = example.services.filter((s) => s !== example.chosen);
  const rows = [
    { time: "09:00", service: others[0]?.name ?? example.chosen.name, who: "Mariana" },
    { time: "10:30", service: others[1]?.name ?? example.chosen.name, who: "Carla" },
    { time: TIME, service: example.chosen.name, who: T.customer, isNew: true },
    { time: "16:00", service: others[2]?.name ?? example.chosen.name, who: "Patrícia" },
  ];
  return (
    <PanelChrome title="Agenda" icon={<CalendarDays className="size-4" />}>
      <p className="font-semibold">Amanhã · 4 horários</p>
      {rows.map((r, i) => {
        const a = appear(300 + i * 350);
        return (
          <div
            key={r.time}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${r.isNew ? "border-primary bg-primary/10" : "bg-card"} ${a.className}`}
            style={a.style}
          >
            <span className="font-semibold tabular-nums">{r.time}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{r.service}</span>
              <span className="block text-muted-foreground">{r.who}</span>
            </span>
            {r.isNew ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Novo
              </span>
            ) : null}
          </div>
        );
      })}
      <Hint delay={2200}>Toque no horário para remarcar, confirmar ou cancelar.</Hint>
    </PanelChrome>
  );
}

function Reminder({ example }: { example: Example }) {
  const card = appear(400);
  const button = appear(1600);
  return (
    <div className="flex h-full flex-col bg-muted/40">
      <div className="flex items-center gap-2 border-b bg-card px-3 pt-7 pb-2.5 text-sm font-semibold">
        <Mail className="size-4 text-primary" /> E-mail do cliente
      </div>
      <div className="flex flex-col gap-3 p-3 text-[13px]">
        <div
          className={`rounded-2xl border bg-card p-4 shadow-sm ${card.className}`}
          style={card.style}
        >
          <p className="text-[11px] text-muted-foreground">De: {example.business}</p>
          <p className="mt-1 font-semibold">
            Lembrete: {example.chosen.name} amanhã · {example.business}
          </p>
          <p className="mt-3 text-base font-bold">Até amanhã, {T.customer}!</p>
          <p className="mt-1 text-muted-foreground">Passando para lembrar do seu horário.</p>
          <div className="mt-3 rounded-lg bg-muted p-2.5">
            <p className="font-medium">{example.chosen.name}</p>
            <p className="text-muted-foreground">Amanhã às {TIME}</p>
          </div>
          <span
            className={`mt-3 block rounded-lg bg-primary py-2 text-center font-semibold text-primary-foreground ${button.className}`}
            style={button.style}
          >
            Remarcar ou cancelar
          </span>
        </div>
        <Hint delay={2400}>Enviado sozinho, no dia anterior.</Hint>
      </div>
    </div>
  );
}

function Numbers({ example }: { example: Example }) {
  const bars = [38, 52, 46, 64, 58, 80];
  const visits = 4;
  const tiles = appear(300);
  const chart = appear(900);
  const client = appear(1800);
  return (
    <PanelChrome title="Clientes e financeiro" icon={<Users className="size-4" />}>
      <div className={`grid grid-cols-2 gap-2 ${tiles.className}`} style={tiles.style}>
        <div className="rounded-xl border bg-card p-2.5">
          <p className="text-[11px] text-muted-foreground">Agendamentos no mês</p>
          <p className="text-xl font-bold">86</p>
        </div>
        <div className="rounded-xl border bg-card p-2.5">
          <p className="text-[11px] text-muted-foreground">Faturamento no mês</p>
          <p className="text-xl font-bold">
            R$ {(86 * example.chosen.price).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>
      <div className={`rounded-xl border bg-card p-2.5 ${chart.className}`} style={chart.style}>
        <p className="text-[11px] text-muted-foreground">Últimos 6 meses</p>
        <div className="mt-2 flex h-20 items-end gap-1.5">
          {bars.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t bg-primary motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700"
              style={{ height: `${h}%`, opacity: i === bars.length - 1 ? 1 : 0.6 }}
            />
          ))}
        </div>
      </div>
      <div className={`rounded-xl border bg-card p-2.5 ${client.className}`} style={client.style}>
        <p className="font-semibold">{T.customer} Alves</p>
        <p className="text-muted-foreground">
          {visits} visitas · última: {example.chosen.name}
        </p>
        <p className="text-muted-foreground">WhatsApp e histórico guardados</p>
      </div>
    </PanelChrome>
  );
}
