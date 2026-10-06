"use client";

import { useEffect, useState, useTransition } from "react";

import { sendLoginCodeAction, verifyLoginCodeAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMAIL_PATTERN, suggestEmailFix } from "@/lib/email-typos";

/**
 * Sign-in by e-mail code (no password): e-mail, then the 6-digit code from the e-mail. "Reenviar"
 * after 30 s; "Trocar e-mail" goes back.
 */
export function CodeSignIn({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState(0);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const left = sentTo ? Math.max(0, Math.ceil((sentAt + 30_000 - now) / 1000)) : 0;
  const fix = !sentTo && EMAIL_PATTERN.test(email) ? suggestEmailFix(email) : null;

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [left, now]);

  function send(target: string) {
    startTransition(async () => {
      const result = await sendLoginCodeAction({ email: target });
      if (result.ok) {
        setSentTo(target);
        setSentAt(Date.now());
        setNow(Date.now());
        setCode("");
        setMessage({
          ok: true,
          text: `Se ${target} tiver conta, enviamos um código de 6 dígitos. Ele vale por 10 minutos.`,
        });
      } else setMessage({ ok: false, text: result.message });
    });
  }

  if (!sentTo) {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const target = email.trim().toLowerCase();
          if (!EMAIL_PATTERN.test(target)) {
            setMessage({ ok: false, text: "Informe um e-mail válido." });
            return;
          }
          send(target);
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code-email">E-mail</Label>
          <Input
            id="code-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
          {fix ? (
            <button
              type="button"
              className="self-start text-sm text-primary underline underline-offset-4"
              onClick={() => setEmail(fix)}
            >
              Você quis dizer {fix}?
            </button>
          ) : null}
        </div>
        <Button type="submit" className="h-11" disabled={pending}>
          {pending ? "Enviando…" : "Receber código por e-mail"}
        </Button>
        {message ? <Feedback message={message} /> : null}
      </form>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await verifyLoginCodeAction({ email: sentTo, code, next });
          if (result.ok) {
            // Full load: the panel renders from scratch with the new session.
            window.location.assign(result.next);
          } else setMessage({ ok: false, text: result.message });
        });
      }}
    >
      {message ? <Feedback message={message} /> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code-value">Código de 6 dígitos</Label>
        <Input
          id="code-value"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="h-12 text-center text-xl tracking-[0.4em]"
        />
      </div>
      <Button type="submit" className="h-11" disabled={pending || code.length !== 6}>
        {pending ? "Conferindo…" : "Entrar"}
      </Button>
      <div className="flex justify-between gap-2 text-sm">
        <button
          type="button"
          className="text-primary underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
          disabled={left > 0 || pending}
          onClick={() => send(sentTo)}
        >
          {left > 0 ? `Reenviar em ${left}s` : "Reenviar código"}
        </button>
        <button
          type="button"
          className="text-primary underline-offset-4 hover:underline"
          onClick={() => {
            setSentTo(null);
            setMessage(null);
          }}
        >
          Trocar e-mail
        </button>
      </div>
    </form>
  );
}

function Feedback({ message }: { message: { ok: boolean; text: string } }) {
  return (
    <p
      role={message.ok ? "status" : "alert"}
      className={`rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"}`}
    >
      {message.text}
    </p>
  );
}
