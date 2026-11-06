"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CopyTextButton } from "@/components/panel/copy-text-button";
import { RefreshWhilePending } from "@/components/refresh-while-pending";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadButton } from "@/components/uploads/image-upload-button";
import type { PixCharge } from "@/lib/billing/service";
import {
  BRIEFING_HIGHLIGHTS,
  BRIEFING_MAX_PHOTOS,
  BRIEFING_STYLES,
  type Briefing,
} from "@/lib/custom-site/briefing";

import {
  removeBriefingPhotoAction,
  requestAdjustmentAction,
  saveBriefingAction,
  startCustomSitePaymentAction,
} from "./actions";

function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== option) : [...value, option])}
            className={`min-h-10 rounded-full border px-4 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

/** Briefing of the custom site: saved as a draft, sent when ready. */
export function BriefingForm({
  initial,
  photos,
}: {
  initial: Briefing;
  /** Uploaded photos: key and public URL. */
  photos: { key: string; url: string }[];
}) {
  const router = useRouter();
  const [b, setB] = useState<Briefing>({
    ...initial,
    references: [...initial.references, "", "", ""].slice(0, 3),
  });
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof Briefing>(key: K, value: Briefing[K]) => {
    setB((v) => ({ ...v, [key]: value }));
    setMessage(null);
  };

  const save = (send: boolean) =>
    startTransition(async () => {
      const result = await saveBriefingAction(
        { ...b, references: b.references.filter((r) => r.trim()) },
        send,
      );
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) router.refresh();
    });

  const field = "flex flex-col gap-2";
  return (
    <div className="flex flex-col gap-6">
      <div className={field}>
        <p className="font-medium">1. Que sensação o site deve passar? *</p>
        <Chips
          label="Estilo"
          options={BRIEFING_STYLES}
          value={b.styles}
          onChange={(v) => set("styles", v)}
        />
      </div>
      <div className={field}>
        <Label htmlFor="colors" className="font-medium">
          2. Cores (as da sua marca, ou as que você gosta)
        </Label>
        <Input
          id="colors"
          maxLength={200}
          placeholder="Ex.: rosa antigo e dourado; ou: as cores da minha logo"
          value={b.colors}
          onChange={(e) => set("colors", e.target.value)}
        />
      </div>
      <div className={field}>
        <p className="font-medium">3. Sites que você acha bonitos (até 3, opcional)</p>
        {b.references.map((ref, i) => (
          <Input
            key={i}
            aria-label={`Referência ${i + 1}`}
            maxLength={300}
            placeholder="Link de um site ou perfil do Instagram"
            value={ref}
            onChange={(e) =>
              set(
                "references",
                b.references.map((r, j) => (j === i ? e.target.value : r)),
              )
            }
          />
        ))}
      </div>
      <div className={field}>
        <p className="font-medium">4. O que destacar no site? *</p>
        <Chips
          label="Destaques"
          options={BRIEFING_HIGHLIGHTS}
          value={b.highlights}
          onChange={(v) => set("highlights", v)}
        />
      </div>
      <div className={field}>
        <Label htmlFor="headline" className="font-medium">
          5. Frase principal (a primeira coisa que aparece)
        </Label>
        <Input
          id="headline"
          maxLength={120}
          placeholder="Ex.: Unhas impecáveis, do jeito que você sonhou"
          value={b.headline}
          onChange={(e) => set("headline", e.target.value)}
        />
      </div>
      <div className={field}>
        <Label htmlFor="about" className="font-medium">
          6. Conte um pouco sobre você e o negócio *
        </Label>
        <Textarea
          id="about"
          rows={4}
          maxLength={1500}
          value={b.about}
          onChange={(e) => set("about", e.target.value)}
        />
      </div>
      <div className={field}>
        <Label htmlFor="differentials" className="font-medium">
          7. O que te diferencia?
        </Label>
        <Textarea
          id="differentials"
          rows={3}
          maxLength={1000}
          value={b.differentials}
          onChange={(e) => set("differentials", e.target.value)}
        />
      </div>
      <div className={field}>
        <Label htmlFor="audience" className="font-medium">
          8. Quem é o seu público?
        </Label>
        <Textarea
          id="audience"
          rows={2}
          maxLength={500}
          value={b.audience}
          onChange={(e) => set("audience", e.target.value)}
        />
      </div>
      <div className={field}>
        <p className="font-medium">
          9. Fotos e logo (até {BRIEFING_MAX_PHOTOS}: trabalhos, espaço, equipe, você)
        </p>
        {photos.length ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((photo) => (
              <li key={photo.key} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- R2 public URL */}
                <img
                  src={photo.url}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  aria-label="Remover foto"
                  onClick={() =>
                    startTransition(async () => {
                      await removeBriefingPhotoAction(photo.key);
                      router.refresh();
                    })
                  }
                  className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-background/90 shadow"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {photos.length < BRIEFING_MAX_PHOTOS ? (
          <ImageUploadButton kind="briefing">Adicionar foto</ImageUploadButton>
        ) : null}
      </div>
      <div className={field}>
        <Label htmlFor="notes" className="font-medium">
          10. Mais alguma coisa?
        </Label>
        <Textarea
          id="notes"
          rows={3}
          maxLength={1500}
          value={b.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-lg md:bottom-4">
        <Button type="button" size="lg" disabled={pending} onClick={() => save(true)}>
          Enviar briefing
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => save(false)}>
          Salvar e continuar depois
        </Button>
        {message ? (
          <p
            role={message.ok ? "status" : "alert"}
            className={`text-sm ${message.ok ? "text-muted-foreground" : "text-destructive"}`}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Pix of the order (asks name and CPF/CNPJ when it starts the subscription too). */
export function CustomSitePayment({
  askPayer,
  current,
  priceLabel,
}: {
  askPayer: boolean;
  current: PixCharge | null;
  priceLabel: string;
}) {
  const [pix, setPix] = useState<PixCharge | null>(current);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (pix) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL from Asaas */}
        <img src={pix.image} alt="QR code do Pix" width={220} height={220} className="rounded-lg" />
        <p className="text-sm text-muted-foreground">
          {pix.automatic
            ? "Pague pelo app do banco e confirme o Pix Automático: as próximas mensalidades saem sozinhas."
            : "Pague pelo app do banco (Pix copia e cola)."}
        </p>
        <CopyTextButton text={pix.payload} label="Copiar código Pix" variant="default" />
        <p className="text-sm">Aguardando o pagamento…</p>
        <RefreshWhilePending />
      </div>
    );
  }

  return (
    <form
      action={(form) =>
        startTransition(async () => {
          setError(null);
          const result = await startCustomSitePaymentAction(
            askPayer ? { name: form.get("name"), cpfCnpj: form.get("cpfCnpj") } : null,
          );
          if (result.ok) setPix(result.pix);
          else setError(result.message);
        })
      }
      className="flex flex-col gap-3"
    >
      {askPayer ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome completo ou razão social</Label>
            <Input id="name" name="name" required maxLength={120} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
            <Input id="cpfCnpj" name="cpfCnpj" required inputMode="numeric" maxLength={20} />
          </div>
        </>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Gerando…" : `Gerar Pix de ${priceLabel}`}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}

/** The one adjustment included after the delivery. */
export function AdjustmentForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="adjustment">O que você quer mudar?</Label>
      <Textarea
        id="adjustment"
        rows={4}
        maxLength={2000}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button
        type="button"
        disabled={pending}
        className="self-start"
        onClick={() =>
          startTransition(async () => {
            const result = await requestAdjustmentAction(text);
            setMessage({ ok: result.ok, text: result.message });
            if (result.ok) router.refresh();
          })
        }
      >
        Pedir ajuste
      </Button>
      {message ? (
        <p role={message.ok ? "status" : "alert"} className="text-sm">
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
