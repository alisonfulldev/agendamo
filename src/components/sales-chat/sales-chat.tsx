"use client";

import { ArrowLeft, Check, Copy, RotateCcw, Send } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { getBrand, getNiche, NICHES, PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import {
  chatSaleStatusAction,
  enterPanelAction,
  renewChatSalePixAction,
  startChatSaleAction,
  type ChatPix,
} from "@/app/conheca/actions";
import { detectNiche } from "@/content/creation";
import { firstPaymentText, SALES_CHAT as T } from "@/content/sales-chat";
import { EMAIL_PATTERN, suggestEmailFix } from "@/lib/email-typos";
import { formatBRL } from "@/lib/money";
import { maskBrPhone, normalizeBrPhone } from "@/lib/phone";
import { validCnpj, validCpf } from "@/lib/pix";

type Phase =
  | "name"
  | "confirm"
  | "pick"
  | "models"
  | "how"
  | "plan"
  | "cycle"
  | "payer"
  | "email"
  | "email-fix"
  | "whatsapp"
  | "document"
  | "summary"
  | "generating"
  | "pix"
  | "paid";

type Template = "vibrant" | "elegant";
type Tier = "site" | "complete";
type Cycle = "monthly" | "yearly";

interface Bubble {
  from: "system" | "user";
  text: string;
}

interface Paid {
  chatUrl: string;
  siteUrl: string | null;
  email: string;
}

interface SalesState {
  phase: Phase;
  log: Bubble[];
  name: string;
  detected: string | null;
  nicheKey: string | null;
  template: Template | null;
  tier: Tier | null;
  cycle: Cycle | null;
  payerName: string;
  email: string;
  emailFix: string | null;
  whatsapp: string;
  token: string | null;
  pix: ChatPix | null;
  expired: boolean;
  paid: Paid | null;
  /** The conversation before each answer: "Voltar" restores the last one. */
  history: SalesState[];
  /** Changing the plan from the summary: back to the summary after the cycle. */
  editing: boolean;
}

/** Saved in this browser so whoever leaves comes back where she stopped (never the CPF). */
const STORAGE_KEY = "mc_sales_chat_v1";
const TYPING_MS = 450;
const POLL_MS = 4000;

const system = (text: string): Bubble => ({ from: "system", text });
const user = (text: string): Bubble => ({ from: "user", text });
const fill = (template: string, vars: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");

function fresh(): SalesState {
  return {
    phase: "name",
    log: [system(T.greeting), system(T.askName)],
    name: "",
    detected: null,
    nicheKey: null,
    template: null,
    tier: null,
    cycle: null,
    payerName: "",
    email: "",
    emailFix: null,
    whatsapp: "",
    token: null,
    pix: null,
    expired: false,
    paid: null,
    history: [],
    editing: false,
  };
}

/** The state before an answer, kept for "Voltar" (without its own history). */
const snapshot = (s: SalesState): SalesState => ({ ...s, history: [] });

/** Everything she typed and chose, to confirm before the Pix. */
function summaryText(s: SalesState): string {
  const tier = s.tier ?? "site";
  return fill(T.summary, {
    business: s.name,
    plan: T.plans[tier].label,
    price: firstPaymentText(tier, s.cycle ?? "monthly"),
    payer: s.payerName,
    email: s.email,
    whatsapp: s.whatsapp,
  });
}

function load(): SalesState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SalesState;
    const saved = { ...parsed, history: parsed.history ?? [], editing: false };
    // The document is never saved: a conversation left at the summary asks it again.
    if (saved.phase === "summary" || saved.phase === "generating")
      return { ...saved, phase: "document", log: [...saved.log, system(T.askDocument)] };
    return saved;
  } catch {
    return null;
  }
}

function save(state: SalesState | null) {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the conversation still works, it just does not survive closing.
  }
}

/** Example-site route of a niche ("Outra área" shows the consulting example). */
function exampleRoute(nicheKey: string): string {
  return getBrand(nicheKey)?.niche?.route ?? getBrand("consulting")?.niche?.route ?? "consultoria";
}

function nicheLabel(key: string): string {
  return getNiche(key).niche?.name.toLowerCase() ?? T.other.toLowerCase();
}

const NICHE_OPTIONS = [...NICHES]
  .sort((a, b) => a.niche!.name.localeCompare(b.niche!.name, "pt-BR"))
  .map((b) => ({ key: b.key, label: b.niche!.name }));

/**
 * The sales chat (/conheca): business name → niche → the two example sites with her name (opened
 * over the chat, "Voltar para a conversa" brings her back) → how it works → plan and cycle →
 * payer data → Pix of the first payment → paid: her site, her link and the panel.
 */
export function SalesChat({
  initialName,
  initialNiche,
}: {
  initialName: string | null;
  initialNiche: string | null;
}) {
  const [state, setState] = useState<SalesState>(fresh);
  const [revealed, setRevealed] = useState(2);
  const [document, setDocument] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restores a conversation left halfway (after the first render: storage is browser-only).
  useEffect(() => {
    const saved = load();
    const timer = setTimeout(() => {
      if (saved) {
        setState(saved);
        setRevealed(saved.log.length);
      } else if (initialName) {
        start(initialName, initialNiche);
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on arrival
  }, []);

  useEffect(() => save(state), [state]);

  // One system bubble at a time, with "digitando…" between them.
  const typing = revealed < state.log.length;
  useEffect(() => {
    if (!typing) return;
    const next = state.log[revealed];
    const timer = setTimeout(
      () => setRevealed((n) => n + 1),
      next?.from === "user" ? 0 : TYPING_MS,
    );
    return () => clearTimeout(timer);
  }, [typing, revealed, state.log]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [revealed, state.phase, typing]);

  // Every answer (a user bubble) keeps the state before it, for "Voltar".
  const update = useCallback((patch: Partial<SalesState>, bubbles: Bubble[] = []) => {
    setState((s) => ({
      ...s,
      ...patch,
      history: bubbles.some((b) => b.from === "user") ? [...s.history, snapshot(s)] : s.history,
      log: [...s.log, ...bubbles],
    }));
  }, []);

  function start(name: string, niche: string | null) {
    const clean = name.trim().slice(0, 80);
    const detected = niche ?? detectNiche(clean);
    if (detected) {
      update({ name: clean, detected, phase: "confirm" }, [
        user(clean),
        system(fill(T.confirmNiche, { niche: nicheLabel(detected) })),
      ]);
    } else {
      update({ name: clean, detected: null, phase: "pick" }, [user(clean), system(T.askNiche)]);
    }
  }

  /** Undoes the last answer: the question comes back as it was. */
  function back() {
    const previous = state.history.at(-1);
    if (!previous) return;
    const restored = { ...previous, history: state.history.slice(0, -1) };
    setState(restored);
    setRevealed(restored.log.length);
    setNotice(null);
  }

  const canGoBack =
    state.history.length > 0 &&
    !typing &&
    state.phase !== "generating" &&
    state.phase !== "pix" &&
    state.phase !== "paid";

  function chooseNiche(key: string, label: string) {
    update({ nicheKey: key, phase: "models" }, [
      user(label),
      system(fill(T.models, { name: state.name })),
    ]);
  }

  function exampleUrl(template: Template): string {
    const params = new URLSearchParams({ nome: state.name });
    if (template === "elegant") params.set("modelo", "elegante");
    return `/exemplo/${exampleRoute(state.nicheKey ?? "general")}?${params.toString()}`;
  }

  // Waits for the payment while the Pix is shown.
  const token = state.token;
  const waiting = state.phase === "pix" && !state.expired;
  useEffect(() => {
    if (!waiting || !token) return;
    const timer = setInterval(async () => {
      const status = await chatSaleStatusAction(token).catch(() => null);
      if (status?.status === "paid") {
        const what = status.siteUrl ? T.paidSite : T.paidChat;
        update({ phase: "paid", paid: status }, [
          system(fill(T.paid, { what })),
          system(fill(T.paidEmail, { email: status.email })),
          system(T.loginLater),
        ]);
      } else if (status?.status === "awaiting_payment" && status.expired) {
        update({ expired: true }, [system(T.expired)]);
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [waiting, token, update]);

  async function generate() {
    if (!state.nicheKey || !state.tier || !state.cycle || !state.template) return;
    update({ phase: "generating" }, [user(T.generate)]);
    const result = await startChatSaleAction({
      businessName: state.name,
      nicheKey: state.nicheKey,
      payerName: state.payerName,
      email: state.email,
      whatsapp: state.whatsapp,
      cpfCnpj: document,
      tier: state.tier,
      cycle: state.cycle,
      template: state.template,
      acceptedTerms: true,
    }).catch(() => ({ ok: false as const, error: "failed" as const }));
    if (result.ok) {
      setDocument("");
      update({ phase: "pix", token: result.token, pix: result.pix, expired: false }, [
        system(T.pix),
      ]);
      return;
    }
    if (result.error === "has_account" || result.error === "has_business") {
      update({ phase: "email" }, [system(T.errors[result.error]), system(T.askEmail)]);
    } else {
      update({ phase: "summary" }, [
        system(result.error === "limit" ? T.errors.limit : T.errors.failed),
      ]);
    }
  }

  async function renew() {
    if (!state.token) return;
    const status = await renewChatSalePixAction(state.token).catch(() => null);
    if (status?.status === "awaiting_payment" && status.pix && !status.expired) {
      update({ pix: status.pix, expired: false }, [system(T.pix)]);
    }
  }

  async function enterPanel() {
    if (!state.token) return;
    // On success the server sends her to the panel (with the session); the paid conversation
    // stays saved, so coming back to this link shows it again.
    const result = await enterPanelAction(state.token).catch(() => ({ ok: false }));
    if (!result?.ok) setNotice(T.errors.login);
  }

  function restart() {
    save(null);
    setDocument("");
    setPreview(null);
    setNotice(null);
    setState(fresh());
    setRevealed(2);
  }

  function submitText(text: string) {
    const value = text.trim();
    switch (state.phase) {
      case "name":
        start(value, null);
        return;
      case "payer":
        update({ payerName: value, phase: "email" }, [user(value), system(T.askEmail)]);
        return;
      case "email": {
        const email = value.toLowerCase();
        if (!EMAIL_PATTERN.test(email)) {
          update({}, [user(value), system(T.emailInvalid)]);
          return;
        }
        const fix = suggestEmailFix(email);
        if (fix) {
          update({ email, emailFix: fix, phase: "email-fix" }, [
            user(value),
            system(fill(T.emailFix, { email: fix })),
          ]);
          return;
        }
        update({ email, phase: "whatsapp" }, [user(value), system(T.askWhatsapp)]);
        return;
      }
      case "whatsapp": {
        if (!normalizeBrPhone(value)) {
          update({}, [user(value), system(T.whatsappInvalid)]);
          return;
        }
        update({ whatsapp: value, phase: "document" }, [user(value), system(T.askDocument)]);
        return;
      }
      case "document": {
        const digits = value.replace(/\D/g, "");
        // The CPF stays out of the conversation history (and of this browser's storage).
        const masked = `${"•".repeat(Math.max(0, digits.length - 3))}${digits.slice(-3)}`;
        if (!(validCpf(digits) || validCnpj(digits))) {
          update({}, [user(masked), system(T.documentInvalid)]);
          return;
        }
        setDocument(digits);
        update({ phase: "summary", editing: false }, [user(masked), system(summaryText(state))]);
        return;
      }
    }
  }

  const visible = state.log.slice(0, revealed);
  const composer = composerFor(state.phase);

  return (
    <div
      data-theme-scope=""
      data-palette="meetchat"
      style={brandThemeStyle(PLATFORM)}
      className="mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background font-sans text-foreground md:border-x"
    >
      <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
        <img
          src={PLATFORM.logo}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-xl"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold">{T.headerTitle}</span>
          <span className="block text-sm opacity-85">{T.headerSubtitle}</span>
        </span>
        {state.log.length > 2 && state.phase !== "paid" ? (
          <button
            type="button"
            onClick={restart}
            aria-label={T.restart}
            title={T.restart}
            className="flex size-9 items-center justify-center rounded-full hover:bg-primary-foreground/15"
          >
            <RotateCcw className="size-5" />
          </button>
        ) : null}
      </header>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {visible.map((bubble, i) => (
          <div
            key={i}
            className={`flex ${bubble.from === "user" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[17px] leading-snug whitespace-pre-line shadow-sm motion-safe:animate-in motion-safe:fade-in ${
                bubble.from === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground"
              }`}
            >
              {bubble.text}
            </p>
          </div>
        ))}

        {typing ? (
          <div className="flex">
            <span className="rounded-2xl bg-card px-4 py-2.5 text-[15px] text-muted-foreground shadow-sm">
              digitando…
            </span>
          </div>
        ) : (
          <Options
            state={state}
            onConfirm={(yes) => {
              if (yes && state.detected) chooseNiche(state.detected, T.yes);
              else update({ phase: "pick" }, [user(T.no), system(T.askNiche)]);
            }}
            onNiche={chooseNiche}
            onOpenModel={(template) => setPreview(exampleUrl(template))}
            onModel={(template) =>
              update({ template, phase: "how" }, [
                user(fill(T.modelChosen, { model: T.modelNames[template] })),
                ...T.how.map(system),
              ])
            }
            onPresentation={() =>
              setPreview(`/apresentacao?ramo=${exampleRoute(state.nicheKey ?? "general")}`)
            }
            onHowNext={() => update({ phase: "plan" }, [user(T.howNext), system(T.askPlan)])}
            onPlan={(tier) =>
              update({ tier, phase: "cycle" }, [user(T.plans[tier].label), system(T.askCycle)])
            }
            onCycle={(cycle) => {
              const answer = user(T.cycles[cycle].label);
              if (!state.editing) {
                update({ cycle, phase: "payer" }, [answer, system(T.askPayer)]);
              } else if (document) {
                // Plan changed from the summary: the data is already here.
                update({ cycle, phase: "summary", editing: false }, [
                  answer,
                  system(summaryText({ ...state, cycle })),
                ]);
              } else {
                update({ cycle, phase: "document", editing: false }, [
                  answer,
                  system(T.askDocument),
                ]);
              }
            }}
            onChangePlan={() =>
              update({ phase: "plan", editing: true }, [user(T.changePlan), system(T.askPlan)])
            }
            onChangeData={() =>
              update({ phase: "payer", editing: false }, [user(T.changeData), system(T.askPayer)])
            }
            onEmailFix={(accept) => {
              const email = accept ? state.emailFix! : state.email;
              update({ email, emailFix: null, phase: "whatsapp" }, [
                user(accept ? T.yes : T.no),
                system(T.askWhatsapp),
              ]);
            }}
            onGenerate={() => void generate()}
            onRenew={() => void renew()}
            onEnterPanel={() => void enterPanel()}
            notice={notice}
          />
        )}
      </div>

      {canGoBack ? (
        <div className="border-t bg-card px-3 pt-2">
          <button
            type="button"
            onClick={back}
            className="flex min-h-9 items-center gap-1.5 rounded-full px-2 text-[15px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {T.back}
          </button>
        </div>
      ) : null}

      {composer ? (
        <Composer key={state.phase} enabled={!typing} settings={composer} onSubmit={submitText} />
      ) : null}

      {preview ? <Preview url={preview} onClose={() => setPreview(null)} /> : null}
    </div>
  );
}

export interface ComposerSettings {
  placeholder: string;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
  mask?: (value: string) => string;
  minLength?: number;
}

function composerFor(phase: Phase): ComposerSettings | null {
  switch (phase) {
    case "name":
      return { placeholder: T.namePlaceholder, autoComplete: "organization", minLength: 2 };
    case "payer":
      return { placeholder: T.payerPlaceholder, autoComplete: "name", minLength: 3 };
    case "email":
      return {
        placeholder: T.emailPlaceholder,
        type: "email",
        inputMode: "email",
        autoComplete: "email",
      };
    case "whatsapp":
      return {
        placeholder: T.whatsappPlaceholder,
        type: "tel",
        inputMode: "tel",
        autoComplete: "tel",
        mask: maskBrPhone,
      };
    case "document":
      return {
        placeholder: T.documentPlaceholder,
        inputMode: "numeric",
        autoComplete: "off",
        minLength: 11,
      };
    default:
      return null;
  }
}

export function Composer({
  enabled,
  settings,
  onSubmit,
}: {
  enabled: boolean;
  settings: ComposerSettings;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const min = settings.minLength ?? 1;
  return (
    <form
      className="flex items-center gap-2 border-t bg-card p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!enabled || text.trim().length < min) return;
        onSubmit(text);
        setText("");
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(settings.mask ? settings.mask(e.target.value) : e.target.value)}
        disabled={!enabled}
        type={settings.type ?? "text"}
        inputMode={settings.inputMode}
        autoComplete={settings.autoComplete}
        maxLength={120}
        aria-label={settings.placeholder}
        placeholder={settings.placeholder}
        className="h-12 min-w-0 flex-1 rounded-full border bg-background px-4 text-[17px] outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!enabled}
        aria-label="Enviar"
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
      >
        <Send className="size-4" />
      </button>
    </form>
  );
}

export const choice =
  "rounded-full border-2 border-primary bg-card px-4 py-2.5 text-[16px] font-semibold text-primary hover:bg-primary hover:text-primary-foreground";
export const primary =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[16px] font-semibold text-primary-foreground";

function Options({
  state,
  notice,
  onConfirm,
  onNiche,
  onOpenModel,
  onModel,
  onPresentation,
  onHowNext,
  onPlan,
  onCycle,
  onEmailFix,
  onGenerate,
  onChangePlan,
  onChangeData,
  onRenew,
  onEnterPanel,
}: {
  state: SalesState;
  notice: string | null;
  onConfirm: (yes: boolean) => void;
  onNiche: (key: string, label: string) => void;
  onOpenModel: (template: Template) => void;
  onModel: (template: Template) => void;
  onPresentation: () => void;
  onHowNext: () => void;
  onPlan: (tier: Tier) => void;
  onCycle: (cycle: Cycle) => void;
  onEmailFix: (accept: boolean) => void;
  onGenerate: () => void;
  onChangePlan: () => void;
  onChangeData: () => void;
  onRenew: () => void;
  onEnterPanel: () => void;
}) {
  switch (state.phase) {
    case "confirm":
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={choice} onClick={() => onConfirm(true)}>
            {T.yes}
          </button>
          <button type="button" className={choice} onClick={() => onConfirm(false)}>
            {T.no}
          </button>
        </div>
      );
    case "pick":
      return (
        <div className="flex flex-wrap justify-end gap-2">
          {NICHE_OPTIONS.map((n) => (
            <button
              key={n.key}
              type="button"
              className={choice}
              onClick={() => onNiche(n.key, n.label)}
            >
              {n.label}
            </button>
          ))}
          <button type="button" className={choice} onClick={() => onNiche("general", T.other)}>
            {T.other}
          </button>
        </div>
      );
    case "models":
      return (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            {(["vibrant", "elegant"] as const).map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => onOpenModel(template)}
                className="flex flex-col gap-1 rounded-2xl border bg-card p-3 text-left shadow-sm hover:border-primary"
              >
                <span
                  aria-hidden
                  className={`flex h-20 items-end rounded-xl p-2 text-xs font-semibold ${
                    template === "vibrant"
                      ? "bg-primary text-primary-foreground"
                      : "border bg-background font-serif text-foreground"
                  }`}
                >
                  {state.name}
                </span>
                <span className="font-semibold">{T.modelNames[template]}</span>
                <span className="text-sm text-muted-foreground">{T.modelHints[template]}</span>
                <span className="text-sm font-semibold text-primary">{T.modelOpen} →</span>
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">{T.modelTip}</p>
          <p className="max-w-[85%] rounded-2xl bg-card px-4 py-2.5 text-[17px] shadow-sm">
            {T.askModel}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            {(["vibrant", "elegant"] as const).map((template) => (
              <button
                key={template}
                type="button"
                className={choice}
                onClick={() => onModel(template)}
              >
                {T.modelNames[template].split(" · ")[0]}
              </button>
            ))}
          </div>
        </div>
      );
    case "how":
      return (
        <div className="flex flex-col gap-2">
          <button type="button" className={primary} onClick={onHowNext}>
            {T.howNext}
          </button>
          <button
            type="button"
            onClick={onPresentation}
            className="min-h-11 rounded-xl border bg-card text-[15px] font-medium"
          >
            {T.presentation}
          </button>
        </div>
      );
    case "plan":
      return (
        <div className="flex flex-col gap-2">
          {(["site", "complete"] as const).map((tier) => {
            const plan = T.plans[tier];
            return (
              <button
                key={tier}
                type="button"
                onClick={() => onPlan(tier)}
                className={`flex flex-col gap-0.5 rounded-2xl border-2 bg-card p-4 text-left shadow-sm hover:border-primary ${
                  plan.badge ? "border-primary" : "border-border"
                }`}
              >
                {plan.badge ? (
                  <span className="w-fit rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                    {plan.badge}
                  </span>
                ) : null}
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-semibold">{plan.label}</span>
                  <span className="font-semibold text-primary">{plan.price}</span>
                </span>
                <span className="text-sm text-muted-foreground">{plan.text}</span>
              </button>
            );
          })}
        </div>
      );
    case "cycle":
      return (
        <div className="grid grid-cols-2 gap-2">
          {(["monthly", "yearly"] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => onCycle(cycle)}
              className="flex flex-col rounded-2xl border-2 bg-card p-3 text-left shadow-sm hover:border-primary"
            >
              <span className="font-semibold">{T.cycles[cycle].label}</span>
              <span className="text-sm font-semibold text-primary">
                {firstPaymentText(state.tier ?? "site", cycle)}
              </span>
              <span className="text-xs text-muted-foreground">{T.cycles[cycle].hint}</span>
            </button>
          ))}
        </div>
      );
    case "email-fix":
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={choice} onClick={() => onEmailFix(true)}>
            {T.yes}
          </button>
          <button type="button" className={choice} onClick={() => onEmailFix(false)}>
            {T.no}
          </button>
        </div>
      );
    case "summary":
      return (
        <div className="flex flex-col gap-2">
          <button type="button" className={primary} onClick={onGenerate}>
            {T.generate}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onChangePlan}
              className="min-h-11 rounded-xl border bg-card text-[15px] font-medium"
            >
              {T.changePlan}
            </button>
            <button
              type="button"
              onClick={onChangeData}
              className="min-h-11 rounded-xl border bg-card text-[15px] font-medium"
            >
              {T.changeData}
            </button>
          </div>
          <a
            href="/termos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-sm text-muted-foreground underline underline-offset-2"
          >
            {T.terms}
          </a>
        </div>
      );
    case "generating":
      return <p className="text-center text-muted-foreground">{T.generating}</p>;
    case "pix":
      return state.pix ? (
        <PixCard pix={state.pix} expired={state.expired} onRenew={onRenew} />
      ) : null;
    case "paid":
      return state.paid ? (
        <div className="flex flex-col gap-2">
          <button type="button" className={primary} onClick={onEnterPanel}>
            {T.openPanel}
          </button>
          <Link
            href="/entrar"
            className="flex min-h-11 items-center justify-center rounded-xl border bg-card font-medium"
          >
            {T.signIn}
          </Link>
          {state.paid.siteUrl ? (
            <a
              href={state.paid.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center rounded-xl border bg-card font-medium"
            >
              {T.openSite}
            </a>
          ) : null}
          <a
            href={state.paid.chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center rounded-xl border bg-card font-medium"
          >
            {T.openChat}
          </a>
          {notice ? (
            <p role="status" className="text-center text-sm text-muted-foreground">
              {notice}{" "}
              <Link href="/entrar" className="font-medium text-primary underline">
                /entrar
              </Link>
            </p>
          ) : null}
        </div>
      ) : null;
    default:
      return null;
  }
}

export function PixCard({
  pix,
  expired,
  onRenew,
}: {
  pix: ChatPix;
  expired: boolean;
  onRenew: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (expired) {
    return (
      <button type="button" className={primary} onClick={onRenew}>
        {T.renew}
      </button>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <p className="text-2xl font-bold">{formatBRL(pix.valueCents)}</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL from Asaas */}
      <img
        src={pix.image}
        alt="QR code do Pix"
        width={208}
        height={208}
        className="size-52 rounded-lg"
      />
      <button
        type="button"
        className={primary}
        onClick={() => {
          void navigator.clipboard?.writeText(pix.payload).then(() => setCopied(true));
        }}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? T.pixCopied : T.pixCopy}
      </button>
      <p className="text-sm text-muted-foreground motion-safe:animate-pulse">{T.waiting}</p>
    </div>
  );
}

/** Example site or presentation over the chat, with the way back always at the top. */
export function Preview({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        className="flex min-h-12 shrink-0 items-center justify-center gap-2 bg-primary px-4 text-[16px] font-semibold text-primary-foreground"
      >
        <ArrowLeft className="size-5" />
        {T.modelBack.replace("← ", "")}
      </button>
      <iframe src={url} title="Prévia do site" className="min-h-0 w-full flex-1 border-0" />
    </div>
  );
}
