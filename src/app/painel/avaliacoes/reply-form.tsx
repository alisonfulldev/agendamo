"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { replyReviewAction } from "./actions";

export function ReplyForm({ id, reply }: { id: string; reply: string | null }) {
  const [value, setValue] = useState(reply ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        aria-label="Resposta pública"
        rows={2}
        maxLength={1000}
        placeholder="Responder publicamente"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => setSaved((await replyReviewAction(id, value)).ok))
          }
        >
          Salvar resposta
        </Button>
        {saved ? <span className="text-sm text-muted-foreground">Salva.</span> : null}
      </div>
    </div>
  );
}
