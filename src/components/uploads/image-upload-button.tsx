"use client";

import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { compressImage, ImageError } from "@/lib/images/compress";
import type { ImageKind } from "@/lib/images/presets";
import { registerUploadAction } from "@/lib/uploads/actions";

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
  const [status, setStatus] = useState<"idle" | "working">("idle");
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setStatus("working");
    setError(null);
    try {
      const image = await compressImage(file, kind);
      const signResponse = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          contentType: image.blob.type,
          size: image.blob.size,
          professionalId,
        }),
      });
      const signed = await signResponse.json();
      if (!signResponse.ok) throw new ImageError(signed.error ?? "Não foi possível enviar.");

      const put = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: signed.headers,
        body: image.blob,
      });
      if (!put.ok) throw new ImageError("O envio falhou. Verifique sua conexão e tente de novo.");

      const result = await registerUploadAction({
        kind,
        key: signed.key,
        width: image.width,
        height: image.height,
        professionalId,
      });
      if (!result.ok) throw new ImageError(result.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof ImageError ? e.message : "Não foi possível enviar a imagem.");
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
        disabled={status === "working"}
        aria-describedby={error ? errorId : undefined}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus /> {status === "working" ? "Enviando…" : (children ?? "Enviar imagem")}
      </Button>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
