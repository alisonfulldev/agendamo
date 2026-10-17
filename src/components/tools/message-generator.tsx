"use client";

import { useState } from "react";

import { CopyTextButton } from "@/components/panel/copy-text-button";
import {
  buildMessage,
  MESSAGE_KIND_LABELS,
  MESSAGE_KINDS,
  type MessageFields,
  type MessageKind,
  type MessageVocabulary,
} from "@/lib/tools/messages";

import { ToolField, toolInputClass } from "./tool-field";

export interface MessageNiche extends MessageVocabulary {
  key: string;
  name: string;
}

/** WhatsApp message generator (/ferramentas/mensagens-whatsapp). Runs in the browser. */
export function MessageGenerator({ niches }: { niches: MessageNiche[] }) {
  const [nicheKey, setNicheKey] = useState(niches[0]!.key);
  const [kind, setKind] = useState<MessageKind>("confirmacao");
  const [fields, setFields] = useState<MessageFields>({
    customer: "",
    service: "",
    date: "",
    time: "",
    business: "",
    link: "",
  });
  const niche = niches.find((n) => n.key === nicheKey) ?? niches[0]!;
  const text = buildMessage(kind, niche, fields);
  const field = (name: keyof MessageFields, label: string, placeholder: string) => (
    <ToolField label={label} htmlFor={`msg-${name}`}>
      <input
        id={`msg-${name}`}
        className={toolInputClass}
        placeholder={placeholder}
        value={fields[name]}
        onChange={(e) => setFields({ ...fields, [name]: e.target.value })}
      />
    </ToolField>
  );

  return (
    <div className="mt-8 grid gap-6 rounded-2xl border bg-card p-5 sm:grid-cols-2 sm:p-6">
      <div className="flex flex-col gap-4">
        <ToolField label="Sua área" htmlFor="msg-area">
          <select
            id="msg-area"
            className={toolInputClass}
            value={nicheKey}
            onChange={(e) => setNicheKey(e.target.value)}
          >
            {niches.map((n) => (
              <option key={n.key} value={n.key}>
                {n.name}
              </option>
            ))}
          </select>
        </ToolField>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium">Mensagem</legend>
          <div className="flex flex-wrap gap-2">
            {MESSAGE_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={`h-10 rounded-full border px-4 text-sm font-medium ${kind === k ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}
              >
                {MESSAGE_KIND_LABELS[k]}
              </button>
            ))}
          </div>
        </fieldset>
        {field("customer", "Nome do cliente", "Ana")}
        {field("service", "Serviço", "Escova")}
        {field("date", "Dia", "sexta (17/10)")}
        {field("time", "Hora", "14h")}
        {field("business", "Seu nome ou do negócio", "Studio Lumi")}
        {field("link", "Seu link de agendamento (opcional)", "meetchat.com.br/seu-negocio")}
      </div>
      <div className="flex flex-col gap-3">
        <label htmlFor="msg-texto" className="text-sm font-medium">
          Texto pronto
        </label>
        <textarea
          id="msg-texto"
          readOnly
          value={text}
          rows={12}
          className="w-full flex-1 rounded-xl border bg-muted/40 p-4 text-base leading-relaxed"
        />
        <CopyTextButton text={text} label="Copiar mensagem" variant="default" />
      </div>
    </div>
  );
}
