"use client";

import { useState } from "react";

import { CopyTextButton } from "@/components/panel/copy-text-button";
import { BIO_LIMIT, buildBios } from "@/lib/tools/bio";

import { ToolField, toolInputClass } from "./tool-field";

/** Instagram bio generator (/ferramentas/bio-instagram). Runs in the browser. */
export function BioGenerator({ areas }: { areas: string[] }) {
  const [area, setArea] = useState("");
  const [highlight, setHighlight] = useState("");
  const [place, setPlace] = useState("");
  const bios = buildBios({ area, highlight, place });

  return (
    <div className="mt-8 grid gap-6 rounded-2xl border bg-card p-5 sm:grid-cols-2 sm:p-6">
      <div className="flex flex-col gap-4">
        <ToolField label="Sua área" htmlFor="bio-area">
          <input
            id="bio-area"
            list="bio-areas"
            className={toolInputClass}
            placeholder="Manicure e nail designer"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
          <datalist id="bio-areas">
            {areas.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </ToolField>
        <ToolField label="O que você faz de melhor" htmlFor="bio-destaque">
          <input
            id="bio-destaque"
            className={toolInputClass}
            placeholder="Alongamento em gel"
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
          />
        </ToolField>
        <ToolField label="Bairro ou cidade (opcional)" htmlFor="bio-lugar">
          <input
            id="bio-lugar"
            className={toolInputClass}
            placeholder="Moema, São Paulo"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />
        </ToolField>
      </div>
      <ul aria-live="polite" className="flex flex-col gap-3">
        {bios.map((bio) => (
          <li key={bio} className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-4">
            <p className="text-base leading-relaxed whitespace-pre-line">{bio}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {[...bio].length}/{BIO_LIMIT}
              </span>
              <CopyTextButton text={bio} label="Copiar bio" />
            </div>
          </li>
        ))}
        {bios.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            Os textos passaram de {BIO_LIMIT} caracteres. Encurte a área ou o destaque.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
