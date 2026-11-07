"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { getNiche, NICHES, PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { startWebSaleAction } from "@/app/criar-site/actions";
import {
  chatSaleStatusAction,
  enterPanelAction,
  renewChatSalePixAction,
  type ChatPix,
} from "@/app/conheca/actions";
import {
  choice,
  Composer,
  PixCard,
  Preview,
  primary,
  type ComposerSettings,
} from "@/components/sales-chat/sales-chat";
import { detectNiche } from "@/content/creation";
import { SALES_CHAT as T } from "@/content/sales-chat";
import { salesWhatsappHref } from "@/content/contact";
import { WEB_CHAT as W, webFirstPayment } from "@/content/web-sales-chat";
import { WEB_SITE_TEMPLATES, WEB_STORE_TEMPLATES, type WebTemplate } from "@/lib/db/types";
import { EMAIL_PATTERN, suggestEmailFix } from "@/lib/email-typos";
import { maskBrPhone, normalizeBrPhone } from "@/lib/phone";
import { validCnpj, validCpf } from "@/lib/pix";

type Phase =
  | "need"
  | "name"
  | "confirm"
  | "pick"
  | "models"
  | "custom"
  | "how"
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

type Product = "site" | "store";
type Cycle = "monthly" | "yearly";

interface Bubble {
  from: "system" | "user";
  text: string;
}

interface State {
  phase: Phase;
  log: Bubble[];
  product: Product | null;
  name: string;
  /** Her niche (colors, photos and services of the site); null = generic. */
  nicheKey: string | null;
  /** Niche found in the business name, to confirm. */
  detected: string | null;
  template: WebTemplate | null;
  customSite: boolean;
  cycle: Cycle | null;
  payerName: string;
  email: string;
  emailFix: string | null;
  whatsapp: string;
  token: string | null;
  pix: ChatPix | null;
  expired: boolean;
  paid: { siteUrl: string | null; email: string } | null;
  /** The conversation before each answer: "Voltar" restores the last one. */
  history: State[];
}

/** Niches to pick, by name ("Outra área" = the generic site). */
const NICHE_OPTIONS = [...NICHES]
  .sort((a, b) => a.niche!.name.localeCompare(b.niche!.name, "pt-BR"))
  .map((b) => ({ key: b.key, label: b.niche!.name }));

function nicheLabel(key: string): string {
  return getNiche(key).niche?.name.toLowerCase() ?? T.other.toLowerCase();
}

/** Saved in this browser so whoever leaves comes back where she stopped (never the CPF). */
const STORAGE_KEY = "mc_web_chat_v1";
const TYPING_MS = 450;
const POLL_MS = 4000;

/** Names of the templates in the chat (the panel uses the same). */
const TEMPLATE_NAMES: Record<WebTemplate, { name: string; hint: string }> = {
  site_bold: { name: "Impacto", hint: "Foto grande e cores fortes" },
  site_clean: { name: "Clean", hint: "Claro e sofisticado" },
  store_showcase: { name: "Vitrine", hint: "Produtos em destaque" },
  store_clean: { name: "Boutique", hint: "Fotos grandes, estilo elegante" },
};

const system = (text: string): Bubble => ({ from: "system", text });
const user = (text: string): Bubble => ({ from: "user", text });
const fill = (template: string, vars: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
const snapshot = (s: State): State => ({ ...s, history: [] });

function fresh(): State {
  return {
    phase: "need",
    log: [system(W.greeting), system(W.askNeed)],
    product: null,
    name: "",
    nicheKey: null,
    detected: null,
    template: null,
    customSite: false,
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
  };
}

function load(): State | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as State;
    // The document is never saved: a conversation left at the summary asks it again.
    if (saved.phase === "summary" || saved.phase === "generating")
      return { ...saved, phase: "document", log: [...saved.log, system(T.askDocument)] };
    return saved;
  } catch {
    return null;
  }
}

function save(state: State | null) {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the conversation still works, it just does not survive closing.
  }
}

function planName(s: Pick<State, "product" | "customSite">): string {
  const plan = s.product === "store" ? W.planStore : W.planSite;
  return s.customSite ? fill(W.planCustom, { plan }) : plan;
}

function summaryText(s: State): string {
  return fill(W.summary, {
    business: s.name,
    plan: planName(s),
    price: webFirstPayment(s.cycle ?? "monthly", s.customSite),
    payer: s.payerName,
    email: s.email,
    whatsapp: s.whatsapp,
  });
}

/**
 * Sales chat of "Site ou Loja" (/criar-site): what she wants (site, store or booking, which goes
 * to /conheca) → business name → the two templates with her name (over the chat) or the custom
 * site → how it works → month or year → payer data → summary → Pix → paid: site and panel.
 */
export function WebSalesChat({ initialName }: { initialName: string | null }) {
  const [state, setState] = useState<State>(fresh);
  const [revealed, setRevealed] = useState(2);
  const [document, setDocument] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = load();
    const timer = setTimeout(() => {
      if (saved) {
        setState(saved);
        setRevealed(saved.log.length);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => save(state), [state]);

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
  const update = useCallback((patch: Partial<State>, bubbles: Bubble[] = []) => {
    setState((s) => ({
      ...s,
      ...patch,
      history: bubbles.some((b) => b.from === "user") ? [...s.history, snapshot(s)] : s.history,
      log: [...s.log, ...bubbles],
    }));
  }, []);

  function back() {
    const previous = state.history.at(-1);
    if (!previous) return;
    const restored = { ...previous, history: state.history.slice(0, -1) };
    setState(restored);
    setRevealed(restored.log.length);
    setNotice(null);
  }

  function restart() {
    save(null);
    setDocument("");
    setPreview(null);
    setNotice(null);
    setState(fresh());
    setRevealed(2);
  }

  function chooseNeed(need: Product | "agenda") {
    if (need === "agenda") {
      // Booking is the other product: its own sales chat.
      save(null);
      window.location.href = initialName
        ? `/conheca?nome=${encodeURIComponent(initialName)}`
        : "/conheca";
      return;
    }
    if (initialName) {
      afterName(need, initialName, [user(W.needs[need])]);
    } else {
      update({ product: need, phase: "name" }, [user(W.needs[need]), system(W.askName)]);
    }
  }

  /** A site asks its niche (photos, colors and services follow it); a store goes on. */
  function afterName(product: Product, name: string, bubbles: Bubble[]) {
    const detected = detectNiche(name);
    if (product === "store") {
      update({ product, name, nicheKey: detected, phase: "models" }, [
        ...bubbles,
        system(modelsText(product, name)),
      ]);
    } else if (detected) {
      update({ product, name, detected, phase: "confirm" }, [
        ...bubbles,
        system(fill(T.confirmNiche, { niche: nicheLabel(detected) })),
      ]);
    } else {
      update({ product, name, phase: "pick" }, [...bubbles, system(T.askNiche)]);
    }
  }

  function chooseNiche(key: string | null, label: string) {
    update({ nicheKey: key, phase: "models" }, [
      user(label),
      system(modelsText(state.product ?? "site", state.name)),
    ]);
  }

  function modelsText(product: Product, name: string) {
    return fill(W.models, { kind: product === "store" ? W.kindStore : W.kindSite, name });
  }

  const templates: readonly WebTemplate[] =
    state.product === "store" ? WEB_STORE_TEMPLATES : WEB_SITE_TEMPLATES;
  const exampleUrl = (template: WebTemplate) => {
    const params = new URLSearchParams({ nome: state.name });
    const route = state.nicheKey ? getNiche(state.nicheKey).niche?.route : null;
    if (route) params.set("ramo", route);
    return `/exemplo/web/${template}?${params.toString()}`;
  };

  // Waits for the payment while the Pix is shown.
  const token = state.token;
  const waiting = state.phase === "pix" && !state.expired;
  useEffect(() => {
    if (!waiting || !token) return;
    const timer = setInterval(async () => {
      const status = await chatSaleStatusAction(token).catch(() => null);
      if (status?.status === "paid") {
        setState((s) => ({
          ...s,
          phase: "paid",
          paid: { siteUrl: status.siteUrl, email: status.email },
          log: [
            ...s.log,
            system(fill(W.paid, { what: s.product === "store" ? W.paidStore : W.paidSite })),
            ...(s.customSite ? [system(W.paidCustom)] : []),
            system(fill(W.paidEmail, { email: status.email })),
            system(T.loginLater),
            system(W.domain),
          ],
        }));
      } else if (status?.status === "awaiting_payment" && status.expired) {
        update({ expired: true }, [system(T.expired)]);
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [waiting, token, update]);

  async function generate() {
    if (!state.product || !state.template || !state.cycle) return;
    update({ phase: "generating" }, [user(T.generate)]);
    const result = await startWebSaleAction({
      product: state.product,
      template: state.template,
      customSite: state.customSite,
      businessName: state.name,
      nicheKey: state.nicheKey ?? "general",
      payerName: state.payerName,
      email: state.email,
      whatsapp: state.whatsapp,
      cpfCnpj: document,
      cycle: state.cycle,
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

  function submitText(text: string) {
    const value = text.trim();
    switch (state.phase) {
      case "name":
        afterName(state.product ?? "site", value.slice(0, 80), [user(value)]);
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
      case "whatsapp":
        if (!normalizeBrPhone(value)) {
          update({}, [user(value), system(T.whatsappInvalid)]);
          return;
        }
        update({ whatsapp: value, phase: "document" }, [user(value), system(T.askDocument)]);
        return;
      case "document": {
        const digits = value.replace(/\D/g, "");
        // The CPF stays out of the conversation history (and of this browser's storage).
        const masked = `${"•".repeat(Math.max(0, digits.length - 3))}${digits.slice(-3)}`;
        if (!(validCpf(digits) || validCnpj(digits))) {
          update({}, [user(masked), system(T.documentInvalid)]);
          return;
        }
        setDocument(digits);
        update({ phase: "summary" }, [user(masked), system(summaryText(state))]);
        return;
      }
    }
  }

  const composer = composerFor(state.phase);
  const canGoBack =
    state.history.length > 0 &&
    !typing &&
    state.phase !== "generating" &&
    state.phase !== "pix" &&
    state.phase !== "paid";

  return (
    <div
      data-theme-scope=""
      data-palette="meetchat"
      style={brandThemeStyle(PLATFORM)}
      className="mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background font-sans text-foreground md:border-x"
    >
      <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
        <img src={PLATFORM.logo} alt="" width={40} height={40} className="size-10 rounded-xl" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold">{W.headerTitle}</span>
          <span className="block text-sm opacity-85">{W.headerSubtitle}</span>
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
        {state.log.slice(0, revealed).map((bubble, i) => (
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
            templates={templates}
            notice={notice}
            onNeed={chooseNeed}
            onConfirm={(yes) =>
              yes && state.detected
                ? chooseNiche(state.detected, T.yes)
                : update({ phase: "pick" }, [user(T.no), system(T.askNiche)])
            }
            onNiche={chooseNiche}
            onOpenModel={(template) => setPreview(exampleUrl(template))}
            onModel={(template) =>
              update({ template, customSite: false, phase: "how" }, [
                user(fill(W.modelChosen, { model: TEMPLATE_NAMES[template].name })),
                ...W.how[state.product ?? "site"].map(system),
                system(W.ready[state.product ?? "site"]),
              ])
            }
            onNoneFits={() => update({ phase: "custom" }, [user(W.custom), system(W.customOffer)])}
            onCustom={(yes) => {
              if (yes) {
                // The custom site is talked over with the seller (from R$ 197), on the WhatsApp.
                window.open(
                  salesWhatsappHref(fill(W.customMessage, { name: state.name })),
                  "_blank",
                  "noopener",
                );
                update({ phase: "models" }, [user(W.customYes), system(W.customSent)]);
                return;
              }
              update({ phase: "models" }, [
                user(W.customNo),
                system(modelsText(state.product ?? "site", state.name)),
              ]);
            }}
            onHowNext={() =>
              update({ phase: "cycle" }, [
                user(W.howNext[state.product ?? "site"]),
                system(W.askCycle),
              ])
            }
            onPreview={() => state.template && setPreview(exampleUrl(state.template))}
            onCycle={(cycle) =>
              update({ cycle, phase: "payer" }, [user(W.cycles[cycle].label), system(W.askPayer)])
            }
            onEmailFix={(accept) => {
              const email = accept ? state.emailFix! : state.email;
              update({ email, emailFix: null, phase: "whatsapp" }, [
                user(accept ? T.yes : T.no),
                system(T.askWhatsapp),
              ]);
            }}
            onChangeData={() =>
              update({ phase: "payer" }, [user(T.changeData), system(W.askPayer)])
            }
            onGenerate={() => void generate()}
            onRenew={() => void renew()}
            onEnterPanel={() => void enterPanel()}
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

function composerFor(phase: Phase): ComposerSettings | null {
  switch (phase) {
    case "name":
      return { placeholder: W.namePlaceholder, autoComplete: "organization", minLength: 2 };
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

function Options({
  state,
  templates,
  notice,
  onNeed,
  onConfirm,
  onNiche,
  onOpenModel,
  onModel,
  onNoneFits,
  onCustom,
  onHowNext,
  onPreview,
  onCycle,
  onEmailFix,
  onChangeData,
  onGenerate,
  onRenew,
  onEnterPanel,
}: {
  state: State;
  templates: readonly WebTemplate[];
  notice: string | null;
  onNeed: (need: Product | "agenda") => void;
  onConfirm: (yes: boolean) => void;
  onNiche: (key: string | null, label: string) => void;
  onOpenModel: (template: WebTemplate) => void;
  onModel: (template: WebTemplate) => void;
  onNoneFits: () => void;
  onCustom: (yes: boolean) => void;
  onHowNext: () => void;
  onPreview: () => void;
  onCycle: (cycle: Cycle) => void;
  onEmailFix: (accept: boolean) => void;
  onChangeData: () => void;
  onGenerate: () => void;
  onRenew: () => void;
  onEnterPanel: () => void;
}) {
  switch (state.phase) {
    case "need":
      return (
        <div className="flex flex-col items-end gap-2">
          {(["site", "store", "agenda"] as const).map((need) => (
            <button key={need} type="button" className={choice} onClick={() => onNeed(need)}>
              {W.needs[need]}
            </button>
          ))}
        </div>
      );
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
          <button type="button" className={choice} onClick={() => onNiche(null, T.other)}>
            {T.other}
          </button>
        </div>
      );
    case "models":
      return (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            {templates.map((template) => {
              const bold = template === "site_bold" || template === "store_showcase";
              return (
                <button
                  key={template}
                  type="button"
                  onClick={() => onOpenModel(template)}
                  className="flex flex-col gap-1 rounded-2xl border bg-card p-3 text-left shadow-sm hover:border-primary"
                >
                  <span
                    aria-hidden
                    className={`flex h-20 items-end rounded-xl p-2 text-sm font-bold ${
                      bold ? "bg-primary text-primary-foreground" : "border bg-background"
                    }`}
                  >
                    {state.name}
                  </span>
                  <span className="font-semibold">{TEMPLATE_NAMES[template].name}</span>
                  <span className="text-sm text-muted-foreground">
                    {TEMPLATE_NAMES[template].hint}
                  </span>
                  <span className="text-sm font-semibold text-primary">{W.modelOpen} →</span>
                </button>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted-foreground">{W.modelTip}</p>
          <p className="max-w-[85%] rounded-2xl bg-card px-4 py-2.5 text-[17px] shadow-sm">
            {W.askModel}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            {templates.map((template) => (
              <button
                key={template}
                type="button"
                className={choice}
                onClick={() => onModel(template)}
              >
                {TEMPLATE_NAMES[template].name}
              </button>
            ))}
            <button type="button" className={choice} onClick={onNoneFits}>
              {W.custom}
            </button>
          </div>
        </div>
      );
    case "custom":
      return (
        <div className="flex flex-col gap-2">
          <button type="button" className={primary} onClick={() => onCustom(true)}>
            {W.customYes}
          </button>
          <button
            type="button"
            onClick={() => onCustom(false)}
            className="min-h-11 rounded-xl border bg-card text-[15px] font-medium"
          >
            {W.customNo}
          </button>
        </div>
      );
    case "how":
      return (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="min-h-11 rounded-xl border-2 border-primary bg-card text-[15px] font-semibold text-primary"
          >
            {W.previewOpen[state.product ?? "site"]}
          </button>
          <button type="button" className={primary} onClick={onHowNext}>
            {W.howNext[state.product ?? "site"]}
          </button>
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
              <span className="font-semibold">{W.cycles[cycle].label}</span>
              <span className="text-sm font-semibold text-primary">
                {webFirstPayment(cycle, state.customSite)}
              </span>
              <span className="text-xs text-muted-foreground">{W.cycles[cycle].hint}</span>
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
          <button
            type="button"
            onClick={onChangeData}
            className="min-h-11 rounded-xl border bg-card text-[15px] font-medium"
          >
            {T.changeData}
          </button>
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
            {W.openPanel}
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
              {state.product === "store" ? W.openStore : W.openSite}
            </a>
          ) : null}
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
