"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { addDomainAction, removeDomainAction, verifyDomainAction } from "./domain-actions";

export function DomainForm({ domain, verified }: { domain: string | null; verified: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const result = await action();
      if (result.message) setMessage({ ok: result.ok, text: result.message });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      {domain ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{domain}</span>
          <span className={verified ? "text-primary" : "text-muted-foreground"}>
            {verified ? "· verificado" : "· aguardando DNS"}
          </span>
          {!verified ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => run(verifyDomainAction)}
            >
              Verificar
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => run(removeDomainAction)}
          >
            Remover
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Input
            aria-label="Seu domínio"
            placeholder="www.meuconsultorio.com.br"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-10 max-w-xs"
          />
          <Button
            type="button"
            disabled={pending || !value}
            onClick={() => run(() => addDomainAction(value))}
          >
            Adicionar domínio
          </Button>
        </div>
      )}
      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-sm ${message.ok ? "text-primary" : "text-destructive"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
