"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Status = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function isIos() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

/** "Ativar notificações": registers the service worker and saves the push subscription. */
export function EnablePush({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: Status;
      if (!vapidPublicKey) next = "unsupported";
      else if (isIos() && !isStandalone()) next = "ios-install";
      else if (!("serviceWorker" in navigator) || !("PushManager" in window)) next = "unsupported";
      else if (Notification.permission === "denied") next = "denied";
      else {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        next = subscription ? "on" : "off";
      }
      if (!cancelled) setStatus(next);
    })().catch(() => !cancelled && setStatus("unsupported"));
    return () => {
      cancelled = true;
    };
  }, [vapidPublicKey]);

  async function enable() {
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToBytes(vapidPublicKey!),
      });
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error();
      setStatus("on");
    } catch {
      setError("Não foi possível ativar. Tente de novo.");
    }
  }

  async function disable() {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
    setStatus("off");
  }

  if (status === "loading") return null;
  if (status === "ios-install") {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm">
        <p className="font-medium">No iPhone, instale o painel antes de ativar as notificações:</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Abra este painel no Safari.</li>
          <li>Toque em Compartilhar (quadrado com seta para cima).</li>
          <li>Escolha “Adicionar à Tela de Início”.</li>
          <li>Abra o painel pelo ícone criado e volte aqui para ativar.</li>
        </ol>
      </div>
    );
  }
  if (status === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground">
        Notificações não estão disponíveis neste navegador.
      </p>
    );
  }
  if (status === "denied") {
    return (
      <p className="text-sm text-muted-foreground">
        As notificações foram bloqueadas no navegador. Libere nas configurações do site para ativar.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {status === "on" ? (
        <Button type="button" variant="outline" className="self-start" onClick={disable}>
          <BellOff /> Desativar notificações neste aparelho
        </Button>
      ) : (
        <Button type="button" className="self-start" onClick={enable}>
          <Bell /> Ativar notificações
        </Button>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
