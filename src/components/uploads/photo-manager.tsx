"use client";

import { ChevronLeft, ChevronRight, EyeOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deletePhotoAction, reorderPhotosAction } from "@/lib/uploads/actions";

import { ImageUploadButton } from "./image-upload-button";

export interface ManagedPhoto {
  id: string;
  url: string | null;
  hidden: boolean;
}

/** Gallery editor: upload, delete and reorder (drag and drop, or arrow buttons for keyboard users). */
export function PhotoManager({ photos, limit }: { photos: ManagedPhoto[]; limit: number }) {
  const router = useRouter();
  const [order, setOrder] = useState(photos);
  const [dragging, setDragging] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const visible = order.filter((p) => !p.hidden).length;

  // Keep in sync when the server list changes (upload/delete).
  const [source, setSource] = useState(photos);
  if (source !== photos) {
    setSource(photos);
    setOrder(photos);
  }

  function save(next: ManagedPhoto[]) {
    setOrder(next);
    startTransition(async () => {
      const result = await reorderPhotosAction(next.map((p) => p.id));
      if (!result.ok) setError(result.error);
    });
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target]!, next[index]!];
    save(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {visible} de {limit} fotos no seu plano.
        </p>
        {visible < limit ? (
          <ImageUploadButton kind="photo">Adicionar foto</ImageUploadButton>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {order.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Mostre seus trabalhos: adicione fotos.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-busy={pending}>
          {order.map((photo, index) => (
            <li
              key={photo.id}
              draggable
              onDragStart={() => setDragging(photo.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!dragging || dragging === photo.id) return;
                const next = order.filter((p) => p.id !== dragging);
                next.splice(
                  index,
                  0,
                  order.find((p) => p.id === dragging)!,
                );
                setDragging(null);
                save(next);
              }}
              className={`group relative overflow-hidden rounded-xl border bg-muted ${dragging === photo.id ? "opacity-50" : ""}`}
            >
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- served by the R2 public domain, no Vercel optimization
                <img
                  src={photo.url}
                  alt={`Foto ${index + 1}`}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="aspect-square" />
              )}
              {photo.hidden ? (
                <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-xs">
                  <EyeOff className="size-3" /> Oculta (acima do limite)
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-card/90 p-1">
                <div className="flex">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Mover para a esquerda"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Mover para a direita"
                    onClick={() => move(index, 1)}
                    disabled={index === order.length - 1}
                  >
                    <ChevronRight />
                  </Button>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Excluir foto ${index + 1}`}
                  onClick={() =>
                    startTransition(async () => {
                      if (!window.confirm("Excluir esta foto?")) return;
                      const result = await deletePhotoAction(photo.id);
                      if (!result.ok) setError(result.error);
                      router.refresh();
                    })
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
