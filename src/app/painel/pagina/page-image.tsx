"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { ImageUploadButton } from "@/components/uploads/image-upload-button";
import { Button } from "@/components/ui/button";
import { removePageImageAction } from "@/lib/uploads/actions";

export function PageImage({
  kind,
  url,
  label,
}: {
  kind: "avatar" | "cover";
  url: string | null;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div
        className={`overflow-hidden border bg-muted ${kind === "avatar" ? "size-24 rounded-full" : "aspect-[3/1] w-full rounded-xl"}`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- R2 public URL
          <img src={url} alt="" className="size-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <ImageUploadButton kind={kind}>{url ? "Trocar" : "Enviar"}</ImageUploadButton>
        {url ? (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await removePageImageAction(kind);
                router.refresh();
              })
            }
          >
            Remover
          </Button>
        ) : null}
      </div>
    </div>
  );
}
