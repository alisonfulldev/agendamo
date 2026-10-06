"use client";

import { Bell, CalendarCheck, Check, Copy, Send, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { getBrand, getNiche, NICHES, PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { nichesByGroup } from "@/components/sales/niche-cards";
import { CREATION, detectNiche } from "@/content/creation";
import { EMAIL_PATTERN, suggestEmailFix } from "@/lib/email-typos";
import { formatDuration } from "@/lib/money";
import { maskBrPhone } from "@/lib/phone";

import { createDemoAction, recordTestBookingAction } from "./actions";
import { closeCreation, creationParams, isCreationOpen, subscribeCreation } from "./creation-store";
import { sendSignupCodeAction, verifySignupCodeAction } from "./signup-actions";

type Phase =
  | "resume"
  | "name"
  | "confirm"
  | "pick"
  | "all"
  | "other"
  | "building"
  | "service"
  | "day"
  | "time"
  | "done"
  // Sign-up in the conversation (e-mail + 6-digit code).
  | "whatsapp"
  | "email"
  | "email-fix"
  | "terms"
  | "sending"
  | "code"
  | "verifying"
  | "created"
  | "has_business";

const SIGNUP_PHASES: Phase[] = [
  "whatsapp",
  "email",
  "email-fix",
  "terms",
  "sending",
  "code",
  "verifying",
  "created",
  "has_business",
];

const SU = CREATION.signup;

interface Bubble {
  from: "system" | "user";
  text: string;
  links?: readonly { label: string; href: string }[];
}

interface CreationState {
  phase: Phase;
  /** Setup conversation (with Agendamo) and, after the transformation, her own chat. */
  log: Bubble[];
  name: string;
  detected: string | null;
  brandKey: string | null;
  nicheDescription: string | null;
  demoId: string | null;
  suggestedSlug: string | null;
  service: string | null;
  dateLabel: string | null;
  time: string | null;
  startedAt: number;
  whatsapp: string | null;
  email: string | null;
  emailFix: string | null;
  codeSentAt: number | null;
  created: { name: string; slug: string; pageUrl: string; qr: string } | null;
}

const STORAGE_KEY = "lv_creation_v1";
const TYPING_MS = 450;

function fresh(): CreationState {
  return {
    phase: "name",
    log: [
      { from: "system", text: CREATION.intro },
      { from: "system", text: CREATION.askName },
    ],
    name: "",
    detected: null,
    brandKey: null,
    nicheDescription: null,
    demoId: null,
    suggestedSlug: null,
    service: null,
    dateLabel: null,
    time: null,
    startedAt: Date.now(),
    whatsapp: null,
    email: null,
    emailFix: null,
    codeSentAt: null,
    created: null,
  };
}

function load(): CreationState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CreationState) : null;
  } catch {
    return null;
  }
}

function save(state: CreationState | null) {
  try {
    if (state) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the conversation still works, it just does not survive closing.
  }
}

const fill = (template: string, vars: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");

/** Niche from ?ramo=: a niche key ("barber") or its page route ("barbearia"). */
function nicheFromParam(value: string | null): string | null {
  if (!value) return null;
  const byKey = getBrand(value);
  if (byKey) return byKey.key;
  return NICHES.find((b) => b.niche!.route === value)?.key ?? null;
}

function nicheLabel(key: string): string {
  const niche = getNiche(key);
  return niche.niche ? niche.niche.name.toLowerCase() : CREATION.other.toLowerCase();
}

/** The next 7 days ("Hoje", then "Quarta-feira, 8 de outubro"…). */
function nextDays(): string[] {
  const format = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const label = format.format(date);
    return i === 0
      ? `Hoje, ${label.split(", ")[1]}`
      : label.charAt(0).toUpperCase() + label.slice(1);
  });
}

/** Made-up free times for a day of the test booking (always at least 3). */
function fakeTimes(dayLabel: string): string[] {
  const seed = [...dayLabel].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const all = ["09:00", "10:00", "11:00", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30"];
  const free = all.filter((_, i) => (seed + i * 7) % 3 !== 0);
  return free.length >= 3 ? free : all.slice(0, 4);
}

/** Where the person came from (UTM, prospecting link, page). */
function sourceInfo(viaName: boolean, viaNiche: boolean) {
  const params = new URLSearchParams(window.location.search);
  const pick = (k: string) => params.get(k)?.slice(0, 100) || undefined;
  let referrer: string | undefined;
  try {
    referrer = document.referrer ? new URL(document.referrer).host : undefined;
  } catch {
    referrer = undefined;
  }
  return {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    via: viaName ? ("nome" as const) : viaNiche ? ("ramo" as const) : ("direct" as const),
    page: window.location.pathname.slice(0, 200),
    referrer,
  };
}

/**
 * The creation conversation: opens over the site (full screen on phones, a phone frame on
 * desktop). The person names the business, the niche is detected or chosen, and the chat turns
 * into hers for a test booking. Progress survives closing (sessionStorage).
 */
export function CreationChat() {
  const open = useSyncExternalStore(subscribeCreation, isCreationOpen, () => false);
  if (!open) return null;
  return <Conversation />;
}

function Conversation() {
  const [state, setState] = useState<CreationState>(() => {
    const saved = load();
    if (saved && saved.name && saved.phase !== "name") {
      return {
        ...saved,
        phase: "resume",
        log: [{ from: "system", text: fill(CREATION.resume, { nome: saved.name }) }],
      };
    }
    return fresh();
  });
  const [revealed, setRevealed] = useState(0);
  const [trap, setTrap] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  // Persist (the resume prompt itself is not saved).
  useEffect(() => {
    if (state.phase === "created" || state.phase === "has_business") save(null);
    else if (state.phase !== "resume") save(state);
  }, [state]);

  // Short "typing" pause before each system message; the person's answers appear at once.
  useEffect(() => {
    if (revealed >= state.log.length) return;
    const next = state.log[revealed]!;
    const timer = setTimeout(() => setRevealed(revealed + 1), next.from === "user" ? 0 : TYPING_MS);
    return () => clearTimeout(timer);
  }, [revealed, state.log]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [revealed, state.phase]);

  // Lock the page behind and close on Escape.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCreation();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const typing = revealed < state.log.length;
  const visible = state.log.slice(0, revealed);
  const niche = state.brandKey ? getNiche(state.brandKey) : null;
  const ownChat = Boolean(niche && state.demoId);

  function update(patch: Partial<CreationState>, bubbles: Bubble[] = []) {
    setState((s) => ({ ...s, ...patch, log: [...(patch.log ?? s.log), ...bubbles] }));
  }

  const user = (text: string): Bubble => ({ from: "user", text });
  const system = (text: string): Bubble => ({ from: "system", text });

  async function build(brandKey: string, nicheDescription: string | null, current = state) {
    const viaParams = creationParams();
    update({ phase: "building", brandKey, nicheDescription }, [system(CREATION.building)]);
    const result = await createDemoAction({
      name: current.name,
      brandKey,
      nicheDescription,
      source: sourceInfo(Boolean(viaParams.name), Boolean(viaParams.niche)),
      trap,
      elapsedMs: Math.max(Date.now() - current.startedAt, 0),
    }).catch(() => ({ ok: false as const, error: "invalid" as const }));
    if (!result.ok) {
      update({ phase: "pick" }, [
        system(result.error === "rate_limited" ? CREATION.rateLimited : CREATION.error),
        system(CREATION.askNiche),
      ]);
      return;
    }
    const chosen = getNiche(brandKey);
    // The transformation: the chat starts over as hers.
    setRevealed(0);
    setState((s) => ({
      ...s,
      phase: "service",
      demoId: result.id,
      suggestedSlug: result.suggestedSlug,
      log: [system(fill(chosen.chatMessages.greeting, { business: s.name }))],
    }));
  }

  function submitName(raw: string, current = state) {
    const name = raw.trim().slice(0, 120);
    if (name.length < 2) return;
    const next = { ...current, name, log: [...current.log, user(name)] };
    const preset = nicheFromParam(creationParams().niche);
    if (preset) {
      setState(next);
      void build(preset, null, next);
      return;
    }
    const detected = detectNiche(name);
    if (detected) {
      setState({
        ...next,
        phase: "confirm",
        detected,
        log: [
          ...next.log,
          system(fill(CREATION.confirmNiche, { nome: name, ramo: nicheLabel(detected) })),
        ],
      });
    } else {
      setState({ ...next, phase: "pick", log: [...next.log, system(CREATION.askNiche)] });
    }
  }

  // Prospecting links (?nome= / ?ramo=) skip the questions they answer.
  useEffect(() => {
    const { name } = creationParams();
    if (!name || started.current || state.phase !== "name") return;
    // After the welcome messages, and past the server's anti-robot minimum time. The flag is set
    // when it fires, so a re-run of the effect (React dev mode) does not lose it.
    const timer = setTimeout(() => {
      started.current = true;
      submitName(name);
    }, 1700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on open
  }, []);

  function restart() {
    save(null);
    setRevealed(0);
    setState(fresh());
  }

  /** "Quero esse link para mim": the sign-up goes on right here. */
  function claim() {
    update({ phase: "whatsapp" }, [user(CREATION.claim), system(SU.askWhatsapp)]);
  }

  function submitWhatsapp(text: string | null) {
    update({ phase: "email", whatsapp: text }, [user(text ?? SU.later), system(SU.askEmail)]);
  }

  function submitEmail(raw: string) {
    const email = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      update({}, [user(raw.trim()), system(SU.invalidEmail)]);
      return;
    }
    const fix = suggestEmailFix(email);
    if (fix) {
      update({ phase: "email-fix", email, emailFix: fix }, [
        user(email),
        system(fill(SU.didYouMean, { sugestao: fix })),
      ]);
      return;
    }
    askTerms(email, [user(email)]);
  }

  function askTerms(email: string, before: Bubble[]) {
    update({ phase: "terms", email, emailFix: null }, [
      ...before,
      { from: "system", text: SU.terms, links: SU.termsLinks },
    ]);
  }

  async function sendCode(email: string, before: Bubble[]) {
    update({ phase: "sending" }, [...before, system(SU.sending)]);
    const result = await sendSignupCodeAction({
      demoId: state.demoId,
      email,
      acceptedTerms: true,
    }).catch(() => ({ ok: false as const, error: "failed" as const }));
    if (result.ok) {
      update({ phase: "code", codeSentAt: Date.now() }, [
        system(result.existing ? SU.existingAccount : fill(SU.codeSent, { email })),
      ]);
    } else if (result.error === "wait") {
      update({ phase: "code" }, [system(fill(SU.wait, { s: String(result.waitSeconds) }))]);
    } else if (result.error === "rate_limited") {
      update({ phase: "email" }, [system(SU.rateLimited)]);
    } else {
      update({ phase: "email" }, [system(SU.failed), system(SU.askEmail)]);
    }
  }

  async function verify(code: string) {
    update({ phase: "verifying" }, [user(code), system(SU.checking)]);
    const result = await verifySignupCodeAction({
      demoId: state.demoId,
      email: state.email,
      code,
      whatsapp: state.whatsapp,
    }).catch(() => ({ ok: false as const, error: "failed" as const }));
    if (result.ok && result.outcome === "created") {
      update({ phase: "created", created: result }, [
        system(fill(SU.created, { nome: result.name })),
      ]);
    } else if (result.ok) {
      update({ phase: "has_business" }, [system(SU.hasBusiness)]);
    } else {
      const message = {
        wrong: SU.wrongCode,
        too_many: SU.tooMany,
        expired: SU.expired,
        rate_limited: SU.accountsLimit,
        invalid: CREATION.error,
        failed: SU.failed,
      }[result.error];
      update({ phase: "code" }, [system(message)]);
    }
  }

  function shortcut(label: string, answer: string) {
    update({}, [user(label), system(answer)]);
  }

  const days = nextDays();
  const theme = brandThemeStyle(niche && ownChat ? niche : PLATFORM);
  const headerName = ownChat ? state.name : "Agendamo";
  const initials = state.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
  const signup = SIGNUP_PHASES.includes(state.phase);
  const composer = composerFor(state.phase);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Criar meu link de agendamento"
      onClick={(e) => e.target === e.currentTarget && closeCreation()}
    >
      <div
        data-theme-scope=""
        style={theme}
        className="flex h-dvh w-full flex-col overflow-hidden bg-background font-sans text-foreground transition-colors duration-500 md:h-[min(780px,92vh)] md:w-[400px] md:rounded-[2.4rem] md:border-[10px] md:border-foreground md:shadow-2xl"
      >
        <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 font-semibold">
            {ownChat ? initials || "A" : "A"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{headerName}</span>
            <span className="block text-xs opacity-85">
              {ownChat ? "Seu chat de agendamento" : "Monte seu link em 1 minuto"}
            </span>
          </span>
          <button
            type="button"
            onClick={closeCreation}
            aria-label="Fechar"
            className="flex size-9 items-center justify-center rounded-full hover:bg-primary-foreground/15"
          >
            <X className="size-5" />
          </button>
        </header>

        {ownChat ? (
          <p className="bg-accent px-4 py-2 text-center text-sm font-medium text-accent-foreground">
            {CREATION.banner}
          </p>
        ) : null}

        <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          {visible.map((bubble, i) => (
            <div
              key={i}
              className={`flex ${bubble.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[15px] shadow-sm motion-safe:animate-in motion-safe:fade-in ${
                  bubble.from === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground"
                }`}
              >
                {bubble.text}
                {bubble.links?.length ? (
                  <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                    {bubble.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline underline-offset-2"
                      >
                        {link.label}
                      </a>
                    ))}
                  </span>
                ) : null}
              </p>
            </div>
          ))}
          {typing ? (
            <div className="flex">
              <span className="rounded-2xl bg-card px-3.5 py-2 text-sm text-muted-foreground shadow-sm">
                digitando…
              </span>
            </div>
          ) : (
            <Options
              state={state}
              days={days}
              onResume={(resume) => {
                const saved = load();
                if (resume && saved) {
                  setRevealed(saved.log.length);
                  setState(saved);
                } else restart();
              }}
              onConfirm={(yes) => {
                if (yes && state.detected) {
                  update({}, [user(CREATION.confirmYes)]);
                  void build(state.detected, null, {
                    ...state,
                    log: [...state.log, user(CREATION.confirmYes)],
                  });
                } else
                  update({ phase: "pick" }, [user(CREATION.confirmNo), system(CREATION.askNiche)]);
              }}
              onPick={(key, label) => {
                if (key === "other")
                  update({ phase: "other" }, [user(label), system(CREATION.askOther)]);
                else if (key === "all") update({ phase: "all" }, [user(label)]);
                else {
                  update({}, [user(label)]);
                  void build(key, null);
                }
              }}
              onService={(service) => {
                const n = niche!;
                update({ phase: "day", service }, [user(service), system(n.chatMessages.askDate)]);
              }}
              onDay={(label) => {
                const n = niche!;
                update({ phase: "time", dateLabel: label }, [
                  user(label),
                  system(
                    fill(n.chatMessages.askTime, {
                      date: label.replace(/^Hoje, /, "").toLowerCase(),
                    }),
                  ),
                ]);
              }}
              onTime={(time) => {
                update({ phase: "done", time }, [
                  user(time),
                  system(CREATION.testDone),
                  system(CREATION.arrives),
                ]);
                if (state.demoId) void recordTestBookingAction(state.demoId);
              }}
              onClaim={claim}
              onRestart={restart}
              onWhatsappLater={() => submitWhatsapp(null)}
              onEmailFix={(accept) => {
                const email = accept ? state.emailFix! : state.email!;
                askTerms(email, [user(accept ? SU.yes : SU.no)]);
              }}
              onAcceptTerms={() => void sendCode(state.email!, [user(SU.acceptTerms)])}
              onResend={() => void sendCode(state.email!, [user(SU.resend)])}
              onChangeEmail={() =>
                update({ phase: "email", codeSentAt: null }, [
                  user(SU.changeEmail),
                  system(SU.askEmail),
                ])
              }
            />
          )}
        </div>

        {ownChat && state.phase !== "done" && !signup ? (
          <div className="border-t bg-card px-3 py-2">
            <button
              type="button"
              onClick={claim}
              className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              {CREATION.claim}
            </button>
          </div>
        ) : null}

        {!ownChat ? (
          <div className="flex gap-2 overflow-x-auto border-t bg-card px-3 pt-2 pb-1">
            <ShortcutChip
              onClick={() =>
                shortcut(CREATION.shortcuts.price.label, CREATION.shortcuts.price.answer)
              }
            >
              {CREATION.shortcuts.price.label}
            </ShortcutChip>
            <ShortcutChip
              onClick={() => shortcut(CREATION.shortcuts.app.label, CREATION.shortcuts.app.answer)}
            >
              {CREATION.shortcuts.app.label}
            </ShortcutChip>
            <a
              href={CREATION.shortcuts.account.href}
              className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap"
            >
              {CREATION.shortcuts.account.label}
            </a>
          </div>
        ) : null}

        {composer ? (
          <Composer
            key={state.phase}
            enabled={!typing}
            {...composer}
            trap={trap}
            onTrap={setTrap}
            onSubmit={(text) => {
              if (state.phase === "name") submitName(text);
              else if (state.phase === "other" && text.trim().length >= 2) {
                const description = text.trim().slice(0, 200);
                update({}, [user(description)]);
                void build("general", description, {
                  ...state,
                  log: [...state.log, user(description)],
                });
              } else if (state.phase === "whatsapp") submitWhatsapp(text.trim());
              else if (state.phase === "email") submitEmail(text);
              else if (state.phase === "code") void verify(text.replace(/\D/g, ""));
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

interface ComposerSettings {
  placeholder: string;
  type?: "text" | "email" | "tel";
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  mask?: (value: string) => string;
}

/** Text answers of each phase (bottom bar); null when the phase is answered with buttons. */
function composerFor(phase: Phase): ComposerSettings | null {
  switch (phase) {
    case "name":
      return { placeholder: CREATION.namePlaceholder, autoComplete: "organization" };
    case "other":
      return { placeholder: CREATION.otherPlaceholder, maxLength: 200 };
    case "whatsapp":
      return {
        placeholder: SU.whatsappPlaceholder,
        type: "tel",
        inputMode: "tel",
        autoComplete: "tel",
        mask: maskBrPhone,
        minLength: 14,
      };
    case "email":
      return {
        placeholder: SU.emailPlaceholder,
        type: "email",
        inputMode: "email",
        autoComplete: "email",
        maxLength: 254,
        minLength: 6,
      };
    case "code":
      return {
        placeholder: SU.codePlaceholder,
        inputMode: "numeric",
        autoComplete: "one-time-code",
        maxLength: 6,
        minLength: 6,
        mask: (value) => value.replace(/\D/g, "").slice(0, 6),
      };
    default:
      return null;
  }
}

function ShortcutChip({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap"
    >
      {children}
    </button>
  );
}

const OPTION =
  "rounded-xl border bg-card px-3 py-2.5 text-left text-[15px] font-medium text-card-foreground shadow-sm transition-colors hover:border-primary";

function Options({
  state,
  days,
  onResume,
  onConfirm,
  onPick,
  onService,
  onDay,
  onTime,
  onClaim,
  onRestart,
  onWhatsappLater,
  onEmailFix,
  onAcceptTerms,
  onResend,
  onChangeEmail,
}: {
  state: CreationState;
  days: string[];
  onResume: (resume: boolean) => void;
  onConfirm: (yes: boolean) => void;
  onPick: (key: string, label: string) => void;
  onService: (service: string) => void;
  onDay: (label: string) => void;
  onTime: (time: string) => void;
  onClaim: () => void;
  onRestart: () => void;
  onWhatsappLater: () => void;
  onEmailFix: (accept: boolean) => void;
  onAcceptTerms: () => void;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  const wrap = (children: React.ReactNode, columns = 1) => (
    <div
      className={`mt-1 grid gap-2 ${columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : ""}`}
    >
      {children}
    </div>
  );
  const niche = state.brandKey ? getNiche(state.brandKey) : null;

  switch (state.phase) {
    case "resume":
      return wrap(
        <>
          <button type="button" className={OPTION} onClick={() => onResume(true)}>
            {CREATION.resumeYes}
          </button>
          <button type="button" className={OPTION} onClick={() => onResume(false)}>
            {CREATION.resumeNo}
          </button>
        </>,
        2,
      );
    case "confirm":
      return wrap(
        <>
          <button type="button" className={OPTION} onClick={() => onConfirm(true)}>
            {CREATION.confirmYes}
          </button>
          <button type="button" className={OPTION} onClick={() => onConfirm(false)}>
            {CREATION.confirmNo}
          </button>
        </>,
        2,
      );
    case "pick":
      return wrap(
        <>
          {CREATION.popular.map((key) => {
            const label = CREATION.chipLabels[key] ?? getNiche(key).niche?.name ?? key;
            return (
              <button key={key} type="button" className={OPTION} onClick={() => onPick(key, label)}>
                {label}
              </button>
            );
          })}
          <button type="button" className={OPTION} onClick={() => onPick("other", CREATION.other)}>
            {CREATION.other}
          </button>
          <button type="button" className={OPTION} onClick={() => onPick("all", CREATION.seeAll)}>
            {CREATION.seeAll}
          </button>
        </>,
        2,
      );
    case "all":
      return (
        <div className="mt-1 flex flex-col gap-3">
          {nichesByGroup().map((section) => (
            <div key={section.group}>
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {section.label}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {section.niches.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    className={OPTION}
                    onClick={() => onPick(b.key, b.niche!.name)}
                  >
                    {b.niche!.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button type="button" className={OPTION} onClick={() => onPick("other", CREATION.other)}>
            {CREATION.other}
          </button>
        </div>
      );
    case "service":
      return wrap(
        niche!.suggestedServices.map((s) => (
          <button key={s.name} type="button" className={OPTION} onClick={() => onService(s.name)}>
            {s.name}{" "}
            <span className="font-normal text-muted-foreground">
              · {formatDuration(s.durationMinutes)}
            </span>
          </button>
        )),
      );
    case "day":
      return wrap(
        days.map((label) => (
          <button key={label} type="button" className={OPTION} onClick={() => onDay(label)}>
            {label}
          </button>
        )),
        2,
      );
    case "time":
      return wrap(
        fakeTimes(state.dateLabel ?? "").map((time) => (
          <button
            key={time}
            type="button"
            className={`${OPTION} text-center`}
            onClick={() => onTime(time)}
          >
            {time}
          </button>
        )),
        3,
      );
    case "done":
      return (
        <div className="mt-1 flex flex-col gap-3">
          <ArrivesPreview state={state} />
          <button
            type="button"
            onClick={onClaim}
            className="h-12 rounded-xl bg-primary text-base font-semibold text-primary-foreground"
          >
            {CREATION.claim}
          </button>
          <button type="button" className={`${OPTION} text-center`} onClick={onRestart}>
            {CREATION.restart}
          </button>
        </div>
      );
    case "whatsapp":
      return wrap(
        <button type="button" className={`${OPTION} text-center`} onClick={onWhatsappLater}>
          {SU.later}
        </button>,
      );
    case "email-fix":
      return wrap(
        <>
          <button type="button" className={OPTION} onClick={() => onEmailFix(true)}>
            {SU.yes}
          </button>
          <button type="button" className={OPTION} onClick={() => onEmailFix(false)}>
            {SU.no}
          </button>
        </>,
        2,
      );
    case "terms":
      return wrap(
        <button
          type="button"
          onClick={onAcceptTerms}
          className="h-12 rounded-xl bg-primary text-base font-semibold text-primary-foreground"
        >
          {SU.acceptTerms}
        </button>,
      );
    case "code":
      return wrap(
        <>
          <ResendButton sentAt={state.codeSentAt} onResend={onResend} />
          <button type="button" className={`${OPTION} text-center`} onClick={onChangeEmail}>
            {SU.changeEmail}
          </button>
        </>,
        2,
      );
    case "created":
      return state.created ? <CreatedCard created={state.created} /> : null;
    case "has_business":
      return wrap(
        <GoPanelButton className="flex h-12 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground" />,
      );
    default:
      return null;
  }
}

/**
 * Opens the panel with a full load on purpose: the session has just started and the business's
 * niche (brand) may differ from the page's, so the panel layout must render from scratch.
 */
function GoPanelButton({ className }: { className: string }) {
  return (
    <button
      type="button"
      className={className}
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      onClick={() => window.location.assign("/painel")}
    >
      {SU.goPanel}
    </button>
  );
}

/** "Reenviar código", available 30 s after the last code. */
function ResendButton({ sentAt, onResend }: { sentAt: number | null; onResend: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const left = sentAt ? Math.max(0, Math.ceil((sentAt + 30_000 - now) / 1000)) : 0;
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [left, now]);
  return (
    <button
      type="button"
      disabled={left > 0}
      onClick={onResend}
      className={`${OPTION} text-center disabled:opacity-60`}
    >
      {left > 0 ? fill(SU.resendIn, { s: String(left) }) : SU.resend}
    </button>
  );
}

/** The link is live: copy, open the panel, QR code and next steps. */
function CreatedCard({
  created,
}: {
  created: { name: string; slug: string; pageUrl: string; qr: string };
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const reply = fill(SU.whatsappReply, { link: created.pageUrl });
  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    setCopied(key);
  };
  return (
    <div className="mt-1 flex flex-col gap-3">
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 text-center shadow-sm">
        <a
          href={created.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold break-all text-primary"
        >
          {created.pageUrl.replace(/^https?:\/\//, "").split("?")[0]}
        </a>
        {/* eslint-disable-next-line @next/next/no-img-element -- generated QR (data URL) */}
        <img src={created.qr} alt="QR code do seu link" width={160} height={160} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`${OPTION} flex items-center justify-center gap-1.5`}
          onClick={() => copy(created.pageUrl, "link")}
        >
          {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied === "link" ? SU.copied : SU.copyLink}
        </button>
        <GoPanelButton className="flex items-center justify-center rounded-xl bg-primary px-3 text-[15px] font-semibold text-primary-foreground" />
      </div>
      <div className="rounded-2xl border bg-card p-4 text-sm shadow-sm">
        <p className="mb-2 font-semibold">{SU.nextStepsTitle}</p>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-muted-foreground">
          {SU.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-3 rounded-lg bg-muted p-2.5 text-card-foreground">{reply}</p>
        <button
          type="button"
          className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary"
          onClick={() => copy(reply, "reply")}
        >
          {copied === "reply" ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied === "reply" ? SU.copied : SU.copyReply}
        </button>
      </div>
    </div>
  );
}

/** "É isso que chega para você": the owner's notification and the new item in her agenda. */
function ArrivesPreview({ state }: { state: CreationState }) {
  return (
    <div className="flex flex-col gap-2" aria-label="Prévia do aviso e da agenda">
      <div className="flex items-start gap-3 rounded-2xl border bg-card p-3 shadow-lg motion-safe:animate-in motion-safe:slide-in-from-top-4 motion-safe:duration-500">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Bell className="size-4" />
        </span>
        <span className="min-w-0 text-sm">
          <span className="block font-semibold">Novo agendamento</span>
          <span className="block text-muted-foreground">
            {state.service} · {state.dateLabel} às {state.time}
          </span>
        </span>
      </div>
      <div className="rounded-2xl border bg-card p-3 text-sm shadow-sm">
        <p className="mb-2 flex items-center gap-2 font-semibold">
          <CalendarCheck className="size-4 text-primary" /> Sua agenda
        </p>
        <div className="flex items-center gap-3 rounded-lg bg-accent px-3 py-2 text-accent-foreground">
          <span className="font-semibold">{state.time}</span>
          <span className="min-w-0 truncate">{state.service} · Cliente de teste</span>
        </div>
      </div>
    </div>
  );
}

function Composer({
  enabled,
  placeholder,
  type = "text",
  inputMode = "text",
  autoComplete = "off",
  maxLength = 120,
  minLength = 2,
  mask,
  trap,
  onTrap,
  onSubmit,
}: ComposerSettings & {
  enabled: boolean;
  trap: string;
  onTrap: (value: string) => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <form
      className="flex items-center gap-2 border-t bg-card p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!enabled || text.trim().length < minLength) return;
        onSubmit(text);
        setText("");
      }}
    >
      {/* Honeypot: invisible to people, filled by robots. */}
      <input
        type="text"
        name="website"
        value={trap}
        onChange={(e) => onTrap(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="sr-only"
      />
      <input
        value={text}
        onChange={(e) => setText(mask ? mask(e.target.value) : e.target.value)}
        disabled={!enabled}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-label={placeholder}
        placeholder={enabled ? placeholder : "Escolha uma opção acima"}
        className="h-11 min-w-0 flex-1 rounded-full border bg-background px-4 text-[15px] outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!enabled}
        aria-label="Enviar"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
      >
        <Send className="size-4" />
      </button>
    </form>
  );
}
