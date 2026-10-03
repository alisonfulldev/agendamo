"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Install the panel as an app: native prompt on Android/Chrome, instructions on iPhone. */
export function InstallGuide({ brandName }: { brandName: string }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"ios" | "other" | "installed" | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const timer = setTimeout(
      () => setPlatform(standalone ? "installed" : ios ? "ios" : "other"),
      0,
    );
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  if (platform === null || platform === "installed") return null;
  return (
    <div className="rounded-xl border bg-card p-4 text-sm">
      <p className="font-medium">Instale o painel do {brandName} no celular</p>
      {platform === "ios" ? (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Abra este painel no Safari.</li>
          <li>Toque em Compartilhar (quadrado com seta).</li>
          <li>Escolha “Adicionar à Tela de Início”.</li>
        </ol>
      ) : promptEvent ? (
        <Button
          type="button"
          className="mt-2"
          onClick={async () => {
            await promptEvent.prompt();
            setPromptEvent(null);
          }}
        >
          <Download /> Instalar app
        </Button>
      ) : (
        <p className="mt-1 text-muted-foreground">
          No Android, abra o menu do Chrome (⋮) e toque em “Instalar app” ou “Adicionar à tela
          inicial”.
        </p>
      )}
    </div>
  );
}
