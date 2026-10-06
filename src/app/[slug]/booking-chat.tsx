"use client";

import { CalendarPlus, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";

import { useBrand } from "@/components/brand-provider";
import {
  CHAT_OPTION_CLASS,
  ChatBubble,
  ChatComposer,
  ChatDayPill,
  ChatNotice,
  ChatOption,
  ChatOptions,
  ChatTyping,
  ChatWindow,
  useChatClock,
} from "@/components/chat/chat-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { formatAmount, formatDuration } from "@/lib/money";
import { maskBrPhone, whatsappLink } from "@/lib/phone";
import { track } from "@/lib/tracking/client";

import { NextBooking } from "./next-booking";
import {
  confirmChatBookingAction,
  getChatCatalogAction,
  getChatDaysAction,
  getChatSlotsAction,
  joinWaitlistAction,
  previewCouponAction,
  saveAbandonedAction,
  type ChatCatalog,
  type ConfirmResult,
} from "./chat-actions";

type Step =
  | "service"
  | "professional"
  | "day"
  | "time"
  | "name"
  | "phone"
  | "email"
  | "coupon"
  | "summary"
  | "done"
  | "blocked";

interface ChatState {
  step: Step;
  history: Step[];
  serviceIds: string[];
  comboId: string | null;
  serviceLabel: string;
  professional: "any" | string;
  professionalLabel: string;
  date: string | null;
  dateLabel: string;
  startsAt: string | null;
  time: string | null;
  name: string;
  phone: string;
  email: string;
  optIn: boolean;
  couponCode: string | null;
  discountCents: number;
  priceCents: number;
  abandonedId: string | null;
  conflict: boolean;
  result: Extract<ConfirmResult, { ok: true }> | null;
  savedAt: number;
}

const INITIAL: ChatState = {
  step: "service",
  history: [],
  serviceIds: [],
  comboId: null,
  serviceLabel: "",
  professional: "any",
  professionalLabel: "",
  date: null,
  dateLabel: "",
  startsAt: null,
  time: null,
  name: "",
  phone: "",
  email: "",
  optIn: false,
  couponCode: null,
  discountCents: 0,
  priceCents: 0,
  abandonedId: null,
  conflict: false,
  result: null,
  savedAt: 0,
};

const STORAGE_TTL_MS = 2 * 60 * 60 * 1000;

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

/** Rejects when the server takes too long, so the chat never waits forever. */
function withTimeout<T>(promise: Promise<T>, ms = 15_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function storage<T>(key: string, value?: T): T | null {
  try {
    if (value === undefined) {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: the chat still works, it just does not survive a reload.
  }
  return null;
}

export function BookingChat({
  slug,
  businessId,
  businessName,
  avatarUrl,
  onClose,
  onProfile,
  branding,
  initialServiceId,
  initialDate,
}: {
  slug: string;
  businessId: string;
  businessName: string;
  avatarUrl?: string | null;
  onClose?: () => void;
  onProfile?: () => void;
  branding?: React.ReactNode;
  initialServiceId?: string | null;
  initialDate?: string | null;
}) {
  const brand = useBrand();
  const messages = brand.chatMessages;
  const storageKey = `lv_chat_v1_${slug}`;
  const [catalog, setCatalog] = useState<ChatCatalog | null | undefined>(undefined);
  const [state, setState] = useState<ChatState>(INITIAL);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [days, setDays] = useState<{ date: string; label: string }[] | null>(null);
  const [slots, setSlots] = useState<{ startsAt: string; time: string }[] | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitlistDone, setWaitlistDone] = useState(false);
  // A failed or slow load shows "Tentar de novo" instead of "digitando…" forever.
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pending, startTransition] = useTransition();
  const clock = useChatClock();

  // Load catalog, restore a recent session and remember ?ref=.
  useEffect(() => {
    let cancelled = false;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) storage(`lv_ref_${slug}`, ref);
    withTimeout(getChatCatalogAction(slug))
      .catch((error: unknown) => {
        console.error("chat catalog failed", error);
        if (!cancelled) setLoadFailed(true);
        return undefined;
      })
      .then((data) => {
        if (cancelled || data === undefined) return;
        setCatalog(data);
        const saved = storage<ChatState>(storageKey);
        if (
          saved &&
          Date.now() - saved.savedAt < STORAGE_TTL_MS &&
          saved.step !== "done" &&
          saved.step !== "blocked"
        ) {
          setState({ ...saved, conflict: false });
        } else if (
          data &&
          initialServiceId &&
          data.services.some((s) => s.id === initialServiceId)
        ) {
          const service = data.services.find((s) => s.id === initialServiceId)!;
          setState({
            ...INITIAL,
            step: data.anyProfessional ? "professional" : "day",
            history: ["service"],
            serviceIds: [service.id],
            serviceLabel: service.name,
            priceCents: service.priceCents,
            date: initialDate ?? null,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, storageKey, initialServiceId, initialDate, attempt]);

  // Persist on every change (so a reload keeps the conversation).
  useEffect(() => {
    if (state !== INITIAL) storage(storageKey, { ...state, savedAt: Date.now() });
  }, [state, storageKey]);

  // Short "typing" pause before each system message; options appear right away.
  const messageKey = `${state.step}:${state.history.length}:${state.conflict}`;
  const typing = revealed !== messageKey;
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(messageKey), 300 + Math.round(Math.random() * 300));
    return () => clearTimeout(timer);
  }, [messageKey]);

  const selection = useCallback(
    () => ({
      slug,
      serviceIds: state.serviceIds,
      comboId: state.comboId,
      professional: state.professional,
    }),
    [slug, state.serviceIds, state.comboId, state.professional],
  );

  // Data for the current step.
  useEffect(() => {
    if (state.step === "day") {
      let cancelled = false;
      withTimeout(getChatDaysAction({ ...selection(), from: null })).then(
        (list) => !cancelled && setDays(list),
        (error: unknown) => {
          console.error("chat days failed", error);
          if (!cancelled) setLoadFailed(true);
        },
      );
      return () => {
        cancelled = true;
      };
    }
    if (state.step === "time" && state.date) {
      let cancelled = false;
      withTimeout(getChatSlotsAction({ ...selection(), date: state.date })).then(
        (list) => !cancelled && setSlots(list),
        (error: unknown) => {
          console.error("chat slots failed", error);
          if (!cancelled) setLoadFailed(true);
        },
      );
      return () => {
        cancelled = true;
      };
    }
  }, [state.step, state.date, state.conflict, selection, attempt]);

  function retryLoad() {
    setLoadFailed(false);
    setAttempt((n) => n + 1);
  }

  function go(next: Step, patch: Partial<ChatState> = {}) {
    if (state.history.length === 0) track(businessId, "booking_started");
    setError(null);
    setLoadFailed(false);
    if (next === "day") setDays(null);
    if (next === "time") setSlots(null);
    setState((s) => ({
      ...s,
      ...patch,
      step: next,
      history: [...s.history, s.step],
      conflict: false,
    }));
  }

  function back() {
    setError(null);
    setLoadFailed(false);
    setState((s) => {
      const history = [...s.history];
      const previous = history.pop();
      if (!previous) return s;
      if (previous === "day") setDays(null);
      if (previous === "time") setSlots(null);
      return { ...s, step: previous, history, conflict: false };
    });
  }

  const frame = (children: React.ReactNode, footer?: React.ReactNode) => (
    <ChatWindow
      businessName={businessName}
      avatarUrl={avatarUrl}
      titlePrefix="Agendar com"
      onClose={onClose}
      onProfile={onProfile}
      branding={branding}
      footer={footer}
    >
      <ChatDayPill>Hoje</ChatDayPill>
      {children}
    </ChatWindow>
  );

  if (catalog === undefined) {
    return frame(
      loadFailed ? (
        <LoadFailed time={clock} onRetry={retryLoad}>
          Não consegui abrir a agenda agora. Pode ser a conexão.
        </LoadFailed>
      ) : (
        <ChatTyping />
      ),
    );
  }
  if (catalog === null) {
    return frame(
      <ChatBubble from="system" time={clock}>
        O agendamento online não está disponível agora.
      </ChatBubble>,
    );
  }

  const vars: Record<string, string> = {
    business: catalog.businessName,
    service: state.serviceLabel,
    professional: state.professionalLabel || catalog.businessName,
    date: state.dateLabel,
    time: state.time ?? "",
    price: formatAmount(Math.max(0, state.priceCents - state.discountCents)),
    customerName: state.name.split(" ")[0] ?? "",
    ...(state.result?.vars ?? {}),
  };

  const afterContactStep = (): Step => (catalog.salesTools ? "coupon" : "summary");

  // The summary only names the professional when the customer chose one (a solo business is
  // often named after the person) and only shows the price when there is one.
  const chargedCents = Math.max(0, state.priceCents - state.discountCents);
  const summaryTemplate = (template: string) => {
    let result = template;
    if (!state.professionalLabel) result = result.replace(/\s+com \{professional\}/, "");
    if (chargedCents === 0) result = result.replace(/,?\s*valor\s+R\$\s*\{price\}/i, "");
    return result;
  };

  // ---- transcript of completed steps ----
  const transcript: { prompt: string; answer: string | null }[] = [];
  const prompts: Partial<Record<Step, string>> = {
    service: fill(messages.greeting, vars),
    professional: fill(messages.askProfessional, vars),
    day: fill(messages.askDate, vars),
    time: fill(messages.askTime, vars),
    name: fill(messages.askName, vars),
    phone: fill(messages.askPhone, vars),
    email: fill(messages.askEmail, vars),
    coupon: fill(messages.askCoupon, vars),
    summary: fill(summaryTemplate(messages.summary), vars),
  };
  const answers: Partial<Record<Step, string>> = {
    service: state.serviceLabel,
    professional: state.professional === "any" ? "Qualquer profissional" : state.professionalLabel,
    day: state.dateLabel,
    time: state.time ?? "",
    name: state.name,
    phone: state.phone,
    email: state.email || "Prefiro não informar",
    coupon: state.couponCode ? `Cupom ${state.couponCode}` : "Não tenho",
    summary: "Confirmar agendamento",
  };
  for (const step of state.history) {
    if (prompts[step]) transcript.push({ prompt: prompts[step]!, answer: answers[step] ?? null });
  }

  function confirm() {
    startTransition(async () => {
      // A failure on the way (network, server restart) gets the friendly error, never a crash.
      const result = await confirmChatBookingAction({
        ...selection(),
        startsAt: state.startsAt,
        name: state.name,
        phone: state.phone,
        email: state.email,
        optIn: state.optIn,
        couponCode: state.couponCode,
        referralCode: storage<string>(`lv_ref_${slug}`),
        abandonedId: state.abandonedId,
      }).catch((error: unknown) => {
        console.error("confirm booking failed", error);
        return { ok: false as const, error: "invalid" as const };
      });
      if (result.ok) {
        track(businessId, "booking_confirmed");
        setState((s) => ({ ...s, step: "done", history: [...s.history, "summary"], result }));
        return;
      }
      if (result.error === "conflict") {
        setSlots(null);
        setState((s) => ({
          ...s,
          step: "time",
          conflict: true,
          startsAt: null,
          time: null,
          history: s.history.slice(0, s.history.indexOf("time")),
        }));
      } else if (result.error === "blocked") {
        setState((s) => ({ ...s, step: "blocked" }));
      } else if (result.error === "coupon_invalid") {
        setState((s) => ({ ...s, couponCode: null, discountCents: 0 }));
        setError("Esse cupom não vale mais. Confirme sem ele ou tente outro.");
      } else {
        setError(fill(messages.error, vars));
      }
    });
  }

  const current = state.step;
  const currentPrompt =
    current === "time" && state.conflict
      ? fill(messages.conflict, vars)
      : current === "done" && state.result
        ? fill(
            state.result.status === "confirmed"
              ? messages.successConfirmed
              : state.result.status === "pending"
                ? messages.successPending
                : messages.successDeposit,
            vars,
          ) + (state.email ? ` ${fill(messages.emailNote, vars)}` : "")
        : current === "blocked"
          ? fill(messages.blocked, vars)
          : prompts[current];

  function submitEmail(email: string) {
    const optIn = state.optIn;
    const isWaitlist = !state.startsAt;
    if (isWaitlist && state.date) {
      startTransition(async () => {
        const result = await joinWaitlistAction({
          ...selection(),
          date: state.date,
          name: state.name,
          phone: state.phone,
          email,
        });
        if (result.ok) {
          setWaitlistDone(true);
          setState((s) => ({
            ...s,
            step: "time",
            email,
            history: s.history.slice(0, s.history.indexOf("time")),
          }));
        } else setError(result.message ?? "Não foi possível.");
      });
      return;
    }
    if (optIn) {
      saveAbandonedAction({
        ...selection(),
        consent: true,
        date: state.date,
        slot: state.startsAt,
        name: state.name,
        phone: state.phone,
        email,
        id: state.abandonedId,
      }).then((id) => id && setState((s) => ({ ...s, abandonedId: id })));
    }
    go(afterContactStep(), { email });
  }

  // ---- composer (bottom bar): text answers; disabled while waiting for a button answer ----
  let composer: React.ReactNode = <ChatComposer label={null} />;
  if (current === "name") {
    composer = (
      <ChatComposer
        key="name"
        label="Seu nome"
        placeholder="Seu nome"
        autoComplete="name"
        initial={state.name}
        validate={(v) => (v.trim().length >= 2 ? null : "Informe seu nome")}
        onSubmit={(name) => go("phone", { name: name.trim() })}
      />
    );
  } else if (current === "phone") {
    composer = (
      <ChatComposer
        key="phone"
        label="WhatsApp"
        placeholder="(11) 99999-8888"
        inputMode="tel"
        autoComplete="tel"
        initial={state.phone}
        mask={maskBrPhone}
        validate={(v) => (v.replace(/\D/g, "").length >= 10 ? null : "Informe DDD + número")}
        onSubmit={(phone) => go("email", { phone })}
      />
    );
  } else if (current === "email") {
    composer = (
      <ChatComposer
        key="email"
        label="E-mail"
        placeholder="seu@email.com (opcional)"
        type="email"
        inputMode="email"
        autoComplete="email"
        initial={state.email}
        allowEmpty
        pending={pending}
        validate={(v) =>
          v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()) ? "E-mail inválido" : null
        }
        onSubmit={(email) => submitEmail(email.trim().toLowerCase())}
        above={
          <label className="flex items-start gap-2 rounded-lg bg-card px-3 py-2 text-sm text-card-foreground shadow-sm">
            <Checkbox
              checked={state.optIn}
              onCheckedChange={(c) => setState((s) => ({ ...s, optIn: c === true }))}
            />
            <span>{fill(messages.optInLabel, vars)}</span>
          </label>
        }
      />
    );
  } else if (current === "coupon" && couponOpen) {
    composer = (
      <ChatComposer
        key="coupon"
        label="Código do cupom"
        placeholder="CÓDIGO"
        pending={pending}
        mask={(v) => v.toUpperCase()}
        validate={(v) => (v.trim().length >= 3 ? null : "Digite o código do cupom")}
        onSubmit={(code) =>
          startTransition(async () => {
            const result = await previewCouponAction({ ...selection(), code });
            if (result.ok) {
              setCouponOpen(false);
              go("summary", {
                couponCode: code.trim().toUpperCase(),
                discountCents: result.discountCents,
              });
            } else setError("Cupom inválido ou vencido.");
          })
        }
      />
    );
  } else if (current === "done" || current === "blocked") {
    composer = null;
  }

  // After a confirmed single service with a usual return interval: offer the next visit.
  const bookedService =
    !state.comboId && state.serviceIds.length === 1
      ? catalog.services.find((s) => s.id === state.serviceIds[0])
      : undefined;
  const offerNext =
    current === "done" &&
    state.result !== null &&
    state.result.status !== "awaiting_deposit" &&
    Boolean(bookedService?.returnAfterDays) &&
    Boolean(state.date);

  const priceSuffix = (cents: number) =>
    catalog.showPrices && cents > 0 ? ` · R$ ${formatAmount(cents)}` : "";
  const linkClass = `${CHAT_OPTION_CLASS} justify-center text-primary`;

  return frame(
    <>
      {transcript.map((entry, i) => (
        <div key={i} className="flex flex-col">
          <ChatBubble from="system" time={clock}>
            {entry.prompt}
          </ChatBubble>
          {entry.answer ? (
            <ChatBubble from="user" time={clock}>
              {entry.answer}
            </ChatBubble>
          ) : null}
        </div>
      ))}

      {currentPrompt ? (
        typing ? (
          <ChatTyping />
        ) : (
          <ChatBubble from="system" time={clock}>
            {currentPrompt}
          </ChatBubble>
        )
      ) : null}

      {current === "service" ? (
        <ChatOptions>
          {catalog.combos.map((combo) => (
            <ChatOption
              key={combo.id}
              onClick={() =>
                go(catalog.anyProfessional ? "professional" : "day", {
                  comboId: combo.id,
                  serviceIds: [],
                  serviceLabel: combo.name,
                  priceCents: combo.priceCents,
                })
              }
            >
              <span className="font-medium">{combo.name}</span>{" "}
              <span className="text-sm text-muted-foreground">
                · {formatDuration(combo.durationMinutes)}
                {priceSuffix(combo.priceCents)}
              </span>
            </ChatOption>
          ))}
          {catalog.services.map((service) => (
            <ChatOption
              key={service.id}
              onClick={() =>
                go(catalog.anyProfessional ? "professional" : "day", {
                  serviceIds: [service.id],
                  comboId: null,
                  serviceLabel: service.name,
                  priceCents: service.priceCents,
                })
              }
            >
              <span className="font-medium">{service.name}</span>{" "}
              <span className="text-sm text-muted-foreground">
                · {formatDuration(service.durationMinutes)}
                {priceSuffix(service.priceCents)}
              </span>
            </ChatOption>
          ))}
        </ChatOptions>
      ) : null}

      {current === "professional" ? (
        <ChatOptions>
          {catalog.professionals
            .filter((p) => {
              const needed = state.comboId
                ? (catalog.combos.find((c) => c.id === state.comboId)?.serviceIds ?? [])
                : state.serviceIds;
              return needed.every((id) => p.serviceIds.includes(id));
            })
            .map((p) => (
              <ChatOption
                key={p.id}
                onClick={() => go("day", { professional: p.id, professionalLabel: p.name })}
              >
                <span className="flex items-center gap-3">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- R2 public URL
                    <img
                      src={p.photoUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-9 items-center justify-center rounded-full bg-muted font-medium">
                      {p.name.charAt(0)}
                    </span>
                  )}
                  {p.name}
                </span>
              </ChatOption>
            ))}
          <ChatOption onClick={() => go("day", { professional: "any", professionalLabel: "" })}>
            Qualquer profissional
          </ChatOption>
        </ChatOptions>
      ) : null}

      {current === "day" ? (
        days === null ? (
          loadFailed ? (
            <LoadFailed time={clock} onRetry={retryLoad}>
              Não consegui carregar os dias livres agora. Pode ser a conexão.
            </LoadFailed>
          ) : (
            <ChatTyping />
          )
        ) : days.length === 0 ? (
          <NoSlots
            message={fill(messages.noSlots, vars)}
            time={clock}
            salesTools={catalog.salesTools}
            onWaitlist={(date) =>
              go("name", { date, dateLabel: date.split("-").reverse().join("/") })
            }
          />
        ) : (
          <>
            <ChatOptions columns={2}>
              {days.map((day) => (
                <ChatOption
                  key={day.date}
                  onClick={() => go("time", { date: day.date, dateLabel: day.label })}
                >
                  <span className="capitalize">{day.label}</span>
                </ChatOption>
              ))}
            </ChatOptions>
            <ChatOptions>
              <ChatOption
                className="text-center text-primary"
                onClick={() => {
                  const last = days.at(-1)!.date;
                  const next = new Date(`${last}T12:00:00Z`);
                  next.setUTCDate(next.getUTCDate() + 1);
                  getChatDaysAction({ ...selection(), from: next.toISOString().slice(0, 10) }).then(
                    (more) => setDays((list) => [...(list ?? []), ...more]),
                  );
                }}
              >
                Ver mais dias
              </ChatOption>
            </ChatOptions>
          </>
        )
      ) : null}

      {current === "time" ? (
        slots === null ? (
          loadFailed ? (
            <LoadFailed time={clock} onRetry={retryLoad}>
              Não consegui carregar os horários agora. Pode ser a conexão.
            </LoadFailed>
          ) : (
            <ChatTyping />
          )
        ) : slots.length === 0 ? (
          waitlistDone ? (
            <ChatBubble from="system" time={clock}>
              Pronto! Você entrou na lista de espera e recebe um e-mail se abrir um horário.
            </ChatBubble>
          ) : (
            <NoSlots
              message={fill(messages.noSlots, vars)}
              time={clock}
              salesTools={catalog.salesTools}
              fixedDate={state.date}
              onOtherDay={() => back()}
              onWaitlist={() => go("name", { startsAt: null, time: null })}
            />
          )
        ) : (
          <ChatOptions columns={3}>
            {slots.map((slot) => (
              <ChatOption
                key={slot.startsAt}
                className="text-center font-medium"
                onClick={() => go("name", { startsAt: slot.startsAt, time: slot.time })}
              >
                {slot.time}
              </ChatOption>
            ))}
          </ChatOptions>
        )
      ) : null}

      {current === "email" ? (
        <ChatOptions>
          <ChatOption className="text-center" disabled={pending} onClick={() => submitEmail("")}>
            Prefiro não informar
          </ChatOption>
        </ChatOptions>
      ) : null}

      {current === "coupon" && !couponOpen ? (
        <ChatOptions columns={2}>
          <ChatOption className="text-center" onClick={() => setCouponOpen(true)}>
            Tenho cupom
          </ChatOption>
          <ChatOption
            className="text-center"
            onClick={() => go("summary", { couponCode: null, discountCents: 0 })}
          >
            Não tenho
          </ChatOption>
        </ChatOptions>
      ) : null}

      {current === "summary" ? (
        <ChatOptions>
          {state.discountCents > 0 ? (
            <p className="rounded-lg bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
              Desconto do cupom: R$ {formatAmount(state.discountCents)}
            </p>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={confirm}
            className="h-12 rounded-lg bg-primary px-4 text-base font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Confirmando…" : "Confirmar agendamento"}
          </button>
          <ChatOption
            className="text-center"
            disabled={pending}
            onClick={() =>
              setState((s) => ({
                ...s,
                step: "service",
                history: [],
                startsAt: null,
                time: null,
                date: null,
              }))
            }
          >
            Alterar
          </ChatOption>
        </ChatOptions>
      ) : null}

      {current === "done" && state.result ? (
        <>
          {state.result.pix ? (
            <ChatBubble from="system" time={clock} tail={false}>
              <span className="flex flex-col items-center gap-2 py-1">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated Pix QR (data URL) */}
                <img src={state.result.pix.qr} alt="QR code do Pix" width={220} height={220} />
                <code className="w-full rounded-md bg-muted p-2 text-xs break-all">
                  {state.result.pix.code}
                </code>
              </span>
            </ChatBubble>
          ) : null}
          <ChatOptions>
            {state.result.pix ? (
              <>
                <ChatOption
                  className="text-center text-primary"
                  onClick={() => navigator.clipboard.writeText(state.result!.pix!.code)}
                >
                  Copiar Pix copia e cola
                </ChatOption>
                <a href={`/cancelar/${state.result.cancelToken}`} className={linkClass}>
                  Já paguei
                </a>
              </>
            ) : null}
            {state.result.status !== "awaiting_deposit" ? (
              <>
                <p className="px-1 pt-1 text-sm text-muted-foreground">
                  Salvar na minha agenda (com lembrete):
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {state.result.googleCalendarUrl ? (
                    <a
                      href={state.result.googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      <CalendarPlus className="size-4" /> Google Agenda
                    </a>
                  ) : null}
                  <a href={`/api/ics/${state.result.cancelToken}`} className={linkClass}>
                    <CalendarPlus className="size-4" /> Calendário do iPhone
                  </a>
                </div>
              </>
            ) : null}
            {state.result.whatsappSummary && catalog.whatsapp ? (
              <a
                href={whatsappLink(catalog.whatsapp, state.result.whatsappSummary)}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <MessageCircle className="size-4" /> Avisar pelo WhatsApp
              </a>
            ) : null}
          </ChatOptions>
          {offerNext && bookedService && state.date ? (
            <NextBooking
              slug={slug}
              businessId={businessId}
              serviceId={bookedService.id}
              serviceLabel={bookedService.name}
              professionalId={state.result.professionalId}
              bookedDate={state.date}
              returnAfterDays={bookedService.returnAfterDays!}
              contact={{ name: state.name, phone: state.phone, email: state.email }}
              clock={clock}
              conflictMessage={fill(messages.conflict, vars)}
              errorMessage={fill(messages.error, vars)}
            />
          ) : null}
        </>
      ) : null}

      {current === "blocked" && catalog.whatsapp ? (
        <ChatOptions>
          <a
            href={whatsappLink(catalog.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <MessageCircle className="size-4" /> Falar pelo WhatsApp
          </a>
        </ChatOptions>
      ) : null}

      {error ? (
        <ChatBubble from="system" time={clock}>
          <span role="alert" className="text-destructive">
            {error}
          </span>
        </ChatBubble>
      ) : null}

      {state.history.length > 0 && current !== "done" ? (
        <ChatNotice onClick={back}>↩ Voltar e mudar a resposta anterior</ChatNotice>
      ) : null}
    </>,
    composer,
  );
}

/** A load that failed or took too long: never leaves the customer on "digitando…". */
function LoadFailed({
  time,
  onRetry,
  children,
}: {
  time: string;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <ChatBubble from="system" time={time}>
        {children}
      </ChatBubble>
      <ChatOptions>
        <ChatOption className="text-center text-primary" onClick={onRetry}>
          Tentar de novo
        </ChatOption>
      </ChatOptions>
    </>
  );
}

function NoSlots({
  message,
  time,
  salesTools,
  fixedDate,
  onOtherDay,
  onWaitlist,
}: {
  message: string;
  time: string;
  salesTools: boolean;
  fixedDate?: string | null;
  onOtherDay?: () => void;
  onWaitlist: (date: string) => void;
}) {
  const [date, setDate] = useState(fixedDate ?? "");
  return (
    <>
      <ChatBubble from="system" time={time}>
        {message}
      </ChatBubble>
      <ChatOptions>
        {onOtherDay ? <ChatOption onClick={onOtherDay}>Escolher outro dia</ChatOption> : null}
        {salesTools ? (
          fixedDate ? (
            <ChatOption onClick={() => onWaitlist(fixedDate)}>Entrar na lista de espera</ChatOption>
          ) : (
            <div className="flex gap-2">
              <input
                type="date"
                aria-label="Dia desejado"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 min-w-0 flex-1 rounded-lg bg-card px-3 text-card-foreground shadow-sm"
              />
              <ChatOption
                className="w-auto shrink-0"
                disabled={!date}
                onClick={() => onWaitlist(date)}
              >
                Lista de espera
              </ChatOption>
            </div>
          )
        ) : null}
      </ChatOptions>
    </>
  );
}
