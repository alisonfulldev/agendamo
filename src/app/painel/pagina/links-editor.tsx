"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { saveLinksAction } from "./actions";

interface LinkDraft {
  label: string;
  url: string;
}

export function LinksEditor({ initial }: { initial: LinkDraft[] }) {
  const [links, setLinks] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (index: number, patch: Partial<LinkDraft>) =>
    setLinks((current) => current.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  const move = (index: number, delta: number) =>
    setLinks((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      {links.map((link, index) => (
        <div key={index} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[12rem_1fr_auto]">
          <Input
            aria-label={`Nome do link ${index + 1}`}
            placeholder="Ex.: Cardápio de serviços"
            value={link.label}
            maxLength={60}
            onChange={(e) => update(index, { label: e.target.value })}
            className="h-10"
          />
          <Input
            aria-label={`Endereço do link ${index + 1}`}
            placeholder="https://"
            inputMode="url"
            value={link.url}
            onChange={(e) => update(index, { url: e.target.value })}
            className="h-10"
          />
          <div className="flex">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Subir"
              onClick={() => move(index, -1)}
            >
              <ChevronUp />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Descer"
              onClick={() => move(index, 1)}
            >
              <ChevronDown />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Remover link"
              onClick={() => setLinks((current) => current.filter((_, i) => i !== index))}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLinks((c) => [...c, { label: "", url: "https://" }])}
        >
          <Plus /> Adicionar link
        </Button>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await saveLinksAction(links);
              setMessage(
                result.ok
                  ? { ok: true, text: "Links salvos." }
                  : { ok: false, text: result.error ?? "Erro" },
              );
            })
          }
        >
          {pending ? "Salvando…" : "Salvar links"}
        </Button>
      </div>
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
