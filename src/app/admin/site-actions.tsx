"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

import { setSiteDeliveredAction } from "./actions";

/** "Marcar como entregue" / "Desfazer" for a Site + Agenda order. */
export function SiteDeliveredButton({
  businessId,
  delivered,
}: {
  businessId: string;
  delivered: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant={delivered ? "ghost" : "default"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (!delivered && !window.confirm("Marcar o site como entregue?")) return;
          await setSiteDeliveredAction(businessId, !delivered);
          router.refresh();
        })
      }
    >
      {pending ? "Salvando…" : delivered ? "Desfazer" : "Marcar como entregue"}
    </Button>
  );
}
