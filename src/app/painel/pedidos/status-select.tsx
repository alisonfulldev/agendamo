"use client";

import { useTransition } from "react";

import { updateRequestStatusAction } from "./actions";

export const REQUEST_STATUS_LABELS = {
  new: "Novo",
  contacted: "Em contato",
  done: "Agendado",
  discarded: "Descartado",
} as const;

export function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: keyof typeof REQUEST_STATUS_LABELS;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      aria-label="Status do pedido"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => startTransition(() => void updateRequestStatusAction(id, e.target.value))}
      className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
    >
      {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
