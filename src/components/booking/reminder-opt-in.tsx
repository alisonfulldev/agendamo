"use client";

import { Bell, BellRing, Share, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";

import {
  reminderStatusAction,
  saveReminderDeviceAction,
} from "@/app/cancelar/[token]/reminder-actions";
import { isAndroid, isIos, isStandalone, pushSupported, subscribeDevice } from "@/lib/push/browser";

type Status = "loading" | "hidden" | "ready" | "working" | "on" | "ios-install" | "fallback";

/**
 * "Ative o lembrete" (2026-11-27): the main step after booking. Android and computers: one tap
 * (browser notification, with a test notification right away). iPhone: the reminder needs the
 * app installed from the appointment page, so a short tutorial; inside the installed app, the
 * same button. Blocked, unsupported or skipped: `fallback` (save in the phone's calendar).
 */
export function ReminderOptIn({
  token,
  fallback,
  onAppointmentPage = false,
}: {
  token: string;
  /** Shown when notifications are not possible or skipped. */
  fallback: React.ReactNode;
  /** The appointment page itself (the iPhone installs the app from here). */
  onAppointmentPage?: boolean;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    reminderStatusAction(token)
      .then((result) => {
        if (cancelled) return;
        if (!result.available || !result.vapidPublicKey) return setStatus("hidden");
        setVapidKey(result.vapidPublicKey);
        if (result.active) return setStatus("on");
        if (isIos() && !isStandalone()) return setStatus("ios-install");
        if (!pushSupported() || Notification.permission === "denied") return setStatus("fallback");
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("hidden"));
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function enable() {
    if (!vapidKey) return;
    setMessage(null);
    setStatus("working");
    try {
      const subscription = await subscribeDevice(vapidKey);
      if (subscription === "denied" || subscription === "dismissed") {
        setMessage(
          subscription === "denied"
            ? "As notificações ficaram bloqueadas. Salve na agenda do celular para receber o lembrete."
            : null,
        );
        setStatus(subscription === "denied" ? "fallback" : "ready");
        return;
      }
      const json = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      const result = await saveReminderDeviceAction({
        token,
        platform: isIos() ? "ios" : isAndroid() ? "android" : "other",
        subscription: json,
      });
      if (!result.ok) throw new Error(result.error);
      if (!result.tested)
        setMessage(
          "Ativamos, mas a notificação de teste não chegou. Confira se as notificações deste site estão liberadas.",
        );
      setStatus("on");
    } catch (error) {
      console.error("reminder enable failed", error instanceof Error ? error.name : "unknown");
      setMessage(
        "Não foi possível ativar neste navegador. No Android, use o Chrome. Enquanto isso, salve na agenda do celular.",
      );
      setStatus("fallback");
    }
  }

  if (status === "loading") return null;
  if (status === "hidden") return <>{fallback}</>;

  if (status === "on") {
    return (
      <div className="flex flex-col gap-1.5">
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
        >
          <BellRing className="size-4 shrink-0" aria-hidden />
          Lembrete ativado: você recebe o aviso 1 dia e 2 horas antes.
        </p>
        {message ? <p className="px-1 text-sm text-muted-foreground">{message}</p> : null}
      </div>
    );
  }

  if (status === "ios-install") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 rounded-xl border-2 border-primary bg-card p-3 text-sm">
          <p className="font-semibold">Receba o lembrete no iPhone</p>
          <p className="text-muted-foreground">
            O aviso chega pelo app do agendamento. Leva 10 segundos:
          </p>
          <ol className="flex flex-col gap-1.5">
            {onAppointmentPage ? null : (
              <li>
                1.{" "}
                <a
                  href={`/cancelar/${token}?instalar=1`}
                  className="font-medium text-primary underline"
                >
                  Abra a página do seu agendamento
                </a>
              </li>
            )}
            <li className="flex items-center gap-1">
              {onAppointmentPage ? "1." : "2."} Toque em{" "}
              <Share className="size-4" aria-label="Compartilhar" /> na barra do Safari
            </li>
            <li className="flex items-center gap-1">
              {onAppointmentPage ? "2." : "3."} Escolha{" "}
              <SquarePlus className="size-4" aria-hidden /> “Adicionar à Tela de Início”
            </li>
            <li>
              {onAppointmentPage ? "3." : "4."} Abra pelo ícone novo e toque em “Ativar lembrete”
            </li>
          </ol>
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer px-1 text-muted-foreground">
            Prefiro salvar na agenda do celular
          </summary>
          <div className="pt-2">{fallback}</div>
        </details>
      </div>
    );
  }

  if (status === "fallback") {
    return (
      <div className="flex flex-col gap-1.5">
        {message ? <p className="px-1 text-sm text-muted-foreground">{message}</p> : null}
        {fallback}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 rounded-xl border-2 border-primary bg-card p-3">
        <p className="text-sm font-semibold">Ative o lembrete para não esquecer do horário</p>
        <button
          type="button"
          disabled={status === "working"}
          onClick={() => void enable()}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60"
        >
          <Bell className="size-4" aria-hidden />
          {status === "working" ? "Ativando…" : "Ativar lembrete no celular"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Você recebe o aviso 1 dia e 2 horas antes.
        </p>
      </div>
      {message ? <p className="px-1 text-sm text-muted-foreground">{message}</p> : null}
      <button
        type="button"
        onClick={() => setStatus("fallback")}
        className="self-center text-sm text-muted-foreground underline"
      >
        Agora não
      </button>
    </div>
  );
}
