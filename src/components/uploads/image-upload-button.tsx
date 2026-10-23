"use client";

import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { compressImage, ImageError, PrepareError } from "@/lib/images/compress";
import type { ImageKind } from "@/lib/images/presets";
import { processOriginalAction, registerUploadAction } from "@/lib/uploads/actions";

/** Picks an image, compresses it in the browser and uploads it straight to R2 (rule 7). */
export function ImageUploadButton({
  kind,
  professionalId,
  children,
  variant = "outline",
}: {
  kind: ImageKind;
  professionalId?: string;
  children?: ReactNode;
  variant?: "outline" | "default" | "ghost";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [status, setStatus] = useState<"idle" | "working" | "converting">("idle");
  const [error, setError] = useState<string | null>(null);

  /** Sends a signed upload request and returns the presigned PUT target. */
  async function sign(body: Record<string, unknown>) {
    const response = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, professionalId, ...body }),
    });
    const signed = await response.json();
    if (!response.ok) throw new ImageError(signed.error ?? "Não foi possível enviar.");
    return signed as { key: string; uploadUrl: string; headers: Record<string, string> };
  }

  async function put(signed: { uploadUrl: string; headers: Record<string, string> }, body: Blob) {
    const response = await fetch(signed.uploadUrl, {
      method: "PUT",
      headers: signed.headers,
      body,
    });
    if (!response.ok) {
      throw new ImageError("O envio falhou. Verifique sua conexão e tente de novo.", {
        cause: `http ${response.status}`,
      });
    }
  }

  /**
   * The phone could not prepare the photo: the original goes straight to R2 and the server
   * converts it (rule 7 exception, 2026-10-23), like big apps do. Any photo ends up usable.
   */
  async function uploadOriginal(file: File, reason: string) {
    setStatus("converting");
    const signed = await sign({ original: true, contentType: file.type, size: file.size });
    await put(signed, file);
    const result = await processOriginalAction({ kind, key: signed.key, professionalId, reason });
    if (!result.ok) throw new ImageError(result.error);
  }

  /** Tells the server which step failed and why (no image, no file name), for the log. */
  function report(step: string, file: File, error: unknown) {
    const body = JSON.stringify({
      kind,
      step,
      error: (error instanceof Error
        ? `${error.name}: ${error.message}${error.cause ? ` (${String(error.cause)})` : ""}`
        : String(error)
      ).slice(0, 200),
      type: file.type.slice(0, 100),
      sizeKb: Math.round(file.size / 1024),
      browser: navigator.userAgent.slice(0, 200),
    });
    void fetch("/api/uploads/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }

  async function upload(picked: File) {
    setStatus("working");
    setError(null);
    let step = "read";
    try {
      // Read the whole file right away: on Android a picked file can stop being readable later
      // (gallery items still syncing, revoked access), and every later step would fail with it.
      const file = new File([await picked.arrayBuffer()], picked.name, { type: picked.type });
      step = "prepare";
      let image: Awaited<ReturnType<typeof compressImage>> | null = null;
      try {
        image = await compressImage(file, kind);
      } catch (e) {
        if (!(e instanceof PrepareError)) throw e;
        step = "original";
        await uploadOriginal(file, e.reason);
      }
      if (image) {
        step = "sign";
        const signed = await sign({ contentType: image.blob.type, size: image.blob.size });
        step = "put";
        await put(signed, image.blob);
        step = "save";
        const result = await registerUploadAction({
          kind,
          key: signed.key,
          width: image.width,
          height: image.height,
          professionalId,
        });
        if (!result.ok) throw new ImageError(result.error);
      }
      router.refresh();
    } catch (e) {
      report(step, picked, e);
      setError(
        step === "read"
          ? "Não conseguimos abrir essa foto no celular. Se ela estiver na nuvem, baixe para o aparelho e tente de novo."
          : e instanceof ImageError
            ? e.message
            : "Não foi possível enviar a imagem.",
      );
    } finally {
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <Button
        type="button"
        variant={variant}
        disabled={status !== "idle"}
        aria-describedby={error ? errorId : undefined}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus />{" "}
        {status === "converting"
          ? "Preparando sua foto…"
          : status === "working"
            ? "Enviando…"
            : (children ?? "Enviar imagem")}
      </Button>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
