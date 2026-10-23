"use client";

import { Camera, Check } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageUploadButton } from "@/components/uploads/image-upload-button";

import { tourPendingAction } from "./tour-actions";

const SNOOZE_KEY = "mc_photo_prompt_until";
const TOUR_STEP_KEY = "lv_tour_step";
const SNOOZE_DAYS = 3;
const DELAY_MS = 1500;

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
    // Private mode: the prompt just shows again next time.
  }
}

/**
 * Friendly prompt to add the profile photo and the cover, shown a moment after the owner opens
 * the panel while one of them is missing. Never during the first-access tour, never on "Meu
 * perfil" (the uploads are there), and "Agora não" hides it for a few days. The uploads happen
 * right here; when both images are in, it says so and closes.
 */
export function PhotoPrompt({
  businessName,
  avatarUrl,
  coverUrl,
}: {
  businessName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const complete = Boolean(avatarUrl && coverUrl);

  useEffect(() => {
    if (complete || pathname.startsWith("/painel/pagina")) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (snoozedUntil() > Date.now()) return;
      try {
        if (sessionStorage.getItem(TOUR_STEP_KEY) !== null) return;
      } catch {
        // No sessionStorage: carry on.
      }
      if (await tourPendingAction().catch(() => false)) return;
      if (!cancelled) setOpen(true);
    }, DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Only on the first panel page of the visit, not on every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    if (!complete) snooze();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {complete
              ? "Pronto, seu perfil ficou completo!"
              : "Seu perfil fica mais bonito com foto"}
          </DialogTitle>
          <DialogDescription>
            {complete
              ? "É assim que os seus clientes vão ver o seu perfil."
              : "Quem toca no seu link vê primeiro a sua foto. Escolha qualquer foto da galeria: o MeetChat ajusta o tamanho sozinho."}
          </DialogDescription>
        </DialogHeader>

        {/* Preview of the profile top: cover with the profile photo over it. */}
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="relative aspect-[3/1] w-full bg-muted">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- R2 public URL
              <img src={coverUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-sm text-muted-foreground">
                Sua capa aqui
              </span>
            )}
          </div>
          <div className="flex items-end gap-3 px-4 pb-4">
            <span className="-mt-8 flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-muted">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- R2 public URL
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <Camera className="size-6 text-muted-foreground" aria-hidden />
              )}
            </span>
            <span className="truncate pb-1 font-semibold">{businessName}</span>
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium">
              {avatarUrl ? <Check className="size-4 text-success" aria-hidden /> : null}
              Foto de perfil
            </span>
            <ImageUploadButton kind="avatar" variant={avatarUrl ? "ghost" : "default"}>
              {avatarUrl ? "Trocar" : "Escolher foto"}
            </ImageUploadButton>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium">
              {coverUrl ? <Check className="size-4 text-success" aria-hidden /> : null}
              Capa
            </span>
            <ImageUploadButton kind="cover" variant={coverUrl ? "ghost" : "outline"}>
              {coverUrl ? "Trocar" : "Escolher capa"}
            </ImageUploadButton>
          </li>
        </ul>

        <DialogFooter>
          <Button type="button" variant={complete ? "default" : "ghost"} onClick={close}>
            {complete ? "Fechar" : "Agora não"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
