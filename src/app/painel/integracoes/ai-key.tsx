"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { createApiKeyAction } from "./actions";
import { CodeBlock } from "./code-block";

/** Generates the key and shows it once, with the connection data for the AI. */
export function AiKeyGenerator({ hasKey, mcpUrl }: { hasKey: boolean; mcpUrl: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [key, setKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  if (key) {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p role="status" className="rounded-lg bg-accent px-3 py-2 text-accent-foreground">
          Copie a chave agora: ela não aparece de novo. Se perder, gere outra.
        </p>
        <CodeBlock code={`Servidor MCP: ${mcpUrl}\nChave (Authorization: Bearer): ${key}`} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size="sm"
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (
              hasKey &&
              !window.confirm("Gerar uma chave nova? A atual para de funcionar na hora.")
            )
              return;
            const result = await createApiKeyAction();
            if (result.ok) {
              setKey(result.key);
              router.refresh();
            } else setFailed(true);
          })
        }
      >
        {hasKey ? "Gerar chave nova" : "Gerar chave da IA"}
      </Button>
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível gerar a chave. Confira sua assinatura.
        </p>
      ) : null}
    </div>
  );
}
