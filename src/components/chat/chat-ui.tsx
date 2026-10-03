"use client";

import { CheckCheck, SendHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Messaging-app style chat (booking and "Pedir horário"): header with the business photo,
 * patterned wallpaper, bubbles with tails, time and read ticks, and a composer bar.
 * Own design in the brand colors; no third-party logos, names or artwork.
 */

export function ChatWindow({
  businessName,
  avatarUrl,
  subtitle = "online · responde na hora",
  titlePrefix,
  onClose,
  onProfile,
  branding,
  footer,
  children,
  className,
}: {
  businessName: string;
  avatarUrl?: string | null;
  subtitle?: string;
  /** Read by screen readers before the name, e.g. "Agendar com". */
  titlePrefix?: string;
  onClose?: () => void;
  /** Tapping the photo or name opens the business profile. */
  onProfile?: () => void;
  /** "Feito com …" line under the composer (Free plan). */
  branding?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new MutationObserver(() => {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    });
    observer.observe(element, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <header className="flex shrink-0 items-center gap-1 bg-primary px-2 py-2 text-primary-foreground">
        {(() => {
          const identity = (
            <>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- R2 public URL
                <img
                  src={avatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-lg font-semibold">
                  {businessName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-base leading-tight font-semibold">
                  {businessName}
                </span>
                <span className="block truncate text-xs opacity-80">
                  {onProfile ? "toque para ver o perfil" : subtitle}
                </span>
              </span>
            </>
          );
          const heading = (
            <h2 className="sr-only">
              {titlePrefix ? `${titlePrefix} ` : ""}
              {businessName}
            </h2>
          );
          return onProfile ? (
            <>
              {heading}
              <button
                type="button"
                onClick={onProfile}
                aria-label={`Ver perfil de ${businessName}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-0.5 hover:bg-primary-foreground/10"
              >
                {identity}
              </button>
            </>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-3 px-1 py-0.5">
              {heading}
              {identity}
            </div>
          );
        })()}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-9 items-center justify-center rounded-full hover:bg-primary-foreground/15"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </header>
      <div
        ref={scrollRef}
        className="chat-wallpaper flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4"
        aria-live="polite"
      >
        {children}
      </div>
      {footer || branding ? (
        <div className="chat-wallpaper shrink-0 px-2 pt-1 pb-2">
          {footer}
          {branding ? (
            <p className="pt-1.5 text-center text-xs text-muted-foreground">{branding}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** "Hoje" pill at the top of the conversation. */
export function ChatDayPill({ children }: { children: ReactNode }) {
  return (
    <div className="my-2 flex justify-center">
      <span className="rounded-lg bg-card/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
        {children}
      </span>
    </div>
  );
}

export function ChatBubble({
  from,
  time,
  tail = true,
  children,
}: {
  from: "system" | "user";
  time?: string;
  tail?: boolean;
  children: ReactNode;
}) {
  const user = from === "user";
  return (
    <div className={cn("flex", user ? "justify-end" : "justify-start", tail ? "mt-2" : "mt-0.5")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 pt-1.5 pb-1 text-[0.95rem] whitespace-pre-line shadow-sm",
          user ? "chat-bubble-out" : "chat-bubble-in",
          tail && "chat-tail",
          tail && (user ? "rounded-tr-none" : "rounded-tl-none"),
        )}
      >
        {children}
        {time ? " " : null}
        {time ? (
          <span className="float-right mt-1.5 ml-3 flex items-center gap-0.5 text-[0.7rem] leading-none text-muted-foreground">
            {time}
            {user ? <CheckCheck className="size-3.5 text-primary" aria-label="lida" /> : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ChatTyping() {
  return (
    <div className="mt-2 flex justify-start">
      <div
        className="chat-bubble-in chat-tail chat-typing flex gap-1 rounded-lg rounded-tl-none px-4 py-3 shadow-sm"
        role="status"
        aria-label="digitando"
      >
        <span className="size-2 rounded-full bg-muted-foreground" />
        <span className="size-2 rounded-full bg-muted-foreground" />
        <span className="size-2 rounded-full bg-muted-foreground" />
      </div>
    </div>
  );
}

/** Answer buttons shown under the last message, like quick replies. */
export function ChatOptions({
  children,
  columns = 1,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div
      className={cn(
        "mt-2 ml-auto grid w-full max-w-[85%] gap-1.5",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3 sm:grid-cols-4",
      )}
    >
      {children}
    </div>
  );
}

const CHAT_OPTION_BASE =
  "rounded-lg bg-card px-3 py-2.5 text-left text-[0.95rem] text-card-foreground shadow-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60";

/** Same look as ChatOption, for links (calendar file, WhatsApp). */
export const CHAT_OPTION_CLASS = `${CHAT_OPTION_BASE} flex items-center gap-2`;

export function ChatOption({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(CHAT_OPTION_BASE, "block w-full", className)}
    >
      {children}
    </button>
  );
}

/** Small centered link-like action inside the conversation (e.g. "Voltar"). */
export function ChatNotice({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <div className="my-2 flex justify-center">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="rounded-lg bg-card/90 px-3 py-1 text-xs font-medium text-primary shadow-sm hover:bg-card"
        >
          {children}
        </button>
      ) : (
        <span className="rounded-lg bg-card/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
          {children}
        </span>
      )}
    </div>
  );
}

/**
 * Composer bar. When `label` is null the bar is shown disabled with a hint, like an app waiting
 * for a button answer.
 */
export function ChatComposer({
  label,
  placeholder,
  initial = "",
  inputMode,
  type = "text",
  autoComplete,
  mask,
  validate,
  allowEmpty = false,
  pending = false,
  onSubmit,
  above,
}: {
  label: string | null;
  placeholder?: string;
  initial?: string;
  inputMode?: "text" | "tel" | "email";
  type?: "text" | "email";
  autoComplete?: string;
  mask?: (value: string) => string;
  validate?: (value: string) => string | null;
  allowEmpty?: boolean;
  pending?: boolean;
  onSubmit?: (value: string) => void;
  above?: ReactNode;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const disabled = label === null;

  return (
    <form
      noValidate
      className="flex flex-col gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled || pending) return;
        const problem = validate?.(value) ?? null;
        if (problem) return setError(problem);
        if (!allowEmpty && !value.trim()) return;
        onSubmit?.(value);
      }}
    >
      {above}
      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-card px-3 py-1.5 text-sm text-destructive shadow-sm"
        >
          {error}
        </p>
      ) : null}
      <div className="flex items-end gap-2">
        <input
          key={label ?? "disabled"}
          aria-label={label ?? "Mensagem"}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          autoFocus={!disabled}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={disabled ? "Escolha uma opção acima" : (placeholder ?? "Digite aqui")}
          value={disabled ? "" : value}
          onChange={(event) => {
            setError(null);
            setValue(mask ? mask(event.target.value) : event.target.value);
          }}
          className="h-11 min-w-0 flex-1 rounded-full border-0 bg-card px-4 text-base text-card-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
        />
        <button
          type="submit"
          aria-label="Enviar"
          disabled={disabled || pending}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <SendHorizontal className="size-5" />
        </button>
      </div>
    </form>
  );
}

/** "14:05" in the visitor's clock, fixed when the chat opens. */
export function useChatClock(): string {
  const [time] = useState(() =>
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  );
  return time;
}
