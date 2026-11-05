"use client";

import { Bell, Download, Smartphone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { EnablePush } from "@/components/panel/enable-push";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { claimPromptSlot } from "./prompt-slot";
import { tourPendingAction } from "./tour-actions";

const SNOOZE_KEY = "mc_app_prompt_until";
const TOUR_STEP_KEY = "lv_tour_step";
const SNOOZE_DAYS = 3;
const DELAY_MS = 1200;

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Step = "install-android" | "install-ios" | "push";

function snoozedUntil(): number {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
  } catch {
    // Private mode: it just shows again next time.
  }
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isPhone = () => isIos() || /android/i.test(navigator.userAgent);

/** Push already on in this browser (or not possible here). */
async function pushReadyOrImpossible(vapidPublicKey: string | null): Promise<boolean> {
  if (!vapidPublicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return true;
  if (Notification.permission === "denied") return true;
  const registration = await navigator.serviceWorker.getRegistration();
  return Boolean(await registration?.pushManager.getSubscription());
}

/**
 * "Instale o app" (2026-11-05): on the phone without the app, install it (Android button, iPhone
 * steps); with the app (or on a computer), turn on the notices, so the owner knows right away when
 * a customer books. Never during the first-access tour; "Agora não" hides it for a few days.
 */
export function AppPrompt({
  brandName,
  vapidPublicKey,
}: {
  brandName: string;
  vapidPublicKey: string | null;
}) {
  const pathname = usePathname();
  const [step, setStep] = useState<Step | null>(null);
  const [open, setOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setOpen(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/painel/notificacoes")) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (snoozedUntil() > Date.now()) return;
      try {
        if (sessionStorage.getItem(TOUR_STEP_KEY) !== null) return;
      } catch {
        // No sessionStorage: carry on.
      }
      let next: Step | null = null;
      if (isPhone() && !isStandalone()) next = isIos() ? "install-ios" : "install-android";
      else if (!(await pushReadyOrImpossible(vapidPublicKey).catch(() => true))) next = "push";
      if (!next || cancelled) return;
      if (await tourPendingAction().catch(() => false)) return;
      if (cancelled || !claimPromptSlot("app")) return;
      setStep(next);
      setOpen(true);
    }, DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Only on the first panel page of the visit, not on every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    snooze();
    setOpen(false);
  }

  if (!step) return null;
  const install = step !== "push";

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {install ? (
              <Smartphone className="size-6" aria-hidden />
            ) : (
              <Bell className="size-6" aria-hidden />
            )}
          </span>
          <DialogTitle className="text-center">
            {install ? `Instale o app do ${brandName}` : "Saiba na hora quando alguém agendar"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {install
              ? "Seu painel na tela do celular, como um app: abre num toque e avisa na hora quando um cliente marcar, cancelar ou remarcar."
              : "Ative os avisos neste aparelho. Você recebe um aviso a cada agendamento, cancelamento e remarcação, sem precisar abrir o painel."}
          </DialogDescription>
        </DialogHeader>

        {step === "install-ios" ? (
          <ol className="list-decimal space-y-1.5 rounded-xl bg-muted p-4 pl-9 text-sm">
            <li>Abra este painel no Safari.</li>
            <li>Toque em Compartilhar (quadrado com seta para cima).</li>
            <li>Escolha “Adicionar à Tela de Início”.</li>
            <li>Abra pelo ícone novo e ative os avisos.</li>
          </ol>
        ) : step === "install-android" ? (
          installEvent ? (
            <Button
              type="button"
              size="lg"
              onClick={async () => {
                await installEvent.prompt();
                const { outcome } = await installEvent.userChoice.catch(() => ({
                  outcome: "dismissed" as const,
                }));
                setInstallEvent(null);
                if (outcome === "accepted") setOpen(false);
              }}
            >
              <Download /> Instalar app
            </Button>
          ) : (
            <p className="rounded-xl bg-muted p-4 text-sm">
              Abra o menu do Chrome (⋮) e toque em “Instalar app” ou “Adicionar à tela inicial”.
              Depois, abra pelo ícone novo e ative os avisos.
            </p>
          )
        ) : (
          <div className="flex justify-center">
            <EnablePush vapidPublicKey={vapidPublicKey} />
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={close}>
            Agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
