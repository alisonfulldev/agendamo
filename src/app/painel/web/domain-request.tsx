"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { requestDomainAction } from "./actions";

/** "Quero meu domínio": the owner writes the address she wants; the MeetChat team takes it on. */
export function DomainRequest({ price }: { price: string }) {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (message?.ok) {
    return (
      <p role="status" className="text-sm text-primary">
        {message.text}
      </p>
    );
  }
  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Quero meu domínio
      </Button>
    );
  }
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await requestDomainAction(domain);
          setMessage(
            result.ok
              ? {
                  ok: true,
                  text: `Pedido enviado! A gente confere se ${domain} está livre e te chama por e-mail com o Pix de ${price}.`,
                }
              : { ok: false, text: result.error },
          );
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="domain">Qual endereço você quer?</Label>
        <Input
          id="domain"
          required
          maxLength={253}
          value={domain}
          placeholder="seunegocio.com.br"
          onChange={(e) => setDomain(e.target.value)}
        />
      </div>
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message.text}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Pedir"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Agora não
        </Button>
      </div>
    </form>
  );
}
